"use client";

import { useState } from "react";
import { Button, message } from "antd";
import { FilePdfOutlined } from "@ant-design/icons";
import { erroDaResposta, fetchSeguro, mensagemDeErro } from "@/lib/errors";
import { getAdminToken, tratarSessaoAdminExpirada } from "@/lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// O CCMEI tem dado pessoal e só é servido pela rota autenticada do admin,
// então o arquivo é baixado com o token e aberto como blob.
export default function CcmeiViewer({
  estabelecimentoId,
  pendente = false,
}: {
  estabelecimentoId: number;
  // true para o CCMEI enviado numa atualização ainda não aprovada.
  pendente?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const abrir = async () => {
    const token = getAdminToken();
    if (!token) {
      message.error("Sessão expirada. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchSeguro(
        `${API_URL}/api/admin/estabelecimento/${estabelecimentoId}/ccmei${pendente ? "?pendente=1" : ""}`,
        { credentials: "include", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) throw await erroDaResposta(response, "CCMEI não disponível.");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error: any) {
      if (tratarSessaoAdminExpirada(error)) return;
      message.error(mensagemDeErro(error, "Erro ao abrir o CCMEI."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="link"
      icon={<FilePdfOutlined />}
      loading={loading}
      onClick={abrir}
    >
      Ver CCMEI
    </Button>
  );
}
