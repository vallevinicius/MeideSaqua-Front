// ESPAÇO MEI
"use client";
import { toast } from "sonner";
import { mensagemDeErro } from "@/lib/errors";
import Link from "next/link";
import React from "react";
import Image from "next/image";
import { registrarVisualizacao, getCursos } from "@/lib/api";
import { useEffect, useRef, useState } from "react";

interface CursoData {
  id: number;
  cursoId?: number;
  nome: string;
  descricao: string | null;
  link: string | null;
  imagemUrl: string | null;
  ativo: boolean;
}

const getFullImageUrl = (path: string | null | undefined) => {
  if (!path || path.trim() === "") return "/placeholder-logo.png";

  if (
    path.startsWith("http") ||
    path.startsWith("https") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (!baseUrl) return path.startsWith("/") ? path : `/${path}`;

  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export default function SobrePage() {
  const jaContabilizou = useRef(false);
  const [cursos, setCursos] = useState<CursoData[]>([]);

  useEffect(() => {
    if (!jaContabilizou.current) {
      jaContabilizou.current = true;
      registrarVisualizacao("ESPACO_MEI");
    }

    const loadCursos = async () => {
      try {
        const data = await getCursos();
        if (Array.isArray(data)) {
          setCursos(data.filter((curso) => curso.ativo !== false));
        }
      } catch (error) {
        toast.error(mensagemDeErro(error, "Não foi possível carregar os cursos."));
      }
    };
    loadCursos();
  }, []);

  const handleCursoClick = (nomeCurso: string) => {
    const idCurso =
      "CURSO_" +
      nomeCurso
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .replace(/\s+/g, "_")
        .toUpperCase();

    registrarVisualizacao(idCurso);
  };

  const handleLinkClick = (id: string) => {
    registrarVisualizacao(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-300 to-blue-800 py-20 px-6 sm:px-12">
      <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-lg p-10 sm:p-16">
        <section className="mb-8">
          <div className="md:flex md:items-start md:gap-8 lg:gap-12">
            <div className="md:w-2/3">
              <h1
                className=" text-4xl font-extrabold mb-6 inline-block pb-2
                    bg-gradient-to-r from-[#017DB9] to-[#22c362]
                    bg-no-repeat
                    [background-position:0_100%]
                    [background-size:100%_4px]"
              >
                <span className=" bg-gradient-to-r from-[#017DB9] to-[#22c362] bg-clip-text text-transparent">
                  ESPAÇO MEI
                </span>
              </h1>
              <p className="text-gray-700 leading-relaxed text-lg">
                Aqui você encontra informações, oportunidades e ferramentas para
                impulsionar o seu negócio.
              </p>
            </div>

            <div className="mt-8 md:mt-0 md:w-1/3 flex-shrink-0">
              <Image
                src="/Sala-do-Empreendedor.jpg"
                alt="Logo Espaço do Empreendedor"
                width={400}
                height={400}
                className="w-full h-auto rounded-2xl shadow-md"
              />
            </div>
          </div>
        </section>

        <section className="mt-8 border-t pt-6">
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Nesse espaço serão divulgadas capacitações, cursos, oficinas e
            treinamentos, além de oportunidades para participação em licitações
            públicas, feiras, eventos e projetos especiais.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            O Espaço MEI é uma iniciativa em parceria com a Sala do Empreendedor
            de Saquarema, que atua como grande aliada na formalização, no apoio,
            reconhecimento e valorização dos microempreendedores da cidade. Essa
            união garante o acesso a programas de qualificação, orientação e
            iniciativas que fortalecem os MEI's, criando condições para que cada
            negócio possa crescer, se profissionalizar e conquistar novos
            mercados.
          </p>
          <p className="text-gray-700 leading-relaxed text-lg mt-4">
            Mais do que um canal de informação, o Espaço MEI é um ambiente de
            valorização e fortalecimento do microempreendedorismo, reafirmando o
            compromisso da Prefeitura Municipal de Saquarema em apoiar quem gera
            renda, movimenta a economia e preserva a identidade da nossa cidade.
          </p>
        </section>

        <section className="mt-12 border-t pt-6">
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-[#017DB9] to-[#22c362] bg-clip-text text-transparent">
              Cursos e Capacitações disponíveis:
            </span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {cursos.length > 0 ? (
              cursos.map((curso) => (
                <Link
                  key={curso.id}
                  href={curso.link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block text-center"
                  onClick={(e) => {
                    if (!curso.link) {
                      e.preventDefault();
                      return;
                    }
                    handleCursoClick(curso.nome);
                  }}
                >
                  <div className="overflow-hidden rounded-lg border border-gray-200 group-hover:shadow-xl transition-shadow duration-300 relative aspect-[4/3]">
                    <Image
                      src={getFullImageUrl(curso.imagemUrl)}
                      alt={curso.nome}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {}}
                    />
                  </div>
                  <p className="mt-3 text-md font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                    {curso.nome}
                  </p>
                </Link>
              ))
            ) : (
              <p className="col-span-4 text-center text-gray-500">
                Carregando cursos ou nenhum curso disponível no momento.
              </p>
            )}
          </div>
        </section>

        <section className="mt-12 border-t pt-6">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-[#007a73] mb-3">
                <span className=" bg-gradient-to-r from-[#017DB9] to-[#22c362] bg-clip-text text-transparent">
                  Desejo me formalizar como MEI, atualizar meu cadastro ou obter
                  mais informações sobre MEI’s, como faço?
                </span>
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                Você pode acessar o portal nacional de MEI’s no endereço
                eletrônico{" "}
                <a
                  href="https://www.gov.br/empresas-e-negocios/pt-br/empreendedor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  onClick={() => handleLinkClick("LINK_GOV")}
                >
                  https://www.gov.br/empresas-e-negocios/pt-br/empreendedor
                </a>{" "}
                ou buscar atendimento por meio da nossa Sala do Empreendedor de
                Saquarema, nos canais de atendimento a seguir:
              </p>
              <ul className="list-none text-gray-700 leading-relaxed text-lg space-y-2 mt-6 pt-4 border-t">
                <li>
                  <strong>WhatsApp:</strong>{" "}
                  <a
                    href="https://wa.me/5522920052534"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:underline hover:text-blue-600"
                    onClick={() => handleLinkClick("LINK_WPP")}
                  >
                    (22) 92005-2534
                  </a>
                </li>
                <li>
                  <strong>E-mail:</strong>{" "}
                  <a
                    href="mailto:saladoempreendedor@saquarema.rj.gov.br"
                    className="text-gray-700 hover:underline hover:text-blue-600"
                    onClick={() => handleLinkClick("LINK_EMAIL")}
                  >
                    <span className="sm:hidden">
                      saladoempreendedor
                      <br />
                      @saquarema.rj.gov.br
                    </span>
                    <span className="hidden sm:inline">
                      saladoempreendedor@saquarema.rj.gov.br
                    </span>
                  </a>
                </li>
                <li className="pt-2">
                  <strong>Endereço 1:</strong>{" "}
                  <a
                    href="https://www.google.com/maps/place/R.+Cec%C3%ADlia+dos+Santos+Souza,+31+-+Centro,+Saquarema+-+RJ,+28990-798/@-22.9348024,-42.493805,20z/data=!4m16!1m9!3m8!1s0x975eed1c76674d:0xb7f3c343e1217d2a!2sR.+Cec%C3%ADlia+dos+Santos+Souza,+31+-+Centro,+Saquarema+-+RJ,+28990-798!3b1!8m2!3d-22.9346909!4d-42.493739!10e5!16s%2Fg%2F11c5p5k4rt!3m5!1s0x975eed1c76674d:0xb7f3c343e1217d2a!8m2!3d-22.9346909!4d-42.493739!16s%2Fg%2F11c5p5k4rt?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:underline hover:text-blue-600"
                  >
                    Rua Cecília dos Santos Souza, n° 31 - Centro, Saquarema -
                    RJ, 28990-756
                  </a>
                </li>
                <li>
                  <strong>Endereço 2:</strong>{" "}
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Av.+Saquarema,+5483+-+Porto+da+Roça,+Saquarema+-+RJ,+28994-711"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:underline hover:text-blue-600"
                  >
                    Avenida Saquarema, 5.481, Bacaxá - Saquarema - RJ, 28994-711
                    (Central do Cidadão)
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
