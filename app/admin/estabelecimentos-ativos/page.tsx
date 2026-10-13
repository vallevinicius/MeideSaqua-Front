"use client";

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
  Popconfirm,
  Grid,
  Pagination,
} from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  BarChartOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  adminGetAllActiveEstablishments,
  adminGetAllInactiveEstablishments,
  adminDeleteEstablishment,
  adminExportEstabelecimentos,
  adminToggleEstablishmentStatus, // <--- Nova chamada de API (muda o status)
} from "@/lib/api";
import AdminEstabelecimentoModal from "@/components/AdminEstabelecimentoModal";
import { Estabelecimento } from "@/types/Interface-Estabelecimento";
import { getAdminToken } from "@/lib/session";

const { Title, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const PAGE_SIZE = 6;

const getFullImageUrl = (path: string): string => {
  if (!path) return "";
  const normalizedPath = path.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/")
    ? normalizedPath.substring(1)
    : normalizedPath;
  return `${API_URL}/${cleanPath}`;
};

const EstabelecimentosAtivosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(
    [],
  );
  const [filteredEstabelecimentos, setFilteredEstabelecimentos] = useState<
    Estabelecimento[]
  >([]);
  const [selectedItem, setSelectedItem] = useState<Estabelecimento | null>(
    null,
  );
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
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
      const [ativosData, inativosData] = await Promise.all([
        adminGetAllActiveEstablishments(token),
        adminGetAllInactiveEstablishments(token),
      ]);

      const merged = [...ativosData, ...inativosData];
      const uniqueById = Array.from(
        new Map(
          merged.map((item) => [item.estabelecimentoId, item] as const),
        ).values(),
      );

      setEstabelecimentos(uniqueById);
      setFilteredEstabelecimentos(uniqueById);
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar estabelecimentos.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    const token = getAdminToken();
    if (!token) {
      message.error("Sessão expirada.");
      return;
    }
    setExporting(true);
    try {
      const blob = await adminExportEstabelecimentos(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `estabelecimentos_MeiDeSaqua_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      message.success("Relatório gerado com sucesso!");
    } catch (error: any) {
      console.error(error);
      message.error("Erro ao gerar relatório. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (value: string) => {
    const lowerCaseValue = value.toLowerCase();

    const filtered = estabelecimentos.filter((p) => {
      return (
        (p.nomeFantasia || "").toLowerCase().includes(lowerCaseValue) ||
        (p.cnpj || "").toLowerCase().includes(lowerCaseValue) ||
        (p.categoria || "").toLowerCase().includes(lowerCaseValue) ||
        (p.nomeResponsavel || "").toLowerCase().includes(lowerCaseValue) ||
        (p.estabelecimentoId ? p.estabelecimentoId.toString() : "").includes(
          lowerCaseValue,
        ) ||
        (p.emailEstabelecimento || "").toLowerCase().includes(lowerCaseValue)
      );
    });

    setFilteredEstabelecimentos(filtered);
    setCurrentPage(1);
  };

  const openEditModal = (est: Estabelecimento) => {
    setSelectedItem(est);
    setIsEditModalVisible(true);
  };

  const handleModalClose = (shouldRefresh: boolean) => {
    setIsEditModalVisible(false);
    setSelectedItem(null);
    if (shouldRefresh) fetchData();
  };

  // Nova função para Desativar/Reativar (Soft Delete)
  const handleToggleStatus = async (est: Estabelecimento) => {
    const token = getAdminToken();
    if (!token) {
      message.error("Autenticação expirada.");
      return;
    }
    setLoading(true);
    try {
      await adminToggleEstablishmentStatus(
        est.estabelecimentoId,
        !est.ativo,
        token,
      );
      message.success(
        `Estabelecimento ${est.ativo ? "desativado" : "reativado"} com sucesso!`,
      );
      fetchData();
    } catch (error: any) {
      message.error(
        error.message || "Falha ao alterar o status do estabelecimento.",
      );
      setLoading(false);
    }
  };

  // Exclusão definitiva (Hard Delete do BD)
  const handleDeleteDefinitivo = async (estId: number) => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    try {
      await adminDeleteEstablishment(estId, token);
      message.success(
        "Estabelecimento excluído permanentemente do banco de dados!",
      );
      fetchData();
    } catch (error: any) {
      message.error(error.message || "Falha ao excluir o estabelecimento.");
      setLoading(false);
    }
  };

  const handleTabChange = () => {
    setCurrentPage(1);
  };

  // Agrupamentos
  const ativos = filteredEstabelecimentos.filter((est) => est.ativo);
  const inativos = filteredEstabelecimentos.filter((est) => !est.ativo);

  const groupedEstabelecimentos = filteredEstabelecimentos.reduce(
    (acc, est) => {
      const categoria = est.categoria || "Sem Categoria";
      if (!acc[categoria]) acc[categoria] = [];
      acc[categoria].push(est);
      return acc;
    },
    {} as { [key: string]: Estabelecimento[] },
  );

  const sortedCategories = Object.keys(groupedEstabelecimentos).sort((a, b) =>
    a.localeCompare(b),
  );
  const tabPosition = screens.md ? "left" : "top";

  // Função isolada para renderizar os Cards dinamicamente e deixar o código limpo
  const renderEstabelecimentosGrid = (lista: Estabelecimento[]) => {
    const totalCount = lista.length;
    const estabelecimentosToShow = lista.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );

    if (totalCount === 0) {
      return (
        <Empty description="Nenhum estabelecimento encontrado nesta aba." />
      );
    }

    return (
      <>
        <Row gutter={[16, 16]}>
          {estabelecimentosToShow.map((est) => (
            <Col xs={24} md={12} lg={8} key={est.estabelecimentoId}>
              <Card
                hoverable
                // Aplica filtro de cor cinza caso esteja inativo
                className={
                  !est.ativo
                    ? "grayscale opacity-80 bg-gray-50 border-gray-300"
                    : ""
                }
                actions={[
                  <Button
                    key="editar"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(est)}
                    className="hover:!bg-blue-500 hover:!text-white text-blue-500"
                  >
                    Editar
                  </Button>,
                  <Popconfirm
                    key="toggle"
                    title={
                      est.ativo
                        ? "Desativar Estabelecimento"
                        : "Reativar Estabelecimento"
                    }
                    description={
                      est.ativo
                        ? "Ocultar este estabelecimento do site público?"
                        : "Voltar a exibir este estabelecimento no site público?"
                    }
                    onConfirm={() => handleToggleStatus(est)}
                    okText="Sim"
                    cancelText="Não"
                  >
                    <Button
                      type="text"
                      icon={
                        est.ativo ? <StopOutlined /> : <CheckCircleOutlined />
                      }
                      className={
                        est.ativo
                          ? "hover:!bg-orange-500 hover:!text-white text-orange-500"
                          : "hover:!bg-green-500 hover:!text-white text-green-600"
                      }
                    >
                      {est.ativo ? "Desativar" : "Reativar"}
                    </Button>
                  </Popconfirm>,
                  <Popconfirm
                    key="delete"
                    title="Excluir"
                    description="ATENÇÃO: Deseja apagar definitivamente? Isso não pode ser desfeito."
                    onConfirm={() =>
                      handleDeleteDefinitivo(est.estabelecimentoId)
                    }
                    okText="Sim, Apagar"
                    cancelText="Não"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      className="hover:!bg-red-500 hover:!text-white"
                    >
                      Excluir
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  avatar={
                    <Avatar
                      src={
                        est.logoUrl
                          ? getFullImageUrl(est.logoUrl)
                          : "/LogoMeideSaqua.png"
                      }
                    />
                  }
                  title={
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          !est.ativo ? "line-through text-gray-500" : ""
                        }
                      >
                        {est.nomeFantasia}
                      </span>
                      {!est.ativo && (
                        <span className="text-red-500 text-xs font-normal border border-red-500 rounded px-1">
                          Inativo
                        </span>
                      )}
                    </span>
                  }
                  description={
                    <>
                      <Text>
                        <strong>ID:</strong> {est.estabelecimentoId}
                      </Text>
                      <br />
                      <Text>
                        <strong>CNPJ:</strong> {est.cnpj}
                      </Text>
                      <br />
                      <Text>
                        <strong>Responsável:</strong> {est.nomeResponsavel}
                      </Text>
                      <br />
                      <Text>
                        <strong>Categoria:</strong> {est.categoria}
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
      </>
    );
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <Link href="/admin/dashboard" passHref>
          <Button icon={<ArrowLeftOutlined />} type="text">
            Voltar ao Dashboard
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href="/admin/indicadores" passHref>
            <Button icon={<BarChartOutlined />}>Ver Indicadores</Button>
          </Link>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
            className="bg-green-600 hover:!bg-green-700 border-green-600 hover:!border-green-700"
          >
            Exportar Planilha (CSV)
          </Button>
        </div>
      </div>

      <Title level={2} className="mb-6">
        Gerenciar Estabelecimentos ({filteredEstabelecimentos.length})
      </Title>

      <Search
        placeholder="Buscar por nome fantasia, CNPJ ou categoria..."
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        enterButton
        size="large"
        className="mb-6"
      />

      <Spin spinning={loading}>
        {filteredEstabelecimentos.length === 0 && !loading ? (
          <Empty description="Nenhum estabelecimento encontrado com este filtro." />
        ) : (
          <Tabs
            defaultActiveKey="geral"
            tabPosition={tabPosition}
            onChange={handleTabChange}
          >
            {/* Abas Principais de Status (Geral, Ativos, Inativos) */}
            <TabPane
              tab={
                <span className="font-semibold text-gray-700">
                  Geral ({filteredEstabelecimentos.length})
                </span>
              }
              key="geral"
            >
              {renderEstabelecimentosGrid(filteredEstabelecimentos)}
            </TabPane>

            <TabPane
              tab={
                <span className="font-semibold text-green-600">
                  Ativos ({ativos.length})
                </span>
              }
              key="ativos"
            >
              {renderEstabelecimentosGrid(ativos)}
            </TabPane>

            <TabPane
              tab={
                <span className="font-semibold text-red-500">
                  Inativos ({inativos.length})
                </span>
              }
              key="inativos"
            >
              {renderEstabelecimentosGrid(inativos)}
            </TabPane>

            {/* Abas dinâmicas das Categorias (como você já tinha) */}
            {sortedCategories.map((categoria) => {
              const catList = groupedEstabelecimentos[categoria];
              return (
                <TabPane
                  tab={`${categoria} (${catList.length})`}
                  key={categoria}
                >
                  {renderEstabelecimentosGrid(catList)}
                </TabPane>
              );
            })}
          </Tabs>
        )}
      </Spin>

      <AdminEstabelecimentoModal
        estabelecimento={selectedItem}
        visible={isEditModalVisible}
        onClose={handleModalClose}
        mode="edit-only"
        onEditAndApprove={async () => {}}
      />
    </div>
  );
};

export default EstabelecimentosAtivosPage;
