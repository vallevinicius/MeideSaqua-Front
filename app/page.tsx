"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUp, Search } from "lucide-react";
import ImageCarousel from "../components/ImageCarousel";
import ButtonWrapper from "../components/ui/button-home";
import FaleConoscoButton from "@/components/FaleConoscoButton";
import { registrarVisualizacao, getAllEstablishments } from "@/lib/api"; // <-- Importamos getAllEstablishments

import { categories } from "@/constants/categories";

export default function HomePage() {
  const [visibleCards, setVisibleCards] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [allMeis, setAllMeis] = useState<any[]>([]); // Estado invisível para guardar os MEIs

  const jaContabilizou = useRef(false);

  // Efeito 1: Registrar view e buscar todos os MEIs em segundo plano
  useEffect(() => {
    if (!jaContabilizou.current) {
      jaContabilizou.current = true;
      registrarVisualizacao("HOME");
    }

    const fetchMeis = async () => {
      try {
        const data = await getAllEstablishments();
        setAllMeis(data);
      } catch (error) {
        console.error("Erro ao carregar MEIs", error);
      }
    };
    fetchMeis();
  }, []);

  useEffect(() => {
    const totalItems = categories.length + 1;
    const timer = setInterval(() => {
      setVisibleCards((prev) => {
        if (prev < totalItems) {
          return prev + 1;
        }
        clearInterval(timer);
        return prev;
      });
    }, 150);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomPosition = document.body.offsetHeight;
      if (scrollPosition >= bottomPosition - 100) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ==========================================
  // LÓGICA DE BUSCA INTELIGENTE (MEIs + Categorias)
  // ==========================================
  const normalizeText = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const normalizedSearchTerm = normalizeText(searchTerm);

  const filteredCategories = categories.filter((category) => {
    const normalizedTitle = normalizeText(category.title);
    const normalizedTags = normalizeText(category.tagsinv);

    // 1. O que foi digitado bate com as TAGS ou TÍTULO da categoria?
    const matchesCategory =
      normalizedTitle.includes(normalizedSearchTerm) ||
      normalizedTags.includes(normalizedSearchTerm);

    // 2. O que foi digitado bate com algum MEI que pertence a esta categoria?
    const matchesMei = allMeis.some((mei) => {
      // Se o MEI não pertence a essa categoria, ignoramos
      if (mei.categoria !== category.title) return false;

      // Pegamos os dados do MEI sem acentos
      const nomeMei = normalizeText(mei.nomeFantasia || "");
      const tagsMei = normalizeText(mei.tagsInvisiveis || "");

      return (
        nomeMei.includes(normalizedSearchTerm) ||
        tagsMei.includes(normalizedSearchTerm)
      );
    });

    // Se bater com a categoria OU com algum MEI de dentro dela, mostramos o cartão!
    return matchesCategory || matchesMei;
  });

  return (
    <>
      <div className="flex flex-col flex-grow bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 to-white pt-8">
        <Image
          src="/logo2sq.png"
          alt="Logo Prefeitura de Saquarema"
          width={2660}
          height={898}
          className="hidden md:hidden mx-auto h-20 w-auto mb-5"
        />
        <div>
          <Link href="/" target="about:blank">
            <Image
              src="/LogoMeideSaqua.png"
              alt="Logo MeideSaqua"
              width={2660}
              height={898}
              className="md:block mx-auto h-14 sm:h-20 w-auto mb-5 milecem:h-24"
            />
          </Link>
        </div>
        <ImageCarousel />

        <section className="flex-grow container mx-auto px-4 py-8 md:py-8 relative z-10 -mt-[1px] md:-mt-[1px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              Vitrine de{" "}
              <span className="bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent">
                MEI's
              </span>{" "}
              de Saquarema
            </h2>
            <p className="text-xl font-bold text-gray-700 md:text-gray-600 max-w-2xl mx-auto">
              A vitrine digital de quem faz a economia local acontecer. Conheça
              o{" "}
              <span className="bg-gradient-to-r from-[#017DB9] to-[#22c362] bg-clip-text text-transparent">
                MEIdeSaquá!
              </span>{" "}
            </p>
            <div className="max-w-md mx-auto mt-6">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Pesquisar categoria ou MEI..."
                  className="
                    w-full pl-12 pr-4 py-3
                    rounded-2xl border border-gray-200 bg-white shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-600/70 focus:border-transparent
                    transition-all duration-300 placeholder-gray-400 text-sm
                    hover:shadow-md
                  "
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={
                  index < visibleCards
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, y: 50, scale: 0.9 }
                }
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100,
                }}
              >
                <Link href={`/categoria/${category.id}`}>
                  <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] ">
                    <div className="relative w-full rounded-md overflow-hidden h-40 flex justify-center items-center">
                      {category.backgroundimg && (
                        <Image
                          src={category.backgroundimg}
                          alt={category.title}
                          fill
                          className="object-cover"
                        />
                      )}
                      <div
                        className={`absolute inset-0 bg-black backdrop-blur-md opacity-30 group-hover:opacity-60 transition-opacity duration-300 `}
                      />
                      <div className="relative p-6">
                        <h3 className=" font-poppins text-2xl font-bold text-white mb-auto group-hover: text-shadow-lg">
                          {category.title}
                        </h3>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent group-hover:via-green-500 transition-all duration-300" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {showScrollTop && (
          <motion.button
            type="button"
            aria-label="Voltar ao topo"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="
            fixed bottom-6 left-6 z-50 
            bg-blue-600 hover:bg-green-500
            text-white font-semibold font-sans 
            px-5 py-3 rounded-full 
            shadow-lg shadow-blue-600/50 
            flex items-center gap-2
            transition-colors duration-300
            md:hidden
            select-none
            cursor-pointer
          "
          >
            <ArrowUp size={20} />
          </motion.button>
        )}

        <div className="mt-auto pt-10 pb-24">
          <div className="text-center text-gray-600 mb-3">
            <h3>Gostaria que seu MEI aparecesse na vitrine?</h3>
          </div>
          <ButtonWrapper />
          <FaleConoscoButton />
        </div>
      </div>
    </>
  );
}
