"use client";

import React, { useEffect, useState } from "react";
import {
  Modal,
  Spin,
  Tabs,
  Empty,
  Card,
  Tag,
  Typography,
  Rate,
  Divider,
} from "antd";
import {
  ShopOutlined,
  CommentOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { adminGetUserInteractions } from "@/lib/api";
import { getAdminToken } from "@/lib/session";

const { Text, Title, Paragraph } = Typography;

interface AdminUserInteractionsModalProps {
  visible: boolean;
  user: any;
  onClose: () => void;
}

export const AdminUserInteractionsModal: React.FC<
  AdminUserInteractionsModalProps
> = ({ visible, user, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [interacoes, setInteracoes] = useState<{
    estabelecimentos: any[];
    avaliacoes: any[];
  }>({
    estabelecimentos: [],
    avaliacoes: [],
  });

  useEffect(() => {
    if (visible && user) {
      fetchInteractions();
    } else {
      setInteracoes({ estabelecimentos: [], avaliacoes: [] }); // Limpa ao fechar
    }
  }, [visible, user]);

  const fetchInteractions = async () => {
    setLoading(true);
    const token = getAdminToken();
    if (!token) return;

    try {
      const data = await adminGetUserInteractions(user.usuarioId, token);

      // O backend agora retorna data.estabelecimentos e data.avaliacoes
      setInteracoes({
        estabelecimentos: data.estabelecimentos || [],
        avaliacoes: data.avaliacoes || [],
      });
    } catch (error: any) {
      console.error("Erro ao buscar interações:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ativo":
        return "success";
      case "pendente":
        return "warning";
      case "inativo":
        return "error";
      default:
        return "default";
    }
  };

  const renderEstabelecimentos = () => {
    if (interacoes.estabelecimentos.length === 0) {
      return (
        <Empty
          description="Este usuário não é dono de nenhum MEI."
          className="py-10"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {interacoes.estabelecimentos.map((mei: any) => (
          <Card
            key={mei.id}
            size="small"
            className="border-l-4 border-l-blue-500 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <Title level={5} className="m-0 mb-1">
                  {mei.nome}
                </Title>
                <Text type="secondary" className="block text-xs mb-1">
                  CNPJ: {mei.cnpj || "Não informado"}
                </Text>
                <Text type="secondary" className="block text-xs">
                  Categoria: {mei.categoria}
                </Text>
              </div>
              <Tag color={getStatusColor(mei.status)}>
                {mei.status.toUpperCase()}
              </Tag>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderAvaliacoes = () => {
    if (interacoes.avaliacoes.length === 0) {
      return (
        <Empty
          description="Este usuário não fez nenhuma interação."
          className="py-10"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {interacoes.avaliacoes.map((av: any) => (
          <Card
            key={av.id}
            size="small"
            className="bg-white border-gray-200 shadow-sm"
          >
            {/* Cabeçalho: Qual MEI e Data */}
            <div className="flex justify-between mb-3 border-b pb-2">
              <Text
                strong
                className="text-sm text-blue-800 flex items-center gap-2"
              >
                <ShopOutlined />
                {av.estabelecimento}
              </Text>
              <Text type="secondary" className="text-xs">
                {av.data}
              </Text>
            </div>

            {/* Bloco do Comentário "Pai" (Só aparece se for uma resposta) */}
            {av.isReply && av.parentTexto && (
              <div className="bg-gray-50 p-3 rounded-md border-l-4 border-gray-300 mb-3 ml-2 relative">
                <Text
                  type="secondary"
                  className="text-[11px] font-bold block mb-1 uppercase tracking-wider"
                >
                  Em resposta a: {av.parentAutor}
                </Text>
                <Paragraph className="text-gray-600 italic m-0 text-sm line-clamp-2">
                  "{av.parentTexto}"
                </Paragraph>
              </div>
            )}

            {/* Bloco da Ação do Usuário (A Avaliação ou a Resposta dele) */}
            <div
              className={`relative ${av.isReply ? "ml-8 pl-3 border-l-2 border-blue-200" : "mt-2"}`}
            >
              {/* Ícone de setinha indicando que é resposta */}
              {av.isReply && (
                <RightOutlined className="text-blue-400 absolute -left-5 top-0 text-lg" />
              )}

              {/* Só mostra as estrelas se NÃO for uma resposta */}
              {!av.isReply && av.nota && (
                <Rate
                  disabled
                  defaultValue={av.nota}
                  className="text-sm mb-2 block text-yellow-500"
                />
              )}

              {/* O texto que o usuário digitou */}
              {av.texto && (
                <Paragraph className="text-gray-800 m-0 font-medium">
                  {av.texto}
                </Paragraph>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };
  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-bold text-lg">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-lg font-bold">
              Interações: {user?.username}
            </div>
            <div className="text-xs text-gray-500 font-normal">
              Analisando o histórico na plataforma
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      className="modern-modal"
    >
      <Divider className="my-4" />
      <Spin spinning={loading}>
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: (
                <span className="flex items-center gap-2">
                  <ShopOutlined />
                  Meus Negócios ({interacoes.estabelecimentos.length})
                </span>
              ),
              children: renderEstabelecimentos(),
            },
            {
              key: "2",
              label: (
                <span className="flex items-center gap-2">
                  <CommentOutlined />
                  Avaliações & Comentários ({interacoes.avaliacoes.length})
                </span>
              ),
              children: renderAvaliacoes(),
            },
          ]}
        />
      </Spin>
    </Modal>
  );
};
