import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  dividirEmTrechos,
  escalaDaFonte,
  extrairTrechosDaPagina,
  garantirMenuSiennaNoDom,
  instalarProtetorListenerSienna,
  liberarTamanhosSienna,
  limparDestaquesLeituraSienna,
  restaurarCorElementoSienna,
  rotaSemMenu,
  siennaAberto,
  textoDaPagina,
  TAMANHO_TRECHO,
  traduzirRotulosSienna,
} from "@/lib/acessibilidade";

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.className = "";
});

describe("rotaSemMenu", () => {
  it.each(["/admin", "/admin/", "/admin/usuarios"])("esconde o menu em %s", (rota) => {
    expect(rotaSemMenu(rota)).toBe(true);
  });

  it.each(["/", "/vagas/1", "/administracao", "/meu/admin", "/Admin"])("mostra o menu em %s", (rota) => {
    expect(rotaSemMenu(rota)).toBe(false);
  });
});

describe("dividirEmTrechos", () => {
  it("devolve lista vazia para texto vazio", () => {
    expect(dividirEmTrechos("")).toEqual([]);
  });

  it("junta frases curtas num único trecho", () => {
    expect(dividirEmTrechos("Primeira. Segunda. Terceira.")).toEqual(["Primeira. Segunda. Terceira."]);
  });

  it("corta no fim de uma frase quando passa do tamanho do trecho", () => {
    const frase = `${"a".repeat(TAMANHO_TRECHO - 20)}.`;
    const trechos = dividirEmTrechos(`${frase} ${frase}`);
    expect(trechos).toEqual([frase, frase]);
  });

  it("não perde o texto final sem pontuação", () => {
    expect(dividirEmTrechos("Olá. Sem ponto final")).toEqual(["Olá. Sem ponto final"]);
  });
});

describe("textoDaPagina", () => {
  it("lê só o <main> visível, em frases por bloco", () => {
    document.body.innerHTML = `
      <header><p>Menu do site</p></header>
      <main><h1>Título</h1><p>Um parágrafo.</p><ul><li>Item um</li><li>Item dois</li></ul></main>
      <footer><p>Rodapé</p></footer>`;
    expect(textoDaPagina(document)).toBe("Título. Um parágrafo. Item um. Item dois.");
  });

  it("usa a página inteira quando não há <main>", () => {
    document.body.innerHTML = "<p>Solta</p>";
    expect(textoDaPagina(document)).toBe("Solta.");
  });

  it("pula o que está escondido, o próprio menu, selects e scripts", () => {
    document.body.innerHTML = `
      <main>
        <p>Visível</p>
        <p hidden>Escondido</p>
        <p aria-hidden="true">Decorativo</p>
        <select><option>Opção A</option><option>Opção B</option></select>
        <div id="acesso"><button>Acessibilidade</button></div>
        <div data-acesso-ignorar>Ignorado</div>
        <script>var x = 1;</script>
      </main>`;
    expect(textoDaPagina(document)).toBe("Visível.");
  });

  it("ignora um <main> escondido e usa o próximo visível", () => {
    document.body.innerHTML = `<div hidden><main><p>Antigo</p></main></div><main><p>Atual</p></main>`;
    expect(textoDaPagina(document)).toBe("Atual.");
  });

  it("separa com vírgula textos de elementos diferentes no mesmo bloco", () => {
    document.body.innerHTML = `<main><p>Preço<span>R$ 10</span></p></main>`;
    expect(textoDaPagina(document)).toBe("Preço, R$ 10.");
  });

  it("extrairTrechosDaPagina devolve a lista de trechos", () => {
    document.body.innerHTML = `<main><p>Um.</p><p>Dois.</p></main>`;
    expect(extrairTrechosDaPagina(document)).toEqual(["Um. Dois."]);
  });
});

describe("tamanho da fonte do Sienna", () => {
  const prender = () => {
    document.body.innerHTML = `<p id="p" style="font-size: 20px" data-asw-org-font-size="16">texto</p>`;
  };

  it("escalaDaFonte lê o ajuste salvo e cai em 1 se não houver ou for inválido", () => {
    expect(escalaDaFonte()).toBe(1);
    localStorage.setItem("asw-user-settings", JSON.stringify({ states: { fontSize: 1.3 } }));
    expect(escalaDaFonte()).toBe(1.3);
    localStorage.setItem("asw-user-settings", "{quebrado");
    expect(escalaDaFonte()).toBe(1);
  });

  it("em 100% devolve o tamanho de fonte ao CSS", () => {
    prender();
    liberarTamanhosSienna();
    const p = document.getElementById("p")!;
    expect(p.style.fontSize).toBe("");
    expect(p.hasAttribute("data-asw-org-font-size")).toBe(false);
  });

  it("com fonte maior pedida pelo usuário, não mexe", () => {
    prender();
    localStorage.setItem("asw-user-settings", JSON.stringify({ states: { fontSize: 1.5 } }));
    liberarTamanhosSienna();
    const p = document.getElementById("p")!;
    expect(p.style.fontSize).toBe("20px");
    expect(p.hasAttribute("data-asw-org-font-size")).toBe(true);
  });
});

