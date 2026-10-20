"use client";

import PageHeader from "@/components/admin/PageHeader";
import React, { useState, useEffect, useCallback } from "react";
import {
  List,
  Button,
  Spin,
  message,
  Modal,
  Typography,
  Tag,
  Empty,
  Avatar,
  Pagination,
  Grid,
} from "antd";
import {
  DeleteOutlined,
  ArrowLeftOutlined,
  MessageOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
// 1. API REFETORADA
import { adminGetReviewsByEstablishment, adminDeleteReview } from "@/lib/api";
import { getAdminToken } from "@/lib/session";

const { Text, Paragraph } = Typography;
const { confirm } = Modal;
const { useBreakpoint } = Grid;

const PAGE_SIZE = 8; // Mantido do seu código de referência

// 2. INTERFACES REFETORADAS
interface AvaliacaoAdmin {
  avaliacoesId: number;
  comentario: string;
  nota: number | null;
  usuario: {
    usuarioId: number;
    nomeCompleto: string;
    email: string;
  };
  parentId: number | null; // <-- Corrigido para 'parentId' (camelCase)
  respostas?: AvaliacaoAdmin[];
}

interface PageData {
  // Alterado de 'projeto' para 'estabelecimento'
  estabelecimento: {
    estabelecimentoId: number;
    nomeFantasia: string; // Alterado de 'nomeProjeto'
    categoria: string; // Alterado de 'ods'
  };
  avaliacoes: AvaliacaoAdmin[];
}

// --- COMPONENTE RECURSIVO (Nenhuma mudança de lógica necessária) ---
interface AdminReviewCommentItemProps {
  review: AvaliacaoAdmin;
  handleDelete: (id: number) => void;
  isReply: boolean;
  isMobile: boolean;
  isActionLoading: boolean;
}

const AdminReviewCommentItem: React.FC<AdminReviewCommentItemProps> = ({
  review,
  handleDelete,
  isReply,
  isMobile,
  isActionLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasReplies = review.respostas && review.respostas.length > 0;
  const replyCount = review.respostas?.length ?? 0;

  const deleteButton = (
    <Button
      type="primary"
      danger
      icon={<DeleteOutlined />}
      onClick={() => handleDelete(review.avaliacoesId)}
      loading={isActionLoading}
      size={isReply || isMobile ? "small" : "middle"}
      className="ml-auto"
    >
      {isMobile ? null : "Excluir"}
    </Button>
  );

  const expandButton = !isReply && hasReplies && (
    <Button
      icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
      onClick={() => setIsExpanded(!isExpanded)}
      size={isMobile ? "small" : "middle"}
    >
      {isExpanded
        ? "Esconder"
        : `Ver ${replyCount} ${replyCount === 1 ? "Resposta" : "Respostas"}`}
    </Button>
  );

  return (
    <div
      className={`h-full flex flex-col p-4 border rounded-lg shadow-sm bg-white ${
        isReply ? "ml-4 md:ml-8" : "" // Indentação de resposta
      }`}
    >
      {/* 1. Meta (Cabeçalho do card) */}
      <div className="flex gap-3">
        <Avatar
          src={"/avatars/default-avatar.png"}
          size={isReply ? "small" : "default"}
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Text strong className={isReply ? "text-sm" : ""}>
              {review.usuario.nomeCompleto}
            </Text>
            {review.nota && ( // Só mostra a nota se existir (comentário pai)
              <Tag
                color={
                  review.nota < 3 ? "red" : review.nota > 3 ? "green" : "blue"
                }
              >
                {review.nota} estrela(s)
              </Tag>
            )}
            {isReply && ( // Mostra a tag "Resposta"
              <Tag icon={<MessageOutlined />} color="default">
                Resposta
              </Tag>
            )}
          </div>
          <Text type="secondary" className={isReply ? "text-xs" : ""}>
            {review.usuario.email}
          </Text>
        </div>
      </div>

      {/* 2. Conteúdo */}
      <div
        className={`mt-3 ${
          isReply ? "pl-10 text-sm" : "pl-2 text-base"
        } flex-1`}
      >
        <Paragraph>
          {review.comentario || <Text type="secondary">(Sem comentário)</Text>}
        </Paragraph>
      </div>

      {/* 3. Respostas recursivas (se expandido) */}
      {isExpanded && hasReplies && (
        <div className="mt-4">
          <List
            itemLayout="vertical"
            dataSource={review.respostas}
            renderItem={(reply) => (
              <AdminReviewCommentItem
                key={reply.avaliacoesId}
                review={reply}
                handleDelete={handleDelete}
                isReply={true}
                isMobile={isMobile}
                isActionLoading={isActionLoading}
              />
            )}
          />
        </div>
      )}

      {/* 4. Rodapé de Ações */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
        {[expandButton, deleteButton].filter(Boolean)}
      </div>
    </div>
  );
};

// --- 3. COMPONENTE PRINCIPAL (REFETORADO) ---
const AdminComentariosDoEstabelecimento: React.FC = () => {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const params = useParams();

  // 3.1 Variável refatorada
  const estabelecimentoId = params.id as string;
  const screens = useBreakpoint();

  const fetchData = useCallback(async () => {
    // 3.2 Variável refatorada
    if (!estabelecimentoId) return;
    setLoading(true);
    const token = getAdminToken();
    if (!token) {
      message.error("Acesso negado. Faça login novamente.");
      router.push("/admin/login");
      return;
    }

    try {
      // 3.3 API refatorada
      const data = await adminGetReviewsByEstablishment(
        estabelecimentoId,
        token
      );
      setPageData(data);
      setCurrentPage(1);
    } catch (error: any) {
      message.error(error.message || "Falha ao buscar comentários.");
    } finally {
      setLoading(false);
    }
  }, [estabelecimentoId, router]); // router adicionado para consistência

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = (id: number) => {
    confirm({
      title: "Você tem certeza que quer excluir este item?",
      content:
        "Se for um comentário pai, todas as suas respostas também serão excluídas. Esta ação não pode ser desfeita.",
      okText: "Sim, excluir",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: async () => {
        setIsActionLoading(true);
        const token = getAdminToken();
        if (!token) {
          message.error("Sessão expirada.");
          setIsActionLoading(false);
          return;
        }
        try {
          // 3.4 API (já estava correta)
          await adminDeleteReview(id, token);
          message.success("Item excluído com sucesso!");
          fetchData(); // Recarrega a árvore de comentários
        } catch (error: any) {
          message.error(error.message || "Falha ao excluir item.");
        } finally {
          setIsActionLoading(false);
        }
      },
    });
  };

  const isMobile = !screens.md;

  // 3.5 Título refatorado
  const pageTitle = pageData?.estabelecimento?.nomeFantasia
    ? `Comentários de: ${pageData.estabelecimento.nomeFantasia}`
    : "Carregando comentários...";

  // Paginação dos comentários-PAI
  const allAvaliacoes = pageData?.avaliacoes || [];
  const totalCount = allAvaliacoes.length;
  const paginatedAvaliacoes = allAvaliacoes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        titulo={pageTitle}
        descricao={
          pageData?.estabelecimento?.categoria
            ? `Categoria: ${pageData.estabelecimento.categoria}`
            : undefined
        }
        acoes={
          <Link href="/admin/comentarios" passHref>
            <Button icon={<ArrowLeftOutlined />}>Voltar para estabelecimentos</Button>
          </Link>
        }
      />

      <Spin spinning={loading}>
        {/* Layout de Grid (lógica idêntica) */}
        <List
          grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          dataSource={paginatedAvaliacoes}
          locale={{
            emptyText: (
              <Empty description="Nenhum comentário encontrado para este estabelecimento." />
            ),
          }}
          renderItem={(item: AvaliacaoAdmin) => (
            <List.Item key={item.avaliacoesId} style={{ height: "100%" }}>
              <AdminReviewCommentItem
                review={item}
                handleDelete={handleDelete}
                isReply={false} // Itens no grid principal nunca são respostas
                isMobile={isMobile}
                isActionLoading={isActionLoading}
              />
            </List.Item>
          )}
        />

        {/* Paginação (lógica idêntica) */}
        {totalCount > PAGE_SIZE && (
          <div className="mt-6 text-center">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={totalCount}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              simple={isMobile}
            />
          </div>
        )}
      </Spin>
    </div>
  );
};

// 3.8 Export refatorado
export default AdminComentariosDoEstabelecimento;
