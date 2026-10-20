import { beforeEach, describe, expect, it, vi } from "vitest";

const resposta = (corpo: unknown = {}, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(corpo), { status }));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  process.env.NEXT_PUBLIC_API_URL = "http://api.teste";
  fetchMock = vi.fn(() => resposta());
  vi.stubGlobal("fetch", fetchMock);
});

const api = () => import("@/lib/api");
const ultima = () => {
  const [url, opcoes] = fetchMock.mock.calls[0];
  return { url: url as string, opcoes: (opcoes ?? {}) as RequestInit };
};
const cab = (opcoes: RequestInit) => (opcoes.headers ?? {}) as Record<string, string>;

// [função, argumentos, método, caminho, exige token?]
type Caso = [string, any[], string, string, boolean];
const fd = () => new FormData();

const casos: Caso[] = [
  ["registerUser", [{ a: 1 }], "POST", "/api/auth/cadastro", false],
  ["loginUser", [{ a: 1 }], "POST", "/api/auth/login", false],
  ["confirmAccount", ["tk"], "GET", "/api/auth/confirm-account?token=tk", false],
  ["updateUserProfile", [{}, "T"], "POST", "/api/users/profile", true],
  ["changeUserPassword", [{}, "T"], "PUT", "/api/users/password", true],
  ["requestPasswordReset", [{ email: "a@b.c" }], "POST", "/api/auth/forgot-password", false],
  ["deleteUserAccount", ["T"], "DELETE", "/api/users/profile", true],
  ["confirmEmailChange", ["tk"], "GET", "/api/auth/confirm-email-change?token=tk", false],
  ["resetPassword", [{ token: "t", newPassword: "x" }], "POST", "/api/auth/reset-password", false],
  ["getAllEstablishments", [], "GET", "/api/estabelecimentos", false],
  ["getEstablishmentById", ["7"], "GET", "/api/estabelecimentos/7", false],
  ["getReviewsByEstablishment", ["7"], "GET", "/api/avaliacoes/estabelecimento/7", false],
  ["getMyEstablishments", ["T"], "GET", "/api/users/profile/estabelecimentos", true],
  ["updateMyEstablishment", [7, {}, "T"], "PUT", "/api/users/profile/estabelecimentos/7", true],
  ["cadastrarEstabelecimento", [fd(), "T"], "POST", "/api/estabelecimentos", true],
  ["atualizarEstabelecimento", [fd(), "T"], "PUT", "/api/estabelecimentos/solicitar-atualizacao", true],
  ["excluirEstabelecimento", [fd(), "T"], "POST", "/api/estabelecimentos/solicitar-exclusao", true],
  ["submitReview", [{}, "T"], "POST", "/api/avaliacoes", true],
  ["deleteReview", [3, "T"], "DELETE", "/api/avaliacoes/3", true],
  ["getPendingAdminRequests", ["T"], "GET", "/api/admin/pending", true],
  ["getAllActiveEstablishments", ["T"], "GET", "/api/estabelecimentos", true],
  ["adminGetAllEstablishmentsGeral", ["T"], "GET", "/api/admin/estabelecimentos-geral", true],
  ["adminGetAllActiveEstablishments", ["T"], "GET", "/api/admin/estabelecimentos-ativos", true],
  ["adminGetAllInactiveEstablishments", ["T"], "GET", "/api/admin/estabelecimentos-inativos", true],
  ["adminGetEstablishmentById", [7, "T"], "GET", "/api/admin/estabelecimento/7", true],
  ["adminToggleEstablishmentStatus", [7, true, "T"], "PUT", "/api/admin/estabelecimento/7/status", true],
  ["adminDeleteEstablishment", [7, "T"], "DELETE", "/api/admin/estabelecimento/7", true],
  ["adminUpdateEstablishment", [7, fd(), "T"], "PATCH", "/api/admin/estabelecimento/7", true],
  ["adminEditAndApproveEstablishment", [7, fd(), "T"], "POST", "/api/admin/edit-and-approve/7", true],
  ["adminGetReviewsByEstablishment", ["7", "T"], "GET", "/api/admin/avaliacoes/estabelecimento/7", true],
  ["adminDeleteReview", [3, "T"], "DELETE", "/api/admin/avaliacoes/3", true],
  ["getAllUsers", ["T"], "GET", "/api/admin/users", true],
  ["adminUpdateUser", [4, {}, "T"], "PUT", "/api/admin/users/4", true],
  ["adminDeleteUser", [4, "T"], "DELETE", "/api/admin/users/4", true],
  ["adminChangeUserPassword", [4, "nova123", "T"], "PATCH", "/api/admin/users/4/password", true],
  ["adminResendConfirmation", [4, "T"], "POST", "/api/admin/users/4/resend-confirmation", true],
  ["getCursos", [], "GET", "/api/cursos", false],
  ["createCurso", [{}, "T"], "POST", "/api/cursos", true],
  ["updateCurso", [2, {}, "T"], "PUT", "/api/cursos/2", true],
  ["deleteCurso", [2, "T"], "DELETE", "/api/cursos/2", true],
];

