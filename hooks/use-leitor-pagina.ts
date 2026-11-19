"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { extrairTrechosDaPagina } from "@/lib/acessibilidade";

export type SituacaoLeitura = "parado" | "lendo" | "pausado";

/**
 * "Ouvir página inteira": lê em voz alta o conteúdo principal (Web Speech API, pt-BR).
 *  - o texto vem do <main> visível, em trechos curtos (o Chrome corta falas longas);
 *  - "Pausar" interrompe e guarda o trecho; "Continuar" retoma desse trecho
 *    (o pause() nativo não funciona no Chrome do Android);
 *  - a leitura para ao trocar de rota e ao sair da página.
 */
export function useLeitorPagina(
  painelRef: React.RefObject<HTMLElement>,
  aoPerderFoco?: (novaSituacao: SituacaoLeitura) => void
) {
  const pathname = usePathname();

  const [suportaVoz, setSuportaVoz] = useState(false);
  const [situacao, setSituacao] = useState<SituacaoLeitura>("parado");
  const [mensagemVoz, setMensagemVoz] = useState("Pronto para ler a página.");
  const [velocidade, setVelocidade] = useState("1");

  const trechosRef = useRef<string[]>([]);
  const posicaoRef = useRef(0);
  // Muda a cada cancelamento: o "fim" de uma fala cancelada é ignorado.
  const rodadaRef = useRef(0);
  const situacaoRef = useRef<SituacaoLeitura>("parado");
  const velocidadeRef = useRef("1");
  const vozRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    setSuportaVoz(true);

    // Voz pt-BR, se o sistema tiver; em alguns navegadores as vozes chegam depois.
    const sintese = window.speechSynthesis;
    const escolherVoz = () => {
      const vozes = sintese.getVoices();
      vozRef.current =
        vozes.find((voz) => /^pt[-_]BR$/i.test(voz.lang)) ?? vozes.find((voz) => /^pt/i.test(voz.lang)) ?? null;
    };
    escolherVoz();
    sintese.addEventListener?.("voiceschanged", escolherVoz);
    return () => sintese.removeEventListener?.("voiceschanged", escolherVoz);
  }, []);

  const silenciar = useCallback(() => {
    rodadaRef.current += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const atualizarSituacao = useCallback(
    (novaSituacao: SituacaoLeitura, mensagem: string) => {
      situacaoRef.current = novaSituacao;
      setSituacao(novaSituacao);
      setMensagemVoz(mensagem);

      // Se o botão em foco ficou desativado, o foco passa para o que faz sentido.
      window.setTimeout(() => {
        const focado = document.activeElement as HTMLButtonElement | null;
        if (focado?.disabled && painelRef.current?.contains(focado)) aoPerderFoco?.(novaSituacao);
      }, 0);
    },
    [aoPerderFoco, painelRef]
  );

  const pararLeitura = useCallback(
    (mensagem?: string) => {
      silenciar();
      posicaoRef.current = 0;
      atualizarSituacao("parado", mensagem || "Leitura parada.");
    },
    [atualizarSituacao, silenciar]
  );

  const falarTrechoAtual = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    const trechos = trechosRef.current;
    const posicao = posicaoRef.current;

    if (posicao >= trechos.length) {
      pararLeitura("Leitura concluída.");
      return;
    }

    const minhaRodada = rodadaRef.current;
    const fala = new SpeechSynthesisUtterance(trechos[posicao]);
    fala.lang = "pt-BR";
    if (vozRef.current) fala.voice = vozRef.current;
    fala.rate = Number(velocidadeRef.current) || 1;

    fala.onend = () => {
      if (minhaRodada !== rodadaRef.current || situacaoRef.current !== "lendo") return;
      posicaoRef.current += 1;
      falarTrechoAtual();
    };

    fala.onerror = (erro) => {
      if (minhaRodada !== rodadaRef.current || erro.error === "interrupted" || erro.error === "canceled") return;
      pararLeitura("Não foi possível ler a página neste navegador.");
    };

    atualizarSituacao("lendo", `Lendo… trecho ${posicao + 1} de ${trechos.length}.`);
    window.speechSynthesis.speak(fala);
  }, [atualizarSituacao, pararLeitura]);

  const iniciarLeitura = useCallback(() => {
    silenciar();
    trechosRef.current = extrairTrechosDaPagina(document);
    posicaoRef.current = 0;
    if (!trechosRef.current.length) {
      pararLeitura("Não há texto para ler nesta página.");
      return;
    }
    falarTrechoAtual();
  }, [falarTrechoAtual, pararLeitura, silenciar]);

  const pausarLeitura = useCallback(() => {
    if (situacaoRef.current !== "lendo") return;
    silenciar();
    atualizarSituacao("pausado", `Pausado no trecho ${posicaoRef.current + 1} de ${trechosRef.current.length}.`);
  }, [atualizarSituacao, silenciar]);

  const continuarLeitura = useCallback(() => {
    if (situacaoRef.current !== "pausado") return;
    falarTrechoAtual();
  }, [falarTrechoAtual]);

  // Nova velocidade vale na hora: recomeça o trecho atual.
  const aoMudarVelocidade = useCallback(
    (novoValor: string) => {
      setVelocidade(novoValor);
      velocidadeRef.current = novoValor;
      if (situacaoRef.current === "lendo") {
        silenciar();
        falarTrechoAtual();
      }
    },
    [falarTrechoAtual, silenciar]
  );

  // Navegação dentro do app (sem recarregar): a leitura da tela anterior para.
  useEffect(() => {
    if (situacaoRef.current !== "parado") {
      pararLeitura("A página mudou. Use “Ouvir” para ler a nova página.");
    }
  }, [pathname, pararLeitura]);

  // Ao sair da página (ou desmontar o menu), a leitura para.
  useEffect(() => {
    const aoSair = () => silenciar();
    window.addEventListener("pagehide", aoSair);
    return () => {
      window.removeEventListener("pagehide", aoSair);
      silenciar();
    };
  }, [silenciar]);

  return {
    suportaVoz,
    situacao,
    mensagemVoz,
    velocidade,
    iniciarLeitura,
    pausarLeitura,
    continuarLeitura,
    pararLeitura,
    aoMudarVelocidade,
  };
}
