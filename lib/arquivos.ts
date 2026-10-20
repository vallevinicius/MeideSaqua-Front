// Validação de arquivos no navegador, alinhada aos limites do back-end
// (imagens JPG/PNG/WebP, PDF só para o CCMEI, até 10 MB). O servidor revalida tudo.
export const TAMANHO_MAXIMO_MB = 10;

const TIPOS_IMAGEM = ["image/jpeg", "image/png", "image/webp"];

export function validarArquivo(
  file: { name: string; size: number; type: string },
  opcoes: { permitePdf?: boolean } = {},
): string | null {
  if (file.size === 0) return `${file.name} está vazio.`;
  if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    return `${file.name} passa do limite de ${TAMANHO_MAXIMO_MB} MB.`;
  }
  const permitidos = opcoes.permitePdf
    ? [...TIPOS_IMAGEM, "application/pdf"]
    : TIPOS_IMAGEM;
  if (!permitidos.includes(file.type)) {
    return opcoes.permitePdf
      ? `${file.name}: use PDF, JPG, PNG ou WebP.`
      : `${file.name}: use uma imagem JPG, PNG ou WebP.`;
  }
  return null;
}
