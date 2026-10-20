// Erro de chamada à API, com o status HTTP (0 quando nem houve resposta).
export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const MENSAGEM_REDE =
  "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

// Mensagem padrão por status, usada quando a API não devolve uma mensagem própria.
export function mensagemPorStatus(status: number): string {
  if (status === 400 || status === 422) return "Dados inválidos. Revise as informações e tente novamente.";
  if (status === 401) return "Sua sessão expirou. Faça login novamente.";
  if (status === 403) return "Você não tem permissão para realizar esta ação.";
  if (status === 404) return "O item solicitado não foi encontrado.";
  if (status === 409) return "Esta ação conflita com o estado atual do registro.";
  if (status === 413) return "O arquivo enviado é grande demais.";
  if (status === 415) return "Tipo de arquivo não permitido.";
  if (status === 429) return "Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.";
  if (status >= 500) return "O servidor encontrou um problema. Tente novamente em alguns minutos.";
  return "Ocorreu um erro inesperado. Tente novamente.";
}

// Converte qualquer erro capturado em texto seguro para mostrar ao usuário.
export function mensagemDeErro(
  erro: unknown,
  padrao = "Ocorreu um erro inesperado. Tente novamente.",
): string {
  if (erro instanceof ApiError) return erro.message || padrao;
  if (erro instanceof TypeError) return MENSAGEM_REDE;
  if (erro instanceof Error && erro.message) return erro.message;
  if (typeof erro === "string" && erro) return erro;
  return padrao;
}

// Lê a mensagem de erro de uma resposta HTTP sem quebrar quando o corpo não é JSON
// (por exemplo, página HTML de um proxy).
export async function erroDaResposta(
  response: Response,
  padrao?: string,
): Promise<ApiError> {
  let mensagem: string | undefined;
  try {
    const texto = await response.text();
    const dados = texto ? JSON.parse(texto) : null;
    const candidata = dados?.message ?? dados?.error;
    if (typeof candidata === "string" && candidata.trim()) mensagem = candidata;
  } catch {
    /* corpo vazio ou não-JSON: cai na mensagem padrão */
  }
  return new ApiError(mensagem || padrao || mensagemPorStatus(response.status), response.status);
}

// fetch que converte falha de rede em ApiError legível.
export async function fetchSeguro(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    throw new ApiError(MENSAGEM_REDE, 0);
  }
}

// Falhas que não dependem dos dados digitados (sem rede, limite de tentativas, erro do servidor).
export function ehFalhaDeInfraestrutura(erro: unknown): boolean {
  if (erro instanceof TypeError) return true;
  return (
    erro instanceof ApiError &&
    (erro.status === 0 || erro.status === 429 || erro.status >= 500)
  );
}
