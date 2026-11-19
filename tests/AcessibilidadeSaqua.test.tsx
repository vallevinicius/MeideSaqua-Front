import { StrictMode } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import AcessibilidadeSaqua from "@/components/AcessibilidadeSaqua";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));
vi.mock("sonner", () => ({ toast: vi.fn() }));
// O Sienna de verdade se instala sozinho no `document`; aqui só importa quando ele "termina".
vi.mock("sienna-accessibility", () => ({}));

const PAGINA = `<main><h1>Título</h1><p>Texto da página.</p></main>`;

/** Fala falsa: guarda o texto e deixa o teste disparar o fim dela. */
class FalaFalsa {
  lang = "";
  voice: unknown = null;
  rate = 1;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  constructor(public text: string) {}
}

function instalarVoz() {
  const falas: FalaFalsa[] = [];
  const sintese = {
    speak: vi.fn((fala: FalaFalsa) => falas.push(fala)),
    cancel: vi.fn(),
    getVoices: () => [],
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(window, "speechSynthesis", { value: sintese, configurable: true });
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: FalaFalsa, configurable: true });
  return { sintese, falas };
}

function removerVoz() {
  Reflect.deleteProperty(window, "speechSynthesis");
  Reflect.deleteProperty(window, "SpeechSynthesisUtterance");
}

/** Simula o botão do Sienna que aparece depois do import. */
function instalarBotaoSienna() {
  const botao = document.createElement("button");
  botao.className = "asw-menu-btn";
  document.body.appendChild(botao);
  return botao;
}

const abrirMenu = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(screen.getByRole("button", { name: /Acessibilidade: Libras/ }));
};

beforeEach(() => {
  document.body.innerHTML = PAGINA;
  document.documentElement.className = "";
  vi.mocked(usePathname).mockReturnValue("/");
  vi.mocked(toast).mockClear();
  delete window.VLibras;
  delete window.VLibrasWidget;
  removerVoz();
});

afterEach(() => {
  removerVoz();
});

describe("AcessibilidadeSaqua: visibilidade", () => {
  it("em rota pública mostra o botão do menu", () => {
    render(<AcessibilidadeSaqua />);
    expect(screen.getByRole("button", { name: /Acessibilidade: Libras/ })).toBeInTheDocument();
  });

  it("em /admin não renderiza o menu nem carrega o VLibras", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/usuarios");
    render(<AcessibilidadeSaqua />);
    expect(screen.queryByRole("button", { name: /Acessibilidade/ })).toBeNull();
    expect(document.querySelector('script[src*="vlibras"]')).toBeNull();
  });

  it("carrega o script do VLibras uma única vez", () => {
    const { unmount } = render(<AcessibilidadeSaqua />);
    unmount();
    render(<AcessibilidadeSaqua />);
    expect(document.querySelectorAll('script[src="https://vlibras.gov.br/app/vlibras-plugin.js"]')).toHaveLength(1);
  });
});

describe("AcessibilidadeSaqua: menu", () => {
  it("abre e fecha pelo botão, atualizando aria-expanded", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    const botao = screen.getByRole("button", { name: /Acessibilidade: Libras/ });
    expect(botao).toHaveAttribute("aria-expanded", "false");

    await usuario.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Ferramentas de acessibilidade" })).toBeVisible();

    await usuario.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "false");
  });

  it("Esc fecha o menu e devolve o foco ao botão", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    const botao = screen.getByRole("button", { name: /Acessibilidade: Libras/ });
    await usuario.click(botao);

    await usuario.keyboard("{Escape}");
    expect(botao).toHaveAttribute("aria-expanded", "false");
    expect(botao).toHaveFocus();
  });

  it("clique fora fecha o menu", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(document.querySelector("h1")!);
    expect(screen.getByRole("button", { name: /Acessibilidade: Libras/ })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("AcessibilidadeSaqua: Libras", () => {
  it("a opção Libras aparece mesmo sem o VLibras", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    expect(screen.getByRole("button", { name: "Traduzir em Libras" })).toBeInTheDocument();
  });

  it("sem o VLibras carregado, ao clicar avisa que a Libras está indisponível", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(screen.getByRole("button", { name: "Traduzir em Libras" }));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/Libras indisponível/));
  });

  it("com o VLibras carregado, abre o avatar e não avisa erro", async () => {
    const open = vi.fn();
    window.VLibras = { Widget: vi.fn() as unknown as NonNullable<Window["VLibras"]>["Widget"] };
    window.VLibrasWidget = { open };
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(screen.getByRole("button", { name: "Traduzir em Libras" }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(toast).not.toHaveBeenCalled();
  });

  it("não abre dois avatares quando o React monta o menu duas vezes (Strict Mode)", () => {
    const Widget = vi.fn(function () {
      const caixa = document.createElement("div");
      caixa.id = "vlibras-access-wrapper";
      document.body.appendChild(caixa);
    });
    window.VLibras = { Widget: Widget as unknown as NonNullable<Window["VLibras"]>["Widget"] };
    render(
      <StrictMode>
        <AcessibilidadeSaqua />
      </StrictMode>
    );
    expect(Widget).toHaveBeenCalledTimes(1);
  });
});

