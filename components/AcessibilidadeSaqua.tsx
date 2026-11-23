"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Hand, MousePointerClick, SlidersHorizontal, Volume2 } from "lucide-react";
import { useAcessibilidadeVendors } from "@/hooks/use-acessibilidade-vendors";
import { useLeitorPagina } from "@/hooks/use-leitor-pagina";
import { rotaSemMenu } from "@/lib/acessibilidade";

const ICONE = { size: 18, strokeWidth: 2, "aria-hidden": true } as const;

function MenuAcessibilidade() {
  const [aberto, setAberto] = useState(false);
  const [ouvirExpandido, setOuvirExpandido] = useState(false);

  const caixaRef = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const botaoOuvirRef = useRef<HTMLButtonElement>(null);

  const focarBotaoPrincipalPlayer = useCallback(() => {
    botaoOuvirRef.current?.focus();
  }, []);

  const {
    siennaPronto,
    leitorParagrafoAtivo,
    definirLeitorParagrafo,
    alternarLeitorParagrafo,
    abrirLibras,
    abrirAjustesSienna,
  } = useAcessibilidadeVendors(botaoRef);

  const {
    suportaVoz,
    situacao,
    mensagemVoz,
    velocidade,
    iniciarLeitura,
    pausarLeitura,
    continuarLeitura,
    pararLeitura,
    aoMudarVelocidade,
  } = useLeitorPagina(painelRef, focarBotaoPrincipalPlayer);

  const algumLeitorAtivo = situacao !== "parado" || leitorParagrafoAtivo;

  const alternarMenu = useCallback(() => {
    setAberto((atual) => {
      const proximo = !atual;
      if (proximo) {
        window.setTimeout(() => {
          painelRef.current?.querySelector<HTMLElement>(".acesso-pilula, .ouvir-acao")?.focus();
        }, 0);
      }
      return proximo;
    });
  }, []);

  // Fecha com clique fora e com Esc (o foco volta para o botão do menu).
  useEffect(() => {
    const aoClicarFora = (evento: MouseEvent) => {
      const clicouDentro = !!caixaRef.current && evento.composedPath().includes(caixaRef.current);
      if (aberto && !clicouDentro) setAberto(false);
    };

    const aoPressionarEsc = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && aberto) {
        evento.preventDefault();
        setAberto(false);
        botaoRef.current?.focus();
      }
    };

    document.addEventListener("click", aoClicarFora);
    document.addEventListener("keydown", aoPressionarEsc, true);
    return () => {
      document.removeEventListener("click", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarEsc, true);
    };
  }, [aberto]);

  // As duas leituras não falam ao mesmo tempo.
  useEffect(() => {
    if (leitorParagrafoAtivo && situacao !== "parado") {
      pararLeitura("Leitura da página pausada para usar o Ouvir por parágrafo.");
    }
  }, [leitorParagrafoAtivo, pararLeitura, situacao]);

  const aoAlternarLeitorParagrafo = () => {
    if (!leitorParagrafoAtivo && situacao !== "parado") pararLeitura();
    alternarLeitorParagrafo();
    setAberto(false);
  };

  const aoAlternarLeituraPagina = () => {
    if (situacao === "lendo") {
      pausarLeitura();
      return;
    }
    if (leitorParagrafoAtivo) definirLeitorParagrafo(false);
    if (situacao === "parado") iniciarLeitura();
    else continuarLeitura();
  };

  return (
    <div ref={caixaRef} id="acesso" className="acesso asw-widget">
      <div
        ref={painelRef}
        id="acesso-painel"
        className="acesso-pilulas"
        role="group"
        aria-label="Ferramentas de acessibilidade"
        hidden={!aberto}
      >
        <button
          type="button"
          className="acesso-pilula"
          id="acesso-libras"
          onClick={() => {
            setAberto(false);
            abrirLibras();
          }}
        >
          <span className="acesso-pilula-icone" aria-hidden="true">
            <Hand {...ICONE} />
          </span>
          <span>Traduzir em Libras</span>
        </button>

        {siennaPronto && (
          <button
            type="button"
            className="acesso-pilula"
            id="acesso-ajustes"
            onClick={() => {
              setAberto(false);
              abrirAjustesSienna();
            }}
          >
            <span className="acesso-pilula-icone" aria-hidden="true">
              <SlidersHorizontal {...ICONE} />
            </span>
            <span>Menu de acessibilidade</span>
          </button>
        )}

        {siennaPronto && suportaVoz && (
          <button
            type="button"
            className="acesso-pilula"
            id="acesso-ouvir-paragrafo"
            aria-pressed={leitorParagrafoAtivo}
            onClick={aoAlternarLeitorParagrafo}
          >
            <span className="acesso-pilula-icone" aria-hidden="true">
              <MousePointerClick {...ICONE} />
            </span>
            <span>Ouvir por parágrafo</span>
            {leitorParagrafoAtivo && <span className="acesso-pilula-badge">Ativo</span>}
          </button>
        )}

        {suportaVoz &&
          (!ouvirExpandido ? (
            <button
              type="button"
              className="acesso-pilula"
              id="acesso-ouvir"
              aria-expanded={false}
              onClick={() => setOuvirExpandido(true)}
            >
              <span className="acesso-pilula-icone" aria-hidden="true">
                <Volume2 {...ICONE} />
              </span>
              <span>Ouvir página inteira</span>
              {situacao !== "parado" && (
                <span className="acesso-pilula-badge">{situacao === "lendo" ? "Lendo" : "Pausado"}</span>
              )}
            </button>
          ) : (
            <section className="acesso-pilula-player" id="ouvir" aria-label="Ouvir página inteira">
              <div className="acesso-player-topo">
                <span className="acesso-player-titulo">Ouvir página inteira</span>
                <button
                  type="button"
                  className="acesso-player-fechar"
                  aria-label="Recolher controles de leitura"
                  onClick={() => setOuvirExpandido(false)}
                >
                  ×
                </button>
              </div>

              <div className="acesso-player-controles">
                <button
                  ref={botaoOuvirRef}
                  type="button"
                  className="ouvir-acao ouvir-acao-principal"
                  onClick={aoAlternarLeituraPagina}
                >
                  {situacao === "lendo" ? "Pausar" : situacao === "pausado" ? "Continuar" : "Ouvir"}
                </button>

                {situacao !== "parado" && (
                  <button type="button" className="ouvir-acao" onClick={() => pararLeitura()}>
                    Parar
                  </button>
                )}

                <select
                  id="ouvir-velocidade"
                  aria-label="Velocidade da leitura"
                  className="ouvir-velocidade-compacta"
                  value={velocidade}
                  onChange={(evento) => aoMudarVelocidade(evento.target.value)}
                >
                  <option value="0.75">0,75×</option>
                  <option value="1">1×</option>
                  <option value="1.25">1,25×</option>
                  <option value="1.5">1,5×</option>
                </select>
              </div>

              <p className="ouvir-estado" id="ouvir-estado" aria-live="polite">
                {mensagemVoz}
              </p>
            </section>
          ))}
      </div>

      <button
        ref={botaoRef}
        type="button"
        className={`acesso-botao${algumLeitorAtivo ? " ativo" : ""}`}
        id="acesso-botao"
        aria-expanded={aberto}
        aria-controls="acesso-painel"
        aria-label="Acessibilidade: Libras, ajustes de leitura e ouvir a página"
        onClick={alternarMenu}
      >
        <svg
          className="icone"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="12" cy="6.8" r="1.5" />
          <path d="M7 9.6 12 11l5-1.4M12 11v3.4M9.4 18.2 12 14.4l2.6 3.8" />
        </svg>
        <span className="acesso-botao-texto">Acessibilidade</span>
      </button>
    </div>
  );
}

/**
 * Menu de acessibilidade (Libras, ajustes de leitura, ouvir por parágrafo e
 * ouvir a página inteira). Não aparece no /admin.
 */
export default function AcessibilidadeSaqua() {
  const pathname = usePathname();
  if (rotaSemMenu(pathname ?? "/")) return null;
  return <MenuAcessibilidade />;
}
