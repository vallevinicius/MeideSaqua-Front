"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Button,
  Spin,
  Alert,
  message,
  Typography,
  Image as AntdImage,
  Tag,
  Popconfirm,
  Rate,
  Upload,
} from "antd";
import {
  CloseOutlined,
  QuestionCircleOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileImageOutlined,
} from "@ant-design/icons";
import {
  adminUpdateEstablishment,
  adminEditAndApproveEstablishment,
  adminGetEstablishmentById,
  getAllUsers,
} from "@/lib/api";
import {
  Estabelecimento,
  ImagemProduto,
} from "@/types/Interface-Estabelecimento";
import {
  categorias,
  areasAtuacao,
  tagsPorCategoria,
  canaisDeVendaOpcoes,
} from "@/constants/mei-options";
import dynamic from "next/dynamic";
import CcmeiViewer from "@/components/admin/CcmeiViewer";
import "react-quill/dist/quill.snow.css";
import "@/app/cadastro-mei/quill-styles.css";
import { getAdminToken } from "@/lib/session";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <Spin
      size="large"
      style={{ display: "block", margin: "20px auto", minHeight: "150px" }}
    />
  ),
});

const quillModules = {
  toolbar: [
    [{ header: "1" }, { header: "2" }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AdminEstabelecimentoModalProps {
  estabelecimento: Estabelecimento | null;
  visible: boolean;
  onClose: (shouldRefresh: boolean) => void;
  mode: "edit-and-approve" | "edit-only";
  onEditAndApprove: (formData: FormData) => Promise<void>;
}

const AdminEstabelecimentoModal: React.FC<AdminEstabelecimentoModalProps> = ({
  estabelecimento,
  visible,
  onClose,
  mode,
  onEditAndApprove,
}) => {
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [outrasAlteracoes, setOutrasAlteracoes] = useState<string | null>(null);

  // Estados para Imagens e Arquivos
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [currentPortfolio, setCurrentPortfolio] = useState<ImagemProduto[]>([]);
  const [currentCcmei, setCurrentCcmei] = useState<string | null>(null);

  const [portfolioToDelete, setPortfolioToDelete] = useState<string[]>([]);
  const [logoToDelete, setLogoToDelete] = useState<boolean>(false);
  const [ccmeiToDelete, setCcmeiToDelete] = useState<boolean>(false);

  const [newCcmeiFile, setNewCcmeiFile] = useState<File | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<{
    username: string | null;
    userId: number | string | null;
  }>({ username: null, userId: null });
  const [isOwnerLoading, setIsOwnerLoading] = useState(false);

  const getFullImageUrl = (
    path: string | null | undefined,
  ): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith("http") || path.startsWith("blob:")) {
      return path;
    }
    const normalizedPath = path.replace(/\\/g, "/");
    const cleanPath = normalizedPath.startsWith("/")
      ? normalizedPath.substring(1)
      : normalizedPath;
    return `${API_URL}/${cleanPath}`;
  };

  useEffect(() => {
    const uniqueTags = [
      ...new Set(Object.values(tagsPorCategoria).flat()),
    ].sort();
    setAllTags(uniqueTags);

    if (estabelecimento) {
      let dataToEdit: any = { ...estabelecimento };

      // Valores iniciais (atuais do banco)
      let finalLogoUrl = estabelecimento.logoUrl || null;
      let finalCcmeiUrl = estabelecimento.ccmeiUrl || null;
      let finalPortfolioImgs = estabelecimento.produtosImg || [];

      // Se for uma atualização pendente, sobrescreve com os dados da solicitação
      if (
        estabelecimento.status === "pendente_atualizacao" &&
        estabelecimento.dados_atualizacao
      ) {
        dataToEdit = {
          ...estabelecimento,
          ...estabelecimento.dados_atualizacao,
        };
        setOutrasAlteracoes(
          estabelecimento.dados_atualizacao.outrasAlteracoes || null,
        );

        // Atualiza URLs com os novos valores pendentes, se existirem
        finalLogoUrl = estabelecimento.dados_atualizacao.logo || finalLogoUrl;
        finalCcmeiUrl =
          estabelecimento.dados_atualizacao.ccmei || finalCcmeiUrl;

        if (estabelecimento.dados_atualizacao.produtos) {
          finalPortfolioImgs = estabelecimento.dados_atualizacao.produtos.map(
            (url: string) => ({ url: url }),
          );
        }
        delete dataToEdit.outrasAlteracoes;
      } else {
        setOutrasAlteracoes(null);
      }

      // Filtra logo do portfólio (lógica legado)
      const normalize = (path: string | null | undefined): string => {
        if (!path) return "";
        return path
          .replace(API_URL || "", "")
          .replace(/\\/g, "/")
          .replace(/^\/+|\/+$/g, "");
      };

      const normalizedLogoPath = normalize(finalLogoUrl);
      const filteredPortfolio = finalPortfolioImgs.filter((img) => {
        if (!img || !img.url) return false;
        if (normalizedLogoPath === "") return true;
        return normalize(img.url) !== normalizedLogoPath;
      });

      setCurrentLogo(finalLogoUrl);
      setCurrentCcmei(finalCcmeiUrl);
      setCurrentPortfolio(filteredPortfolio);

      setPortfolioToDelete([]);
      setLogoToDelete(false);
      setCcmeiToDelete(false);
      setNewCcmeiFile(null);

      // Tratamento de Arrays/Strings
      if (typeof dataToEdit.areasAtuacao === "string") {
        dataToEdit.areasAtuacao = dataToEdit.areasAtuacao
          .split(",")
          .map((s: string) => s.trim());
      }
      if (typeof dataToEdit.tagsInvisiveis === "string") {
        dataToEdit.tagsInvisiveis = dataToEdit.tagsInvisiveis
          .split(",")
          .map((s: string) => s.trim());
      }
      if (typeof dataToEdit.venda === "string") {
        dataToEdit.venda = dataToEdit.venda
          .split(",")
          .map((s: string) => s.trim());
      }

      editForm.setFieldsValue(dataToEdit);
    } else {
      editForm.resetFields();
      setOutrasAlteracoes(null);
      setCurrentLogo(null);
      setCurrentCcmei(null);
      setCurrentPortfolio([]);
      setPortfolioToDelete([]);
      setLogoToDelete(false);
      setCcmeiToDelete(false);
      setNewCcmeiFile(null);
    }
  }, [estabelecimento, visible, editForm]);

  useEffect(() => {
    const loadOwnerInfo = async () => {
      if (!visible || !estabelecimento?.estabelecimentoId) {
        setOwnerInfo({ username: null, userId: null });
        return;
      }

      setIsOwnerLoading(true);

      const extractOwner = (source: any) => {
        const pickText = (...values: any[]) => {
          const found = values.find(
            (value) => typeof value === "string" && value.trim() !== "",
          );
          return found ? String(found).trim() : null;
        };

        const usernameRaw = pickText(
          source?.username,
          source?.usuario?.username,
          source?.nomeUsuario,
          source?.usuario?.nomeUsuario,
          source?.user?.username,
          source?.proprietario?.username,
          source?.nomeCompleto,
          source?.usuario?.nomeCompleto,
          source?.user?.nomeCompleto,
          source?.proprietario?.nomeCompleto,
          source?.nome,
          source?.usuario?.nome,
          source?.user?.nome,
          source?.proprietario?.nome,
          source?.email,
          source?.usuario?.email,
          source?.user?.email,
          source?.proprietario?.email,
        );

        const username = usernameRaw
          ? String(usernameRaw).replace(/^@/, "")
          : null;

        const userId =
          source?.usuarioId ??
          source?.usuario_id ??
          source?.usuario?.usuarioId ??
          source?.usuario?.id ??
          source?.user?.id ??
          source?.proprietario?.usuarioId ??
          null;

        return { username, userId };
      };

      const isOwnerResolved = (owner: {
        username: string | null;
        userId: number | string | null;
      }) => owner.username !== null || owner.userId !== null;

      const fallbackOwner = extractOwner(estabelecimento);
      setOwnerInfo(fallbackOwner);

      const token = getAdminToken();
      if (!token) {
        setIsOwnerLoading(false);
        return;
      }

      try {
        const details = await adminGetEstablishmentById(
          estabelecimento.estabelecimentoId,
          token,
        );

        const detailsOwner = isOwnerResolved(extractOwner(details))
          ? extractOwner(details)
          : extractOwner(details?.data);

        if (isOwnerResolved(detailsOwner)) {
          setOwnerInfo(detailsOwner);
          return;
        }

        // Fallback extra: busca na API de usuarios e cruza pelo estabelecimentoId.
        const usersResponse = await getAllUsers(token);
        const usersList = Array.isArray(usersResponse)
          ? usersResponse
          : Array.isArray(usersResponse?.data)
            ? usersResponse.data
            : [];

        const ownerUser = usersList.find((user: any) =>
          Array.isArray(user?.estabelecimentos)
            ? user.estabelecimentos.some((est: any) => {
                const estId =
                  est?.estabelecimentoId ?? est?.id ?? est?.estabelecimento_id;
                return Number(estId) === Number(estabelecimento.estabelecimentoId);
              })
            : false,
        );

        if (ownerUser) {
          const ownerFromUsers = {
            username:
              ownerUser?.username ||
              ownerUser?.nomeCompleto ||
              ownerUser?.nome ||
              ownerUser?.email
                ? String(
                    ownerUser?.username ||
                      ownerUser?.nomeCompleto ||
                      ownerUser?.nome ||
                      ownerUser?.email,
                  ).replace(/^@/, "")
                : null,
            userId: ownerUser?.usuarioId ?? ownerUser?.id ?? null,
          };
          setOwnerInfo(ownerFromUsers);
          return;
        }

        setOwnerInfo(fallbackOwner);
      } catch {
        // Se a rota de detalhe falhar, tenta mapear dono pela lista de usuarios.
        try {
          const usersResponse = await getAllUsers(token);
          const usersList = Array.isArray(usersResponse)
            ? usersResponse
            : Array.isArray(usersResponse?.data)
              ? usersResponse.data
              : [];

          const ownerUser = usersList.find((user: any) =>
            Array.isArray(user?.estabelecimentos)
              ? user.estabelecimentos.some((est: any) => {
                  const estId =
                    est?.estabelecimentoId ?? est?.id ?? est?.estabelecimento_id;
                  return Number(estId) === Number(estabelecimento.estabelecimentoId);
                })
              : false,
          );

          if (ownerUser) {
            setOwnerInfo({
              username:
                ownerUser?.username ||
                ownerUser?.nomeCompleto ||
                ownerUser?.nome ||
                ownerUser?.email
                  ? String(
                      ownerUser?.username ||
                        ownerUser?.nomeCompleto ||
                        ownerUser?.nome ||
                        ownerUser?.email,
                    ).replace(/^@/, "")
                  : fallbackOwner.username,
              userId:
                ownerUser?.usuarioId ?? ownerUser?.id ?? fallbackOwner.userId,
            });
          }
        } catch {
          // Mantem fallback silenciosamente se todas as rotas falharem.
        }
      } finally {
        setIsOwnerLoading(false);
      }
    };

    loadOwnerInfo();
  }, [visible, estabelecimento]);

  const handleSubmit = async (values: any) => {
    if (!estabelecimento) return;

    setIsEditLoading(true);

    const formData = new FormData();

    Object.keys(values).forEach((key) => {
      const value = values[key];
      if (value) {
        if (Array.isArray(value)) {
          formData.append(key, value.join(", "));
        } else {
          formData.append(key, value);
        }
      }
    });

    if (logoToDelete) {
      formData.append("logoUrl", "DELETE");
    }

    if (ccmeiToDelete) {
      formData.append("ccmeiUrl", "DELETE");
    }

    // Adiciona o novo arquivo CCMEI se selecionado
    if (newCcmeiFile) {
      formData.append("ccmei", newCcmeiFile);
    }

    if (portfolioToDelete.length > 0) {
      formData.append("urlsParaExcluir", JSON.stringify(portfolioToDelete));
    }

    try {
      const token = getAdminToken();
      if (!token) {
        message.error("Autenticação expirada.");
        setIsEditLoading(false);
        return;
      }

      if (mode === "edit-and-approve") {
        await onEditAndApprove(formData);
        message.success("Estabelecimento editado e aprovado!");
      } else {
        await adminUpdateEstablishment(
          estabelecimento.estabelecimentoId,
          formData,
          token,
        );
        message.success("Estabelecimento atualizado com sucesso!");
      }

      onClose(true);
    } catch (error: any) {
      message.error(error.message || "Falha ao salvar.");
    } finally {
      setIsEditLoading(false);
    }
  };

  const ownerUsername = ownerInfo.username;
  const ownerUserId = ownerInfo.userId;
  const ownerDisplayFallback =
    estabelecimento?.nomeResponsavel ||
    (estabelecimento as any)?.nome_responsavel ||
    estabelecimento?.emailEstabelecimento ||
    null;

  const ownerDisplay = ownerUsername
    ? ownerUsername.includes(" ") || ownerUsername.includes("@")
      ? ownerUsername
      : `@${ownerUsername}`
    : ownerDisplayFallback ||
      (ownerUserId !== null && ownerUserId !== undefined
        ? `Usuario #${ownerUserId}`
        : "@usuario nao informado");

  return (
    <Modal
      title={
        mode === "edit-and-approve"
          ? "Editar e Aprovar Estabelecimento"
          : "Editar Estabelecimento"
      }
      open={visible}
      onCancel={() => onClose(false)}
      width={900}
      destroyOnClose={true}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={isEditLoading}
          onClick={() => editForm.submit()}
        >
          {mode === "edit-and-approve" ? "Salvar e Aprovar" : "Salvar Edições"}
        </Button>,
      ]}
    >
      <Form
        form={editForm}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Spin spinning={isEditLoading}>
          {outrasAlteracoes && (
            <Alert
              message="Solicitação de 'Outras Alterações' do Usuário"
              description={
                <Typography.Paragraph pre-wrap>
                  {outrasAlteracoes}
                </Typography.Paragraph>
              }
              type="info"
              showIcon
              className="mb-4"
            />
          )}

          <Title level={5} className="mt-4">
            Informações Principais
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nomeFantasia"
                label="Nome Fantasia"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoria"
                label="Categoria Principal"
                rules={[{ required: true }]}
              >
                <Select placeholder="Selecione a categoria principal">
                  {categorias.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cnpj" label="CNPJ" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cnae" label="CNAE" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nomeResponsavel"
                label="Nome do Responsável"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
              <div style={{ marginTop: "-12px", marginBottom: "12px" }}>
                <Text type="secondary" style={{ display: "block" }}>
                  {isOwnerLoading
                    ? "Carregando usuario..."
                    : ownerDisplay}
                </Text>
                <Text type="secondary" style={{ display: "block" }}>
                  ID do usuario: {isOwnerLoading ? "..." : ownerUserId ?? "nao informado"}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                name="cpfResponsavel"
                label="CPF do Responsável"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5} className="mt-4">
            Contato e Links
          </Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="emailEstabelecimento"
                label="Email de Contato"
                rules={[{ required: true, type: "email" }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contatoEstabelecimento"
                label="Telefone / WhatsApp"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="website"
                label="Website"
                rules={[{ type: "url" }]}
              >
                <Input placeholder="http://..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="instagram"
                label="Instagram"
                rules={[{ type: "url" }]}
              >
                <Input placeholder="http://instagram.com/..." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="endereco" label="Endereço">
            <Input />
          </Form.Item>

          <Title level={5} className="mt-4">
            Detalhes
          </Title>
          <Form.Item
            name="descricaoDiferencial"
            label="Diferencial (Descrição Curta)"
            rules={[{ required: true }]}
          >
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="descricao"
            label="Descrição Completa"
            rules={[{ required: true }]}
            className="quill-editor-container"
          >
            <ReactQuill
              theme="snow"
              modules={quillModules}
              placeholder="Descreva o estabelecimento em detalhes, você pode usar negrito, itálico..."
              style={{ minHeight: "10px" }}
            />
          </Form.Item>

          <Form.Item name="areasAtuacao" label="Áreas de Atuação">
            <Select mode="multiple" placeholder="Selecione as áreas">
              {areasAtuacao.map((area) => (
                <Option key={area} value={area}>
                  {area}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="tagsInvisiveis" label="Tags de Busca">
            <Select mode="multiple" placeholder="Selecione as tags de busca">
              {allTags.map((tag) => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="venda" label="Canais de Venda">
            <Select
              mode="multiple"
              placeholder="Selecione os canais de venda"
              allowClear
            >
              {canaisDeVendaOpcoes.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="escala"
            label="Nota de Impacto (0-10)"
            help="Nota que o usuário deu sobre o impacto da plataforma."
          >
            <Rate count={10} />
          </Form.Item>

          <Title level={5} className="mt-4">
            Gerenciamento de Imagens e Documentos
          </Title>
          <Row gutter={16}>
            {/* LOGO */}
            <Col xs={24} md={8}>
              <Title level={5} style={{ fontSize: "16px" }}>
                Logo
              </Title>
              <div style={{ position: "relative", width: "fit-content" }}>
                <AntdImage
                  src={getFullImageUrl(currentLogo)}
                  alt="Logo do Estabelecimento"
                  style={{
                    width: 150,
                    height: 150,
                    objectFit: "cover",
                    border: "1px solid #d9d9d9",
                    borderRadius: "8px",
                    opacity: logoToDelete ? 0.5 : 1,
                  }}
                  fallback="/logo_mei_redonda.png"
                />
                {currentLogo && (
                  <Popconfirm
                    title="Remover esta logo?"
                    okText="Remover"
                    cancelText="Cancelar"
                    okType="danger"
                    placement="topRight"
                    icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                    onConfirm={() => {
                      setLogoToDelete(true);
                      setCurrentLogo(null);
                      message.info("Logo marcada para remoção.");
                    }}
                  >
                    <Button
                      type="primary"
                      danger
                      icon={<CloseOutlined />}
                      style={{ position: "absolute", top: 5, right: 5 }}
                      size="small"
                      title="Remover Logo"
                    />
                  </Popconfirm>
                )}
              </div>
              {logoToDelete && (
                <Tag color="red" style={{ marginTop: 10, width: "100%" }}>
                  Logo será removida ao salvar.
                </Tag>
              )}
            </Col>

            {/* CCMEI */}
            <Col xs={24} md={8}>
              <Title level={5} style={{ fontSize: "16px" }}>
                CCMEI
              </Title>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  alignItems: "flex-start",
                }}
              >
                {currentCcmei ? (
                  <div
                    style={{
                      position: "relative",
                      border: "1px solid #d9d9d9",
                      borderRadius: "8px",
                      padding: "10px",
                      opacity: ccmeiToDelete ? 0.5 : 1,
                      width: "150px",
                      height: "150px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    {currentCcmei.startsWith("blob:") ? (
                      <AntdImage
                        src={currentCcmei}
                        alt="CCMEI"
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <>
                        <FilePdfOutlined
                          style={{ fontSize: "40px", color: "red" }}
                        />
                        <Text style={{ fontSize: "12px", marginTop: "5px" }}>
                          CCMEI
                        </Text>
                        {estabelecimento && (
                          <CcmeiViewer
                            estabelecimentoId={estabelecimento.estabelecimentoId}
                            pendente={
                              currentCcmei ===
                              estabelecimento.dados_atualizacao?.ccmei
                            }
                          />
                        )}
                      </>
                    )}

                    <Popconfirm
                      title="Remover este CCMEI?"
                      okText="Remover"
                      cancelText="Cancelar"
                      okType="danger"
                      placement="topRight"
                      onConfirm={() => {
                        setCcmeiToDelete(true);
                        setCurrentCcmei(null);
                        setNewCcmeiFile(null);
                        message.info("CCMEI marcado para remoção.");
                      }}
                    >
                      <Button
                        type="primary"
                        danger
                        icon={<CloseOutlined />}
                        style={{ position: "absolute", top: 5, right: 5 }}
                        size="small"
                      />
                    </Popconfirm>
                  </div>
                ) : (
                  <div
                    style={{
                      width: "150px",
                      height: "150px",
                      border: "1px dashed #d9d9d9",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#aaa",
                    }}
                  >
                    Sem CCMEI
                  </div>
                )}

                {ccmeiToDelete && (
                  <Tag color="red" style={{ width: "100%" }}>
                    CCMEI será removido.
                  </Tag>
                )}

                <Upload
                  beforeUpload={(file) => {
                    setNewCcmeiFile(file);
                    // Reseta status de exclusão caso usuário faça upload de um novo
                    setCcmeiToDelete(false);
                    // Simula visualização temporária se for imagem
                    if (file.type.startsWith("image/")) {
                      setCurrentCcmei(URL.createObjectURL(file));
                    } else {
                      // Se for PDF ou outro, apenas mostramos que foi selecionado
                      message.success(`Arquivo ${file.name} selecionado.`);
                    }
                    return false; // Impede upload automático do antd
                  }}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button icon={<UploadOutlined />}>
                    {currentCcmei ? "Substituir CCMEI" : "Adicionar CCMEI"}
                  </Button>
                </Upload>
                {newCcmeiFile && (
                  <Text type="success" style={{ fontSize: "12px" }}>
                    Novo arquivo: {newCcmeiFile.name}
                  </Text>
                )}
              </div>
            </Col>

            {/* PORTFOLIO */}
            <Col xs={24} md={8}>
              <Title level={5} style={{ fontSize: "16px" }}>
                Imagens do Portfólio
              </Title>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {currentPortfolio.length > 0 ? (
                  currentPortfolio.map((img: ImagemProduto) => (
                    <div
                      key={img.url}
                      style={{ position: "relative", width: "fit-content" }}
                    >
                      <AntdImage
                        src={getFullImageUrl(img.url)}
                        alt="Imagem do Portfólio"
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: "cover",
                          border: "1px solid #d9d9d9",
                          borderRadius: "8px",
                        }}
                        fallback="/placeholder-logo.png"
                      />
                      <Popconfirm
                        title="Tem certeza que quer remover esta imagem?"
                        okText="Remover"
                        cancelText="Cancelar"
                        okType="danger"
                        placement="topRight"
                        icon={
                          <QuestionCircleOutlined style={{ color: "red" }} />
                        }
                        onConfirm={() => {
                          setPortfolioToDelete((prev) => [...prev, img.url]);
                          setCurrentPortfolio((prev) =>
                            prev.filter((i) => i.url !== img.url),
                          );
                          message.info("Imagem marcada para remoção.");
                        }}
                      >
                        <Button
                          type="primary"
                          danger
                          icon={<CloseOutlined />}
                          style={{ position: "absolute", top: 5, right: 5 }}
                          size="small"
                          title="Remover Imagem"
                        />
                      </Popconfirm>
                    </div>
                  ))
                ) : (
                  <p>Nenhuma imagem no portfólio.</p>
                )}
                {portfolioToDelete.length > 0 && (
                  <Tag color="red" style={{ marginTop: 10, width: "100%" }}>
                    {portfolioToDelete.length} imagem(ns) serão removidas.
                  </Tag>
                )}
              </div>
            </Col>
          </Row>
        </Spin>
      </Form>
    </Modal>
  );
};

export default AdminEstabelecimentoModal;
