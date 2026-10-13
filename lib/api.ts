const API_URL = process.env.NEXT_PUBLIC_API_URL;

function buildApiUrl(path: string) {
  const baseUrl = API_URL || "";

  if (!baseUrl) {
    return path.startsWith("/") ? path : `/${path}`;
  }

  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Função principal para chamadas de API.
 * Lida com headers, FormData, e tratamento de erros 401.
 */
async function fetchApi(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {};

  // Copia headers passados nas opções (como o Authorization)
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  // Se o body NÃO for FormData, define Content-Type: application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Remove o Content-Type se for FormData (deixa o navegador definir)
  if (options.body instanceof FormData && headers["Content-Type"]) {
    delete headers["Content-Type"];
  }

  // Adiciona o header de Autorização se ele foi passado nas opções
  if (options.headers && "Authorization" in options.headers) {
    headers["Authorization"] = (options.headers as Record<string, string>)[
      "Authorization"
    ];
  }

  console.log("\n[FRONTEND DEBUG] Chamando API:", path);
  console.log("[FRONTEND DEBUG] Headers que estão sendo enviados:", headers);

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: text || "Resposta inválida da API" };
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (path !== "/api/auth/login") {
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Sessão expirada. Redirecionando para login...");
      }
    }

    const errorMessage =
      typeof data === "object" && data.message
        ? data.message
        : `API error: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

// ==================================================================
// --- Funções de Autenticação e Usuário ---
// ==================================================================

export const registerUser = (data: any) =>
  fetchApi("/api/auth/cadastro", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const loginUser = (data: any) =>
  fetchApi("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const confirmAccount = (token: string) =>
  fetchApi(`/api/auth/confirm-account?token=${token}`, {
    method: "GET",
  });

export const updateUserProfile = (
  data: { nomeCompleto?: string; email?: string },
  token: string,
) =>
  fetchApi("/api/users/profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const changeUserPassword = (
  data: { currentPassword?: string; newPassword?: string },
  token: string,
) =>
  fetchApi("/api/users/password", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const requestPasswordReset = (data: { email: string }) =>
  fetchApi("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteUserAccount = (token: string) =>
  fetchApi("/api/users/profile", {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const confirmEmailChange = (token: string) =>
  fetchApi(`/api/auth/confirm-email-change?token=${token}`, {
    method: "GET",
  });

export const resetPassword = (data: { token: string; newPassword: string }) =>
  fetchApi("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ==================================================================
// --- Funções Específicas de ESTABELECIMENTO (Público) ---
// ==================================================================

/**
 * Busca todos os estabelecimentos ATIVOS (o backend já faz esse filtro)
 */
export const getAllEstablishments = () => fetchApi("/api/estabelecimentos");

/**
 * Busca um estabelecimento ATIVO específico pelo ID.
 */
export const getEstablishmentById = (id: string) =>
  fetchApi(`/api/estabelecimentos/${id}`);

/**
 * Busca avaliações de um ESTABELECIMENTO (Rota Pública).
 */
export const getReviewsByEstablishment = (id: string) =>
  fetchApi(`/api/avaliacoes/estabelecimento/${id}`);

export const getMyEstablishments = (token: string) =>
  fetchApi("/api/users/profile/estabelecimentos", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const updateMyEstablishment = (
  id: number,
  data: Record<string, any>,
  token: string,
) =>
  fetchApi(`/api/users/profile/estabelecimentos/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

// ==================================================================
// --- Funções do Formulário CADASTRO-MEI (Requer Auth) ---
// ==================================================================

/**
 * [Formulário] Envia um novo cadastro de estabelecimento para aprovação.
 */
