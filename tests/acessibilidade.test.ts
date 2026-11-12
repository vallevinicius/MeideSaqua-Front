import { beforeEach, describe, expect, it } from "vitest";
import {
  CLASSE_MENU_OCULTO,
  MENU_SCRIPT_ID,
  MENU_SCRIPT_SRC,
  atualizarMenu,
  carregarMenu,
  rotaSemMenu,
} from "@/lib/acessibilidade";

const OPCOES = { cor: "#112233", corEscura: "#001122", suave: "#EEF" };

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.className = "";
});

describe("rotaSemMenu", () => {
  it.each(["/admin", "/admin/", "/admin/usuarios"])("esconde o menu em %s", (rota) => {
    expect(rotaSemMenu(rota)).toBe(true);
  });

  it.each(["/", "/vagas/1", "/administracao", "/meu/admin", "/Admin"])("mostra o menu em %s", (rota) => {
    expect(rotaSemMenu(rota)).toBe(false);
  });
});

describe("carregarMenu", () => {
  it("cria o script apontando para o menu, com as cores", () => {
    const tag = carregarMenu(document, { ...OPCOES, destaque: "#FFAA00", noite: "#000" });
    expect(tag).not.toBeNull();
    expect(tag?.id).toBe(MENU_SCRIPT_ID);
    expect(tag?.getAttribute("src")).toBe(MENU_SCRIPT_SRC);
    expect(tag?.dataset).toMatchObject({ cor: "#112233", corEscura: "#001122", suave: "#EEF", destaque: "#FFAA00", noite: "#000" });
    expect(document.body.contains(tag)).toBe(true);
  });

  it("não cria atributos opcionais ausentes", () => {
    const tag = carregarMenu(document, OPCOES);
    expect(tag?.dataset.destaque).toBeUndefined();
    expect(tag?.dataset.noite).toBeUndefined();
  });

  it("só carrega uma vez", () => {
    carregarMenu(document, OPCOES);
    expect(carregarMenu(document, OPCOES)).toBeNull();
    expect(document.querySelectorAll(`#${MENU_SCRIPT_ID}`)).toHaveLength(1);
  });
});

describe("atualizarMenu", () => {
  it("em rota pública, carrega o menu e o deixa visível", () => {
    atualizarMenu(document, "/", OPCOES);
    expect(document.getElementById(MENU_SCRIPT_ID)).not.toBeNull();
    expect(document.documentElement.classList.contains(CLASSE_MENU_OCULTO)).toBe(false);
  });

  it("em /admin, não carrega o script e marca o menu como oculto", () => {
    atualizarMenu(document, "/admin/usuarios", OPCOES);
    expect(document.getElementById(MENU_SCRIPT_ID)).toBeNull();
    expect(document.documentElement.classList.contains(CLASSE_MENU_OCULTO)).toBe(true);
  });

  it("ao sair do /admin, volta a mostrar e carrega o menu", () => {
    atualizarMenu(document, "/admin", OPCOES);
    atualizarMenu(document, "/", OPCOES);
    expect(document.documentElement.classList.contains(CLASSE_MENU_OCULTO)).toBe(false);
    expect(document.getElementById(MENU_SCRIPT_ID)).not.toBeNull();
  });

  it("ao entrar no /admin depois de carregado, só esconde (não remove o script)", () => {
    atualizarMenu(document, "/", OPCOES);
    atualizarMenu(document, "/admin", OPCOES);
    expect(document.documentElement.classList.contains(CLASSE_MENU_OCULTO)).toBe(true);
    expect(document.getElementById(MENU_SCRIPT_ID)).not.toBeNull();
  });
});