describe("chamadas à API: método, caminho e credencial", () => {
  it.each(casos)("%s", async (nome, args, metodo, caminho, comToken) => {
    const modulo: any = await api();
    await modulo[nome](...args);
    const { url, opcoes } = ultima();
    expect(url).toBe(`http://api.teste${caminho}`);
    expect(opcoes.method ?? "GET").toBe(metodo);
    if (comToken) expect(cab(opcoes).Authorization).toBe("Bearer T");
    else expect(cab(opcoes).Authorization).toBeUndefined();
  });

  it("corpo JSON recebe Content-Type e FormData não (o navegador define o boundary)", async () => {
    const { loginUser, cadastrarEstabelecimento } = await api();
    await loginUser({ username: "a", password: "b" });
    expect(cab(ultima().opcoes)["Content-Type"]).toBe("application/json");
    expect(JSON.parse(ultima().opcoes.body as string)).toEqual({ username: "a", password: "b" });

    fetchMock.mockClear();
    await cadastrarEstabelecimento(new FormData(), "T");
    expect(cab(ultima().opcoes)["Content-Type"]).toBeUndefined();
  });

  it("toda rota de dados pessoais ou de admin envia token (nenhuma esquecida)", () => {
    const sensiveis = casos.filter(([, , , caminho]) => caminho.startsWith("/api/admin") || caminho.startsWith("/api/users"));
    for (const [nome, , , , comToken] of sensiveis) expect(comToken, nome).toBe(true);
  });
});

