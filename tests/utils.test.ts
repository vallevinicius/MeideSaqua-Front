import { describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { contemPalavrao } from "@/lib/profanityFilter";
import { cn, containsEmoji, isValidEmail, removeEmojis } from "@/lib/utils";
import {
  getQuillTextLength,
  maskCNAE,
  maskCNPJ,
  maskCPF,
  maskPhone,
  onFinishFailed,
  stripEmojis,
} from "@/lib/utils-mei";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

describe("máscaras", () => {
  it.each([
    ["12345678901", "123.456.789-01"],
    ["123.456.789-01", "123.456.789-01"],
    ["123456", "123.456"],
    ["123456789012345", "123.456.789-01"],
    ["abc", ""],
  ])("CPF %s", (entrada, saida) => expect(maskCPF(entrada)).toBe(saida));

  it.each([
    ["12345678000190", "12.345.678/0001-90"],
    ["12345678", "12.345.678"],
    ["123456780001901234", "12.345.678/0001-90"],
  ])("CNPJ %s", (entrada, saida) => expect(maskCNPJ(entrada)).toBe(saida));

  it.each([
    ["22999998888", "(22) 99999-8888"],
    ["2299", "(22) 99"],
    ["229999988889999", "(22) 99999-8888"],
  ])("telefone %s", (entrada, saida) => expect(maskPhone(entrada)).toBe(saida));

  it("CNAE", () => {
    expect(maskCNAE("5611201")).toBe("5611-2/01");
    expect(maskCNAE("5611")).toBe("5611");
  });
});

describe("emojis e e-mail", () => {
  it("stripEmojis remove emojis e preserva letras acentuadas", () => {
    expect(stripEmojis("Olá 😀 mundo")).toBe("Olá  mundo");
    expect(stripEmojis("")).toBe("");
  });
  it("containsEmoji / removeEmojis", () => {
    expect(containsEmoji("🚀")).toBe(true);
    expect(containsEmoji("texto")).toBe(false);
    expect(removeEmojis("a😀b")).toBe("ab");
    expect(removeEmojis("")).toBe("");
  });
  it.each([
    ["a@b.com", true],
    ["nome.sobrenome+tag@dominio.com.br", true],
    ["sem-arroba.com", false],
    ["a@b", false],
    ["a b@c.com", false],
    ["", false],
  ])("isValidEmail(%s)", (email, esperado) => expect(isValidEmail(email)).toBe(esperado));
});

describe("cn", () => {
  it("junta classes e resolve conflitos do tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});

describe("getQuillTextLength", () => {
  it("conta só o texto, ignorando as tags", () => {
    expect(getQuillTextLength("<p>Olá <b>mundo</b></p>")).toBe(9);
  });
  it("editor vazio vale zero", () => {
    expect(getQuillTextLength("<p><br></p>")).toBe(0);
    expect(getQuillTextLength("")).toBe(0);
  });
});

describe("onFinishFailed", () => {
  it("lista os campos obrigatórios (sem repetir) em uma mensagem", () => {
    onFinishFailed({ errorFields: [{ name: ["cnpj"] }, { name: ["cnpj"] }, { name: ["campoDesconhecido"] }] });
    const msg = (toast.error as any).mock.calls.at(-1)[0] as string;
    expect(msg).toContain("os campos obrigatórios");
    expect(msg).toContain("campoDesconhecido");
  });
  it("um campo só usa o singular e sem erro não avisa", () => {
    (toast.error as any).mockClear();
    onFinishFailed({ errorFields: [{ name: ["cnpj"] }] });
    expect((toast.error as any).mock.calls[0][0]).toContain("o campo obrigatório");
    (toast.error as any).mockClear();
    onFinishFailed({ errorFields: [] });
    onFinishFailed({});
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("filtro de palavrões do front", () => {
  it.each(["merda", "isso é uma MERDA", "p0rra", "vai tomar no cu", "Que PORRA é essa", "puta que pariu"])(
    "bloqueia '%s'",
    (t) => {
      expect(contemPalavrao(t)).toBe(true);
    },
  );

  it.each(["m.e.r.d.a", "m e r d a", "c a r a l h o"])("bloqueia palavrão escrito com letras separadas: '%s'", (t) => {
    expect(contemPalavrao(t)).toBe(true);
  });

  it.each(["Ótimo atendimento", "Excelente", "Sala de espera", "", "   ", undefined])("libera '%s'", (t) => {
    expect(contemPalavrao(t as any)).toBe(false);
  });

  // Antes o filtro procurava a palavra dentro do texto e bloqueava palavras comuns.
  it.each([
    "computador",
    "picanha",
    "Reputação",
    "Assistência técnica",
    "Disputa de preços",
    "Escola de informática",
    "Aspirador de pó",
    "Peruíbe",
    "Cocada baiana",
    "Terapia ocupacional",
  ])("não bloqueia a palavra comum '%s'", (t) => {
    expect(contemPalavrao(t)).toBe(false);
  });

  it("acentos e maiúsculas não escondem o palavrão", () => {
    expect(contemPalavrao("BOSTA")).toBe(true);
    expect(contemPalavrao("Cabrão")).toBe(true);
  });

  it("palavra da lista, inteira, continua bloqueada (decisão da lista, não do filtro)", () => {
    expect(contemPalavrao("Padaria Pinto")).toBe(true);
    expect(contemPalavrao("Furo de reportagem")).toBe(true);
  });

  it("letras soltas comuns não viram palavrão (ex.: 'Loja A B C')", () => {
    expect(contemPalavrao("Loja A B C")).toBe(false);
    expect(contemPalavrao("Plano A e B")).toBe(false);
  });
});
