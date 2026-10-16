import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import AdminLoginPage from "@/app/admin/login/page";
import * as sonner from "sonner";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AdminLoginPage", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    process.env.NEXT_PUBLIC_API_URL = "http://api.teste";
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("renderiza os elementos principais da tela de login", () => {
    render(<AdminLoginPage />);

    expect(screen.getByRole("heading", { name: /Acesso Administrativo/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Usuário ou E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Entrar no Painel/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voltar ao portal/i })).toBeInTheDocument();
  });

  it("alterna a visibilidade da senha ao clicar no botão de exibição", async () => {
    render(<AdminLoginPage />);

    const passwordInput = screen.getByLabelText(/^Senha$/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleButton = screen.getByLabelText(/Exibir senha/i);
    await userEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/Ocultar senha/i)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Ocultar senha/i));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("impede submissão e exibe erros de validação quando campos estão vazios", async () => {
    render(<AdminLoginPage />);

    const submitButton = screen.getByRole("button", { name: /Entrar no Painel/i });
    await userEvent.click(submitButton);

    expect(await screen.findByText(/Informe o usuário ou e-mail/i)).toBeInTheDocument();
    expect(await screen.findByText(/Informe sua senha/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("realiza login com sucesso, limpa token antigo, salva expiração e redireciona", async () => {
    localStorage.setItem("admin_token", "jwt-obsoleto");
    const expiresAt = Date.now() + 3600_000;

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true, expiresAt }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    render(<AdminLoginPage />);

    await userEvent.type(screen.getByLabelText(/Usuário ou E-mail/i), "admin_saqua");
    await userEvent.type(screen.getByLabelText(/^Senha$/i), "senhaForte@123");
    await userEvent.click(screen.getByRole("button", { name: /Entrar no Painel/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.teste/api/admin/login",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "admin_saqua",
            password: "senhaForte@123",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(localStorage.getItem("admin_token")).toBeNull();
      expect(localStorage.getItem("admin_token_expiry")).toBe(String(expiresAt));
      expect(sonner.toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Acesso autorizado")
      );
      expect(pushMock).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("exibe mensagem de erro quando credenciais são rejeitadas pelo backend", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          message: "Credenciais inválidas. Verifique seu usuário e senha.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    render(<AdminLoginPage />);

    await userEvent.type(screen.getByLabelText(/Usuário ou E-mail/i), "admin_saqua");
    await userEvent.type(screen.getByLabelText(/^Senha$/i), "senhaErrada");
    await userEvent.click(screen.getByRole("button", { name: /Entrar no Painel/i }));

    await waitFor(() => {
      expect(sonner.toast.error).toHaveBeenCalledWith(
        "Credenciais inválidas. Verifique seu usuário e senha."
      );
      expect(pushMock).not.toHaveBeenCalled();
      expect(localStorage.getItem("admin_token_expiry")).toBeNull();
    });
  });

  it("exibe erro amigável quando ocorre falha de conexão com a API", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network Error"));

    render(<AdminLoginPage />);

    await userEvent.type(screen.getByLabelText(/Usuário ou E-mail/i), "admin_saqua");
    await userEvent.type(screen.getByLabelText(/^Senha$/i), "qualquerSenha");
    await userEvent.click(screen.getByRole("button", { name: /Entrar no Painel/i }));

    await waitFor(() => {
      expect(sonner.toast.error).toHaveBeenCalledWith(
        "Não foi possível conectar ao servidor. Tente novamente."
      );
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
