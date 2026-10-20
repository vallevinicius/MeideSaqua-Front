import { beforeEach, describe, expect, it, vi } from "vitest";
import { SESSAO_COOKIE, encerrarSessaoAdmin, getAdminToken, iniciarSessaoAdmin } from "@/lib/session";

describe("sessão do admin (marcador, sem token)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.teste";
  });

  it("sem sessão devolve null", () => {
    expect(getAdminToken()).toBeNull();
  });

  it("com sessão ativa devolve o marcador e nunca um JWT", () => {
    iniciarSessaoAdmin(Date.now() + 60_000);
    expect(getAdminToken()).toBe(SESSAO_COOKIE);
    expect(Object.values(localStorage).join(" ")).not.toMatch(/eyJ/);
  });

  it("remove o JWT antigo do admin que ficou no navegador", () => {
    localStorage.setItem("admin_token", "jwt-antigo");
    iniciarSessaoAdmin(Date.now() + 60_000);
    expect(getAdminToken()).toBe(SESSAO_COOKIE);
    expect(localStorage.getItem("admin_token")).toBeNull();
  });

  it("sessão de admin criada pela versão antiga (expiração em ms) continua valendo", () => {
    localStorage.setItem("admin_token", "jwt-antigo");
    localStorage.setItem("admin_token_expiry", String(Date.now() + 28800 * 1000));
    expect(getAdminToken()).toBe(SESSAO_COOKIE);
  });

  it("sessão vencida devolve null e limpa o que sobrou", () => {
    iniciarSessaoAdmin(Date.now() - 1000);
    expect(getAdminToken()).toBeNull();
    expect(localStorage.getItem("admin_token_expiry")).toBeNull();
  });

  it("valor inválido na expiração não vale como sessão", () => {
    localStorage.setItem("admin_token_expiry", "abc");
    expect(getAdminToken()).toBeNull();
  });

  it("encerrar apaga o estado local (inclusive token antigo) e pede ao servidor para apagar o cookie", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
    iniciarSessaoAdmin(Date.now() + 60_000);
    localStorage.setItem("admin_token", "jwt-antigo");
    await encerrarSessaoAdmin();
    expect(localStorage.getItem("admin_token_expiry")).toBeNull();
    expect(localStorage.getItem("admin_token")).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("http://api.teste/api/admin/logout", { method: "POST", credentials: "include" });
  });

  it("encerrar funciona mesmo sem rede", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
    iniciarSessaoAdmin(Date.now() + 60_000);
    await expect(encerrarSessaoAdmin()).resolves.toBeUndefined();
    expect(getAdminToken()).toBeNull();
  });
});

import { ApiError } from "@/lib/errors";
import { tratarSessaoAdminExpirada } from "@/lib/session";

describe("tratarSessaoAdminExpirada", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.teste";
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}"))));
  });

  it("401 limpa a sessão do admin e devolve true", () => {
    iniciarSessaoAdmin(Date.now() + 60_000);
    expect(tratarSessaoAdminExpirada(new ApiError("expirou", 401))).toBe(true);
    expect(localStorage.getItem("admin_token_expiry")).toBeNull();
  });

  it.each([[new ApiError("proibido", 403)], [new ApiError("servidor", 500)], [new Error("x")], [null]])(
    "%o não é tratado como sessão expirada",
    (erro) => {
      iniciarSessaoAdmin(Date.now() + 60_000);
      expect(tratarSessaoAdminExpirada(erro)).toBe(false);
      expect(getAdminToken()).toBe(SESSAO_COOKIE);
    },
  );
});
