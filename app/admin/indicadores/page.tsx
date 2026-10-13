"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  CheckCircle,
  BarChart3,
  Home,
  Globe,
  MousePointerClick,
  Users,
  ShoppingCart,
  GraduationCap,
  Printer,
  Download,
  Share2,
  ExternalLink,
  MessageCircle,
  Mail,
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAdminStats, dispararRelatorioCampanha } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { motion } from "framer-motion";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CalendarRange } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// --- CONFIGURAÇÕES VISUAIS ---
const CATEGORY_COLORS: { [key: string]: string } = {
  Alimentação: "#E5243B",
  Saúde: "#4C9F38",
  Construção: "#FD6925",
  Turismo: "#26BDE2",
  Artesanato: "#DDA63A",
  Serviços: "#00689D",
  Moda: "#FF3A21",
  Tecnologia: "#19486A",
  Festas: "#C5192D",
};

const getCategoryColor = (categoryName: string) => {
  return CATEGORY_COLORS[categoryName] || "#8884d8";
};

const hoverCursorColor = { fill: "#d1d5db", opacity: 0.15 };

const configMeis = {
  qtd: { label: "MEIs", color: "#3C6AB2" },
} satisfies ChartConfig;
const configViews = {
  views: { label: "Acessos", color: "#8884d8" },
} satisfies ChartConfig;
const configNotas = {
  qtd: { label: "Avaliações", color: "#00AEEF" },
} satisfies ChartConfig;
const configEscalaNegocio = {
  value: { label: "Qtd.", color: "#FDB713" },
} satisfies ChartConfig;
const configVendas = {
  qtd: { label: "Qtd.", color: "#10B981" },
} satisfies ChartConfig;
const configCursos = {
  qtd: { label: "Cliques", color: "#F59E0B" },
} satisfies ChartConfig;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminIndicadoresPage() {
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [data, setData] = useState<any>(null);
  const [cursosPage, setCursosPage] = useState(0);
  const router = useRouter();

  const fetchStats = async (range?: DateRange) => {
    const token = localStorage.getItem("admin_token");

    if (!token) {
      router.push("/admin/login");
      return;
    }
    try {
      setIsFiltering(true);
      let startStr: string | undefined = undefined;
      let endStr: string | undefined = undefined;

      if (range?.from) {
        startStr = format(range.from, "yyyy-MM-dd");
        endStr = range.to ? format(range.to, "yyyy-MM-dd") : startStr;
      }

      const stats = await getAdminStats(token, startStr, endStr);
      setData(stats);
      setCursosPage(0);
    } catch (error) {
      console.error("Falha ao buscar estatísticas do painel:", error);
    } finally {
      setIsFiltering(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [router]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Se o usuário selecionou o range completo ou limpou o filtro
    if (!range || (range.from && range.to)) {
      fetchStats(range);
    }
  };

  // --- FUNÇÃO PARA EXPORTAR CSV ---
  const handleExport = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/exportar-estabelecimentos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "estabelecimentos_ativos_meidesaqua.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Erro ao exportar arquivo.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão ao exportar.");
    }
  };

  // --- FUNÇÃO PARA IMPRIMIR ---
  const handlePrint = () => {
    window.print();
  };

  // --- FUNÇÃO PARA DISPARAR RELATÓRIO DE CAMPANHA ANZOL POR E-MAIL ---
  const handleEnviarRelatorioAnzol = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      router.push("/admin/login");
      return;
    }

    setIsSendingReport(true);
    try {
      const res = await dispararRelatorioCampanha(token);
      const dests =
        res.destinatarios && res.destinatarios.length > 0
          ? res.destinatarios.join(", ")
          : "os e-mails configurados";
      toast.success(
        `Relatório de campanha Anzol enviado com sucesso para: ${dests}`
      );
    } catch (error: any) {
      toast.error(error?.message || "Erro ao disparar relatório por e-mail.");
    } finally {
      setIsSendingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // --- CARD LEVE ---
  const LightMetricCard = ({ title, value, icon: Icon, iconColor, suffix }: any) => (
    <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-700">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {suffix && (
            <span className="text-sm font-semibold text-gray-500">
              {suffix}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // --- CARD ANZOL INTERATIVO (Fundo claro, destaca em azul no hover) ---
  const InteractiveAnzolCard = ({ title, value, icon: Icon }: any) => (
    <motion.div
      whileHover={{
        backgroundColor: "#eff6ff", // bg-blue-50
        boxShadow: "inset 0 -3px 0 0 #3b82f6", // borda inferior acendendo
      }}
      transition={{ duration: 0.2 }}
      className="p-6 flex flex-col justify-center relative group cursor-default"
    >
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
        <Icon className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors" />{" "}
        {title}
      </p>
      <motion.p 
        className="text-3xl font-bold text-gray-900 tracking-tight origin-left group-hover:text-blue-900 transition-colors"
        whileHover={{ scale: 1.05 }}
      >
        {value}
      </motion.p>
    </motion.div>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#f8fafc] print:bg-white print:p-0">
      {/* Estilos Globais para Impressão */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
            size: landscape;
          }
          body {
            background-color: white;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* ================= CABEÇALHO E CONTROLES ================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="no-print">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Painel de Indicadores
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Visão geral e desempenho do sistema.
              </p>
            </div>
          </div>

          {/* Filtro de Período e Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3 no-print">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              disabled={isFiltering}
            />

            <Button
              variant="outline"
              onClick={handlePrint}
              className="h-10 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm rounded-lg transition-all flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              <span className="font-medium">Imprimir</span>
            </Button>
            <Button
              onClick={handleExport}
              className="h-10 px-4 bg-[#107c41] hover:bg-[#0c5e31] text-white shadow-sm rounded-lg transition-all flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="font-medium">Exportar CSV</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleEnviarRelatorioAnzol}
              disabled={isSendingReport}
              className="h-10 px-4 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm rounded-lg transition-all flex items-center gap-2"
              title="Disparar relatório consolidado com deltas da campanha Anzol por e-mail"
            >
              {isSendingReport ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Mail className="h-4 w-4 text-blue-600" />
              )}
              <span className="font-medium">
                {isSendingReport ? "Enviando..." : "Enviar Relatório Anzol"}
              </span>
            </Button>
          </div>
        </div>

        {/* Banner Informativo de Período Ativo */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 rounded-xl border bg-white border-gray-100 shadow-sm no-print">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <CalendarRange className="h-4 w-4 text-blue-600" />
            {dateRange?.from && dateRange?.to ? (
              <span>
                Filtrando dados de{" "}
                <strong className="text-gray-900">
                  {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                </strong>{" "}
                até{" "}
                <strong className="text-gray-900">
                  {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                </strong>
                <span className="text-gray-400 ml-1.5 hidden sm:inline">
                  • rastreamento diário ativo a partir de 13/10/2026
                </span>
              </span>
            ) : (
              <span>
                Exibindo métricas consolidadas de{" "}
                <strong className="text-gray-900">todo o período histórico</strong>
                <span className="text-gray-400 ml-1.5 hidden sm:inline">
                  • inclui acessos acumulados anteriores a 13/10/2026
                </span>
                .
              </span>
            )}
          </div>

          {dateRange?.from && (
            <button
              type="button"
              onClick={() => handleDateRangeChange(undefined)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Voltar para todo o período
            </button>
          )}
        </div>

        {/* ================= 1. CARDS DE RESUMO GERAL ================= */}
        <motion.div
          animate={{ opacity: isFiltering ? 0.6 : 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LightMetricCard
              title="MEIs Ativos"
              value={data?.totalMeis}
            icon={Lightbulb}
            iconColor="text-blue-600"
          />
          <LightMetricCard
            title="Média Geral"
            value={data?.mediaAvaliacao}
            icon={TrendingUp}
            iconColor="text-orange-500"
            suffix="/ 5.0"
          />
          <LightMetricCard
            title="Comentários"
            value={data?.totalAvaliacoes}
            icon={CheckCircle}
            iconColor="text-pink-600"
          />
        </div>

        {/* ================= 2. CARDS DE TRÁFEGO ================= */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest print-break-inside-avoid">
            Tráfego e Engajamento
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <LightMetricCard
              title="Usuários"
              value={data?.totalUsuarios || 0}
              icon={Users}
              iconColor="text-emerald-600"
            />
            <LightMetricCard
              title="Espaço MEI"
              value={data?.pageViews?.espacoMei || 0}
              icon={Globe}
              iconColor="text-indigo-600"
            />
            <LightMetricCard
              title="Categorias Visitadas"
              value={data?.pageViews?.categoriasTotal || 0}
              icon={MousePointerClick}
              iconColor="text-red-500"
            />
          </div>
        </div>

        {/* ================= 2.5 CARDS ANZOL ================= */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest print-break-inside-avoid">
            Métricas de Campanha (Anzol)
          </h2>
          
          <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden print-break-inside-avoid">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <InteractiveAnzolCard
                title="Home (Geral)"
                value={data?.pageViews?.home || 0}
                icon={Home}
              />
              <InteractiveAnzolCard
                title="Orgânico"
                value={Math.max(
                  0,
                  (data?.pageViews?.home || 0) -
                    ((data?.pageViews?.redirecionamentoMei || 0) +
                      (data?.pageViews?.redirecionamentoUsuario || 0))
                )}
                icon={Home}
              />
              <InteractiveAnzolCard
                title="Anzol (Geral)"
                value={
                  (data?.pageViews?.redirecionamentoMei || 0) +
                  (data?.pageViews?.redirecionamentoUsuario || 0)
                }
                icon={ExternalLink}
              />
              <InteractiveAnzolCard
                title="Anzol (MEI)"
                value={data?.pageViews?.redirecionamentoMei || 0}
                icon={ExternalLink}
              />
              <InteractiveAnzolCard
                title="Anzol (Usuário)"
                value={data?.pageViews?.redirecionamentoUsuario || 0}
                icon={ExternalLink}
              />
            </div>
          </div>
        </div>

        {/* ==================================================================================== */}
        {/* ======================= DAQUI PARA BAIXO FOI MANTIDO INTACTO ======================= */}
        {/* ==================================================================================== */}

        {/* --- 3. NOVOS CARDS: INTERAÇÕES E COMPARTILHAMENTO --- */}
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-8 print-break-inside-avoid">
          Interações e Alcance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
          {/* Card: Cliques em Links do Espaço MEI */}
          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MousePointerClick className="text-blue-600 h-5 w-5" />
                Links de Suporte (Espaço MEI)
              </CardTitle>
              <CardDescription>
                Cliques registrados nos canais de atendimento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Gov.br */}
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                  <div className="flex justify-center mb-2 text-blue-600">
                    <ExternalLink size={24} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {data?.espacoMeiClicks?.gov || 0}
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase mt-1">
                    Portal GOV
                  </div>
                </div>
                {/* WhatsApp */}
                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex justify-center mb-2 text-green-600">
                    <MessageCircle size={24} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {data?.espacoMeiClicks?.wpp || 0}
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase mt-1">
                    WhatsApp
                  </div>
                </div>
                {/* Email */}
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex justify-center mb-2 text-amber-600">
                    <Mail size={24} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {data?.espacoMeiClicks?.email || 0}
                  </div>
                  <div className="text-xs text-gray-500 font-medium uppercase mt-1">
                    E-mail
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Compartilhamento Viral */}
          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="text-indigo-600 h-5 w-5" />
                Alcance Viral
              </CardTitle>
              <CardDescription>
                Quantas vezes perfis foram compartilhados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[140px]">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-indigo-600 mb-2">
                  {data?.perfilCompartilhado || 0}
                </div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">
                  Compartilhamentos
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  via botão "Compartilhar Perfil"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. GRÁFICOS PRINCIPAIS */}
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 print-break-inside-avoid">
          Análise de Mercado
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
          {/* OFERTA DE MEIS */}
          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="text-blue-600 h-5 w-5" />
                Oferta de MEIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configMeis} className="h-[300px] w-full">
                <BarChart
                  data={data?.chartMeisPorCategoria}
                  margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="categoria"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#666" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tickFormatter={(value) => value.split(" ")[0]}
                  />
                  <YAxis
                    allowDecimals={false}
                    width={30}
                    tick={{ fontSize: 11, fill: "#666" }}
                  />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="bg-white border border-gray-200 shadow-xl"
                      />
                    }
                  />
                  <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="qtd"
                      position="top"
                      style={{ fill: "#666", fontSize: 12, fontWeight: "bold" }}
                    />
                    {data?.chartMeisPorCategoria?.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(entry.categoria)}
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* INTERESSE PÚBLICO */}
          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="text-purple-600 h-5 w-5" />
                Interesse Público
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configViews} className="h-[300px] w-full">
                <BarChart
                  data={data?.chartVisualizacoesPorCategoria}
                  margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="categoria"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#666" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="bg-white border border-gray-200 shadow-xl"
                      />
                    }
                  />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="views"
                      position="top"
                      style={{ fill: "#666", fontSize: 12, fontWeight: "bold" }}
                    />
                    {data?.chartVisualizacoesPorCategoria?.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getCategoryColor(entry.categoria)}
                        />
                      ),
                    )}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* 5. OUTROS GRÁFICOS (Notas, Escala, Vendas, Cursos) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="text-blue-500 h-5 w-5" />
                Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configNotas} className="h-[250px] w-full">
                <BarChart
                  data={data?.chartDistribuicaoNotas}
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="nota"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#666" }}
                    dy={10}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="bg-white border border-gray-200 shadow-xl"
                      />
                    }
                  />
                  <Bar
                    dataKey="qtd"
                    fill="var(--color-qtd)"
                    radius={[8, 8, 0, 0]}
                  >
                    <LabelList
                      dataKey="qtd"
                      position="top"
                      style={{ fill: "#666", fontSize: 12, fontWeight: "bold" }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="text-yellow-500 h-5 w-5" />
                Escala
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={configEscalaNegocio}
                className="h-[250px] w-full"
              >
                <BarChart
                  data={data?.chartEscalaNegocio}
                  layout="vertical"
                  margin={{ left: 0, right: 40, top: 10, bottom: 10 }}
                  barSize={24}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 11, fill: "#666" }}
                  />
                  <XAxis dataKey="value" type="number" hide />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="bg-white border border-gray-200 shadow-xl"
                      />
                    }
                  />
                  <Bar
                    dataKey="value"
                    fill="var(--color-value)"
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      style={{ fontSize: 12, fontWeight: "bold", fill: "#666" }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="text-emerald-600 h-5 w-5" />
                Canais de Venda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={configVendas}
                className="h-[300px] w-full"
              >
                <BarChart
                  data={data?.chartVendas}
                  layout="vertical"
                  margin={{ left: 0, right: 40, top: 10, bottom: 10 }}
                  barSize={24}
                >
                  <CartesianGrid
                    horizontal={false}
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <YAxis
                    dataKey="canal"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={130}
                    tick={{ fontSize: 11, fill: "#666" }}
                  />
                  <XAxis dataKey="qtd" type="number" hide />
                  <ChartTooltip
                    cursor={hoverCursorColor}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        className="bg-white border border-gray-200 shadow-xl"
                      />
                    }
                  />
                  <Bar
                    dataKey="qtd"
                    fill="var(--color-qtd)"
                    radius={[0, 4, 4, 0]}
                  >
                    <LabelList
                      dataKey="qtd"
                      position="right"
                      style={{ fontSize: 12, fontWeight: "bold", fill: "#666" }}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {(() => {
            const CURSOS_PER_PAGE = 5;
            const listaCursos = data?.chartCursos || [];
            const totalCursosPages = Math.ceil(listaCursos.length / CURSOS_PER_PAGE);
            const displayedCursos = listaCursos.slice(
              cursosPage * CURSOS_PER_PAGE,
              (cursosPage + 1) * CURSOS_PER_PAGE
            );
            const maxValCursos =
              listaCursos.length > 0
                ? Math.max(...listaCursos.map((i: any) => i.qtd)) || 1
                : 1;

            return (
              <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <GraduationCap className="text-amber-600 h-5 w-5" />
                    Interesse em Cursos
                  </CardTitle>
                  {totalCursosPages > 1 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                      <span>
                        {cursosPage + 1} de {totalCursosPages}
                      </span>
                      <div className="flex items-center gap-0.5 ml-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                          onClick={() => setCursosPage((prev) => Math.max(0, prev - 1))}
                          disabled={cursosPage === 0}
                          title="Página anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                          onClick={() =>
                            setCursosPage((prev) => Math.min(totalCursosPages - 1, prev + 1))
                          }
                          disabled={cursosPage >= totalCursosPages - 1}
                          title="Próxima página"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {displayedCursos.map((item: any, index: number) => {
                      const percent = (item.qtd / maxValCursos) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span
                              className="font-medium text-gray-700 truncate pr-4"
                              title={item.curso}
                            >
                              {item.curso}
                            </span>
                            <span className="font-bold text-gray-900">
                              {item.qtd}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {listaCursos.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum dado registrado ainda.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </motion.div>
      </div>
    </div>
  );
}