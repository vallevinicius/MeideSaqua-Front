"use client";

import { ehFalhaDeInfraestrutura, mensagemDeErro } from "@/lib/errors";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
import { resetPassword } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";

function ResetPasswordFormComponent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      setIsLoading(false);
      return;
    }

    if (!token) {
      toast.error("Token de redefinição inválido ou ausente.");
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword({ token, newPassword: password });
      toast.success(
        "Senha redefinida com sucesso! Redirecionando para o login...",
      );
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      toast.error(
        ehFalhaDeInfraestrutura(err)
          ? mensagemDeErro(err)
          : "Erro ao redefinir a senha. O token pode ser inválido ou ter expirado.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            <span>Voltar para o Login</span>
          </Link>
        </div>
        <Card className="rounded-2xl border border-[#017DB9]/70 bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Redefinir a sua Senha</CardTitle>
            <CardDescription>Insira a sua nova senha abaixo.</CardDescription>
          </CardHeader>
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-2 pr-10 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full py-2 pr-10 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
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
                  "Redefinir Senha"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          Carregando...
        </div>
      }
    >
      <ResetPasswordFormComponent />
    </Suspense>
  );
}