describe("tratamento de resposta", () => {
  it("devolve o JSON da resposta", async () => {
    fetchMock.mockImplementation(() => resposta([{ id: 1 }]));
    const { getAllEstablishments } = await api();
    expect(await getAllEstablishments()).toEqual([{ id: 1 }]);
  });

  it("resposta vazia vira objeto vazio e texto não-JSON vira mensagem", async () => {
    const { getCursos } = await api();
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("", { status: 200 })));
    expect(await getCursos()).toEqual({});
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("<html>erro</html>", { status: 200 })));
    expect(await getCursos()).toEqual({ message: "<html>erro</html>" });
  });

  it("erro do backend lança a mensagem enviada (400, 413, 415, 429, 500)", async () => {
    const { getCursos } = await api();
    for (const status of [400, 413, 415, 429, 500]) {
      fetchMock.mockImplementationOnce(() => resposta({ message: `msg ${status}` }, status));
      await expect(getCursos()).rejects.toThrow(`msg ${status}`);
    }
  });

  it("erro sem mensagem usa a mensagem padrão do status", async () => {
    const { getCursos } = await api();
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("{}", { status: 503, statusText: "Service Unavailable" })));
    await expect(getCursos()).rejects.toThrow(/servidor encontrou um problema/);
  });

  it("401 em rota autenticada: tenta renovar; se a renovação falha, limpa a sessão e vai ao login", async () => {
    localStorage.setItem("user", "{}");
    const { getMyEstablishments } = await api();
    fetchMock.mockImplementation(() => resposta({}, 401));
    await expect(getMyEstablishments("T")).rejects.toThrow(/Sessão expirada/);
    expect(localStorage.getItem("user")).toBeNull();
    expect(fetchMock.mock.calls.map((c) => c[0])).toContain("http://api.teste/api/auth/refresh");
  });

  it("401 com renovação bem-sucedida repete a chamada e devolve o resultado", async () => {
    const { getMyEstablishments } = await api();
    fetchMock
      .mockImplementationOnce(() => resposta({}, 401))
      .mockImplementationOnce(() => resposta({ expiresAt: 1 }, 200))
      .mockImplementationOnce(() => resposta([{ nomeFantasia: "Meu" }], 200));
    expect(await getMyEstablishments("T")).toEqual([{ nomeFantasia: "Meu" }]);
    expect(fetchMock.mock.calls.map((c) => [c[0], (c[1] as any)?.method ?? "GET"])).toEqual([
      ["http://api.teste/api/users/profile/estabelecimentos", "GET"],
      ["http://api.teste/api/auth/refresh", "POST"],
      ["http://api.teste/api/users/profile/estabelecimentos", "GET"],
    ]);
  });

  it("várias chamadas expiradas ao mesmo tempo fazem uma única renovação", async () => {
    const { getMyEstablishments } = await api();
    let pedidosRefresh = 0;
    const jaRenovou = new Set<string>();
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith("/api/auth/refresh")) {
        pedidosRefresh++;
        return new Promise((ok) => setTimeout(() => ok(new Response("{}", { status: 200 })), 20));
      }
      const chave = String(url);
      if (!jaRenovou.has(chave) && pedidosRefresh === 0) return resposta({}, 401);
      return resposta([]);
    });
    await Promise.all([getMyEstablishments("T"), getMyEstablishments("T"), getMyEstablishments("T")]);
    expect(pedidosRefresh).toBe(1);
  });

  it("toda chamada leva os cookies (credentials: include)", async () => {
    const { getCursos } = await api();
    await getCursos();
    expect(ultima().opcoes.credentials).toBe("include");
  });

  it("401 em rota de admin não tenta renovar: encerra a sessão do admin e vai ao login do admin", async () => {
    localStorage.setItem("admin_token_expiry", String(Date.now() + 100000));
    const { getPendingAdminRequests } = await api();
    fetchMock.mockImplementation(() => resposta({}, 401));
    await expect(getPendingAdminRequests("T")).rejects.toThrow(/Sessão expirada/);
    expect(localStorage.getItem("admin_token_expiry")).toBeNull();
    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls).not.toContain("http://api.teste/api/auth/refresh");
    expect(urls).toContain("http://api.teste/api/admin/logout");
  });

  it("401 no login (senha errada) mostra a mensagem e NÃO desloga", async () => {
    localStorage.setItem("user", "{}");
    const { loginUser } = await api();
    fetchMock.mockImplementationOnce(() => resposta({ message: "Usuário ou senha inválidos" }, 401));
    await expect(loginUser({})).rejects.toThrow("Usuário ou senha inválidos");
    expect(localStorage.getItem("user")).toBe("{}");
  });

  it("sem NEXT_PUBLIC_API_URL usa caminho relativo", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    vi.resetModules();
    const { getCursos } = await api();
    await getCursos();
    expect(ultima().url).toBe("/api/cursos");
  });

  it("URL base com barra no final não duplica a barra", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.teste/";
    vi.resetModules();
    const { getCursos } = await api();
    await getCursos();
    expect(ultima().url).toBe("http://api.teste/api/cursos");
  });
});