describe("destaques de leitura do Sienna", () => {
  it("restaurarCorElementoSienna devolve a cor original e remove o atributo", () => {
    document.body.innerHTML = `<p id="p" style="color: red" data-asw-orgcolor="blue">x</p>`;
    const p = document.getElementById("p")!;
    restaurarCorElementoSienna(p);
    expect(p.style.color).toBe("blue");
    expect(p.hasAttribute("data-asw-orgcolor")).toBe(false);
  });

  it("sem cor original guardada, remove a cor aplicada", () => {
    document.body.innerHTML = `<p id="p" style="color: red" data-asw-orgcolor="">x</p>`;
    const p = document.getElementById("p")!;
    restaurarCorElementoSienna(p);
    expect(p.style.color).toBe("");
  });

  it("limparDestaquesLeituraSienna tira a classe e restaura a cor", () => {
    document.body.innerHTML = `<p id="p" class="asw-reading" style="color: red" data-asw-orgcolor="blue">x</p>`;
    limparDestaquesLeituraSienna();
    const p = document.getElementById("p")!;
    expect(p.classList.contains("asw-reading")).toBe(false);
    expect(p.style.color).toBe("blue");
  });
});

describe("menu do Sienna", () => {
  const montarSienna = () => {
    document.body.innerHTML = `
      <button class="asw-menu-btn"></button>
      <div id="caixa" style="display: none">
        <div class="asw-menu">
          <div class="asw-menu-close" role="button" aria-label="Close"></div>
          <div class="asw-menu-reset" role="button" aria-label="Reset"></div>
          <button class="asw-btn" aria-label="Bigger Text">Texto maior\nmais</button>
          <select aria-label="Language"></select>
        </div>
      </div>`;
  };

  it("traduz os rótulos de leitor de tela", () => {
    montarSienna();
    traduzirRotulosSienna();
    const menu = document.querySelector<HTMLElement>(".asw-menu")!;
    expect(menu.querySelector(".asw-menu-close")?.getAttribute("aria-label")).toBe("Fechar os ajustes de leitura");
    expect(menu.querySelector(".asw-menu-reset")?.getAttribute("aria-label")).toBe("Restaurar as configurações");
    expect(menu.querySelector("select")?.getAttribute("aria-label")).toBe("Idioma do menu");
  });

  it("siennaAberto considera o display da caixa do menu", () => {
    expect(siennaAberto()).toBe(false);
    montarSienna();
    expect(siennaAberto()).toBe(false);
    document.getElementById("caixa")!.style.display = "block";
    expect(siennaAberto()).toBe(true);
  });

  it("garantirMenuSiennaNoDom devolve o menu existente sem clicar no botão", () => {
    montarSienna();
    const clique = vi.fn();
    document.querySelector(".asw-menu-btn")!.addEventListener("click", clique);
    expect(garantirMenuSiennaNoDom()).toBe(document.querySelector(".asw-menu"));
    expect(clique).not.toHaveBeenCalled();
  });

  it("garantirMenuSiennaNoDom cria o menu pelo botão e o fecha em seguida", () => {
    document.body.innerHTML = `<button class="asw-menu-btn"></button>`;
    const fechou = vi.fn();
    document.querySelector(".asw-menu-btn")!.addEventListener("click", () => {
      document.body.insertAdjacentHTML("beforeend", `<div class="asw-menu"><div class="asw-menu-close"></div></div>`);
      document.querySelector(".asw-menu-close")!.addEventListener("click", fechou);
    });
    expect(garantirMenuSiennaNoDom()).not.toBeNull();
    expect(fechou).toHaveBeenCalledTimes(1);
  });

  it("garantirMenuSiennaNoDom devolve null sem o Sienna", () => {
    expect(garantirMenuSiennaNoDom()).toBeNull();
  });
});

describe("instalarProtetorListenerSienna", () => {
  it("ao trocar a função do leitor de tela, remove o listener da anterior", () => {
    instalarProtetorListenerSienna();
    const antiga = vi.fn();
    const nova = vi.fn();

    window.__asw__onClickScreenReader = antiga;
    document.addEventListener("click", antiga, true);
    window.__asw__onClickScreenReader = nova;
    document.addEventListener("click", nova, true);

    document.body.click();
    expect(antiga).not.toHaveBeenCalled();
    expect(nova).toHaveBeenCalledTimes(1);

    document.removeEventListener("click", nova, true);
  });

  it("dá innerText aos SVGs e pode ser chamado mais de uma vez", () => {
    instalarProtetorListenerSienna();
    instalarProtetorListenerSienna();
    document.body.innerHTML = `<svg id="s"><text>Olá</text></svg>`;
    expect((document.getElementById("s") as unknown as SVGElement & { innerText: string }).innerText).toBe("Olá");
  });
});
