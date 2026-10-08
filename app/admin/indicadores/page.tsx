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

const hoverCursorColor = { fill: "#f1f5f9", opacity: 0.5 };

const configMeis = {
  qtd: { label: "MEIs", color: "#3b82f6" },
} satisfies ChartConfig;
const configViews = {
  views: { label: "Acessos", color: "#8b5cf6" },
} satisfies ChartConfig;
const configNotas = {
  qtd: { label: "Avaliações", color: "#0ea5e9" },
} satisfies ChartConfig;
const configEscalaNegocio = {
  value: { label: "Qtd.", color: "#f59e0b" },
} satisfies ChartConfig;
const configVendas = {
  qtd: { label: "Qtd.", color: "#10b981" },
} satisfies ChartConfig;
const configCursos = {
  qtd: { label: "Cliques", color: "#f59e0b" },
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

  const handleExport = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/exportar-estabelecimentos`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const SummaryCard = ({
    title,
    value,
    icon: Icon,
    iconColorClass,
    iconBgClass,
    suffix,
  }: any) => (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-slate-200 overflow-hidden bg-white print:shadow-none print:border-gray-200">
        <CardContent className="p-5 flex items-center justify-between relative h-full">
          <div className="flex flex-col gap-1 z-10">
            <p className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">
              {title}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {value}
              </span>
              {suffix && (
                <span className="text-sm font-medium text-slate-400">
                  {suffix}
                </span>
              )}
            </div>
          </div>
          <div className={`p-2.5 rounded-xl ${iconBgClass} ${iconColorClass} shrink-0`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="p-6 min-h-screen bg-slate-50/50 print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page { margin: 1cm; size: landscape; }
          body { background-color: white; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="no-print">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white">
                <ArrowLeft className="h-4 w-4 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Painel de Indicadores
              </h1>
              <p className="text-sm text-slate-500">
                Visão consolidada do ecossistema MeiDeSaquá
              </p>
            </div>
          </div>

          <div className="flex gap-2 no-print">
            <Button variant="outline" onClick={handlePrint} className="h-9 gap-2 bg-white">
              <Printer className="h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handleExport} className="h-9 gap-2 bg-slate-900 hover:bg-slate-800 text-white">
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </div>

        {/* 1. CARDS DE RESUMO GERAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="MEIs Ativos"
            value={data?.totalMeis}
            icon={Lightbulb}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600"
          />
          <SummaryCard
            title="Média Geral"
            value={data?.mediaAvaliacao}
            icon={TrendingUp}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
            suffix="/ 5.0"
          />
          <SummaryCard
            title="Comentários"
            value={data?.totalAvaliacoes}
            icon={CheckCircle}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
          />
        </div>

        {/* 2. CARDS DE TRÁFEGO */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1">
            Tráfego Orgânico
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard
              title="Usuários Totais"
              value={data?.totalUsuarios || 0}
              icon={Users}
              iconBgClass="bg-slate-100"
              iconColorClass="text-slate-600"
            />
            <SummaryCard
              title="Acessos Espaço MEI"
              value={data?.pageViews?.espacoMei || 0}
              icon={Globe}
              iconBgClass="bg-slate-100"
              iconColorClass="text-slate-600"
            />
            <SummaryCard
              title="Categorias Visitadas"
              value={data?.pageViews?.categoriasTotal || 0}
              icon={MousePointerClick}
              iconBgClass="bg-slate-100"
              iconColorClass="text-slate-600"
            />
          </div>
        </div>

        {/* 2.5 CARDS ANZOL */}
        <div className="space-y-3">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-1">
            Métricas de Campanha (ANZOL)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <SummaryCard
              title="Acesso Home (GERAL)"
              value={data?.pageViews?.home || 0}
              icon={Home}
              iconBgClass="bg-slate-100"
              iconColorClass="text-slate-600"
            />
            <SummaryCard
              title="Home (Orgânico)"
              value={Math.max(0, (data?.pageViews?.home || 0) - ((data?.pageViews?.redirecionamentoMei || 0) + (data?.pageViews?.redirecionamentoUsuario || 0)))}
              icon={Home}
              iconBgClass="bg-slate-100"
              iconColorClass="text-slate-600"
            />
            <SummaryCard
              title="ANZOL (Geral)"
              value={(data?.pageViews?.redirecionamentoMei || 0) + (data?.pageViews?.redirecionamentoUsuario || 0)}
              icon={ExternalLink}
              iconBgClass="bg-indigo-50"
              iconColorClass="text-indigo-600"
            />
            <SummaryCard
              title="ANZOL (MEI)"
              value={data?.pageViews?.redirecionamentoMei || 0}
              icon={ExternalLink}
              iconBgClass="bg-indigo-50"
              iconColorClass="text-indigo-600"
            />
            <SummaryCard
              title="ANZOL (Usuário)"
              value={data?.pageViews?.redirecionamentoUsuario || 0}
              icon={ExternalLink}
              iconBgClass="bg-indigo-50"
              iconColorClass="text-indigo-600"
            />
          </div>
        </div>

        {/* 3. INTERAÇÕES E COMPARTILHAMENTO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid pt-2">
          {/* Card: Cliques em Links do Espaço MEI */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-800">
                Canais de Atendimento
              </CardTitle>
              <CardDescription>Cliques em botões de contato no Espaço MEI.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center">
                  <ExternalLink size={18} className="text-slate-400 mb-2" />
                  <span className="text-xl font-bold text-slate-800 tracking-tight">{data?.espacoMeiClicks?.gov || 0}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Gov.br</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center">
                  <MessageCircle size={18} className="text-slate-400 mb-2" />
                  <span className="text-xl font-bold text-slate-800 tracking-tight">{data?.espacoMeiClicks?.wpp || 0}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">WhatsApp</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center">
                  <Mail size={18} className="text-slate-400 mb-2" />
                  <span className="text-xl font-bold text-slate-800 tracking-tight">{data?.espacoMeiClicks?.email || 0}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">E-mail</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card: Compartilhamento Viral */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold text-slate-800">
                Alcance Viral
              </CardTitle>
              <CardDescription>Acionamentos do botão de compartilhar perfil.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[116px]">
              <div className="text-center flex flex-col items-center gap-1">
                <div className="flex items-baseline gap-2 text-indigo-600">
                  <Share2 size={24} strokeWidth={2.5} className="mb-1" />
                  <span className="text-4xl font-extrabold tracking-tight">{data?.perfilCompartilhado || 0}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Compartilhamentos totais
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. GRÁFICOS PRINCIPAIS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
          {/* OFERTA DE MEIS */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Oferta de MEIs por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configMeis} className="h-[280px] w-full">
                <BarChart
                  data={data?.chartMeisPorCategoria}
                  margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="categoria"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tickFormatter={(value) => value.split(" ")[0]}
                  />
                  <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <ChartTooltip cursor={hoverCursorColor} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl" />} />
                  <Bar dataKey="qtd" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="qtd" position="top" style={{ fill: "#64748b", fontSize: 11, fontWeight: "600" }} />
                    {data?.chartMeisPorCategoria?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.categoria)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* INTERESSE PÚBLICO */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Interesse do Público
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configViews} className="h-[280px] w-full">
                <BarChart
                  data={data?.chartVisualizacoesPorCategoria}
                  margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="categoria"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis hide />
                  <ChartTooltip cursor={hoverCursorColor} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl" />} />
                  <Bar dataKey="views" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="views" position="top" style={{ fill: "#64748b", fontSize: 11, fontWeight: "600" }} />
                    {data?.chartVisualizacoesPorCategoria?.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.categoria)} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* 5. OUTROS GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid pb-8">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Distribuição de Notas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configNotas} className="h-[240px] w-full">
                <BarChart
                  data={data?.chartDistribuicaoNotas}
                  margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="nota" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} />
                  <YAxis hide />
                  <ChartTooltip cursor={hoverCursorColor} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl" />} />
                  <Bar dataKey="qtd" fill="var(--color-qtd)" radius={[6, 6, 0, 0]}>
                    <LabelList dataKey="qtd" position="top" style={{ fill: "#64748b", fontSize: 11, fontWeight: "600" }} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Estágio dos Negócios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configEscalaNegocio} className="h-[240px] w-full">
                <BarChart
                  data={data?.chartEscalaNegocio}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                  barSize={20}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={100} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <XAxis dataKey="value" type="number" hide />
                  <ChartTooltip cursor={hoverCursorColor} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl" />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: "600", fill: "#64748b" }} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid pb-8">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Canais de Venda Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={configVendas} className="h-[280px] w-full">
                <BarChart
                  data={data?.chartVendas}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                  barSize={20}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <YAxis dataKey="canal" type="category" tickLine={false} axisLine={false} width={130} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <XAxis dataKey="qtd" type="number" hide />
                  <ChartTooltip cursor={hoverCursorColor} content={<ChartTooltipContent indicator="line" className="bg-white border-slate-200 shadow-xl" />} />
                  <Bar dataKey="qtd" fill="var(--color-qtd)" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="qtd" position="right" style={{ fontSize: 11, fontWeight: "600", fill: "#64748b" }} />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white rounded-xl h-full">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-800">
                Interesse em Cursos (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {data?.chartCursos?.map((item: any, index: number) => {
                  const maxVal = Math.max(...(data.chartCursos?.map((i: any) => i.qtd) || [1]));
                  const percent = (item.qtd / (maxVal || 1)) * 100;
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700 truncate pr-4 text-[13px]" title={item.curso}>
                          {item.curso}
                        </span>
                        <span className="font-semibold text-slate-900 text-xs">
                          {item.qtd}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-slate-800 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
                {(!data?.chartCursos || data.chartCursos.length === 0) && (
                  <p className="text-sm text-slate-400 text-center py-8">
                    Nenhum curso registrado.
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