describe("AcessibilidadeSaqua: Sienna", () => {
  it("sem o Sienna, a opção de ajustes não aparece", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    expect(screen.queryByRole("button", { name: "Ajustes de leitura" })).toBeNull();
  });

  it("quando o Sienna termina de carregar, a opção aparece e abre o menu dele", async () => {
    const botaoSienna = instalarBotaoSienna();
    const clique = vi.fn();
    botaoSienna.addEventListener("click", clique);
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);

    const ajustes = await screen.findByRole("button", { name: "Ajustes de leitura" });
    await usuario.click(ajustes);
    expect(clique).toHaveBeenCalledTimes(1);
  });

  it("'Ouvir por parágrafo' só aparece com Sienna e voz do navegador", async () => {
    instalarBotaoSienna();
    const usuario = userEvent.setup();
    const { unmount } = render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await screen.findByRole("button", { name: "Ajustes de leitura" });
    expect(screen.queryByRole("button", { name: /Ouvir por parágrafo/ })).toBeNull();
    unmount();

    instalarVoz();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    expect(await screen.findByRole("button", { name: /Ouvir por parágrafo/ })).toBeInTheDocument();
  });
});

describe("AcessibilidadeSaqua: ouvir a página", () => {
  it("sem Web Speech API, a opção de ouvir não aparece", async () => {
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    expect(screen.queryByRole("button", { name: /Ouvir página inteira/ })).toBeNull();
  });

  it("lê o conteúdo do <main>, pausa, continua e para", async () => {
    const { sintese, falas } = instalarVoz();
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(await screen.findByRole("button", { name: /Ouvir página inteira/ }));

    await usuario.click(screen.getByRole("button", { name: "Ouvir" }));
    expect(sintese.speak).toHaveBeenCalledTimes(1);
    expect(falas[0].text).toBe("Título. Texto da página.");
    expect(falas[0].lang).toBe("pt-BR");
    expect(screen.getByText(/Lendo… trecho 1 de 1/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Pausar" }));
    expect(sintese.cancel).toHaveBeenCalled();
    expect(screen.getByText(/Pausado no trecho 1 de 1/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Continuar" }));
    expect(sintese.speak).toHaveBeenCalledTimes(2);

    await usuario.click(screen.getByRole("button", { name: "Parar" }));
    expect(screen.getByText("Leitura parada.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ouvir" })).toBeInTheDocument();
  });

  it("ao terminar o último trecho, avisa que a leitura concluiu", async () => {
    const { falas } = instalarVoz();
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(await screen.findByRole("button", { name: /Ouvir página inteira/ }));
    await usuario.click(screen.getByRole("button", { name: "Ouvir" }));

    act(() => falas[0].onend?.());
    await waitFor(() => expect(screen.getByText("Leitura concluída.")).toBeInTheDocument());
  });

  it("sem texto na página, avisa em vez de falar", async () => {
    document.body.innerHTML = "<main></main>";
    const { sintese } = instalarVoz();
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(await screen.findByRole("button", { name: /Ouvir página inteira/ }));
    await usuario.click(screen.getByRole("button", { name: "Ouvir" }));

    expect(sintese.speak).not.toHaveBeenCalled();
    expect(screen.getByText("Não há texto para ler nesta página.")).toBeInTheDocument();
  });

  it("trocar a velocidade durante a leitura recomeça o trecho na nova velocidade", async () => {
    const { falas, sintese } = instalarVoz();
    const usuario = userEvent.setup();
    render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(await screen.findByRole("button", { name: /Ouvir página inteira/ }));
    await usuario.click(screen.getByRole("button", { name: "Ouvir" }));

    await usuario.selectOptions(screen.getByLabelText("Velocidade da leitura"), "1.5");
    expect(sintese.speak).toHaveBeenCalledTimes(2);
    expect(falas[1].rate).toBe(1.5);
  });

  it("a leitura para ao sair do menu (ex.: ir para /admin)", async () => {
    const { sintese } = instalarVoz();
    const usuario = userEvent.setup();
    const { unmount } = render(<AcessibilidadeSaqua />);
    await abrirMenu(usuario);
    await usuario.click(await screen.findByRole("button", { name: /Ouvir página inteira/ }));
    await usuario.click(screen.getByRole("button", { name: "Ouvir" }));
    sintese.cancel.mockClear();

    unmount();
    expect(sintese.cancel).toHaveBeenCalled();
  });
});
