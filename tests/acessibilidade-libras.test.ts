import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

const SCRIPT = readFileSync(path.resolve(__dirname, "../public/acessibilidade/acessibilidade-saqua.js"), "utf-8");

// Executa o menu como o navegador faria ao carregar o <script>.
function iniciarMenu() {
  new Function(SCRIPT)();
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
  delete (window as any).__acessibilidadeSaqua;
  delete (window as any).VLibras;
  delete (window as any).VLibrasWidget;
  window.matchMedia = (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as any;
});

describe("opção Libras quando o script do VLibras não carrega", () => {
  it("mostra o menu e a opção Libras mesmo sem o VLibras", () => {
    iniciarMenu();
    expect(document.getElementById("acesso")?.hidden).toBe(false);
    expect(document.getElementById("acesso-libras")?.hidden).toBe(false);
  });

  it("ao clicar, avisa que a Libras está indisponível", () => {
    iniciarMenu();
    document.getElementById("acesso-libras")?.click();
    const aviso = document.querySelector(".acesso-aviso");
    expect(aviso?.textContent).toMatch(/Libras indisponível/);
  });

  it("com o VLibras carregado, abre o avatar e não mostra aviso de erro", () => {
    let abriu = false;
    (window as any).VLibras = { Widget() {} };
    (window as any).VLibrasWidget = { open() { abriu = true; } };
    iniciarMenu();
    document.getElementById("acesso-libras")?.click();
    expect(abriu).toBe(true);
    expect(document.querySelector(".acesso-aviso")).toBeNull();
  });

  it("com o plugin presente mas sem open(), avisa em vez de quebrar", () => {
    (window as any).VLibras = { Widget() {} };
    iniciarMenu();
    expect(() => document.getElementById("acesso-libras")?.click()).not.toThrow();
    expect(document.querySelector(".acesso-aviso")).not.toBeNull();
  });
});
