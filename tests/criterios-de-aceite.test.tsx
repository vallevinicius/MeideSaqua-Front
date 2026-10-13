// Critério 12 do Relatório 003/2026 (D19): "Inspecionar o armazenamento do token após o
// login: token em cookie httpOnly, ausente do localStorage." Lado do front.
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import fs from "fs";
import path from "path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const JWT_FALSO = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.assinatura";

const tudoQueEstaNoNavegador = () => {
  const itens: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i)!;
    itens.push(`${chave}=${localStorage.getItem(chave)}`);
  }
  for (let i = 0; i < sessionStorage.length; i++) {
    const chave = sessionStorage.key(i)!;
    itens.push(`${chave}=${sessionStorage.getItem(chave)}`);
  }
  itens.push(document.cookie);
  return itens.join("\n");
};

const usuario = { usuarioId: 1, nomeCompleto: "Ana", username: "ana", email: "a@b.com" };

describe("Critério 12 (front): nenhum token no armazenamento do navegador", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => (document.cookie = `${c.split("=")[0]}=; max-age=0`));
  });

  it("login de usuário: mesmo que o servidor devolvesse um token, ele não é guardado", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => {});
    act(() => result.current.login({ user: usuario, token: JWT_FALSO }));
    const armazenado = tudoQueEstaNoNavegador();
    expect(armazenado).not.toContain(JWT_FALSO);
    expect(armazenado).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
    expect(armazenado).toContain("sessao-por-cookie");
  });

  it("sessão renovada, atualização de perfil e logout também não gravam token", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(null, { status: 204 }))));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => {});
    act(() => result.current.login({ user: usuario }));
    act(() => result.current.updateUser({ nomeCompleto: "Ana Maria" }));
    expect(tudoQueEstaNoNavegador()).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
    act(() => result.current.logout());
    expect(tudoQueEstaNoNavegador()).not.toContain("ana");
  });

  it("sessão antiga com JWT no navegador é migrada e o JWT some do armazenamento", async () => {
    localStorage.setItem("user", JSON.stringify({ ...usuario, token: JWT_FALSO }));
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({ user: usuario }), { status: 200 }))));
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(tudoQueEstaNoNavegador()).not.toContain(JWT_FALSO);
  });

  it("tela de login do admin: guarda só a hora de expiração, nunca o token, e não escreve cookie por JavaScript", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
    process.env.NEXT_PUBLIC_API_URL = "http://api.teste";
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ success: true, expiresAt: Date.now() + 3_600_000, token: JWT_FALSO }), { status: 200 }),
        ),
      ),
    );
    const { default: AdminLogin } = await import("@/app/admin/login/page");
    render(<AdminLogin />);
    await userEvent.type(screen.getByPlaceholderText(/usuário|usuario/i), "admin");
    await userEvent.type(screen.getByPlaceholderText(/senha/i), "segredo");
    await userEvent.click(screen.getByRole("button", { name: /entrar|login/i }));

    await waitFor(() => expect(localStorage.getItem("admin_token_expiry")).toBeTruthy());
    expect(tudoQueEstaNoNavegador()).not.toContain(JWT_FALSO);
    expect(localStorage.getItem("admin_token")).toBeNull();
    expect(document.cookie).not.toContain("admin_token");
    const [, opcoes] = (fetch as any).mock.calls[0];
    expect(opcoes.credentials).toBe("include");
  });
});

// Trava de regressão: lê o código-fonte do front e proíbe voltar a guardar token.
describe("Critério 12 (front): trava de código-fonte", () => {
  const raiz = path.resolve(__dirname, "..");
  const arquivos = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const caminho = path.join(dir, e.name);
      if (e.isDirectory()) return ["node_modules", ".next", "tests", "public"].includes(e.name) ? [] : arquivos(caminho);
      return /\.(ts|tsx)$/.test(e.name) ? [caminho] : [];
    });
  const fontes = ["app", "components", "context", "lib", "hooks"].flatMap((d) => arquivos(path.join(raiz, d)));

  const procurar = (regex: RegExp) =>
    fontes
      .map((f) => ({ f: path.relative(raiz, f), linhas: fs.readFileSync(f, "utf8").split("\n") }))
      .flatMap(({ f, linhas }) => linhas.map((l, i) => ({ f, i: i + 1, l })).filter(({ l }) => regex.test(l) && !l.trim().startsWith("//")))
      .map(({ f, i, l }) => `${f}:${i}  ${l.trim()}`);

  it("nenhum arquivo grava token no localStorage", () => {
    expect(procurar(/localStorage\.setItem\(\s*["'`](admin_token|token|access_token|jwt)["'`]/)).toEqual([]);
  });

  it("nenhum arquivo escreve cookie de sessão por JavaScript", () => {
    expect(procurar(/document\.cookie\s*=\s*[`"']?\s*(admin_token|token|access_token|refresh_token)=[^;]*\$\{/)).toEqual([]);
  });

  it("nenhum arquivo lê token do localStorage (só o marcador de sessão)", () => {
    expect(procurar(/localStorage\.getItem\(\s*["'`](admin_token|token|access_token|jwt)["'`]\s*\)/)).toEqual([]);
  });

  // Rotas públicas, sem sessão: não precisam de cookie.
  const SEM_SESSAO = ["/api/auth/resend-confirmation"];

  // Devolve o texto completo de cada chamada fetch(...), equilibrando os parênteses.
  const chamadasFetch = (codigo: string) => {
    const chamadas: string[] = [];
    for (const m of codigo.matchAll(/\bfetch\(/g)) {
      let nivel = 0;
      for (let i = (m.index ?? 0) + m[0].length; i < codigo.length; i++) {
        if (codigo[i] === "(") nivel++;
        if (codigo[i] === ")") {
          if (nivel === 0) {
            chamadas.push(codigo.slice(m.index, i + 1));
            break;
          }
          nivel--;
        }
      }
    }
    return chamadas;
  };

  it("toda chamada fetch para a API envia credenciais (cookies)", () => {
    const sem: string[] = [];
    for (const arquivo of fontes) {
      if (/sitemap/.test(arquivo)) continue; // roda no servidor do Next, sem navegador
      for (const chamada of chamadasFetch(fs.readFileSync(arquivo, "utf8"))) {
        const ehApi = /API_URL|buildApiUrl|\/api\//.test(chamada);
        const publica = SEM_SESSAO.some((r) => chamada.includes(r));
        if (ehApi && !publica && !/credentials/.test(chamada)) {
          sem.push(`${path.relative(raiz, arquivo)}: ${chamada.replace(/\s+/g, " ").slice(0, 100)}`);
        }
      }
    }
    expect(sem).toEqual([]);
  });

  it("a trava enxerga chamadas sem credenciais (o teste não é vazio)", () => {
    expect(chamadasFetch('fetch(`${API_URL}/api/x`, { method: "POST" })')).toHaveLength(1);
    expect(chamadasFetch("a(); fetch(u1); fetch(u2, {})").length).toBe(2);
    expect(fontes.flatMap((f) => chamadasFetch(fs.readFileSync(f, "utf8"))).length).toBeGreaterThan(8);
  });
});
