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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAdminStats } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
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
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        router.push("/admin/login");
        return;
      }
      try {
        const stats = await getAdminStats(token);
        setData(stats);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [router]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const SummaryCard = ({
    title,
    value,
    icon: Icon,
    colorBg,
    colorText,
    suffix,
  }: any) => (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      <Card
        className="border-none shadow-sm h-full print:shadow-none print:border print:border-gray-200 overflow-hidden"
        style={{ background: colorBg }}
      >
        <CardContent className="p-6 flex items-center justify-between relative h-full">
          <div className="relative z-10">
            <p
              className="font-medium uppercase text-xs tracking-wider mb-1"
              style={{ color: colorText, opacity: 0.8 }}
            >
              {title}
            </p>
            <div className="flex items-baseline">
              <span
                className="text-3xl font-extrabold"
                style={{ color: colorText }}
              >
                {value}
              </span>
              {suffix && (
                <span
                  className="text-sm font-semibold ml-2 opacity-70"
                  style={{ color: colorText }}
                >
                  {suffix}
                </span>
              )}
            </div>
          </div>
          <div
            className="p-3 rounded-full bg-white/20 print:bg-transparent relative z-10"
            style={{ color: colorText }}
          >
            <Icon size={28} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-6 min-h-screen bg-[#f4f7fe] print:bg-white print:p-0">
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="no-print">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Painel de Indicadores
              </h1>
              <p className="text-gray-500">
                Visão geral do ecossistema MeiDeSaquá.
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO (Escondidos na impressão) */}
          <div className="flex gap-2 no-print">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 flex gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* 1. CARDS DE RESUMO GERAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="MEIs Ativos"
            value={data?.totalMeis}
            icon={Lightbulb}
            colorBg="#E6F7FF"
            colorText="#0050B3"
          />
          <SummaryCard
            title="Média Geral"
            value={data?.mediaAvaliacao}
            icon={TrendingUp}
            colorBg="#FFF7E6"
            colorText="#D46B08"
            suffix="/ 5.0"
          />
          <SummaryCard
            title="Comentários"
            value={data?.totalAvaliacoes}
            icon={CheckCircle}
            colorBg="#FFF0F6"
            colorText="#C41D7F"
          />
        </div>

        {/* 2. CARDS DE TRÁFEGO */}
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-8">
          Tráfego e Engajamento
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SummaryCard
            title="Usuários"
            value={data?.totalUsuarios || 0}
            icon={Users}
            colorBg="#F6FFED"
            colorText="#389E0D"
          />
          <SummaryCard
            title="Espaço MEI"
            value={data?.pageViews?.espacoMei || 0}
            icon={Globe}
            colorBg="#F0F5FF"
            colorText="#2F54EB"
          />
          <SummaryCard
            title="Categ. Visitadas"
            value={data?.pageViews?.categoriasTotal || 0}
            icon={MousePointerClick}
            colorBg="#FFF2E8"
            colorText="#D4380D"
          />
        </div>

        {/* 2.5 CARDS ANZOL */}
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest mt-8">
          Métricas de Campanha (ANZOL)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard
            title="Acesso Home (GERAL)"
            value={data?.pageViews?.home || 0}
            icon={Home}
            colorBg="#0f172a"
            colorText="#ffffff"
          />
          <SummaryCard
            title="Home (Orgânico)"
            value={Math.max(0, (data?.pageViews?.home || 0) - ((data?.pageViews?.redirecionamentoMei || 0) + (data?.pageViews?.redirecionamentoUsuario || 0)))}
            icon={Home}
            colorBg="#1e293b"
            colorText="#bfdbfe"
          />
          <SummaryCard
            title="ANZOL (Geral)"
            value={(data?.pageViews?.redirecionamentoMei || 0) + (data?.pageViews?.redirecionamentoUsuario || 0)}
            icon={ExternalLink}
            colorBg="#0ea5e9"
            colorText="#ffffff"
          />
          <SummaryCard
            title="ANZOL (MEI)"
            value={data?.pageViews?.redirecionamentoMei || 0}
            icon={ExternalLink}
            colorBg="#1e293b"
            colorText="#38bdf8"
          />
          <SummaryCard
            title="ANZOL (Usuário)"
            value={data?.pageViews?.redirecionamentoUsuario || 0}
            icon={ExternalLink}
            colorBg="#1e293b"
            colorText="#38bdf8"
          />
        </div>

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

          <Card className="border border-gray-100 shadow-md bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="text-amber-600 h-5 w-5" />
                Interesse em Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {data?.chartCursos?.map((item: any, index: number) => {
                  const maxVal =
                    Math.max(...data.chartCursos.map((i: any) => i.qtd)) || 1;
                  const percent = (item.qtd / maxVal) * 100;
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
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!data?.chartCursos || data.chartCursos.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum dado registrado ainda.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
