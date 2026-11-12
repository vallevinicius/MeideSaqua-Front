"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { atualizarMenu, type OpcoesMenuAcessibilidade } from "@/lib/acessibilidade";

const OPCOES: OpcoesMenuAcessibilidade = {
  cor: "#017DB9",
  corEscura: "#016494",
  suave: "#E3F2FA",
};

/**
 * Menu de acessibilidade (Libras, ajustes de leitura e ouvir a página),
 * igual ao da Agenda Saquarema. Não aparece no /admin.
 */
export default function AcessibilidadeSaqua() {
  const pathname = usePathname();

  useEffect(() => {
    atualizarMenu(document, pathname ?? "/", OPCOES);
  }, [pathname]);

  return null;
}
