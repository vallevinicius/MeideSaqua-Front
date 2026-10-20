"use client";

import { mensagemDeErro } from "@/lib/errors";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { registerUser } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { Notification, NotificationType } from "@/components/ui/notification";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { contemPalavrao } from "@/lib/profanityFilter";
import { removeEmojis, isValidEmail } from "@/lib/utils";

export default function Cadastro() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [nome_completo_user, setNomeCompleto] = useState("");
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const addNotification = (text: string, type: "success" | "error") => {
    const newNotif: NotificationType = { id: Math.random(), text, type };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const removeNotif = (id: number) => {
    setNotifications((pv) => pv.filter((n) => n.id !== id));
  };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueComEmoji = e.target.value;
    const valueSemEmoji = removeEmojis(valueComEmoji);

    if (valueComEmoji !== valueSemEmoji) {
      if (
        !notifications.some((n) => n.text === "Não é possível adicionar emojis")
      ) {
        addNotification("Não é possível adicionar emojis", "error");
      }
    }

    setUsername(valueSemEmoji);
  };

  const handleNomeCompletoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueComEmoji = e.target.value;
    const valueSemEmoji = removeEmojis(valueComEmoji);

    if (valueComEmoji !== valueSemEmoji) {
      if (
        !notifications.some((n) => n.text === "Não é possível adicionar emojis")
      ) {
        addNotification("Não é possível adicionar emojis", "error");
      }
    }
    setNomeCompleto(valueSemEmoji);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contemPalavrao(username)) {
      addNotification("Você utilizou palavras inapropriadas.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      addNotification("Por favor, insira um e-mail válido.", "error");
      return;
    }
    setIsLoading(true);

    const userData = {
      nomeCompleto: nome_completo_user,
      username: username,
      email: email,
      password: password,
    };

    try {
      await registerUser(userData);
      addNotification(
        "Cadastro realizado com sucesso! Para finalizar, verifique seu email.",
        "success"
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 4000);
    } catch (err) {
      addNotification(
        mensagemDeErro(err, "Erro ao cadastrar. Verifique seus dados."),
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-1 w-72 fixed top-4 right-4 z-50 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <Notification removeNotif={removeNotif} {...n} key={n.id} />
          ))}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link href="/" passHref>
              <Image
                src="/LogoMeideSaqua.png"
                alt="Logo MeideSaquá"
                width={150}
                height={150}
                className="mx-auto"
              />
            </Link>
          </div>
          <div className="mb-4">
            <Link
              href="/login"
              className="flex items-center gap-2 text-gray-600 hover:text-[#017DB9] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
          </div>
          <Card
            className="rounded-2xl border border-[#017DB9]/70 bg-white shadow-lg
                                 focus:outline-none focus:ring-2 focus:border-transparent
                                 transition-all duration-300 placeholder-gray-400 text-sm
                                 hover:shadow-md"
          >
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Crie seu Cadastro</CardTitle>
              <CardDescription>
                Crie sua credenciai para avaliar o perfil de um MEI ou cadastrar
                seu negócio na plataforma.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Digite seu nome de usuário"
                    required
                    value={username}
                    onChange={handleUsernameChange}
                    disabled={isLoading}
                    className="w-full py-2 rounded-2xl placeholder:text-gray-400 border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_completo_user">Nome Completo</Label>
                  <Input
                    id="nome_completo_user"
                    type="text"
                    placeholder="Digite seu nome completo"
                    required
                    value={nome_completo_user}
                    onChange={handleNomeCompletoChange}
                    disabled={isLoading}
                    className="w-full py-2 rounded-2xl placeholder:text-gray-400 border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-2 rounded-2xl placeholder:text-gray-400 border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full py-2 pr-10 rounded-2xl placeholder:text-gray-400 border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showPassword ? "Esconder senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full hover:bg-[#22c362] rounded-2xl hover:text-white flex justify-center mx-auto px-10 text-gray-700 border border-[#017DB9]/70 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aguarde...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
