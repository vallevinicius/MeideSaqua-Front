import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { SESSAO_COOKIE } from "@/lib/session";

const usuario = { usuarioId: 1, nomeCompleto: "Ana", username: "ana", email: "a@b.com" };

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

describe("AuthContext", () => {
  it("começa carregando e termina sem usuário quando não há sessão salva", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("restaura a sessão salva no navegador", async () => {
    localStorage.setItem("user", JSON.stringify({ ...usuario, token: SESSAO_COOKIE }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user?.username).toBe("ana");
    expect(result.current.user?.token).toBe(SESSAO_COOKIE);
  });

  describe("migração de quem já estava logado (JWT antigo no navegador)", () => {
    const antigo = { ...usuario, token: "eyJ.JWT.ANTIGO" };

    it("troca o token antigo por cookies sem pedir login, e apaga o JWT do navegador", async () => {
      const fetchMock = vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ user: usuario, expiresAt: 1 }), { status: 200 })),
      );
      vi.stubGlobal("fetch", fetchMock);
      localStorage.setItem("user", JSON.stringify(antigo));

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isLoading).toBe(true);
      await act(async () => {});

      const [url, opcoes] = fetchMock.mock.calls[0] as any;
      expect(url).toContain("/api/auth/migrar-sessao");
      expect(opcoes).toMatchObject({ method: "POST", credentials: "include" });
      expect(opcoes.headers.Authorization).toBe("Bearer eyJ.JWT.ANTIGO");

      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toMatchObject({ username: "ana", token: SESSAO_COOKIE });
      expect(localStorage.getItem("user")).not.toContain("JWT.ANTIGO");
    });

    it("token antigo vencido: sessão limpa (a pessoa teria que logar de qualquer forma)", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}", { status: 401 }))));
      localStorage.setItem("user", JSON.stringify(antigo));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it("sem rede: mantém o login com o token antigo e tenta de novo na próxima visita", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
      localStorage.setItem("user", JSON.stringify(antigo));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user?.token).toBe("eyJ.JWT.ANTIGO");
      expect(JSON.parse(localStorage.getItem("user")!).token).toBe("eyJ.JWT.ANTIGO");
    });

    it("erro do servidor (500) também não desloga", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}", { status: 500 }))));
      localStorage.setItem("user", JSON.stringify(antigo));
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(result.current.user?.username).toBe("ana");
    });

    it("sessão já no formato novo não chama a migração", async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      localStorage.setItem("user", JSON.stringify({ ...usuario, token: SESSAO_COOKIE }));
      renderHook(() => useAuth(), { wrapper });
      await act(async () => {});
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it("dado corrompido no navegador é descartado sem quebrar a tela", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("user", "{quebrado");
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("login guarda só o marcador de sessão, nunca um token", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => result.current.login({ user: usuario, token: "TOKEN-QUE-NAO-DEVE-SER-GUARDADO" }));
    expect(result.current.user).toMatchObject({ username: "ana", token: SESSAO_COOKIE });
    const salvo = localStorage.getItem("user")!;
    expect(JSON.parse(salvo).token).toBe(SESSAO_COOKIE);
    expect(salvo).not.toContain("TOKEN-QUE-NAO-DEVE-SER-GUARDADO");
  });

  it("login sem token no corpo (resposta nova do servidor) funciona", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => result.current.login({ user: usuario }));
    expect(result.current.user?.token).toBe(SESSAO_COOKIE);
  });

  it("updateUser mescla os dados e persiste; sem usuário não faz nada", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => result.current.updateUser({ nomeCompleto: "Ignorado" }));
    expect(result.current.user).toBeNull();

    act(() => result.current.login({ user: usuario }));
    act(() => result.current.updateUser({ nomeCompleto: "Ana Maria" }));
    expect(result.current.user?.nomeCompleto).toBe("Ana Maria");
    expect(result.current.user?.token).toBe(SESSAO_COOKIE);
    expect(JSON.parse(localStorage.getItem("user")!).nomeCompleto).toBe("Ana Maria");
  });

  it("logout limpa a sessão, avisa o servidor e vai para /login", async () => {
    const original = window.location;
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => result.current.login({ user: usuario }));
    act(() => result.current.logout());
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(window.location.href).toBe("/login");
    const [url, opcoes] = fetchMock.mock.calls[0] as any;
    expect(url).toContain("/api/auth/logout");
    expect(opcoes).toMatchObject({ method: "POST", credentials: "include" });
    Object.defineProperty(window, "location", { value: original, writable: true });
  });

  it("useAuth fora do provider lança erro claro", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });

  it("funciona dentro de um componente real", async () => {
    const Tela = () => {
      const { user, login } = useAuth();
      return (
        <>
          <span data-testid="nome">{user?.username ?? "ninguém"}</span>
          <button onClick={() => login({ user: usuario })}>entrar</button>
        </>
      );
    };
    render(<AuthProvider><Tela /></AuthProvider>);
    expect(await screen.findByTestId("nome")).toHaveTextContent("ninguém");
    await userEvent.click(screen.getByText("entrar"));
    expect(screen.getByTestId("nome")).toHaveTextContent("ana");
  });
});
