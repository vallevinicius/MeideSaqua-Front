"use client";

import "./globals.css";

// Último recurso: substitui o layout raiz quando ele próprio falha.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div role="alert" className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900">Algo deu errado</h1>
          <p className="mt-2 text-sm text-gray-600">
            O site encontrou um problema inesperado. Tente recarregar a página.
          </p>
          {error.digest && (
            <p className="mt-3 text-xs text-gray-400">Código: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-11 w-full rounded-md bg-blue-600 font-medium text-white hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
