"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  LogIn,
  Building2,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSessaoAdmin } from "@/lib/session";

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Informe o usuário ou e-mail.")
    .trim(),
  password: z
    .string()
    .min(1, "Informe sua senha."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const cleanBase = rawApiUrl.replace(/\/+$/, "");

    try {
      const response = await fetch(`${cleanBase}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        localStorage.removeItem("admin_token");
        iniciarSessaoAdmin(data.expiresAt);
        toast.success("Login realizado com sucesso! Redirecionando...");
        router.push("/admin/dashboard");
      } else {
        toast.error(
          data?.message || "Credenciais inválidas. Verifique seu usuário e senha."
        );
      }
    } catch {
      toast.error("Não foi possível conectar ao servidor. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 font-sans selection:bg-[#017DB9]/20 selection:text-[#017DB9]">
      {/* Coluna Esquerda: Hero Visual de Saquarema (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-200">
        <img
          src="/igreja-beach.jpg"
          alt="Paisagem costeira de Saquarema com a tradicional Igreja de Nossa Senhora de Nazareth"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.05] transform scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Gradientes e camadas de iluminação costeira */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(1,125,185,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(34,195,98,0.2),transparent_60%)]" />

        {/* Topo do Hero: Logo MeideSaqua Maior e Centralizada */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-2">
          <Link
            href="/"
            className="inline-block p-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl hover:bg-white/25 transition-all duration-300 group"
          >
            <img
              src="/LogoMeideSaqua.png"
              alt="Logo Mei de Saquá"
              className="h-16 xl:h-20 w-auto object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>

        {/* Conteúdo Central do Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 my-auto max-w-xl mx-auto space-y-6 text-center"
        >
          <h1 className="text-3xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight font-poppins drop-shadow-md">
            Painel de Gestão do Empreendedorismo de{" "}
            <span className="bg-gradient-to-r from-sky-300 via-[#017DB9] to-[#22c362] bg-clip-text text-transparent">
              Saquarema
            </span>
          </h1>

          <p className="text-base xl:text-lg text-slate-200 leading-relaxed font-normal">
            Plataforma municipal para validação de MEIs, moderação de avaliações,
            organização de cursos e acompanhamento dos negócios locais.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-[#22c362] shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Validação de Negócios</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0" />
              <span className="text-xs text-slate-200 font-medium">Cursos e Capacitações</span>
            </div>
          </div>
        </motion.div>

        {/* Rodapé do Hero */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-300" />
            <span>Prefeitura Municipal de Saquarema</span>
          </div>
          <span>SMGS &bull; LabISA</span>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Autenticação (Modo Claro) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative bg-white text-slate-900">
        {/* Barra Superior com Botão Voltar */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#017DB9] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#017DB9]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao portal
          </Link>

          <div className="lg:hidden">
            <img
              src="/LogoMeideSaqua.png"
              alt="Logo Mei de Saquá"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>

        {/* Formulário Centralizado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="w-full max-w-md mx-auto my-auto py-8"
        >
          {/* Header do Card */}
          <div className="mb-8 text-center sm:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-[#017DB9] mb-4 shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-poppins">
              Acesso Administrativo
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Informe suas credenciais para gerenciar a plataforma.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Campo Usuário */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700"
              >
                Usuário ou E-mail
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Seu usuário cadastrado"
                  disabled={isSubmitting}
                  {...register("username")}
                  className={`pl-10 h-11 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all focus-visible:ring-2 focus-visible:ring-[#017DB9] focus-visible:border-transparent ${
                    errors.username
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-700"
                >
                  Senha
                </Label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Sua senha de acesso"
                  disabled={isSubmitting}
                  {...register("password")}
                  className={`pl-10 pr-10 h-11 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all focus-visible:ring-2 focus-visible:ring-[#017DB9] focus-visible:border-transparent ${
                    errors.password
                      ? "border-red-500 focus-visible:ring-red-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botão de Submissão */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#017DB9] to-[#006399] hover:from-[#018ece] hover:to-[#0170a7] shadow-md shadow-[#017DB9]/20 transition-all duration-200 hover:shadow-lg hover:shadow-[#017DB9]/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Acessando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar no Painel
                </span>
              )}
            </Button>
          </form>
        </motion.div>

        {/* Rodapé Direita */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Mei de Saquá &bull; Prefeitura de Saquarema</p>
        </div>
      </div>
    </div>
  );
}