export const cadastrarEstabelecimento = (formData: FormData, token: string) =>
  fetchApi("/api/estabelecimentos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

/**
 * [Formulário] Envia uma solicitação de atualização para um estabelecimento existente.
 */
export const atualizarEstabelecimento = (formData: FormData, token: string) =>
  fetchApi("/api/estabelecimentos/solicitar-atualizacao", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

/**
 * [Formulário] Envia uma solicitação de exclusão para um estabelecimento.
 */
export const excluirEstabelecimento = (formData: FormData, token: string) =>
  fetchApi("/api/estabelecimentos/solicitar-exclusao", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

// ==================================================================
// --- Funções de Avaliação (Usuário Comum - Requer Auth) ---
// ==================================================================

export const submitReview = (data: any, token: string) =>
  fetchApi("/api/avaliacoes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const deleteReview = (id: number, token: string) =>
  fetchApi(`/api/avaliacoes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ==================================================================
// --- Funções de ADMIN (Requer Auth de Admin) ---
// ==================================================================

/**
 * [ADMIN] Busca todas as solicitações pendentes.
 */
export const getPendingAdminRequests = (token: string) =>
  fetchApi("/api/admin/pending", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/**
 * [ADMIN] Busca todos os estabelecimentos ativos (aprovados).
 */
export const getAllActiveEstablishments = (token: string) =>
  fetchApi("/api/estabelecimentos", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminGetAllEstablishmentsGeral = (token: string) =>
  fetchApi("/api/admin/estabelecimentos-geral", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminGetAllActiveEstablishments = (token: string) =>
  fetchApi("/api/admin/estabelecimentos-ativos", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminGetAllInactiveEstablishments = (token: string) =>
  fetchApi("/api/admin/estabelecimentos-inativos", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminGetEstablishmentById = (id: number, token: string) =>
  fetchApi(`/api/admin/estabelecimento/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminToggleEstablishmentStatus = (
  id: number,
  ativo: boolean,
  token: string,
) =>
  fetchApi(`/api/admin/estabelecimento/${id}/status`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ativo }),
  });

/**
 * [ADMIN] Deleta (desativa) um estabelecimento.
 */
export const adminDeleteEstablishment = (id: number, token: string) =>
  fetchApi(`/api/admin/estabelecimento/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/**
 * [ADMIN] Atualiza um estabelecimento (no modal de Estabelecimentos Ativos).
 */
export const adminUpdateEstablishment = (
  id: number,
  data: FormData,
  token: string,
) =>
  fetchApi(`/api/admin/estabelecimento/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });

/**
 * [ADMIN] Atualiza/Aprova um estabelecimento pendente (no Dashboard).
 */
export const adminEditAndApproveEstablishment = (
  id: number,
  data: FormData,
  token: string,
) =>
  fetchApi(`/api/admin/edit-and-approve/${id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });

/**
 * [ADMIN] Busca todas as avaliações de um estabelecimento específico.
 */
export const adminGetReviewsByEstablishment = (id: string, token: string) =>
  fetchApi(`/api/admin/avaliacoes/estabelecimento/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/**
 * [ADMIN] Deleta uma avaliação específica.
 */
export const adminDeleteReview = (id: number, token: string) =>
  fetchApi(`/api/admin/avaliacoes/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ==================================================================
// --- Funções Utilitárias (Comuns) ---
// ==================================================================

export const removeEmojis = (text: string): string => {
  if (!text) return "";
  return text.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    "",
  );
};

export function formatarDataParaMesAno(dateString: string): string {
  if (!dateString) {
    return "";
  }
  const data = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(data);
}

export const adminExportEstabelecimentos = async (token: string) => {
  const response = await fetch(
    `${API_URL}/api/admin/exportar-estabelecimentos`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Falha ao exportar estabelecimentos");
  }

  // Retorna o Blob do arquivo para download
  return response.blob();
};

export async function getAdminStats(
  token: string,
  startDate?: string,
  endDate?: string
) {
  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";

  const res = await fetch(`${API_URL}/api/admin/dashboard-stats${qs}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Falha ao buscar estatísticas");
  }

  return res.json();
}

export async function dispararRelatorioCampanha(token: string) {
  const res = await fetch(
    `${API_URL}/api/admin/relatorios/campanha-anzol/disparar`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(
      data?.message || data?.error || "Falha ao disparar relatório de campanha"
    );
  }

  return data;
}

// Adicione também esta função para registrar visualizações (home e categorias)
export async function registrarVisualizacao(identificador: string) {
  try {
    await fetch(
      `${API_URL}/api/estabelecimentos/visualizacao/${identificador}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Erro ao registrar visualização", error);
  }
}

// ADMIN- USUÁRIOS ==================================================
export const getAllUsers = (token: string) =>
  fetchApi("/api/admin/users", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminUpdateUser = (id: number, data: any, token: string) =>
  fetchApi(`/api/admin/users/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

export const adminDeleteUser = (id: number, token: string) =>
  fetchApi(`/api/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminChangeUserPassword = (
  id: number,
  newPassword: string,
  token: string,
) =>
  fetchApi(`/api/admin/users/${id}/password`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });

export const adminResendConfirmation = (id: number, token: string) =>
  fetchApi(`/api/admin/users/${id}/resend-confirmation`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const adminGetUserInteractions = async (
  userId: number,
  token: string,
) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(
    `${API_URL}/api/admin/users/${userId}/interacoes`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "Erro ao buscar interações do usuário.",
    );
  }

  return response.json();
};

// ==================================================================

export const getCursos = () => fetchApi("/api/cursos");

export const createCurso = (data: any, token: string) =>
  fetchApi("/api/cursos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const updateCurso = (id: number, data: any, token: string) =>
  fetchApi(`/api/cursos/${id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

export const deleteCurso = (id: number, token: string) =>
  fetchApi(`/api/cursos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl("/api/files/upload"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Erro no upload");
  return response.json();
};
