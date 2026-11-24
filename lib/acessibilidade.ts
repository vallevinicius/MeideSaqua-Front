/**
 * Menu de acessibilidade (Libras, ajustes de leitura, ouvir por parágrafo e
 * ouvir a página). Funções puras / de DOM usadas por `components/AcessibilidadeSaqua`
 * e pelos hooks `use-acessibilidade-vendors` e `use-leitor-pagina`.
 *
 * O Sienna (npm `sienna-accessibility`, fixo em 2.1.0) e o VLibras (script do
 * governo) manipulam o DOM por seletores internos (`.asw-*`, `#vlibras-*`).
 * Os ajustes que fazemos sobre eles ficam concentrados aqui.
 */

export const VLIBRAS_SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";
export const VLIBRAS_ROOT_PATH = "https://vlibras.gov.br/app";
export const CHAVE_DICA_LIBRAS = "acesso-dica-libras";
export const MENSAGEM_LIBRAS_INDISPONIVEL =
  "Libras indisponível no momento. Recarregue a página ou tente novamente mais tarde.";
export const MENSAGEM_DICA_LIBRAS = "Dica: arraste o avatar pela barra azul para tirá-lo da frente.";

/** O menu não aparece no painel administrativo (/admin e subrotas). */
export function rotaSemMenu(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

// ---------------------------------------------------------------------------
// Ouvir a página (Web Speech API)
// ---------------------------------------------------------------------------

/** O que não se lê: escondido, scripts, o próprio menu e os campos de seleção. */
export const IGNORAR_NA_LEITURA = [
  "[aria-hidden='true']",
  "[hidden]",
  "script",
  "style",
  "template",
  "dialog",
  "select",
  "#acesso",
  ".asw-container",
  "[data-acesso-ignorar]",
].join(",");

/** Caracteres por fala: o Chrome corta falas longas. */
export const TAMANHO_TRECHO = 220;

const BLOCOS_DE_TEXTO = "h1, h2, h3, h4, h5, h6, p, li, dt, dd, button, a, td, th, small, strong";

/** O <main> visível; sem ele, a página inteira. */
export function conteudoPrincipal(doc: Document): HTMLElement {
  const principais = Array.from(doc.querySelectorAll<HTMLElement>("main"));
  return principais.find((principal) => !principal.closest("[hidden]")) ?? doc.body;
}

/** Junta o texto visível da raiz em frases, uma por bloco (título, parágrafo, item...). */
export function textoDaPagina(doc: Document): string {
  const percorrer = doc.createTreeWalker(conteudoPrincipal(doc), NodeFilter.SHOW_TEXT);
  const blocos: string[] = [];
  let blocoAtual: Element | null = null;
  let paiAnterior: Element | null = null;
  let noDeTexto: Node | null;

  while ((noDeTexto = percorrer.nextNode())) {
    const pai = noDeTexto.parentElement;
    const conteudo = (noDeTexto.nodeValue ?? "").replace(/\s+/g, " ");
    if (!conteudo.trim() || !pai || pai.closest(IGNORAR_NA_LEITURA)) continue;

    const bloco = pai.closest(BLOCOS_DE_TEXTO) ?? pai;
    if (bloco !== blocoAtual) {
      blocos.push("");
      blocoAtual = bloco;
    } else if (pai !== paiAnterior && !/[\s,.;:]$/.test(blocos[blocos.length - 1])) {
      // Textos de elementos diferentes no mesmo bloco ganham vírgula, para a voz não emendar as palavras.
      blocos[blocos.length - 1] += ", ";
    }

    blocos[blocos.length - 1] += conteudo;
    paiAnterior = pai;
  }

  return blocos
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => (/[.!?:…]$/.test(bloco) ? bloco : `${bloco}.`))
    .join(" ");
}

/** Corta o texto em trechos curtos, sempre no fim de uma frase. */
export function dividirEmTrechos(texto: string): string[] {
  const frases = texto.match(/[^.!?…]+[.!?…]*\s*/g) ?? [];
  const lista: string[] = [];
  let atual = "";

  frases.forEach((frase) => {
    if ((atual + frase).length > TAMANHO_TRECHO && atual) {
      lista.push(atual.trim());
      atual = "";
    }
    atual += frase;
  });
  if (atual.trim()) lista.push(atual.trim());

  return lista;
}

export function extrairTrechosDaPagina(doc: Document): string[] {
  return dividirEmTrechos(textoDaPagina(doc));
}

// ---------------------------------------------------------------------------
// Sienna
// ---------------------------------------------------------------------------

/**
 * O Sienna 2.1.0 registra um listener de clique no `document` a cada vez que o
 * leitor de tela é ligado e não remove o anterior. Aqui, ao trocar a função em
 * `window.__asw__onClickScreenReader`, o listener antigo sai. Também dá
 * `innerText` aos SVGs, que o Sienna lê e o navegador não tem.
 */
