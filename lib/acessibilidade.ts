/**
 * Menu de acessibilidade (Libras, ajustes de leitura e ouvir a página).
 * O menu em si é o script estático /acessibilidade/acessibilidade-saqua.js
 * (cópia do menu da Agenda Saquarema). Aqui só se decide quando carregá-lo.
 */

export interface OpcoesMenuAcessibilidade {
  /** Cor principal do site (hexadecimal). */
  cor: string;
  /** Cor do hover. */
  corEscura: string;
  /** Fundo suave dos ícones e itens selecionados. */
  suave: string;
  /** Anel do botão e leitura ativa. */
  destaque?: string;
  /** Texto escuro do menu. */
  noite?: string;
}

export const MENU_SCRIPT_ID = "acessibilidade-saqua-script";
export const MENU_SCRIPT_SRC = "/acessibilidade/acessibilidade-saqua.js";
export const CLASSE_MENU_OCULTO = "acesso-oculto";

/** O menu não aparece no painel administrativo (/admin e subrotas). */
export function rotaSemMenu(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/** Carrega o script do menu uma única vez; devolve a tag criada (ou null se já existia). */
export function carregarMenu(doc: Document, opcoes: OpcoesMenuAcessibilidade): HTMLScriptElement | null {
  if (doc.getElementById(MENU_SCRIPT_ID)) return null;
  const tag = doc.createElement("script");
  tag.id = MENU_SCRIPT_ID;
  tag.src = MENU_SCRIPT_SRC;
  tag.async = true;
  tag.dataset.cor = opcoes.cor;
  tag.dataset.corEscura = opcoes.corEscura;
  tag.dataset.suave = opcoes.suave;
  if (opcoes.destaque) tag.dataset.destaque = opcoes.destaque;
  if (opcoes.noite) tag.dataset.noite = opcoes.noite;
  doc.body.appendChild(tag);
  return tag;
}

/** Mostra ou esconde o menu conforme a rota; nas rotas sem menu, nem carrega o script. */
export function atualizarMenu(doc: Document, pathname: string, opcoes: OpcoesMenuAcessibilidade): void {
  const oculto = rotaSemMenu(pathname);
  doc.documentElement.classList.toggle(CLASSE_MENU_OCULTO, oculto);
  if (!oculto) carregarMenu(doc, opcoes);
}
