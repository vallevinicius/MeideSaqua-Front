"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  titulo?: string;
  homeHref?: string;
  homeLabel?: string;
};

// Tela exibida quando uma página lança erro de renderização.
// Não mostra a mensagem técnica ao usuário, só o código (digest) para suporte.
export default function ErrorFallback({
  error,
  reset,
  titulo = "Algo deu errado",
  homeHref = "/",
  homeLabel = "Início",
}: Props) {
  useEffect(() => {
    console.error("Erro de renderização:", error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl shadow-gray-200/50">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {titulo}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Ocorreu um erro inesperado ao carregar esta página. Você pode tentar
          novamente ou voltar ao início.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-gray-400">Código: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            className="h-11 w-full sm:flex-1"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </Button>
          <Button asChild className="h-11 w-full bg-blue-600 text-white hover:bg-blue-700 sm:flex-1">
            <Link href={homeHref}>
              <Home className="mr-2 h-4 w-4" aria-hidden="true" />
              {homeLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
