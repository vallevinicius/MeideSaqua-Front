import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  mensagem: string;
  onRetry?: () => void;
  titulo?: string;
  className?: string;
};

// Bloco de erro para quando uma listagem ou página não conseguiu carregar os dados.
export default function ErrorState({
  mensagem,
  onRetry,
  titulo = "Não foi possível carregar",
  className = "",
}: Props) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 px-6 py-10 text-center ${className}`}
    >
      <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-gray-900">{titulo}</h2>
      <p className="max-w-md text-sm text-gray-600">{mensagem}</p>
      {onRetry && (
        <Button type="button" variant="outline" onClick={onRetry}>
          <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
