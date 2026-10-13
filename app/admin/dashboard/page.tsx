"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  List,
  Modal,
  message,
  Descriptions,
  Spin,
  Empty,
  Typography,
  Image,
  Alert,
  Avatar,
  Table,
  Input,
  Select,
  Pagination,
  Grid,
  Dropdown,
  type MenuProps,
} from "antd";
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  DatabaseOutlined,
  CommentOutlined,
  HomeOutlined,
  TeamOutlined,
  FilePdfOutlined,
  MenuOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getPendingAdminRequests,
  adminUpdateEstablishment,
  adminEditAndApproveEstablishment,
} from "@/lib/api";
import AdminEstabelecimentoModal from "@/components/AdminEstabelecimentoModal";
import { Estabelecimento } from "@/types/Interface-Estabelecimento";
import FormattedDescription from "@/components/FormattedDescription";
import DOMPurify from "dompurify";
import CcmeiViewer from "@/components/admin/CcmeiViewer";
import { getAdminToken } from "@/lib/session";

const { Text, Title } = Typography;
const { Column } = Table;
const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Enum adaptado para Estabelecimento
enum StatusEstabelecimento {
  PENDENTE_APROVACAO = "pendente_aprovacao",
  PENDENTE_ATUALIZACAO = "pendente_atualizacao",
  PENDENTE_EXCLUSAO = "pendente_exclusao",
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const DASHBOARD_PAGE_SIZE = 5;

// Objeto para os ícones dos cards
const listIcons: { [key: string]: React.ReactNode } = {
  "Novos Cadastros": <UserAddOutlined style={{ color: "#52c41a" }} />,
  Atualizações: <EditOutlined style={{ color: "#1890ff" }} />,
  Exclusões: <DeleteOutlined style={{ color: "#f5222d" }} />,
};

// Interface de dados adaptada
interface PendingData {
  cadastros: Estabelecimento[];
  atualizacoes: Estabelecimento[];
  exclusoes: Estabelecimento[];
}

// fieldConfig ORIGINAL do MeideSaquá
const fieldConfig: { [key: string]: { label: string; order: number } } = {
  // dados do responsável
  usuarioId: { label: "ID do Usuário (Dono)", order: 0 },
  usuario_id: { label: "ID do Usuário (Dono)", order: 0 },
  nomeResponsavel: { label: "Nome do Responsável", order: 1 },
  cpfResponsavel: { label: "CPF do Responsável", order: 2 },
  emailEstabelecimento: { label: "Email", order: 3 },

  // dados do MEI
  estabelecimentoId: { label: "ID", order: 1 },
  nomeFantasia: { label: "Nome Fantasia", order: 2 },
  cnpj: { label: "CNPJ", order: 3 },
  categoria: { label: "Categoria", order: 4 },
  tagsInvisiveis: { label: "Tags", order: 5 },
  cnae: { label: "CNAE", order: 6 },
  venda: { label: "Canais de Venda", order: 7 },
  escala: { label: "Escala de Impacto", order: 8 },
  contatoEstabelecimento: { label: "Contato", order: 9 },
  endereco: { label: "Endereço", order: 10 },
  areasAtuacao: { label: "Áreas de Atuação", order: 11 },
  descricao: { label: "Descrição", order: 12 },
  descricaoDiferencial: { label: "Diferencial", order: 13 },
  website: { label: "Website", order: 14 },
  instagram: { label: "Instagram", order: 15 },
  ccmeiUrl: { label: "CCMEI Atual", order: 16 },
  logoUrl: { label: "Logo Atual", order: 17 },
  produtosImg: { label: "Portfólio Atual", order: 18 },

  //atualização
  status: { label: "Status Atual", order: 5 },
  outrasAlteracoes: { label: "Outras Alterações", order: 6 },
  logo: { label: "Nova Logo", order: 17 },
  ccmei: { label: "Novo CCMEI", order: 16 },
  produtos: { label: "Novo Portfólio", order: 18 },
  motivo: { label: "Motivo da Exclusão", order: 1000 },
  motivoExclusao: { label: "Motivo da Exclusão", order: 15 },
  createdAt: { label: "Data de Criação", order: 100 },
  updatedAt: { label: "Última Atualização", order: 101 },
};

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PendingData>({
    cadastros: [],
    atualizacoes: [],
    exclusoes: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Estabelecimento | null>(
    null,
  );
  const router = useRouter();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [currentPages, setCurrentPages] = useState({
    cadastros: 1,
    atualizacoes: 1,
    exclusoes: 1,
  });

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const getFullImageUrl = (path: string): string => {
    if (!path) return "";
    const normalizedPath = path.replace(/\\/g, "/");
    const cleanPath = normalizedPath.startsWith("/")
      ? normalizedPath.substring(1)
      : normalizedPath;
    return `${API_URL}/${cleanPath}`;
  };

  // renderValue MODIFICADO
  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === "") {
      return <Text type="secondary">Não informado</Text>;
    }

    // --- NOVA LÓGICA DE DATA ---
    if (key === "createdAt" || key === "updatedAt") {
      try {
        const dateObj = new Date(value);
        return dateObj.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      } catch (e) {
        return String(value);
      }
    }
    // ---------------------------

    // --- LÓGICA PARA TORNAR LINKS CLICÁVEIS ---
    if (key === "website") {
      const urlString = String(value);
      let href = urlString;
      if (!/^https?:\/\//i.test(href)) {
        href = `https://${href}`;
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1890ff", textDecoration: "underline" }}
        >
          {urlString}
        </a>
      );
    }

    if (key === "instagram") {
      const val = String(value).trim();
      let href = val;

      if (val.includes("instagram.com") || /^https?:\/\//i.test(val)) {
        if (!/^https?:\/\//i.test(href)) {
          href = `https://${href}`;
        }
      } else {
        const handle = val.replace(/^@/, "");
        href = `https://www.instagram.com/${handle}`;
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#1890ff", textDecoration: "underline" }}
        >
          {val}
        </a>
      );
    }
    // -------------------------------------------

    if (key === "descricao") {
      return (
        <div
          className="prose prose-sm max-w-none prose-p:my-1"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(value)) }}
        />
      );
    }

    if (key === "descricaoDiferencial") {
      return <FormattedDescription text={value} />;
    }

    if (
      key === "motivo" ||
      key === "motivoExclusao" ||
      key === "outrasAlteracoes"
    ) {
      return (
        <Typography.Paragraph style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {String(value)}
        </Typography.Paragraph>
      );
    }

    if (key === "ccmeiUrl" && typeof value === "string" && value) {
      return selectedItem ? (
        <CcmeiViewer estabelecimentoId={selectedItem.estabelecimentoId} />
      ) : null;
    }

    if (key === "ccmei" && typeof value === "string" && value) {
      return selectedItem ? (
        <CcmeiViewer
          estabelecimentoId={selectedItem.estabelecimentoId}
          pendente
        />
      ) : null;
    }

    if (
      (key === "produtosImg" || key === "produtos") &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      const imagesUrls = value
        .map((item) => (typeof item === "string" ? item : item.url))
        .map(getFullImageUrl)
        .filter(Boolean);

      return (
        <Image.PreviewGroup>
          <Row gutter={[8, 8]}>
            {imagesUrls.map((imageUrl, index) => (
              <Col key={index}>
                <Image src={imageUrl} alt={`Produto ${index + 1}`} width={80} />
              </Col>
            ))}
          </Row>
        </Image.PreviewGroup>
      );
    }

    if (
      (key === "logoUrl" || key === "logo") &&
      typeof value === "string" &&
      value
    ) {
      return <Image src={getFullImageUrl(value)} alt="Logo" width={150} />;
    }

    if (typeof value === "object" && value !== null)
      return JSON.stringify(value);

    if (
      (key === "tagsInvisiveis" || key === "areasAtuacao") &&
      Array.isArray(value)
    ) {
      return value.join(", ");
    }

    return String(value);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = getAdminToken();
    if (!token) {
      message.error("Acesso negado.");
      router.push("/admin/login");
      return;
    }
    try {
      const pendingData = await getPendingAdminRequests(token);
      setData(pendingData);
      setCurrentPages({
        cadastros: 1,
        atualizacoes: 1,
        exclusoes: 1,
      });
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar dados.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (
    action: "approve" | "reject",
    motivoRejeicao?: string,
  ) => {
    if (!selectedItem) return;

    setIsActionLoading(true);
    const token = getAdminToken();

    try {
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (action === "reject") {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          "Content-Type": "application/json",
        };
        fetchOptions.body = JSON.stringify({
          motivoRejeicao: motivoRejeicao || "",
        });
      }

      const response = await fetch(
        `${API_URL}/api/admin/${action}/${selectedItem.estabelecimentoId}`,
        { ...fetchOptions, credentials: "include" },
      );

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.message || "Erro do servidor");
        } catch (e) {
          console.error("Erro não-JSON da API:", errorText);
          throw new Error(
            "Falha na comunicação com o servidor. (Recebeu HTML)",
          );
        }
      }

      const result = await response.json();
      message.success(result.message || `Ação executada com sucesso!`);

      setData((prevData) => {
        const newData = { ...prevData };
        (Object.keys(newData) as Array<keyof PendingData>).forEach((key) => {
          newData[key] = newData[key].filter(
            (item) => item.estabelecimentoId !== selectedItem.estabelecimentoId,
          );
        });
        return newData;
      });

      if (selectedItem.status === StatusEstabelecimento.PENDENTE_APROVACAO) {
        handlePageChange("cadastros")(1);
      } else if (
        selectedItem.status === StatusEstabelecimento.PENDENTE_ATUALIZACAO
      ) {
        handlePageChange("atualizacoes")(1);
      } else if (
        selectedItem.status === StatusEstabelecimento.PENDENTE_EXCLUSAO
      ) {
        handlePageChange("exclusoes")(1);
      }

      setModalVisible(false);
      setIsRejectModalVisible(false);
      setSelectedItem(null);
      setRejectionReason("");
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const showModal = (item: Estabelecimento) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOpenEditModal = () => {
    if (!selectedItem) return;
    setIsEditModalVisible(true);
  };

  // --- FUNÇÃO ATUALIZADA PARA USAR adminEditAndApproveEstablishment ---
  const handleEditAndApproveSubmit = async (formData: FormData) => {
    if (!selectedItem) return;

    setIsActionLoading(true);
    const token = getAdminToken();
    if (!token) {
      message.error("Autenticação expirada.");
      setIsActionLoading(false);
      return;
    }

    try {
      // Usando a rota específica de "Editar e Aprovar" (POST) em vez de apenas Update (PATCH)
      // Isso garante que o status mude para ATIVO
      await adminEditAndApproveEstablishment(
        selectedItem.estabelecimentoId,
        formData,
        token,
      );

      setIsEditModalVisible(false);
      setModalVisible(false);
      setSelectedItem(null);
      fetchData(); // Recarrega para remover da lista de pendentes
    } catch (error: any) {
      setIsActionLoading(false);
      throw error; // O erro será pego e exibido pelo Modal
    } finally {
      setIsActionLoading(false);
    }
  };

  const renderDiffTable = (
    status: "pendente_atualizacao" | "pendente_exclusao",
    alertType: "info" | "error",
    title: string,
    keysToFilter: string[] = [],
  ) => {
    if (
      !selectedItem ||
      selectedItem.status !== status ||
      !selectedItem.dados_atualizacao
    ) {
      return null;
    }

    const keyMap: { [newKey: string]: { oldKey: string; labelKey: string } } = {
      logo: { oldKey: "logoUrl", labelKey: "logo" },
      produtos: { oldKey: "produtosImg", labelKey: "produtos" },
      ccmei: { oldKey: "ccmeiUrl", labelKey: "ccmei" },
      nome_responsavel: {
        oldKey: "nomeResponsavel",
        labelKey: "nome_responsavel",
      },
      cpf_responsavel: {
        oldKey: "cpfResponsavel",
        labelKey: "cpf_responsavel",
      },
    };

    const diffData = Object.entries(selectedItem.dados_atualizacao)
      .filter(([key]) => !keysToFilter.includes(key))
      .map(([key, newValue]) => {
        const mapping = keyMap[key];
        const oldKey = mapping ? mapping.oldKey : key;
        const labelKey = mapping ? mapping.labelKey : key;

        const oldValue = selectedItem[oldKey];
        const fieldLabel = fieldConfig[labelKey]?.label ?? `Novo ${key}`;

        let finalLabel = fieldLabel;
        if (labelKey === "produtos") finalLabel = "Portfólio";
        if (labelKey === "logo") finalLabel = "Logo";
        if (labelKey === "ccmei") finalLabel = "CCMEI";
        if (key === "motivo") finalLabel = "Motivo da Exclusão";

        return {
          key: oldKey,
          newKey: key,
          field: finalLabel,
          oldValue: oldValue,
          newValue: newValue,
        };
      })
      .sort(
        (a, b) =>
          (fieldConfig[a.newKey]?.order ?? 999) -
          (fieldConfig[b.newKey]?.order ?? 999),
      );

    const titleColor = alertType === "info" ? "#0050b3" : "#d4380d";

    return (
      <Alert
        type={alertType}
        showIcon
        className="mt-6"
        style={{ overflow: "hidden" }}
        message={
          <Title level={4} style={{ margin: 0, color: titleColor }}>
            {title}
          </Title>
        }
        description={
          <Table
            dataSource={diffData}
            pagination={false}
            size="middle"
            bordered
            className="mt-4"
            scroll={{ x: true }}
          >
            <Column title="Campo" dataIndex="field" key="field" width={150} />
            <Column
              title="Valor Antigo"
              dataIndex="oldValue"
              key="oldValue"
              width={400}
              render={(value, record: any) => renderValue(record.key, value)}
            />
            <Column
              title="Valor Novo"
              dataIndex="newValue"
              key="newValue"
              width={450}
              render={(value, record: any) => renderValue(record.newKey, value)}
            />
          </Table>
        }
      />
    );
  };

  const handlePageChange = (listKey: keyof PendingData) => (page: number) => {
    setCurrentPages((prev) => ({
      ...prev,
      [listKey]: page,
    }));
  };

  const renderList = (
    title: string,
    listData: Estabelecimento[],
    listKey: keyof PendingData,
  ) => {
    const totalCount = listData.length;
    const currentPage = currentPages[listKey];
    const pagedData = listData.slice(
      (currentPage - 1) * DASHBOARD_PAGE_SIZE,
      currentPage * DASHBOARD_PAGE_SIZE,
    );

    return (
      <Col xs={24} md={12} lg={8}>
        <Card
          title={
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {listIcons[title]}
              {title} ({listData.length})
            </span>
          }
        >
          {listData.length > 0 ? (
            <>
              <List
                dataSource={pagedData}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button key="detalhes" type="link" onClick={() => showModal(item)}>
                        Detalhes
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          src={getFullImageUrl(item.logoUrl || "")}
                          icon={listIcons[title]}
                        />
                      }
                      title={item.nomeFantasia}
                      description={`CNPJ: ${item.cnpj}`}
                    />
                  </List.Item>
                )}
              />
              {totalCount > DASHBOARD_PAGE_SIZE && (
                <div className="mt-4 text-center">
                  <Pagination
                    current={currentPage}
                    pageSize={DASHBOARD_PAGE_SIZE}
                    total={totalCount}
                    onChange={handlePageChange(listKey)}
                    size="small"
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty description="Nenhuma solicitação" />
          )}
        </Card>
      </Col>
    );
  };

  const renderDescriptionGroup = (title: string, entries: [string, any][]) => {
    const visibleEntries = entries.filter(([key]) => fieldConfig[key]);
    if (visibleEntries.length === 0) return null;

    return (
      <Card type="inner" title={title} className="mb-4">
        <Descriptions bordered column={1} size="small">
          {visibleEntries.map(
            ([key, value]) =>
              fieldConfig[key] && (
                <Descriptions.Item
                  key={key}
                  label={fieldConfig[key]?.label ?? key}
                >
                  {renderValue(key, value)}
                </Descriptions.Item>
              ),
          )}
        </Descriptions>
      </Card>
    );
  };

  const getGroupedEntries = (item: Estabelecimento) => {
    const keysResponsavel = [
      "usuarioId",
      "usuario_id",
      "nomeResponsavel",
      "cpfResponsavel",
      "emailEstabelecimento",
      "createdAt", // Adicionamos aqui para aparecer no grupo
    ];
    const keysMei = [
      "estabelecimentoId",
      "nomeFantasia",
      "cnpj",
      "cnae",
      "categoria",
      "contatoEstabelecimento",
      "endereco",
      "website",
      "instagram",
      "tagsInvisiveis",
      "descricao",
      "descricaoDiferencial",
      "areasAtuacao",
      "logoUrl",
      "produtosImg",
      "ccmeiUrl",
      "venda",
      "escala",
    ];

    const allEntries = Object.entries(item)
      .filter(([key]) => key !== "dados_atualizacao" && key !== "status")
      .sort(
        ([keyA], [keyB]) =>
          (fieldConfig[keyA]?.order ?? 999) - (fieldConfig[keyB]?.order ?? 999),
      );

    const entriesResponsavel = allEntries.filter(([key]) =>
      keysResponsavel.includes(key),
    );
    const entriesMei = allEntries.filter(([key]) => keysMei.includes(key));
    const entriesMetadados = allEntries.filter(
      ([key]) => !keysResponsavel.includes(key) && !keysMei.includes(key),
    );

    return { entriesResponsavel, entriesMei, entriesMetadados };
  };

  return (
    <div className="p-8">
      <Spin spinning={loading}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <Title
            level={isMobile ? 3 : 2}
            className="m-0 md:text-left text-center"
          >
            Painel de Administração
          </Title>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <Link href="/" target="_blank" passHref>
            <Button
              icon={<HomeOutlined />}
              size="large"
              className={isMobile ? "w-full" : ""}
            >
              Home
            </Button>
          </Link>

          <div className="w-full md:w-auto">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "estabelecimentos",
                    icon: (
                      <DatabaseOutlined className="text-blue-500 text-2xl" />
                    ),
                    label: (
                      <Link
                        href="/admin/estabelecimentos-ativos"
                        className="text-base ml-2"
                      >
                        Gerenciar Estabelecimentos
                      </Link>
                    ),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "comentarios",
                    icon: (
                      <CommentOutlined className="text-[#3C6AB2] text-2xl" />
                    ),
                    label: (
                      <Link
                        href="/admin/comentarios"
                        className="text-base ml-2"
                      >
                        Gerenciar Comentários
                      </Link>
                    ),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "usuarios",
                    icon: <TeamOutlined className="text-[#52c41a] text-2xl" />,
                    label: (
                      <Link href="/admin/usuarios" className="text-base ml-2">
                        Gerenciar Usuários
                      </Link>
                    ),
                  },
                  {
                    type: "divider",
                  },
                  {
                    key: "cursos",
                    icon: <ReadOutlined className="text-orange-500 text-2xl" />,
                    label: (
                      <Link href="/admin/cursos" className="text-base ml-2">
                        Gerenciar Cursos & Capacitações
                      </Link>
                    ),
                  },
                ],
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="primary"
                icon={<MenuOutlined className="text-xl" />}
                size="large"
                className={isMobile ? "w-full h-12 text-lg" : "h-10"}
                style={{
                  backgroundColor: "#017DB9",
                  borderColor: "#017DB9",
                }}
              >
                Menu Administrativo
              </Button>
            </Dropdown>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {renderList("Novos Cadastros", data.cadastros, "cadastros")}
          {renderList("Atualizações", data.atualizacoes, "atualizacoes")}
          {renderList("Exclusões", data.exclusoes, "exclusoes")}
        </Row>
      </Spin>

      {selectedItem && (
        <Modal
          title={`Detalhes de ${selectedItem.nomeFantasia}`}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          width={1000}
          footer={[
            <Button
              key="reject"
              onClick={() => setIsRejectModalVisible(true)}
              icon={<CloseOutlined />}
              danger
              loading={isActionLoading}
            >
              Recusar
            </Button>,

            selectedItem.status !== StatusEstabelecimento.PENDENTE_EXCLUSAO && (
              <Button
                key="edit_and_approve"
                onClick={handleOpenEditModal}
                icon={<EditOutlined />}
                loading={isActionLoading}
              >
                Editar e Aprovar
              </Button>
            ),

            selectedItem.status !== StatusEstabelecimento.PENDENTE_EXCLUSAO ? (
              <Button
                key="approve_direct"
                type="primary"
                onClick={() => handleAction("approve")}
                icon={<CheckOutlined />}
                loading={isActionLoading}
              >
                Aprovar Direto
              </Button>
            ) : (
              <Button
                key="approve_delete"
                type="primary"
                danger
                onClick={() => handleAction("approve")}
                icon={<CheckOutlined />}
                loading={isActionLoading}
              >
                Confirmar Exclusão
              </Button>
            ),
          ]}
        >
          {(() => {
            const { entriesResponsavel, entriesMei, entriesMetadados } =
              getGroupedEntries(selectedItem);

            return (
              <>
                <Title level={4} className="mb-4">
                  Dados do Estabelecimento
                </Title>

                {renderDescriptionGroup(
                  "1. Identificação do Responsável",
                  entriesResponsavel,
                )}

                {renderDescriptionGroup("2. Identificação do Mei", entriesMei)}

                {renderDescriptionGroup("3. Metadados", entriesMetadados)}
              </>
            );
          })()}

          {renderDiffTable(
            "pendente_exclusao",
            "error",
            "Solicitação de Exclusão",
            ["estabelecimentoId", "confirmacao"],
          )}
          {renderDiffTable(
            "pendente_atualizacao",
            "info",
            "Dados para Atualizar",
            ["motivoExclusao", "venda", "escala"],
          )}
        </Modal>
      )}

      {isEditModalVisible && (
        <AdminEstabelecimentoModal
          estabelecimento={selectedItem}
          visible={isEditModalVisible}
          onClose={(shouldRefresh: boolean) => {
            setIsEditModalVisible(false);
            if (shouldRefresh) {
              setModalVisible(false);
              setSelectedItem(null);
              fetchData();
            }
          }}
          mode="edit-and-approve"
          onEditAndApprove={handleEditAndApproveSubmit}
        />
      )}

      <Modal
        title="Confirmar Rejeição"
        open={isRejectModalVisible}
        onCancel={() => {
          setIsRejectModalVisible(false);
          setRejectionReason("");
        }}
        onOk={() => handleAction("reject", rejectionReason)}
        confirmLoading={isActionLoading}
        okText="Confirmar Rejeição"
        cancelText="Voltar"
        okButtonProps={{ danger: true }}
      >
        <Typography.Text strong className="block mb-2">
          Por favor, informe o motivo da rejeição (será enviado ao usuário):
        </Typography.Text>
        <TextArea
          rows={4}
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="O cadastro foi rejeitado pois..."
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
