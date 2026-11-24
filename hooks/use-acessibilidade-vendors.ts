"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  CHAVE_DICA_LIBRAS,
  MENSAGEM_DICA_LIBRAS,
  MENSAGEM_LIBRAS_INDISPONIVEL,
  VLIBRAS_ROOT_PATH,
  VLIBRAS_SCRIPT_URL,
  garantirMenuSiennaNoDom,
  instalarProtetorListenerSienna,
  liberarTamanhosSienna,
  limparDestaquesLeituraSienna,
  restaurarCorElementoSienna,
  siennaAberto,
  traduzirRotulosSienna,
} from "@/lib/acessibilidade";

const CLASSE_LEITOR_PARAGRAFO = "asw-screen-reader";

const leitorParagrafoLigado = () => document.documentElement.classList.contains(CLASSE_LEITOR_PARAGRAFO);

/**
 * Integra as duas ferramentas externas ao menu: o VLibras (script do governo,
 * por URL) e o Sienna (pacote npm, import dinâmico). Os botões próprios dos dois
 * ficam escondidos por CSS e este hook os aciona.
 */
export function useAcessibilidadeVendors(botaoRetornoRef: React.RefObject<HTMLElement>) {
  const pathname = usePathname();
  const [siennaPronto, setSiennaPronto] = useState(false);
  const [leitorParagrafoAtivo, setLeitorParagrafoAtivo] = useState(false);

  const ultimoInterativoRef = useRef<HTMLElement | null>(null);
  const timerInterativoRef = useRef(0);

  // "Ouvir por parágrafo" é o leitor de tela do Sienna: liga/desliga pelo botão dele.
  const definirLeitorParagrafo = useCallback((ativo: boolean) => {
    if (leitorParagrafoLigado() === ativo) {
      setLeitorParagrafoAtivo(ativo);
      return;
    }

    const menu = garantirMenuSiennaNoDom();
    const botaoLeitor = menu?.querySelector<HTMLElement>(".asw-btn[data-key='screen-reader']");
    if (!botaoLeitor) return;

    botaoLeitor.click();
    if (!ativo) limparDestaquesLeituraSienna();
    setLeitorParagrafoAtivo(leitorParagrafoLigado());
  }, []);

  const alternarLeitorParagrafo = useCallback(() => {
    definirLeitorParagrafo(!leitorParagrafoLigado());
  }, [definirLeitorParagrafo]);

  // Carrega o Sienna e acompanha o estado do leitor de parágrafo.
  useEffect(() => {
    let cancelado = false;

    instalarProtetorListenerSienna();

    const sincronizarClasseLeitor = () => {
      const ativo = leitorParagrafoLigado();
      setLeitorParagrafoAtivo(ativo);
      if (!ativo) limparDestaquesLeituraSienna();
    };

    const observadorHtml = new MutationObserver(sincronizarClasseLeitor);
    observadorHtml.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    sincronizarClasseLeitor();

    // O Sienna pinta o texto lido e guarda a cor original; aqui ela volta sempre que ele a guarda de novo.
    const observadorCor = new MutationObserver((mutacoes) => {
      for (const mutacao of mutacoes) {
        if (mutacao.target instanceof HTMLElement) restaurarCorElementoSienna(mutacao.target);
      }
    });
    observadorCor.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-asw-orgcolor"],
    });

    // O Sienna termina de montar o botão dele depois do import.
    let observadorBotao: MutationObserver | null = null;
    const verificarBotaoSienna = () => {
      if (!document.querySelector(".asw-menu-btn")) return false;
      setSiennaPronto(true);
      liberarTamanhosSienna();
      sincronizarClasseLeitor();
      return true;
    };

    import("sienna-accessibility")
      .then(() => {
        if (cancelado || verificarBotaoSienna()) return;
        observadorBotao = new MutationObserver(() => {
          if (verificarBotaoSienna()) observadorBotao?.disconnect();
        });
        observadorBotao.observe(document.body, { childList: true });
      })
      .catch((erro) => console.error("Falha ao carregar o widget Sienna:", erro));

    // VLibras: o botão do menu aparece sempre; sem o script, abrirLibras() avisa.
    const iniciarVLibras = () => {
      if (cancelado || !window.VLibras || document.getElementById("vlibras-access-wrapper")) return;
      try {
        new window.VLibras.Widget({ rootPath: VLIBRAS_ROOT_PATH, position: "R" });
      } catch (erro) {
        console.error("Falha ao iniciar o VLibras:", erro);
      }
    };

    if (window.VLibras) {
      iniciarVLibras();
    } else {
      const existente = document.querySelector<HTMLScriptElement>(`script[src="${VLIBRAS_SCRIPT_URL}"]`);
      if (existente) {
        existente.addEventListener("load", iniciarVLibras);
      } else {
        const script = document.createElement("script");
        script.src = VLIBRAS_SCRIPT_URL;
        script.async = true;
        script.onload = iniciarVLibras;
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelado = true;
      observadorHtml.disconnect();
      observadorCor.disconnect();
      observadorBotao?.disconnect();
      window.clearTimeout(timerInterativoRef.current);
    };
  }, []);

  // O Sienna prende o tamanho da fonte em pixels: a cada rota nova, libera.
  useEffect(() => {
    liberarTamanhosSienna();
    ultimoInterativoRef.current = null;
  }, [pathname]);

  // Cliques e teclas: o que o VLibras e o Sienna não tratam sozinhos.
  useEffect(() => {
    // O VLibras traduz o que é clicado. Em botões do menu e em botões só de ícone não há o que traduzir.
    const liberarElementoDoVLibras = (elemento: Element) => {
      if (elemento.classList.contains("vlibras-links")) return;
      elemento.classList.add("vlibras-links");
      window.setTimeout(() => elemento.classList.remove("vlibras-links"), 0);
    };

    // Suspende o leitor de tela do Sienna apenas durante o clique atual e o reanexa em seguida.
    const ignorarCliqueNoSiennaUmaVez = () => {
      const funcaoSienna = window.__asw__onClickScreenReader;
      if (!funcaoSienna) return;
      document.removeEventListener("click", funcaoSienna, true);
      window.setTimeout(() => {
        if (leitorParagrafoLigado() && window.__asw__onClickScreenReader === funcaoSienna) {
          document.addEventListener("click", funcaoSienna, true);
        }
      }, 0);
    };

    const aoCapturarCliqueNaJanela = (evento: MouseEvent) => {
      const alvo = evento.target as HTMLElement | null;
      if (!alvo) return;

      const dentroDoVLibras = !!alvo.closest("#vlibras-app-root, #vlibras-access-wrapper");
      const dentroDoMenuAcessibilidade =
        !!alvo.closest("#acesso") ||
        !!alvo.closest("[data-acesso-trigger]") ||
        !!alvo.closest(".asw-container") ||
        !!alvo.closest(".asw-menu") ||
        !!alvo.closest(".asw-menu-btn") ||
        !!alvo.closest(".asw-widget") ||
        !!alvo.closest(".asw-structure-modal");
      const interativo = alvo.closest<HTMLElement>("a[href], button, [role='button'], input, select, label");
      const textoVisivel = (interativo?.innerText || "").trim();
      const semTextoParaLer = !!interativo && (!textoVisivel || /^[×✕xX+-]$/.test(textoVisivel));

      if (dentroDoMenuAcessibilidade || semTextoParaLer) {
        liberarElementoDoVLibras(alvo);
        if (interativo && interativo !== alvo) liberarElementoDoVLibras(interativo);
      }

      if (!leitorParagrafoLigado()) return;
      if (dentroDoVLibras) {
        ignorarCliqueNoSiennaUmaVez();
        return;
      }
      if (dentroDoMenuAcessibilidade) return;

      if (!interativo) {
        ultimoInterativoRef.current = null;
        return;
      }

      // Segundo clique no mesmo botão (ou botão sem texto): quem leu é cancelado e o clique segue normal.
      if (semTextoParaLer || ultimoInterativoRef.current === interativo) {
        ultimoInterativoRef.current = null;
        window.clearTimeout(timerInterativoRef.current);
        window.speechSynthesis?.cancel();
        limparDestaquesLeituraSienna();
        ignorarCliqueNoSiennaUmaVez();
        return;
      }

      ultimoInterativoRef.current = interativo;
      window.clearTimeout(timerInterativoRef.current);
      timerInterativoRef.current = window.setTimeout(() => {
        if (ultimoInterativoRef.current === interativo) ultimoInterativoRef.current = null;
      }, 4000);
    };

    const aoClicarNoSienna = (evento: MouseEvent) => {
      const alvo = evento.target as HTMLElement | null;
      if (alvo?.closest?.(".asw-menu")) window.setTimeout(() => liberarTamanhosSienna(), 50);
    };

    // Ao fechar o Sienna, o foco volta para o botão do menu de acessibilidade.
    const fecharAjustesSienna = () => {
      document.querySelector<HTMLElement>(".asw-menu .asw-menu-close")?.click();
      botaoRetornoRef.current?.focus();
    };

    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (siennaAberto()) {
        // Sienna aberto: Esc fecha; Enter e espaço acionam os "botões" feitos com <div role="button">.
        if (evento.key === "Escape") {
          evento.preventDefault();
          fecharAjustesSienna();
          return;
        }
        const alvo = evento.target as HTMLElement | null;
        const menu = document.querySelector<HTMLElement>(".asw-menu");
        if (
          (evento.key === "Enter" || evento.key === " ") &&
          alvo?.getAttribute("role") === "button" &&
          alvo.tagName !== "BUTTON" &&
          alvo.tagName !== "A" &&
          menu?.contains(alvo)
        ) {
          evento.preventDefault();
          if (alvo.classList.contains("asw-menu-close")) fecharAjustesSienna();
          else alvo.click();
        }
        return;
      }

      if (evento.key === "Escape" && leitorParagrafoLigado()) definirLeitorParagrafo(false);
    };

    window.addEventListener("click", aoCapturarCliqueNaJanela, true);
    document.addEventListener("click", aoClicarNoSienna);
    document.addEventListener("keydown", aoPressionarTecla, true);
    return () => {
      window.removeEventListener("click", aoCapturarCliqueNaJanela, true);
      document.removeEventListener("click", aoClicarNoSienna);
      document.removeEventListener("keydown", aoPressionarTecla, true);
    };
  }, [botaoRetornoRef, definirLeitorParagrafo]);

  // window.VLibrasWidget.open() é a função do próprio botão do VLibras.
  const abrirLibras = useCallback(() => {
    const widget = window.VLibrasWidget;
    // Script bloqueado (CSP, rede, bloqueador) ou ainda carregando: avisa em vez de falhar calado.
    if (!window.VLibras || !widget?.open) {
      toast(MENSAGEM_LIBRAS_INDISPONIVEL);
      return;
    }
    widget.open();

    // Em tela de toque não há cursor de "mover": na primeira vez, um aviso conta que o avatar sai da frente arrastando.
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    try {
      if (localStorage.getItem(CHAVE_DICA_LIBRAS)) return;
      localStorage.setItem(CHAVE_DICA_LIBRAS, "1");
    } catch {
      // Sem armazenamento: o aviso aparece de novo da próxima vez.
    }
    window.setTimeout(() => toast(MENSAGEM_DICA_LIBRAS), 1500);
  }, []);

  // Abre o menu do Sienna pelo botão escondido dele e leva o foco para dentro.
  const abrirAjustesSienna = useCallback(() => {
    const botaoSienna = document.querySelector<HTMLElement>(".asw-menu-btn");
    if (!botaoSienna) return;
    botaoSienna.click();
    window.setTimeout(() => {
      if (!siennaAberto()) return;
      traduzirRotulosSienna();
      document.querySelector<HTMLElement>(".asw-menu .asw-menu-close")?.focus();
    }, 60);
  }, []);

  return {
    siennaPronto,
    leitorParagrafoAtivo,
    definirLeitorParagrafo,
    alternarLeitorParagrafo,
    abrirLibras,
    abrirAjustesSienna,
  };
}
