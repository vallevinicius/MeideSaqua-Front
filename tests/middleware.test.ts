import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { config, middleware } from "@/middleware";

const chamar = (caminho: string, token?: string) =>
  middleware(
    new NextRequest(`http://localhost:3300${caminho}`, {
      headers: token ? { cookie: `admin_token=${token}` } : {},
    }),
  );

describe("middleware das rotas /admin", () => {
  it.each(["/admin/dashboard", "/admin/cursos", "/admin/estabelecimentos-ativos", "/admin"])(
    "%s sem token redireciona para o login do admin",
    (rota) => {
      const res = chamar(rota);
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toBe("http://localhost:3300/admin/login");
    },
  );

  it("com token deixa passar", () => {
    const res = chamar("/admin/dashboard", "abc");
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("a própria página de login é livre (evita laço de redirecionamento)", () => {
    expect(chamar("/admin/login").headers.get("location")).toBeNull();
  });

  it("cookie vazio não vale como token", () => {
    const res = chamar("/admin/dashboard", "");
    expect(res.headers.get("location")).toContain("/admin/login");
  });

  it("só atua nas rotas de admin", () => {
    expect(config.matcher).toEqual(["/admin/:path*"]);
  });

  it("rotas públicas passam mesmo sem token", () => {
    expect(chamar("/").headers.get("location")).toBeNull();
    expect(chamar("/login").headers.get("location")).toBeNull();
  });
});