describe("funções que usam fetch direto", () => {
  it("uploadImage manda FormData com o campo file e o token", async () => {
    fetchMock.mockImplementation(() => resposta({ url: "/uploads/a.webp" }));
    const { uploadImage } = await api();
    const retorno = await uploadImage(new File(["x"], "a.png"), "T");
    expect(retorno).toEqual({ url: "/uploads/a.webp" });
    const { url, opcoes } = ultima();
    expect(url).toBe("http://api.teste/api/files/upload");
    expect((opcoes.body as FormData).get("file")).toBeInstanceOf(File);
    expect(cab(opcoes).Authorization).toBe("Bearer T");
  });

  it("uploadImage falha quando o servidor recusa", async () => {
    fetchMock.mockImplementation(() => resposta({}, 415));
    const { uploadImage } = await api();
    await expect(uploadImage(new File(["x"], "a.png"), "T")).rejects.toThrow("Erro no upload");
  });

  it("adminExportEstabelecimentos devolve o arquivo ou lança a mensagem do servidor", async () => {
    const { adminExportEstabelecimentos } = await api();
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("a;b", { status: 200 })));
    const blob = await adminExportEstabelecimentos("T");
    expect(await blob.text()).toBe("a;b");
    expect(cab(ultima().opcoes).Authorization).toBe("Bearer T");

    fetchMock.mockImplementationOnce(() => resposta({ message: "Nada para exportar" }, 404));
    await expect(adminExportEstabelecimentos("T")).rejects.toThrow("Nada para exportar");
    fetchMock.mockImplementationOnce(() => Promise.resolve(new Response("x", { status: 500 })));
    await expect(adminExportEstabelecimentos("T")).rejects.toThrow("Falha ao exportar");
  });

  it("getAdminStats envia o token e falha quando o servidor recusa", async () => {
    const { getAdminStats } = await api();
    fetchMock.mockImplementationOnce(() => resposta({ totalMeis: 3 }));
    expect(await getAdminStats("T")).toEqual({ totalMeis: 3 });
    expect(cab(ultima().opcoes).Authorization).toBe("Bearer T");
    fetchMock.mockImplementationOnce(() => resposta({}, 500));
    await expect(getAdminStats("T")).rejects.toThrow("Falha ao buscar estatísticas");
  });

  it("fetchApi: falha de rede vira mensagem amigável", async () => {
    const { getCursos } = await api();
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    await expect(getCursos()).rejects.toThrow(/conectar ao servidor/);
  });

  it("fetchApi: erro 500 sem corpo JSON usa a mensagem padrão do status", async () => {
    const { getCursos } = await api();
    fetchMock.mockImplementation(() => Promise.resolve(new Response("<html>bad gateway</html>", { status: 502 })));
    await expect(getCursos()).rejects.toThrow(/servidor encontrou um problema/);
  });

  it("fetchApi: 429 informa excesso de tentativas", async () => {
    const { getCursos } = await api();
    fetchMock.mockImplementation(() => resposta({}, 429));
    await expect(getCursos()).rejects.toThrow(/Muitas tentativas/);
  });

  it("uploadImage: erro 415 mostra a mensagem do servidor", async () => {
    const { uploadImage } = await api();
    fetchMock.mockImplementation(() => resposta({ message: "Tipo não permitido." }, 415));
    await expect(uploadImage(new File(["x"], "a.png"))).rejects.toThrow("Tipo não permitido.");
  });

  it("adminGetUserInteractions não quebra com resposta de erro não-JSON", async () => {
    const { adminGetUserInteractions } = await api();
    fetchMock.mockImplementation(() => Promise.resolve(new Response("<html>", { status: 500 })));
    await expect(adminGetUserInteractions(1, "T")).rejects.toThrow("Erro ao buscar interações do usuário.");
  });

  it("registrarVisualizacao não lança erro mesmo sem rede", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockImplementation(() => Promise.reject(new Error("offline")));
    const { registrarVisualizacao } = await api();
    await expect(registrarVisualizacao("HOME")).resolves.toBeUndefined();
  });

  it("registrarVisualizacao chama o contador certo", async () => {
    const { registrarVisualizacao } = await api();
    await registrarVisualizacao("CAT_GASTRONOMIA");
    expect(ultima().url).toBe("http://api.teste/api/estabelecimentos/visualizacao/CAT_GASTRONOMIA");
    expect(ultima().opcoes.method).toBe("POST");
  });

  it("adminGetUserInteractions usa o token e repassa o erro do servidor", async () => {
    const { adminGetUserInteractions } = await api();
    fetchMock.mockImplementationOnce(() => resposta({ itens: [] }));
    expect(await adminGetUserInteractions(4, "T")).toEqual({ itens: [] });
    expect(ultima().url).toBe("http://api.teste/api/admin/users/4/interacoes");
    fetchMock.mockImplementationOnce(() => resposta({ message: "Sem permissão" }, 403));
    await expect(adminGetUserInteractions(4, "T")).rejects.toThrow("Sem permissão");
  });
});

describe("relatório de campanha (disparo manual)", () => {
  it("POST com cookies, marcador de sessão e devolve a resposta; erro mostra a mensagem do servidor", async () => {
    const { dispararRelatorioCampanha } = await api();
    fetchMock.mockImplementationOnce(() => resposta({ enviado: true }));
    expect(await dispararRelatorioCampanha("sessao-por-cookie")).toEqual({ enviado: true });
    const { url, opcoes } = ultima();
    expect(url).toBe("http://api.teste/api/admin/relatorios/campanha-anzol/disparar");
    expect(opcoes.method).toBe("POST");
    expect(opcoes.credentials).toBe("include");

    fetchMock.mockImplementationOnce(() => resposta({ message: "Já enviado hoje" }, 429));
    await expect(dispararRelatorioCampanha("sessao-por-cookie")).rejects.toThrow("Já enviado hoje");
  });
});

describe("utilitários do módulo", () => {
  it("removeEmojis", async () => {
    const { removeEmojis } = await api();
    expect(removeEmojis("oi 😀 tudo ❤ bem")).toBe("oi  tudo  bem");
    expect(removeEmojis("")).toBe("");
  });

  it("formatarDataParaMesAno", async () => {
    const { formatarDataParaMesAno } = await api();
    expect(formatarDataParaMesAno("2024-03-15T12:00:00Z")).toMatch(/março.*2024/i);
    expect(formatarDataParaMesAno("")).toBe("");
  });
});
