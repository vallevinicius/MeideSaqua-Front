// app/categoria/[slug]/page.tsx
"use client";
import { useState, useEffect, useMemo, useRef } from "react"; // 1. Adicionado useMemo
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Globe,
  Search,
  SearchX,
  PackageOpen,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { categories } from "@/constants/categories";
import ModernCarousel from "@/components/ModernCarousel";
import { getAllEstablishments } from "@/lib/api";
import { Button } from "@/components/ui/button";
import FormattedDescription from "@/components/FormattedDescription";
import { registrarVisualizacao } from "@/lib/api";
import { Pagination, Empty } from "antd";

interface PageProps {
  params: {
    slug: string;
  };
}

// 3. Adicionadas constantes para paginação e imagens
const MEIS_PER_PAGE = 8;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// 4. Adicionada função para buscar a imagem (com fallback)
const getImageUrl = (path?: string) => {
  if (!path) {
    return "/Logo_mei_redonda.png"; // Use seu logo redondo de fallback aqui
  }
  const cleanPath = path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return `${API_URL}/${cleanPath}`;
};

export default function CategoryPage({ params }: PageProps) {
  const [locations, setLocations] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const decodedSlug = decodeURIComponent(params.slug);
  const jaContabilizou = useRef(false);
  useEffect(() => {
    if (decodedSlug && !jaContabilizou.current) {
      jaContabilizou.current = true;
      registrarVisualizacao(decodedSlug);
    }
  }, [decodedSlug]);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const categoryInfo = categories.find((cat) => cat.id === params.slug);
        const categoryTitle = categoryInfo ? categoryInfo.title : "";
        if (!categoryTitle) {
          setLocations([]);
          return;
        }
        const allEstablishments = await getAllEstablishments();
        const filteredData = allEstablishments.filter(
          (loc: any) => loc.categoria === categoryTitle
        );
        setLocations(filteredData);
      } catch (error) {
        console.error("Erro ao buscar estabelecimentos da API:", error);
        setLocations([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocations();
  }, [params.slug]);

  const category = categories.find((cat) => cat.id === params.slug);

  // 6. Filtragem agora usa useMemo
  const filteredLocations = useMemo(
    () =>
      locations.filter((location) => {
        const normalizedSearchTerm = searchTerm.toLowerCase();

        const matchesName =
          location.nomeFantasia &&
          typeof location.nomeFantasia === "string" &&
          location.nomeFantasia.toLowerCase().includes(normalizedSearchTerm);

        const tagsString = location.tagsInvisiveis || "";
        const matchesTags =
          typeof tagsString === "string" &&
          tagsString.toLowerCase().includes(normalizedSearchTerm);

        return matchesName || matchesTags;
      }),
    [locations, searchTerm]
  );

  // 7. Adicionada lógica de paginação
  const paginatedLocations = useMemo(() => {
    const startIndex = (currentPage - 1) * MEIS_PER_PAGE;
    const endIndex = startIndex + MEIS_PER_PAGE;
    return filteredLocations.slice(startIndex, endIndex);
  }, [filteredLocations, currentPage]);

  // 8. Adicionada função para mudar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document
      .getElementById("lista-meis")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 9. Adicionado useEffect para resetar página na busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // A lógica 'if (selectedLocation)' foi removida

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full">
          <SearchX className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Categoria não encontrada
          </h1>
          <p className="text-gray-600 mb-6">
            A página que você está procurando não existe ou foi movida.
          </p>
          <Button asChild>
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full">
          <Loader2 className="mx-auto h-16 w-16 text-blue-600 animate-spin mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            A carregar locais...
          </h1>
          <p className="text-gray-600">
            Estamos a procurar os melhores MEI's para si. Por favor, aguarde.
          </p>
        </div>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md w-full">
          <PackageOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Nenhum MEI encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            Ainda não há locais cadastrados nesta categoria. Tente outra ou
            volte mais tarde!
          </p>
          <Button asChild>
            <Link href="/">Voltar ao Início</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Renderização Padrão (Lista de MEIs)
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative h-48 md:h-32 w-full flex items-center justify-center text-white overflow-hidden shadow-lg">
        <Image
          src={category.backgroundimg || "/placeholder.jpg"}
          alt={`Background for ${category.title}`}
          fill
          className="object-cover z-0"
          priority
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10"></div>

        <div className="container mx-auto  px-4 relative z-20 text-center">
          <Link
            href="/"
            className="absolute -top-6 left-4 md:top-6 md:left-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm"
          >
            <ArrowLeft className="w-2 h-2 md:w-6 md:h-6" />
            <span>Voltar</span>
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold capitalize"
            style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.6)" }}
          >
            {category.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/90 mt-2 text-sm md:text-base max-w-2xl mx-auto"
            style={{ textShadow: "1px 1px 4px rgba(0,0,0,0.7)" }}
          >
            Explore os melhores MEI's de Saquarema em{" "}
            {category.title.toLowerCase()}.
          </motion.p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 milecem:px-24">
        {/* 10. CORREÇÃO: Removido 'lg:flex' */}
        <div className="grid grid-cols-1 milecem:grid-cols-5 gap-8">
          <div className="flex flex-col milecem:col-span-4">
            <div className="flex items-center justify-between mb-4">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl font-bold text-gray-800 tracking-tight"
              >
                Locais Recomendados
              </motion.h2>
            </div>
            <div className="relative mb-6">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={20}
              />
              <input
                type="text"
                placeholder="Pesquisar por nome ou serviço..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600/80 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-sm hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div
              id="lista-meis"
              className="max-h-[50vh] overflow-y-auto px-2 space-y-4 pb-1 milecem:grid milecem:grid-cols-2 milecem:gap-4 milecem:space-y-0"
            >
              {/* 11. Mapeia os locais PAGINADOS */}
              {paginatedLocations.map((location: any, index: number) => (
                // 12. LÓGICA DE LINK ORIGINAL MANTIDA
                <Link
                  href={`${location.estabelecimentoId}/MEI/`} // Esta é a sua lógica original
                  key={location.estabelecimentoId}
                  className="block"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    // 13. Adicionada classe 'relative'
                    className={`relative bg-white rounded-xl shadow-md p-4 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex flex-col h-full`}
                  >
                    {/* 14. LOGO ADICIONADA (Nova Feature) */}
                    <div className="absolute top-4 right-4 w-12 h-12 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm z-10">
                      <Image
                        src={
                            location.logoUrl 
                           ? getImageUrl(location.logoUrl) 
                          : "/logo_mei_redonda.png"
                            }
                        alt={`Logo de ${location.nomeFantasia}`}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>

                    {/* 15. Padding 'pr-16' adicionado ao título */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 break-words pr-16">
                        {location.nomeFantasia}
                      </h3>
                      {location.rating && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-yellow-500">★</span>
                          <span className="text-sm text-gray-600">
                            {location.rating}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Resto do card (lógica original) */}
                    <p className="text-gray-600 my-2 mt-6 text-sm break-words flex-grow line-clamp-3 pr-4">
                      <FormattedDescription
                        text={location.descricaoDiferencial}
                      />
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 mt-auto">
                      {location.endereco && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                          <span className="break-words">
                            {location.endereco}
                          </span>
                        </div>
                      )}
                      {location.horarioFuncionamento && (
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 mt-1 flex-shrink-0" />
                          <span className="break-words">
                            {location.horarioFuncionamento}
                          </span>
                        </div>
                      )}
                      {location.contatoEstabelecimento && (
                        <div className="flex items-start gap-2">
                          <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                          <span className="break-words">
                            {location.contatoEstabelecimento}
                          </span>
                        </div>
                      )}
                      {location.website && (
                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 mt-1 flex-shrink-0" />
                          <a
                            href={location.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visitar site
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>

            {/* 16. PAGINAÇÃO ADICIONADA (Nova Feature) */}
            {filteredLocations.length > MEIS_PER_PAGE && (
              <div className="flex justify-center mt-8">
                <Pagination
                  current={currentPage}
                  pageSize={MEIS_PER_PAGE}
                  total={filteredLocations.length}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}

            {/* 17. FEEDBACK DE BUSCA VAZIA ADICIONADO (Nova Feature) */}
            {filteredLocations.length === 0 && locations.length > 0 && (
              <div className="mt-8 text-center">
                <Empty description="Nenhum MEI encontrado para a sua busca." />
              </div>
            )}
          </div>

          {/* 18. CORREÇÃO ALTURA DO CARROSSEL */}
          <div
            className="milecem:col-span-1 flex flex-col lg:sticky lg:top-24 milecem:pl-6" // Removido 'h-fit', Adicionado 'flex flex-col'
            id="map-container"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mb-4"
            >
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" /> Conheça também
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                clique no botão para explorar outra categoria
              </p>
            </motion.div>

            <div className="flex-grow w-full h-full min-h-[500px] rounded-2xl shadow-lg overflow-hidden border border-blue-600">
              <ModernCarousel currentCategoryId={category.id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
