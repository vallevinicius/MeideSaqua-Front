"use client";

import { ehFalhaDeInfraestrutura, mensagemDeErro } from "@/lib/errors";
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
import { requestPasswordReset } from "@/lib/api";
import { AnimatePresence } from "framer-motion";
import { Notification, NotificationType } from "@/components/ui/notification";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NovaSenha() {
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addNotification = (text: string, type: "success" | "error") => {
    const newNotif: NotificationType = {
      id: Math.random(),
      text,
      type,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const removeNotif = (id: number) => {
    setNotifications((pv) => pv.filter((n) => n.id !== id));
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userData = {
      email: email,
    };

    try {
      await requestPasswordReset(userData);
      addNotification(
        "Email enviado com sucesso! Verifique sua caixa de entrada.",
        "success"
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      // Para erro de dados a mensagem continua genérica (não revela se o e-mail existe).
      addNotification(
        ehFalhaDeInfraestrutura(err)
          ? mensagemDeErro(err)
          : "Erro ao processar o pedido. Verifique os dados e tente novamente.",
        "error"
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

      <div className="flex items-center justify-center h-screen bg-gray-50 px-4 ">
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
              <CardTitle className="text-2xl">Recupere sua senha</CardTitle>
              <CardDescription>
                Insira seu e-mail para receber o link de recuperação.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordReset}>
              <CardContent className="space-y-4">
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
                    className="w-full py-2
                                     rounded-2xl border border-gray-200 bg-white shadow-sm placeholder:text-gray-400
                                     focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300
                                     "
                  />
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
                      Aguardando...
                    </>
                  ) : (
                    "Enviar email"
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
