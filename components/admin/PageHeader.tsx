import React from "react";

type Props = {
  titulo: string;
  descricao?: string;
  acoes?: React.ReactNode;
  children?: React.ReactNode;
};

// Cabeçalho padrão das telas do painel: título, texto de apoio e ações à direita.
export default function PageHeader({ titulo, descricao, acoes, children }: Props) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0E2A3A] md:text-[28px]">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 max-w-prose text-sm text-slate-500">{descricao}</p>
        )}
        {children}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}
