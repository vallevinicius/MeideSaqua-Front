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
  ShieldCheck,
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

    try {
      const response = await fetch(`${apiUrl}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        localStorage.removeItem("admin_token");
        iniciarSessaoAdmin(data.expiresAt);
        toast.success("Acesso autorizado. Redirecionando para o painel...");
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 text-slate-100 font-sans selection:bg-[#017DB9]/30 selection:text-white">
      {/* Coluna Esquerda: Hero Visual de Saquarema (Desktop) */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-7/12 flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-slate-800/80">
        <img
          src="/igreja-beach.jpg"
          alt="Paisagem costeira de Saquarema com a tradicional Igreja de Nossa Senhora de Nazareth"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.08] transform scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Gradientes e camadas de iluminação costeira */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-900/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(1,125,185,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(34,195,98,0.25),transparent_60%)]" />

        {/* Cabeçalho do Hero */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#017DB9] rounded-xl p-1"
          >
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg group-hover:bg-white/15 transition-all">
              <img
                src="/LogoMeideSaqua.png"
                alt="Logo Mei de Saquá"
                className="h-9 w-auto object-contain"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c362] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c362]" />
            </span>
            <span className="text-xs font-medium text-slate-300">
              Governança Ativa
            </span>
          </div>
        </div>

        {/* Conteúdo Central do Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 my-auto max-w-xl space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#017DB9]/20 border border-[#017DB9]/40 text-xs font-semibold tracking-wide text-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22c362]" />
            MÓDULO DE GESTÃO ESTRATÉGICA
          </div>

          <h1 className="text-3xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight font-poppins drop-shadow-md">
            Painel Central do Empreendedorismo de{" "}
            <span className="bg-gradient-to-r from-sky-300 via-[#017DB9] to-[#22c362] bg-clip-text text-transparent">
              Saquarema
            </span>
          </h1>

          <p className="text-base xl:text-lg text-slate-200/90 leading-relaxed font-normal">
            Plataforma institucional para homologação de MEIs, moderação de avaliações,
            administração de cursos de capacitação e inteligência de dados da economia local.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-[#22c362] shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Auditoria de Cadastros</span>
            </div>
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 backdrop-blur-md border border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-xs text-slate-300 font-medium">Sessão Segura HttpOnly</span>
            </div>
          </div>
        </motion.div>

        {/* Rodapé do Hero */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-6 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>Prefeitura Municipal de Saquarema</span>
          </div>
          <span>SMGS &bull; LabISA</span>
        </div>
      </div>

      {/* Coluna Direita: Formulário de Autenticação */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        {/* Barra Superior com Botão Voltar */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#017DB9]"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao portal
          </Link>

          <div className="lg:hidden">
            <img
              src="/LogoMeideSaqua.png"
              alt="Logo Mei de Saquá"
              className="h-7 w-auto object-contain"
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#017DB9]/30 to-[#22c362]/20 border border-[#017DB9]/40 mb-4 shadow-lg shadow-[#017DB9]/10">
              <Lock className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-poppins">
              Acesso Administrativo
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Informe suas credenciais autorizadas para gerenciar a plataforma.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Campo Usuário */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300"
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
                  className={`pl-10 h-11 bg-slate-900/90 border rounded-xl text-sm text-white placeholder:text-slate-500 transition-all focus-visible:ring-2 focus-visible:ring-[#017DB9] focus-visible:border-transparent ${
                    errors.username
                      ? "border-red-500/80 focus-visible:ring-red-500"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-400 mt-1 font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300"
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
                  className={`pl-10 pr-10 h-11 bg-slate-900/90 border rounded-xl text-sm text-white placeholder:text-slate-500 transition-all focus-visible:ring-2 focus-visible:ring-[#017DB9] focus-visible:border-transparent ${
                    errors.password
                      ? "border-red-500/80 focus-visible:ring-red-500"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Botão de Submissão */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#017DB9] to-[#016292] hover:from-[#018ece] hover:to-[#0170a7] shadow-lg shadow-[#017DB9]/25 transition-all duration-200 hover:shadow-[#017DB9]/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Autenticando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar no Painel
                </span>
              )}
            </Button>
          </form>

          {/* Aviso de Segurança Institucional */}
          <div className="mt-8 pt-6 border-t border-slate-900/80 flex items-start gap-3 text-xs text-slate-400 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Área de acesso restrito e auditado. As sessões são assinadas pelo
              servidor através de cookies com proteção HttpOnly e expiração programada.
            </p>
          </div>
        </motion.div>

        {/* Rodapé Direita */}
        <div className="w-full max-w-md mx-auto text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Mei de Saquá &bull; Prefeitura de Saquarema</p>
        </div>
      </div>
    </div>
  );
}