export function instalarProtetorListenerSienna(win: Window = window): void {
  const SVG = (win as Window & typeof globalThis).SVGElement;
  if (SVG && !("innerText" in SVG.prototype)) {
    Object.defineProperty(SVG.prototype, "innerText", {
      configurable: true,
      enumerable: false,
      get(this: SVGElement) {
        return this.textContent || "";
      },
    });
  }

  const descritor = Object.getOwnPropertyDescriptor(win, "__asw__onClickScreenReader");
  if (descritor?.set) return;

  let atual = win.__asw__onClickScreenReader;
  Object.defineProperty(win, "__asw__onClickScreenReader", {
    configurable: true,
    enumerable: true,
    get() {
      return atual;
    },
    set(nova: ((e: MouseEvent) => void) | undefined) {
      if (atual && atual !== nova) win.document.removeEventListener("click", atual, true);
      atual = nova;
    },
  });
}

/** Tamanho do texto que o usuário pediu ao Sienna (1 = 100%). */
export function escalaDaFonte(storage: Storage = localStorage): number {
  try {
    const salvo = JSON.parse(storage.getItem("asw-user-settings") || "{}");
    return Number(salvo?.states?.fontSize) || 1;
  } catch {
    return 1;
  }
}

/**
 * O Sienna, ao iniciar e a cada ajuste de fonte, grava o tamanho de todo título,
 * parágrafo, link e span em pixels no elemento, mesmo em 100%. Em 100% (ninguém
 * pediu fonte maior) os tamanhos voltam a ser os do CSS, para textos fluidos
 * (clamp, vw) não ficarem presos num valor.
 */
export function liberarTamanhosSienna(doc: Document = document): void {
  if (escalaDaFonte() !== 1) return;
  doc.querySelectorAll<HTMLElement>("[data-asw-org-font-size]").forEach((elemento) => {
    elemento.style.removeProperty("font-size");
    elemento.removeAttribute("data-asw-org-font-size");
  });
}

/** Devolve ao elemento a cor que ele tinha antes de o Sienna destacá-lo. */
export function restaurarCorElementoSienna(elemento: HTMLElement): void {
  if (!elemento.hasAttribute("data-asw-orgcolor")) return;
  const corOriginal = elemento.getAttribute("data-asw-orgcolor");
  if (corOriginal) elemento.style.color = corOriginal;
  else elemento.style.removeProperty("color");
  elemento.removeAttribute("data-asw-orgcolor");
}

export function limparDestaquesLeituraSienna(doc: Document = document): void {
  doc.querySelectorAll<HTMLElement>(".asw-reading").forEach((elemento) => {
    elemento.classList.remove("asw-reading");
    restaurarCorElementoSienna(elemento);
  });
}

/** Rótulos em português: o Sienna deixa os de leitor de tela em inglês. */
export function traduzirRotulosSienna(doc: Document = document): void {
  const menu = doc.querySelector<HTMLElement>(".asw-menu");
  if (!menu) return;

  const fechar = menu.querySelector<HTMLElement>(".asw-menu-close");
  if (fechar) {
    fechar.setAttribute("aria-label", "Fechar os ajustes de leitura");
    fechar.title = "Fechar";
  }

  const restaurar = menu.querySelector<HTMLElement>(".asw-menu-reset");
  if (restaurar) {
    restaurar.setAttribute("aria-label", "Restaurar as configurações");
    restaurar.title = "Restaurar as configurações";
  }

  menu.querySelectorAll<HTMLElement>("[aria-label]").forEach((elemento) => {
    if (elemento === fechar || elemento === restaurar) return;
    if (elemento.tagName === "SELECT") {
      elemento.setAttribute("aria-label", "Idioma do menu");
      return;
    }
    // A primeira linha do texto que já aparece traduzido.
    const texto = (elemento.innerText || "").trim().split("\n")[0];
    if (texto) elemento.setAttribute("aria-label", texto);
  });
}

/** O menu do Sienna só existe no DOM depois do primeiro clique: abre e fecha para criá-lo. */
export function garantirMenuSiennaNoDom(doc: Document = document): HTMLElement | null {
  let menu = doc.querySelector<HTMLElement>(".asw-menu");
  if (menu) return menu;

  const botaoSienna = doc.querySelector<HTMLElement>(".asw-menu-btn");
  if (!botaoSienna) return null;

  botaoSienna.click();
  menu = doc.querySelector<HTMLElement>(".asw-menu");
  menu?.querySelector<HTMLElement>(".asw-menu-close")?.click();
  return menu;
}

/** O menu fica dentro de uma caixa que o Sienna mostra e esconde com `display`. */
export function siennaAberto(doc: Document = document): boolean {
  const menu = doc.querySelector<HTMLElement>(".asw-menu");
  return !!menu && menu.parentElement?.style.display !== "none";
}
