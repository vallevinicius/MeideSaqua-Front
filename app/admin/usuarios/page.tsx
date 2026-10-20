"use client";

import PageHeader from "@/components/admin/PageHeader";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Tabs,
  Input,
  Popconfirm,
  Typography,
  message,
  Spin,
  Pagination,
  Modal,
  Form,
  Switch,
  Tag,
  Empty,
  Tooltip,
  Space,
  Divider,
} from "antd";
import { useRouter } from "next/navigation";
import {
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  MailOutlined,
  IdcardOutlined,
  KeyOutlined,
  SendOutlined,
  LockOutlined,
  FilterOutlined,
  DownloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import {
  getAllUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminChangeUserPassword,
  adminResendConfirmation,
} from "@/lib/api";
import { AdminUserInteractionsModal } from "@/components/admin/AdminUserInteractionsModal";
import { getAdminToken } from "@/lib/session";

const { Text } = Typography;
const { Search } = Input;
const PAGE_SIZE = 8;

interface User {
  usuarioId: number;
  nomeCompleto: string;
  username: string;
  email: string;
  enabled: boolean;
  estabelecimentos?: any[]; // <-- Adicionado para ler os MEIs do usuário
}

const AdminUsuariosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  const [interactionsVisible, setInteractionsVisible] = useState(false);
  const [selectedUserForInteractions, setSelectedUserForInteractions] =
    useState<User | null>(null);

  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = getAdminToken();
    if (!token) {
      message.error("Acesso negado.");
      router.push("/admin/login");
      return;
    }

    try {
      const data = await getAllUsers(token);
      const sortedData = Array.isArray(data)
        ? data.sort((a: User, b: User) => a.usuarioId - b.usuarioId)
        : [];
      setUsers(sortedData);
      setFilteredUsers(sortedData);
    } catch (error: any) {
      message.error(error.message || "Erro ao buscar usuários.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    const lower = value.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.nomeCompleto.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.username.toLowerCase().includes(lower),
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      nomeCompleto: user.nomeCompleto,
      email: user.email,
      username: user.username,
      enabled: user.enabled,
    });
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const token = getAdminToken();
      if (!token || !editingUser) return;

      setEditLoading(true);
      await adminUpdateUser(editingUser.usuarioId, values, token);
      message.success("Perfil atualizado com sucesso!");
      setIsEditModalVisible(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      message.error(error.message || "Falha ao atualizar usuário.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setPasswordUser(user);
    passwordForm.resetFields();
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSubmit = async () => {
    try {
      const values = await passwordForm.validateFields();
      const token = getAdminToken();
      if (!token || !passwordUser) return;

      setPasswordLoading(true);
      await adminChangeUserPassword(
        passwordUser.usuarioId,
        values.newPassword,
        token,
      );
      message.success("Senha alterada com sucesso!");
      setIsPasswordModalVisible(false);
      setPasswordUser(null);
    } catch (error: any) {
      message.error(error.message || "Falha ao alterar senha.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendEmail = async (user: User) => {
    const token = getAdminToken();
    if (!token) return;
    const hide = message.loading("Enviando email...", 0);
    try {
      await adminResendConfirmation(user.usuarioId, token);
      hide();
      message.success(`Email de confirmação enviado para ${user.email}`);
    } catch (error: any) {
      hide();
      message.error(error.message || "Falha ao enviar email.");
    }
  };

  const handleDelete = async (id: number) => {
    const token = getAdminToken();
    if (!token) return;
    try {
      await adminDeleteUser(id, token);
      message.success("Usuário excluído.");
      const newUsers = users.filter((u) => u.usuarioId !== id);
      setUsers(newUsers);
      setFilteredUsers(filteredUsers.filter((u) => u.usuarioId !== id));
    } catch (error: any) {
      message.error(error.message || "Falha ao excluir usuário.");
    }
  };
  const handleExportCSV = () => {
    const headers = ["ID", "Nome Completo", "Email", "Status"];

    const rows = users.map((user) => [
      user.usuarioId,
      `"${user.nomeCompleto}"`,
      user.email,
      user.enabled ? "Ativo" : "Inativo",
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "usuarios_meidesaqua.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success("Arquivo CSV exportado com sucesso!");
  };

  const renderUserList = (list: User[]) => {
    if (list.length === 0)
      return (
        <div className="py-20">
          <Empty description="Nenhum usuário encontrado." />
        </div>
      );

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const currentList = list.slice(startIndex, startIndex + PAGE_SIZE);

    return (
      <div className="animate-in fade-in duration-500">
        <Row gutter={[24, 24]}>
          {currentList.map((user) => (
            <Col xs={24} xl={12} key={user.usuarioId}>
              <Card
                variant="borderless"
                className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden border border-gray-100"
                bodyStyle={{ padding: "20px" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <Avatar
                      size={64}
                      icon={<UserOutlined />}
                      className={`shadow-inner ${user.enabled ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}
                      style={{ border: "2px solid #fff" }}
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <Text strong className="text-lg leading-none m-0">
                          {user.nomeCompleto}
                        </Text>
                        <Tag
                          bordered={false}
                          className="rounded-full px-3 text-[10px] font-bold tracking-wider m-0"
                          color={user.enabled ? "success" : "error"}
                        >
                          {user.enabled ? "ATIVO" : "INATIVO"}
                        </Tag>
                        {/* NOVO SELO INDICANDO SE É DONO DE UM MEI */}
                        {user.estabelecimentos &&
                          user.estabelecimentos.length > 0 && (
                            <Tag
                              color="blue"
                              className="rounded-full px-2 text-[10px] m-0 border-none"
                            >
                              💼 É MEI
                            </Tag>
                          )}
                      </div>
                      <Text type="secondary" className="text-xs mb-2">
                        @{user.username} • ID: {user.usuarioId}
                      </Text>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-500">
                          <MailOutlined className="text-xs" />
                          <Text className="text-sm italic">{user.email}</Text>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Tooltip title="Editar">
                      <Button
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingUser(user);
                          editForm.setFieldsValue(user);
                          setIsEditModalVisible(true);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title="Interações (MEI e Avaliações)">
                      <Button
                        shape="circle"
                        icon={<HistoryOutlined />}
                        onClick={() => {
                          setSelectedUserForInteractions(user);
                          setInteractionsVisible(true);
                        }}
                        className="hover:text-purple-600 hover:border-purple-600"
                      />
                    </Tooltip>
                    <Tooltip title="Segurança">
                      <Button
                        shape="circle"
                        icon={<KeyOutlined />}
                        onClick={() => {
                          setPasswordUser(user);
                          passwordForm.resetFields();
                          setIsPasswordModalVisible(true);
                        }}
                      />
                    </Tooltip>
                  </div>
                </div>

                <Divider className="my-4" />

                <div className="flex justify-between items-center bg-gray-50 -mx-5 -mb-5 px-5 py-3">
                  <Button
                    type="link"
                    size="small"
                    icon={<SendOutlined />}
                    disabled={user.enabled}
                    onClick={() => {}}
                  >
                    Reenviar Email
                  </Button>
                  <Popconfirm
                    title="Excluir Usuário"
                    onConfirm={() => {}}
                    okText="Sim, excluir"
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    >
                      Remover
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="mt-10 flex justify-center">
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={list.length}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            className="bg-white p-2 rounded-lg shadow-sm border border-gray-100"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <PageHeader
          titulo="Usuários"
          descricao={`${users.length} contas no portal. Gerencie dados, senhas e acesso de cada pessoa.`}
        />

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <Search
            placeholder="Buscar por nome, email ou username..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            size="large"
            allowClear
            className="max-w-2xl custom-search"
            style={{ borderRadius: "12px" }}
          />
          <div className="flex-1" />
          <Space>
            <Tag
              color="blue"
              className="m-0 px-3 py-1 rounded-md border-none font-medium"
            >
              <FilterOutlined className="mr-2" />
              {filteredUsers.length} resultados
            </Tag>

            {/* NOVO BOTÃO DE EXPORTAÇÃO AQUI */}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportCSV}
            >
              Exportar CSV
            </Button>
          </Space>
        </div>

        <Spin spinning={loading} tip="Carregando base de usuários...">
          <Tabs
            defaultActiveKey="todos"
            onChange={() => setCurrentPage(1)}
            className="custom-tabs"
            items={[
              {
                key: "todos",
                label: `Todos`,
                children: renderUserList(filteredUsers),
              },
              {
                key: "ativos",
                label: `Ativos`,
                children: renderUserList(
                  filteredUsers.filter((u) => u.enabled),
                ),
              },
              {
                key: "bloqueados",
                label: `Inativos`,
                children: renderUserList(
                  filteredUsers.filter((u) => !u.enabled),
                ),
              },
            ]}
          />
        </Spin>
      </div>

      {/* Modais com Estilo Melhorado */}
      <Modal
        title={<div className="pb-4 border-b">Editar Perfil do Usuário</div>}
        open={isEditModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setIsEditModalVisible(false)}
        confirmLoading={editLoading}
        okText="Salvar Alterações"
        cancelText="Descartar"
        centered
        className="modern-modal"
      >
        <Form form={editForm} layout="vertical" className="mt-6">
          <Form.Item
            name="nomeCompleto"
            label="Nome Completo"
            rules={[{ required: true }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true }]}
              >
                <Input
                  prefix={<IdcardOutlined className="text-gray-400" />}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="Status da Conta"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Ativo"
                  unCheckedChildren="Inativo"
                  className="bg-gray-300"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="email"
            label="Email Corporativo"
            rules={[{ required: true, type: "email" }]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <LockOutlined className="text-yellow-600" />
            </div>
            <Text strong className="text-lg">
              Redefinir Senha: {passwordUser?.username}
            </Text>
          </Space>
        }
        open={isPasswordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => setIsPasswordModalVisible(false)}
        confirmLoading={passwordLoading}
        okText="Atualizar Senha"
        okButtonProps={{ danger: true, size: "large" }}
        cancelButtonProps={{ size: "large" }}
        centered
      >
        <div className="my-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
          <Text className="text-amber-800 text-sm">
            <strong>Importante:</strong> Ao confirmar, o usuário perderá o
            acesso com a senha antiga imediatamente.
          </Text>
        </div>

        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="Nova Senha"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password
              prefix={<KeyOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirmar Senha"
            dependencies={["newPassword"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value)
                    return Promise.resolve();
                  return Promise.reject(new Error("As senhas não coincidem"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<KeyOutlined className="text-gray-400" />}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>

      <AdminUserInteractionsModal
        visible={interactionsVisible}
        user={selectedUserForInteractions}
        onClose={() => setInteractionsVisible(false)}
      />

      <style jsx global>{`
        .custom-tabs .ant-tabs-nav::before {
          border-bottom: 2px solid #e2e8f0;
        }
        .custom-tabs .ant-tabs-tab {
          font-weight: 500;
          padding: 12px 8px;
        }
        .custom-search .ant-input-affix-wrapper {
          border-radius: 12px;
          padding: 8px 16px;
          border-color: #e2e8f0;
        }
        .custom-search .ant-input-search-button {
          border-radius: 0 12px 12px 0 !important;
        }
      `}</style>
    </div>
  );
};

export default AdminUsuariosPage;
