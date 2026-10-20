"use client";

import PageHeader from "@/components/admin/PageHeader";
import { validarArquivo } from "@/lib/arquivos";
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Upload,
  List,
  message,
  Typography,
  Spin,
  Empty,
  Popconfirm,
  Tag,
  Tooltip,
  Divider,
  Switch,
} from "antd";
import {
  UploadOutlined,
  DeleteOutlined,
  SaveOutlined,
  EditOutlined,
  CloseOutlined,
  SearchOutlined,
  PlusOutlined,
  PictureOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { erroDaResposta, fetchSeguro, mensagemDeErro } from "@/lib/errors";
import { uploadImage } from "@/lib/api";
import { encerrarSessaoAdmin, getAdminToken } from "@/lib/session";

const { Text } = Typography;

// Interface adaptada para Cursos
interface CursoCard {
  id: number;
  cursoId?: number;
  nome: string;
  descricao: string | null;
  link: string | null;
  imagemUrl: string | null;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const AdminCursos = () => {
  const [cards, setCards] = useState<CursoCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados de Filtro e Paginação
  const [searchText, setSearchText] = useState("");

  // Estado para Edição
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCurso, setEditingCurso] = useState<CursoCard | null>(null);

  // Form States
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [link, setLink] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);

  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // --- CORREÇÃO DO ERRO DE URL ---
  const getFullImageUrl = (path: string | undefined | null) => {
    if (!path || path.trim() === "") return "/placeholder-logo.png";

    if (
      path.startsWith("http") ||
      path.startsWith("https") ||
      path.startsWith("data:")
    ) {
      return path;
    }

    const baseUrl = API_URL || "";

    if (baseUrl) {
      const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return `${cleanBase}${cleanPath}`;
    }

    return path.startsWith("/") ? path : `/${path}`;
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      // Verifica se API_URL está definida para evitar erro no fetch
      const url = API_URL ? `${API_URL}/api/cursos` : "/api/cursos";
      const res = await fetchSeguro(url);

      if (!res.ok) throw await erroDaResposta(res, "Erro ao buscar dados.");
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(mensagemDeErro(error, "Erro ao carregar cursos."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      router.push("/admin/login");
      return;
    }

    fetchCards();
  }, [router]);

  // Prepara o formulário para edição
  const handleEdit = (item: CursoCard) => {
    setEditingId(item.id);
    setEditingCurso(item);
    setNome(item.nome || "");
    setDescricao(item.descricao || "");
    setLink(item.link || "");
    setImagemUrl(item.imagemUrl || "");
    setFileList([]);
    setPreviewImage(getFullImageUrl(item.imagemUrl));
    setAtivo(Boolean(item.ativo));

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingCurso(null);
    setNome("");
    setDescricao("");
    setLink("");
    setImagemUrl("");
    setFileList([]);
    setPreviewImage(null);
    setAtivo(true);
  };

  const handleFileChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj as File;
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage((e.target?.result as string) || null);
      reader.readAsDataURL(file);
      return;
    }

    if (editingCurso?.imagemUrl) {
      setPreviewImage(getFullImageUrl(editingCurso.imagemUrl));
      return;
    }

    setPreviewImage(null);
  };

  const normalizeOptionalField = (value: string) => {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      return message.warning("O campo nome é obrigatório.");
    }

    const token = getAdminToken();
    if (!token) {
      message.error("Você precisa estar logado.");
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = API_URL || "";
      let url = `${baseUrl}/api/cursos`;
      let method = "POST";
      let uploadedImagemUrl = imagemUrl || "";

      const selectedFile = fileList[0]?.originFileObj as File | undefined;
      if (selectedFile) {
        const uploadResult = await uploadImage(selectedFile, token);
        const possibleUrl =
          uploadResult?.imagemUrl ||
          uploadResult?.url ||
          uploadResult?.path ||
          uploadResult?.fileUrl ||
          uploadResult?.location;

        if (!possibleUrl || typeof possibleUrl !== "string") {
          throw new Error("Falha ao processar upload da imagem.");
        }

        uploadedImagemUrl = possibleUrl;
      }

      let body: Record<string, any> = {
        nome: nome.trim(),
        descricao: normalizeOptionalField(descricao),
        link: normalizeOptionalField(link),
        imagemUrl: normalizeOptionalField(uploadedImagemUrl),
        ativo,
      };

      if (editingId) {
        url = `${baseUrl}/api/cursos/${editingId}`;
        method = "PUT";

        const updateBody: Record<string, any> = {};
        if (!editingCurso || nome.trim() !== (editingCurso.nome || "")) {
          updateBody.nome = nome.trim();
        }
        if (
          !editingCurso ||
          normalizeOptionalField(descricao) !== editingCurso.descricao
        ) {
          updateBody.descricao = normalizeOptionalField(descricao);
        }
        if (!editingCurso || normalizeOptionalField(link) !== editingCurso.link) {
          updateBody.link = normalizeOptionalField(link);
        }
        if (
          !editingCurso ||
          normalizeOptionalField(uploadedImagemUrl) !== editingCurso.imagemUrl
        ) {
          updateBody.imagemUrl = normalizeOptionalField(uploadedImagemUrl);
        }
        if (!editingCurso || Boolean(ativo) !== Boolean(editingCurso.ativo)) {
          updateBody.ativo = Boolean(ativo);
        }

        if (Object.keys(updateBody).length === 0) {
          message.warning("Nenhum campo foi alterado.");
          setSubmitting(false);
          return;
        }

        body = updateBody;
      }

      const res = await fetchSeguro(url, {
        method: method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401 || res.status === 403) {
        void encerrarSessaoAdmin();
        message.error("Sua sessão expirou. Faça login novamente.");
        router.push("/admin/login");
        return;
      }

      if (!res.ok) throw await erroDaResposta(res, "Erro ao salvar.");

      message.success(
        editingId ? "Curso atualizado com sucesso!" : "Novo Curso criado!",
      );
      cancelEdit();
      fetchCards();
    } catch (error: any) {
      message.error(mensagemDeErro(error, "Erro ao salvar."));
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar usando ID
  const handleDelete = async (id: number) => {
    const token = getAdminToken();
    if (!token) {
      message.error("Você precisa estar logado.");
      return;
    }

    try {
      const baseUrl = API_URL || "";
      const res = await fetchSeguro(`${baseUrl}/api/cursos/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw await erroDaResposta(res, "Erro ao deletar.");

      message.success("Curso removido.");
      fetchCards();
    } catch (error: any) {
      message.error(mensagemDeErro(error, "Erro ao excluir curso."));
    }
  };

  // Filtragem local para a busca
  const filteredCards = cards.filter((card) =>
    card.nome?.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        titulo="Cursos e capacitações"
        descricao="Cadastre os cursos do Espaço MEI e acompanhe o interesse de cada um."
      />

      <div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <Card
              title={
                <div className="flex items-center gap-2">
                  {editingId ? (
                    <EditOutlined className="text-blue-500" />
                  ) : (
                    <PlusOutlined className="text-[#017DB9]" />
                  )}
                  <span>{editingId ? `Editar Curso` : "Novo Curso"}</span>
                </div>
              }
              className={`shadow-md border-t-4 sticky top-24 ${
                editingId ? "border-t-blue-500" : "border-t-[#017DB9]"
              }`}
              extra={
                editingId && (
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={cancelEdit}
                  >
                    Cancelar
                  </Button>
                )
              }
            >
              <div className="flex flex-col gap-5">
                {/* Preview da Imagem */}
                <div className="overflow-hidden rounded-lg border border-gray-200 group-hover:shadow-xl transition-shadow duration-300 relative aspect-[4/3]">
                  {previewImage || imagemUrl ? (
                    <Image
                      src={previewImage || getFullImageUrl(imagemUrl)}
                      alt="Preview"
                      fill
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <PictureOutlined style={{ fontSize: 32 }} />
                      <p className="text-xs mt-2">Nenhuma imagem</p>
                    </div>
                  )}
                </div>

                <div>
                  <Text strong className="mb-1 block text-gray-700">
                    Nome do Curso
                  </Text>
                  <Input
                    placeholder="Ex: Como Formalizar seu Negócio"
                    size="large"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    prefix={<span className="text-gray-400 font-bold">N</span>}
                  />
                </div>

                <div>
                  <Text strong className="mb-1 block text-gray-700">
                    Descrição (Opcional)
                  </Text>
                  <Input.TextArea
                    placeholder="Resumo do curso"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 5 }}
                  />
                </div>

                <div>
                  <Text strong className="mb-1 block text-gray-700">
                    Link (Opcional)
                  </Text>
                  <Input
                    placeholder="https://sebrae.com.br/..."
                    size="large"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    prefix={<LinkOutlined className="text-gray-400" />}
                  />
                </div>

                <div>
                  <Text strong className="mb-1 block text-gray-700">
                    Arquivo da Imagem (Opcional)
                  </Text>
                  <Upload
                    listType="picture"
                    maxCount={1}
                    fileList={fileList}
                    onChange={handleFileChange}
                    beforeUpload={(file) => {
                      const erro = validarArquivo(file);
                      if (erro) {
                        message.error(erro);
                        return Upload.LIST_IGNORE;
                      }
                      return false;
                    }}
                    className="w-full"
                    accept="image/png,image/jpeg,image/webp"
                  >
                    <Button icon={<UploadOutlined />} block size="large">
                      Selecionar Arquivo
                    </Button>
                  </Upload>
                </div>

                <div className="flex items-center justify-between">
                  <Text strong className="text-gray-700">
                    Curso ativo
                  </Text>
                  <Switch checked={ativo} onChange={setAtivo} />
                </div>

                <Divider className="my-2" />

                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                  block
                  size="large"
                  className={`font-semibold h-12 shadow-lg transition-all ${
                    editingId
                      ? "bg-blue-600 hover:bg-blue-500 hover:scale-[1.02]"
                      : "bg-[#017DB9] hover:bg-[#016595] hover:scale-[1.02]"
                  }`}
                >
                  {editingId ? "Salvar Alterações" : "Cadastrar Curso"}
                </Button>
              </div>
            </Card>
          </div>

          {/* --- COLUNA DIREITA: LISTA (lg:col-span-8) --- */}
          <div className="lg:col-span-8">
            <Card
              className="shadow-sm border-gray-200"
              title={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                  <span className="text-lg">
                    Cursos Cadastrados ({filteredCards.length})
                  </span>
                  <Input
                    placeholder="Buscar por nome..."
                    prefix={<SearchOutlined className="text-gray-400" />}
                    className="w-full sm:w-64"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </div>
              }
            >
              {loading ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg">
                  <Spin size="large" />
                  <p className="mt-4 text-gray-500">Carregando dados...</p>
                </div>
              ) : filteredCards.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhum curso encontrado"
                  className="py-10"
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={filteredCards}
                  pagination={{
                    onChange: (page) => {
                      console.log(page);
                    },
                    pageSize: 5,
                    align: "center",
                    position: "bottom",
                    showSizeChanger: false,
                    className: "mt-6",
                  }}
                  renderItem={(item) => (
                    <List.Item
                      className={`hover:bg-gray-50 transition-colors px-4 rounded-lg mb-2 border border-transparent hover:border-gray-200 ${
                        editingId === item.id
                          ? "bg-blue-50 border-blue-200"
                          : ""
                      }`}
                      actions={[
                        <Tooltip title="Editar informações" key="edit-tooltip">
                          <Button
                            key="edit"
                            type="text"
                            shape="circle"
                            icon={<EditOutlined />}
                            className="text-blue-600 hover:bg-blue-100"
                            onClick={() => handleEdit(item)}
                          />
                        </Tooltip>,
                        <Tooltip
                          title="Excluir permanentemente"
                          key="delete-tooltip"
                        >
                          <Popconfirm
                            title="Excluir Curso"
                            description={
                              <div className="max-w-xs">
                                Tem certeza que deseja excluir{" "}
                                <b>{item.nome}</b>?
                                <br />
                                Esta ação não pode ser desfeita.
                              </div>
                            }
                            onConfirm={() => handleDelete(item.id)}
                            okText="Sim, Excluir"
                            cancelText="Cancelar"
                            okButtonProps={{ danger: true }}
                            key="delete"
                          >
                            <Button
                              type="text"
                              shape="circle"
                              danger
                              icon={<DeleteOutlined />}
                              className="hover:bg-red-50"
                            />
                          </Popconfirm>
                        </Tooltip>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="relative w-24 h-16 rounded-md overflow-hidden border border-gray-200 shadow-sm group">
                            <Image
                              src={getFullImageUrl(item.imagemUrl)}
                              alt={item.nome}
                              fill
                              className="object-cover transition-transform group-hover:scale-110"
                            />
                          </div>
                        }
                        title={
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800 text-lg">
                              {item.nome}
                            </span>
                            {editingId === item.id && (
                              <Tag color="processing" icon={<EditOutlined />}>
                                Editando agora
                              </Tag>
                            )}
                            {item.ativo ? (
                              <Tag color="success">Ativo</Tag>
                            ) : (
                              <Tag color="default">Inativo</Tag>
                            )}
                          </div>
                        }
                        description={
                          <div className="flex flex-col gap-1">
                            {item.descricao && (
                              <Text type="secondary" className="text-sm">
                                {item.descricao}
                              </Text>
                            )}
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-500 hover:text-[#017DB9] hover:underline truncate max-w-md flex items-center gap-1 text-sm"
                              >
                                {item.link}
                              </a>
                            ) : (
                              <Text type="secondary" className="text-xs">
                                Sem link
                              </Text>
                            )}
                            <Text type="secondary" className="text-xs">
                              ID: {item.id}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCursos;
