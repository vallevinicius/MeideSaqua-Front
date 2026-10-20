import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAll = vi.fn();
vi.mock("@/lib/api", () => ({
  getAllEstablishments: (...a: unknown[]) => getAll(...a),
  registrarVisualizacao: vi.fn(),
}));
vi.mock("next/image", () => ({ default: (p: any) => <img alt={p.alt} /> }));
vi.mock("@/components/ModernCarousel", () => ({ default: () => null }));

import CategoryPage from "@/app/categoria/[slug]/page";
import { ApiError } from "@/lib/errors";
import { categories } from "@/constants/categories";

const slug = categories[0].id;
const titulo = categories[0].title;

beforeEach(() => getAll.mockReset());

describe("página de categoria: tratamento de erro", () => {
  it("falha de rede mostra o erro (e não 'Nenhum MEI encontrado')", async () => {
    getAll.mockImplementationOnce(() => Promise.reject(new ApiError("Não foi possível conectar ao servidor.", 0)));
    render(<CategoryPage params={{ slug }} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar");
    expect(screen.queryByText("Nenhum MEI encontrado")).not.toBeInTheDocument();
  });

  it("'Tentar novamente' busca de novo e mostra os locais", async () => {
    getAll.mockImplementationOnce(() => Promise.reject(new ApiError("falhou", 500)));
    getAll.mockResolvedValueOnce([{ estabelecimentoId: 1, categoria: titulo, nomeFantasia: "Padaria Teste" }]);
    render(<CategoryPage params={{ slug }} />);
    fireEvent.click(await screen.findByRole("button", { name: /tentar novamente/i }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(getAll).toHaveBeenCalledTimes(2);
  });

  it("resposta que não é lista também vira erro", async () => {
    getAll.mockResolvedValue({ message: "oi" });
    render(<CategoryPage params={{ slug }} />);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("lista vazia continua mostrando 'Nenhum MEI encontrado'", async () => {
    getAll.mockResolvedValue([]);
    render(<CategoryPage params={{ slug }} />);
    expect(await screen.findByText("Nenhum MEI encontrado")).toBeInTheDocument();
  });
});
