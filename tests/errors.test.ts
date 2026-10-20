import { describe, expect, it, vi } from "vitest";
import {
  ApiError,
  erroDaResposta,
  fetchSeguro,
  mensagemDeErro,
  mensagemPorStatus,
} from "@/lib/errors";

const resp = (corpo: string, status: number) => new Response(corpo, { status });

describe("mensagemPorStatus", () => {
  it.each([
    [400, "inválidos"],
    [401, "sessão expirou"],
    [403, "permissão"],
    [404, "não foi encontrado"],
    [409, "conflita"],
    [413, "grande demais"],
    [415, "não permitido"],
    [429, "Muitas tentativas"],
    [500, "servidor"],
    [503, "servidor"],
    [418, "inesperado"],
  ])("status %s tem mensagem em português", (status, trecho) => {
    expect(mensagemPorStatus(status).toLowerCase()).toContain(trecho.toLowerCase());
  });
});

describe("mensagemDeErro", () => {
  it("usa a mensagem do ApiError", () => {
    expect(mensagemDeErro(new ApiError("Falhou", 500))).toBe("Falhou");
  });
  it("trata TypeError (falha de rede) com mensagem amigável", () => {
    expect(mensagemDeErro(new TypeError("Failed to fetch"))).toMatch(/conectar ao servidor/);
  });
  it("usa a mensagem de um Error comum", () => {
    expect(mensagemDeErro(new Error("x"))).toBe("x");
  });
  it("aceita string", () => {
    expect(mensagemDeErro("texto")).toBe("texto");
  });
  it.each([[null], [undefined], [{}], [42]])("valor desconhecido (%s) cai no padrão", (v) => {
    expect(mensagemDeErro(v, "padrão")).toBe("padrão");
  });
});

describe("erroDaResposta", () => {
  it("lê message do JSON", async () => {
    const e = await erroDaResposta(resp(JSON.stringify({ message: "CPF inválido" }), 422));
    expect(e).toBeInstanceOf(ApiError);
    expect(e.message).toBe("CPF inválido");
    expect(e.status).toBe(422);
  });
  it("lê o campo error quando não há message", async () => {
    expect((await erroDaResposta(resp(JSON.stringify({ error: "ruim" }), 400))).message).toBe("ruim");
  });
  it("não quebra com corpo HTML e usa o padrão informado", async () => {
    const e = await erroDaResposta(resp("<html>502</html>", 502), "Falha X");
    expect(e.message).toBe("Falha X");
    expect(e.status).toBe(502);
  });
  it("sem padrão, usa a mensagem do status", async () => {
    expect((await erroDaResposta(resp("", 429))).message).toMatch(/Muitas tentativas/);
  });
  it("ignora message que não seja texto", async () => {
    expect((await erroDaResposta(resp(JSON.stringify({ message: { a: 1 } }), 500), "padrão")).message).toBe("padrão");
  });
});

describe("fetchSeguro", () => {
  it("converte falha de rede em ApiError com status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))));
    const erro = await fetchSeguro("http://x").catch((e) => e);
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch(/conectar ao servidor/);
  });
  it("repassa a resposta quando há rede", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(resp("ok", 200))));
    expect((await fetchSeguro("http://x")).status).toBe(200);
  });
});

import { ehFalhaDeInfraestrutura } from "@/lib/errors";

describe("ehFalhaDeInfraestrutura", () => {
  it.each([
    [new TypeError("x"), true],
    [new ApiError("rede", 0), true],
    [new ApiError("limite", 429), true],
    [new ApiError("servidor", 503), true],
    [new ApiError("dados", 400), false],
    [new ApiError("não achou", 404), false],
    [new Error("qualquer"), false],
    ["texto", false],
  ])("%o → %s", (erro, esperado) => {
    expect(ehFalhaDeInfraestrutura(erro)).toBe(esperado);
  });
});
