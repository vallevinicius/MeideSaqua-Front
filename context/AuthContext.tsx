"use client";

import { SESSAO_COOKIE } from "@/lib/session";
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";

interface User {
  usuarioId: number;
  nomeCompleto: string;
  username: string;
  email: string;
  token?: string;
  chosenAvatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (loginData: { user: User; token?: string }) => void;
  logout: () => void;
  isLoading: boolean;
  updateUser: (updatedData: Partial<User>) => void;
}

type ResultadoMigracao =
  | { ok: true; user: User }
  | { ok: false; expirada: boolean };

async function migrarSessaoAntiga(tokenAntigo: string): Promise<ResultadoMigracao> {
  try {
    const resposta = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/migrar-sessao`,
      {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${tokenAntigo}` },
      },
    );
    if (resposta.ok) {
      const dados = await resposta.json();
      return { ok: true, user: dados.user };
    }
    // 401/403: token vencido ou conta inválida. Outros erros do servidor: tenta depois.
    return { ok: false, expirada: resposta.status === 401 || resposta.status === 403 };
  } catch {
    return { ok: false, expirada: false };
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelado = false;

    const carregar = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) return;
        const salvo = JSON.parse(storedUser);

        // Sessão já no formato novo (cookie httpOnly).
        if (!salvo.token || salvo.token === SESSAO_COOKIE) {
          if (!cancelado) setUser({ ...salvo, token: SESSAO_COOKIE });
          return;
        }

        // Quem estava logado antes da mudança ainda tem o JWT no navegador:
        // troca por cookies sem pedir senha de novo.
        const resultado = await migrarSessaoAntiga(salvo.token);
        if (cancelado) return;
        if (resultado.ok) {
          const novo = { ...resultado.user, token: SESSAO_COOKIE };
          setUser(novo);
          localStorage.setItem("user", JSON.stringify(novo));
        } else if (resultado.expirada) {
          // Token vencido: seria deslogado de qualquer forma na próxima chamada.
          localStorage.removeItem("user");
        } else {
          // Sem rede agora: segue com o token antigo e tenta de novo na próxima visita.
          setUser(salvo);
        }
      } catch (error) {
        console.error(
          "Falha ao carregar dados do usuário do localStorage",
          error
        );
        localStorage.removeItem("user");
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    };

    void carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  const login = (loginData: { user: User; token?: string }) => {
    // O token real fica em cookie httpOnly. Aqui vai só o marcador de sessão,
    // que as chamadas à API enviam no lugar do token.
    const userDataWithToken = { ...loginData.user, token: SESSAO_COOKIE };
    setUser(userDataWithToken);
    localStorage.setItem("user", JSON.stringify(userDataWithToken));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Encerra a sessão no servidor (revoga a renovação e apaga os cookies).
    void fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
    window.location.href = "/login";
  };

  //  Nova função para atualizar o usuário
  const updateUser = (updatedData: Partial<User>) => {
    setUser((currentUser) => {
      if (currentUser) {
        const newUser = { ...currentUser, ...updatedData };
        localStorage.setItem("user", JSON.stringify(newUser));
        return newUser;
      }
      return null;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
