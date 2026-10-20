// Círculo de status, no mesmo formato dos círculos da logo do portal.
const CORES = {
  pendente: "bg-[#FF3399]",
  ativo: "bg-[#A6CE45]",
  inativo: "bg-slate-300",
} as const;

export default function StatusDot({
  tipo,
  rotulo,
}: {
  tipo: keyof typeof CORES;
  rotulo: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-600">
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${CORES[tipo]}`} />
      {rotulo}
    </span>
  );
}
