"use client";

import ErrorFallback from "@/components/ErrorFallback";

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      {...props}
      titulo="Erro no painel administrativo"
      homeHref="/admin/dashboard"
      homeLabel="Painel"
    />
  );
}
