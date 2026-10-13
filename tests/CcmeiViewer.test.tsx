import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const sessaoAdminAtiva = () => localStorage.setItem("admin_token_expiry", String(Date.now() + 3600_000));

let fetchMock: ReturnType<typeof vi.fn>;
let abrirJanela: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_API_URL = "http://api.teste";
  fetchMock = vi.fn(() =>
    Promise.resolve(new Response(new Blob(["pdf"]), { status: 200 })),
  );
  vi.stubGlobal("fetch", fetchMock);
  abrirJanela = vi.fn();
  vi.stubGlobal("open", abrirJanela);
  URL.createObjectURL = vi.fn(() => "blob:teste");
  URL.revokeObjectURL = vi.fn();
});

const montar = async (props: { estabelecimentoId: number; pendente?: boolean }) => {
  const { default: CcmeiViewer } = await import("@/components/admin/CcmeiViewer");
  render(<CcmeiViewer {...props} />);
  await userEvent.click(screen.getByRole("button", { name: /ver ccmei/i }));
};

describe("CcmeiViewer", () => {
  it("busca o CCMEI atual enviando o cookie de sessão e abre como blob", async () => {
    sessaoAdminAtiva();
    await montar({ estabelecimentoId: 7 });

    await waitFor(() => expect(abrirJanela).toHaveBeenCalled());
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.teste/api/admin/estabelecimento/7/ccmei");
    expect(opcoes.credentials).toBe("include");
    expect(opcoes.headers.Authorization).toBe("Bearer sessao-por-cookie");
    expect(abrirJanela.mock.calls[0][0]).toBe("blob:teste");
  });

  it("usa ?pendente=1 para o CCMEI de atualização em análise", async () => {
    sessaoAdminAtiva();
    await montar({ estabelecimentoId: 7, pendente: true });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://api.teste/api/admin/estabelecimento/7/ccmei?pendente=1",
    );
  });

  it("sem sessão ativa não chama a API", async () => {
    await montar({ estabelecimentoId: 7 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(abrirJanela).not.toHaveBeenCalled();
  });

  it("não abre janela quando a API recusa", async () => {
    sessaoAdminAtiva();
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("{}", { status: 404 })),
    );
    await montar({ estabelecimentoId: 7 });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(abrirJanela).not.toHaveBeenCalled();
  });
});
