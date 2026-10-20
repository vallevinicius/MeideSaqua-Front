"use client";

import PageHeader from "@/components/admin/PageHeader";
import React, { useState, useEffect, useCallback } from "react";
import {
  Spin,
  Typography,
  message,
  Empty,
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Tabs,
  Input,
  Grid,
  Pagination,
} from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CommentOutlined } from "@ant-design/icons";
import {
  getAllActiveEstablishments,
  adminGetReviewsByEstablishment,
} from "@/lib/api";
import { Estabelecimento } from "@/types/Interface-Estabelecimento";
import { getAdminToken, tratarSessaoAdminExpirada } from "@/lib/session";

const { Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 6;

const getFullImageUrl = (path: string): string => {
  if (!path) return "/logo_mei_redonda.png";
  const normalizedPath = path.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/")
    ? normalizedPath.substring(1)
    : normalizedPath;
  return `${API_URL}/${cleanPath}`;
};

const AdminGerenciarComentariosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(
    []
  );
  const [filteredEstabelecimentos, setFilteredEstabelecimentos] = useState<
    Estabelecimento[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const screens = useBreakpoint();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = getAdminToken();
    if (!token) {
      message.error("Acesso negado.");
      router.push("/admin/login");
      return;
    }
    try {
      const allEstabelecimentos = await getAllActiveEstablishments(token);

      const estabelecimentosComComentarios: Estabelecimento[] = [];
      let falhas = 0;

      for (const est of allEstabelecimentos) {
        try {
          const response = await adminGetReviewsByEstablishment(
            String(est.estabelecimentoId),
            token
          );

          let reviewsList = [];
          if (Array.isArray(response)) {
            reviewsList = response;
          } else if (response && Array.isArray(response.data)) {
            reviewsList = response.data;
          } else if (response && Array.isArray(response.reviews)) {
            reviewsList = response.reviews;
          } else if (response && Array.isArray(response.avaliacoes)) {
            reviewsList = response.avaliacoes;
          }

          if (reviewsList.length > 0) {
            estabelecimentosComComentarios.push(est);
          }
        } catch (error) {
          if (tratarSessaoAdminExpirada(error)) return;
          falhas += 1;
        }
      }

      if (falhas > 0) {
        message.warning(
          `Não foi possível verificar os comentários de ${falhas} estabelecimento(s). A lista pode estar incompleta.`,
        );
      }

      setEstabelecimentos(estabelecimentosComComentarios);
      setFilteredEstabelecimentos(estabelecimentosComComentarios);
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar estabelecimentos.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = (value: string) => {
    const lowerCaseValue = value.toLowerCase();
    const filtered = estabelecimentos.filter(
      (est) =>
        est.nomeFantasia.toLowerCase().includes(lowerCaseValue) ||
        est.categoria.toLowerCase().includes(lowerCaseValue)
    );
    setFilteredEstabelecimentos(filtered);
    setCurrentPage(1);
  };

  const handleTabChange = () => {
    setCurrentPage(1);
  };

  const groupedEstabelecimentos = filteredEstabelecimentos.reduce(
    (acc, est) => {
      const categoriaKey = est.categoria || "Sem Categoria";
      if (!acc[categoriaKey]) {
        acc[categoriaKey] = [];
      }
      acc[categoriaKey].push(est);
      return acc;
    },
    {} as { [key: string]: Estabelecimento[] }
  );

  const sortedCategories = Object.keys(groupedEstabelecimentos).sort((a, b) => {
    if (a === "Sem Categoria") return 1;
    if (b === "Sem Categoria") return -1;
    return a.localeCompare(b);
  });

  const tabPosition = screens.md ? "left" : "top";

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        titulo="Comentários"
        descricao={`Escolha um estabelecimento para ver e moderar as avaliações. ${filteredEstabelecimentos.length} com comentários.`}
      />

      <Search
        placeholder="Buscar por nome do MEI ou categoria..."
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        enterButton
        size="large"
        className="mb-6"
      />

      <Spin spinning={loading}>
        {filteredEstabelecimentos.length === 0 && !loading ? (
          <Empty description="Nenhum estabelecimento ativo encontrado." />
        ) : (
          <Tabs
            // ==================================
            //   ⬇️ 1. ALTERAÇÃO AQUI ⬇️
            // ==================================
            defaultActiveKey="todos" // Inicia na aba "Todos"
            tabPosition={tabPosition}
            onChange={handleTabChange}
          >
            {/* ==================================
                  ⬇️ 2. NOVA ABA "TODOS" ⬇️
                ================================== */}
            <TabPane
              tab={`Todos (${filteredEstabelecimentos.length})`}
              key="todos"
            >
              {(() => {
                // Lógica de paginação para a aba "Todos"
                const totalCount = filteredEstabelecimentos.length;
                const estabelecimentosToShow = filteredEstabelecimentos.slice(
                  (currentPage - 1) * PAGE_SIZE,
                  currentPage * PAGE_SIZE
                );

                return (
                  <>
                    <Row gutter={[16, 16]}>
                      {estabelecimentosToShow.map((est) => (
                        <Col xs={24} md={12} lg={8} key={est.estabelecimentoId}>
                          <Card
                            hoverable
                            actions={[
                              <Link
                                href={`/admin/comentarios/${est.estabelecimentoId}`}
                                passHref
                                key="comentarios"
                              >
                                <Button
                                  type="text"
                                  icon={<CommentOutlined />}
                                  className="hover:!bg-blue-500 hover:!text-white"
                                >
                                  Ver Comentários
                                </Button>
                              </Link>,
                            ]}
                          >
                            <Card.Meta
                              avatar={
                                <Avatar
                                  src={getFullImageUrl(est.logoUrl || "")}
                                />
                              }
                              title={est.nomeFantasia}
                              description={
                                <>
                                  <Text>Categoria: {est.categoria}</Text>
                                  <br />
                                  <Text type="secondary">
                                    CNAE: {est.cnae} <br />
                                    Responsável: {est.nomeResponsavel}
                                    <br />
                                    CPF do Responsável: {est.cpfResponsavel}
                                    <br />
                                  </Text>
                                </>
                              }
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Renderiza o componente de paginação da aba "Todos" */}
                    {totalCount > PAGE_SIZE && (
                      <div className="mt-6 text-center">
                        <Pagination
                          current={currentPage}
                          pageSize={PAGE_SIZE}
                          total={totalCount}
                          onChange={(page) => setCurrentPage(page)}
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                  </>
                );
              })()}
            </TabPane>

            {/* ==================================
                  ⬇️ 3. ABAS DE CATEGORIA (COMO ANTES) ⬇️
                ================================== */}
            {sortedCategories.map((categoria) => {
              const allEstabelecimentosForCat =
                groupedEstabelecimentos[categoria];
              const totalCount = allEstabelecimentosForCat.length;
              const estabelecimentosToShow = allEstabelecimentosForCat.slice(
                (currentPage - 1) * PAGE_SIZE,
                currentPage * PAGE_SIZE
              );

              return (
                <TabPane
                  tab={`${categoria} (${allEstabelecimentosForCat.length})`}
                  key={categoria}
                >
                  <Row gutter={[16, 16]}>
                    {estabelecimentosToShow.map((est) => (
                      <Col xs={24} md={12} lg={8} key={est.estabelecimentoId}>
                        <Card
                          hoverable
                          actions={[
                            <Link
                              href={`/admin/comentarios/${est.estabelecimentoId}`}
                              passHref
                              key="comentarios"
                            >
                              <Button
                                type="text"
                                icon={<CommentOutlined />}
                                className="hover:!bg-blue-500 hover:!text-white"
                              >
                                Ver Comentários
                              </Button>
                            </Link>,
                          ]}
                        >
                          <Card.Meta
                            avatar={
                              <Avatar
                                src={getFullImageUrl(est.logoUrl || "")}
                              />
                            }
                            title={est.nomeFantasia}
                            description={
                              <>
                                <Text>Categoria: {est.categoria}</Text>

                                <br />
                                <Text type="secondary">
                                  CNAE: {est.cnae} <br />
                                  Responsável: {est.nomeResponsavel}
                                  <br />
                                  CPF do Responsável: {est.cpfResponsavel}
                                  <br />
                                </Text>
                              </>
                            }
                          />
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {totalCount > PAGE_SIZE && (
                    <div className="mt-6 text-center">
                      <Pagination
                        current={currentPage}
                        pageSize={PAGE_SIZE}
                        total={totalCount}
                        onChange={(page) => setCurrentPage(page)}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                </TabPane>
              );
            })}
          </Tabs>
        )}
      </Spin>
    </div>
  );
};

export default AdminGerenciarComentariosPage;
