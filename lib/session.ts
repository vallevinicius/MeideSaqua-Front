// A sessão fica em cookies httpOnly do servidor: o JavaScript da página nunca vê o token.
// O front guarda apenas este marcador (e a hora de expiração) para saber que há sessão.
// O servidor ignora o marcador no cabeçalho Authorization e usa o cookie.
export const SESSAO_COOKIE = "sessao-por-cookie";

const CHAVE_EXPIRACAO_ADMIN = "admin_token_expiry";

export const iniciarSessaoAdmin = (expiraEm: number) => {
  localStorage.setItem(CHAVE_EXPIRACAO_ADMIN, String(expiraEm));
};

export const getAdminToken = (): string | null => {
  try {
    // Versões antigas guardavam o JWT do admin aqui; o cookie dele segue valendo até expirar.
    localStorage.removeItem("admin_token");
    const expira = Number(localStorage.getItem(CHAVE_EXPIRACAO_ADMIN));
    if (!expira) return null;
    if (expira <= Date.now()) {
      localStorage.removeItem(CHAVE_EXPIRACAO_ADMIN);
      return null;
    }
    return SESSAO_COOKIE;
  } catch {
    return null;
  }
};

// Apaga o estado local e pede ao servidor que apague o cookie (o JS não consegue).
export const encerrarSessaoAdmin = async () => {
  localStorage.removeItem(CHAVE_EXPIRACAO_ADMIN);
  localStorage.removeItem("admin_token");
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  try {
    await fetch(`${base}/api/admin/logout`, { method: "POST", credentials: "include" });
  } catch {
    /* sem rede: o cookie expira sozinho */
  }
};
