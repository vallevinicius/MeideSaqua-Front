import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/admin/dashboard";
const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push }),
}));
vi.mock("next/image", () => ({ default: (p: any) => <img alt={p.alt} /> }));

const encerrar = vi.fn(() => Promise.resolve());
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  encerrarSessaoAdmin: () => encerrar(),
}));

import AdminShell, { semMenuLateral } from "@/components/admin/AdminShell";
import PageHeader from "@/components/admin/PageHeader";
import StatusDot from "@/components/admin/StatusDot";

beforeEach(() => {
  pathname = "/admin/dashboard";
  push.mockClear();
  encerrar.mockClear();
});

describe("semMenuLateral", () => {
  it.each([
    ["/admin/login", true],
    ["/admin/indicadores", true],
    ["/admin/indicadores/qualquer", true],
    ["/admin/dashboard", false],
    ["/admin/usuarios", false],
    ["/admin/comentarios/12", false],
  ])("%s → %s", (rota, esperado) => {
    expect(semMenuLateral(rota)).toBe(esperado);
  });
});

describe("AdminShell", () => {
  it("mostra o menu com todas as áreas do painel", () => {
    render(<AdminShell><p>conteúdo</p></AdminShell>);
    const menu = screen.getAllByRole("navigation", { name: /menu do painel/i })[0];
    for (const nome of ["Solicitações", "Estabelecimentos", "Usuários", "Comentários", "Cursos", "Indicadores"]) {
      expect(menu).toHaveTextContent(nome);
    }
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("marca a página atual com aria-current", () => {
    pathname = "/admin/usuarios";
    render(<AdminShell><p>x</p></AdminShell>);
    const atual = screen.getAllByRole("link", { current: "page" });
    expect(atual.length).toBeGreaterThan(0);
    atual.forEach((l) => expect(l).toHaveAttribute("href", "/admin/usuarios"));
  });

  it("subrota mantém a seção ativa", () => {
    pathname = "/admin/comentarios/5";
    render(<AdminShell><p>x</p></AdminShell>);
    expect(screen.getAllByRole("link", { current: "page" })[0]).toHaveAttribute("href", "/admin/comentarios");
  });

  it.each(["/admin/indicadores", "/admin/login"])("%s não ganha o menu lateral", (rota) => {
    pathname = rota;
    render(<AdminShell><p>tela própria</p></AdminShell>);
    expect(screen.queryByRole("navigation", { name: /menu do painel/i })).not.toBeInTheDocument();
    expect(screen.getByText("tela própria")).toBeInTheDocument();
  });

  it("'Sair' encerra a sessão e vai para o login", async () => {
    render(<AdminShell><p>x</p></AdminShell>);
    fireEvent.click(screen.getAllByRole("button", { name: /sair/i })[0]);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/login"));
    expect(encerrar).toHaveBeenCalledOnce();
  });

  it("menu do celular abre e fecha", () => {
    render(<AdminShell><p>x</p></AdminShell>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /abrir menu/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /fechar menu/i })[0]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("PageHeader", () => {
  it("mostra título, descrição e ações", () => {
    render(<PageHeader titulo="Usuários" descricao="Gerencie contas" acoes={<button>Exportar</button>} />);
    expect(screen.getByRole("heading", { level: 1, name: "Usuários" })).toBeInTheDocument();
    expect(screen.getByText("Gerencie contas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
  });

  it("sem descrição nem ações renderiza só o título", () => {
    render(<PageHeader titulo="Cursos" />);
    expect(screen.getByRole("heading", { name: "Cursos" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("StatusDot", () => {
  it("mostra o rótulo e esconde o círculo de leitores de tela", () => {
    const { container } = render(<StatusDot tipo="pendente" rotulo="Novos cadastros" />);
    expect(screen.getByText("Novos cadastros")).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
