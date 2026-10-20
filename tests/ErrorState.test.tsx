import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorState from "@/components/ErrorState";

describe("ErrorState", () => {
  it("mostra título e mensagem como alerta", () => {
    render(<ErrorState mensagem="Servidor fora do ar" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Não foi possível carregar")).toBeInTheDocument();
    expect(screen.getByText("Servidor fora do ar")).toBeInTheDocument();
  });

  it("sem onRetry não mostra botão", () => {
    render(<ErrorState mensagem="x" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("botão 'Tentar novamente' chama onRetry", () => {
    const onRetry = vi.fn();
    render(<ErrorState mensagem="x" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /tentar novamente/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
