import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorFallback from "@/components/ErrorFallback";

const erro = (digest?: string) => Object.assign(new Error("detalhe técnico secreto"), { digest });

describe("ErrorFallback", () => {
  it("mostra alerta amigável sem vazar a mensagem técnica", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorFallback error={erro()} reset={() => {}} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    expect(screen.queryByText(/detalhe técnico secreto/)).not.toBeInTheDocument();
  });

  it("exibe o código (digest) quando existe", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorFallback error={erro("abc123")} reset={() => {}} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });

  it("'Tentar novamente' chama reset", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reset = vi.fn();
    render(<ErrorFallback error={erro()} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("o link de saída usa o destino informado", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorFallback error={erro()} reset={() => {}} homeHref="/admin/dashboard" homeLabel="Painel" />);
    expect(screen.getByRole("link", { name: /painel/i })).toHaveAttribute("href", "/admin/dashboard");
  });

  it("registra o erro no console para diagnóstico", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<ErrorFallback error={erro()} reset={() => {}} />);
    expect(spy).toHaveBeenCalled();
  });
});
