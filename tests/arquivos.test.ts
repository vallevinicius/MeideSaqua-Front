import { describe, expect, it } from "vitest";
import { TAMANHO_MAXIMO_MB, validarArquivo } from "@/lib/arquivos";

const arq = (type: string, size = 1000, name = "a") => ({ name, size, type });

describe("validarArquivo", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])("aceita %s", (tipo) => {
    expect(validarArquivo(arq(tipo))).toBeNull();
  });

  it.each(["image/svg+xml", "image/gif", "text/html", "application/javascript", "application/x-msdownload", ""])(
    "rejeita %s",
    (tipo) => {
      expect(validarArquivo(arq(tipo, 1000, "x.bad"))).toMatch(/x\.bad/);
    },
  );

  it("PDF só vale quando permitido (CCMEI)", () => {
    expect(validarArquivo(arq("application/pdf"))).not.toBeNull();
    expect(validarArquivo(arq("application/pdf"), { permitePdf: true })).toBeNull();
  });

  it("rejeita arquivo vazio", () => {
    expect(validarArquivo(arq("image/png", 0, "vazio.png"))).toMatch(/vazio/);
  });

  it("rejeita acima do limite e aceita exatamente no limite", () => {
    const limite = TAMANHO_MAXIMO_MB * 1024 * 1024;
    expect(validarArquivo(arq("image/png", limite + 1, "grande.png"))).toMatch(/limite/);
    expect(validarArquivo(arq("image/png", limite))).toBeNull();
  });
});
