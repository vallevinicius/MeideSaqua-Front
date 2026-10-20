"use client";

import React, { useState } from "react";
import { Form, Input, Button, Row, Col, Checkbox, Upload, message } from "antd";
import { validarArquivo } from "@/lib/arquivos";
import { UploadOutlined } from "@ant-design/icons";
import { CommonTitle, customUploadAction } from "./SharedUI";
import {
  maskCPF,
  maskCNPJ,
  stripEmojis,
  onFinishFailed,
} from "@/lib/utils-mei";

const { TextArea } = Input;

export default function DeleteForm({ form, onFinish, loading }: any) {
  const [ccmeiFileList, setCcmeiFileList] = useState([]);

  // Handlers para manter o comportamento exato de máscaras e emojis
  const handleStripEmojiChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    form.setFieldsValue({ [name]: stripEmojis(value) });
  };

  const handleMaskChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    maskFn: (value: string) => string,
  ) => {
    const { name, value } = e.target;
    form.setFieldsValue({ [name]: maskFn(stripEmojis(value)) });
  };

  const handleSubmit = (values: any) => {
    // Passa os valores e o arquivo CCMEI para a função orquestradora no page.tsx
    onFinish(values, { ccmei: ccmeiFileList[0] });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
      onFinishFailed={onFinishFailed}
    >
      <section className="mb-8 border-t pt-4">
        <CommonTitle title="Exclusão de Cadastro MEI" />
        <p className="text-red-700 bg-red-50 p-4 rounded-md mb-6 -mt-2">
          <b>Atenção:</b> Esta ação é permanente e removerá seu negócio da nossa
          plataforma. Para voltar, será necessário um novo cadastro. Para
          prosseguir, confirme sua identidade.
        </p>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nome_responsavel"
              label="Nome Completo do Responsável"
              rules={[
                {
                  required: true,
                  message: "O nome é obrigatório para identificação!",
                },
              ]}
            >
              <Input
                name="nome_responsavel"
                placeholder="Nome Completo"
                onChange={handleStripEmojiChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="cpf_responsavel"
              label="CPF do Responsável"
              rules={[
                {
                  required: true,
                  message: "O CPF é obrigatório para identificação!",
                },
                {
                  pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                  message: "CPF inválido!",
                },
              ]}
              help="Apenas aceitaremos a exclusão caso o CPF seja correspondente ao do cadastro."
            >
              <Input
                placeholder="000.000.000-00"
                name="cpf_responsavel"
                onChange={(e) => handleMaskChange(e, maskCPF)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="cnpj"
              label="CNPJ do Negócio"
              rules={[
                {
                  required: true,
                  message: "O CNPJ é obrigatório para identificação!",
                },
                {
                  pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                  message: "CNPJ inválido!",
                },
              ]}
            >
              <Input
                placeholder="00.000.000/0001-00"
                name="cnpj"
                onChange={(e) => handleMaskChange(e, maskCNPJ)}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="ccmeiFile"
              label="Certificado CCMEI"
              rules={[
                {
                  required: true,
                  message:
                    "O Certificado CCMEI é obrigatório para identificação!",
                },
                () => ({
                  validator(_, value) {
                    if (ccmeiFileList.length > 0) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Envie o Certificado CCMEI (PDF ou Imagem)!"),
                    );
                  },
                }),
              ]}
              help="Anexe a cópia mais recente do Certificado de Condição de Microempreendedor Individual (PDF/Imagem)."
            >
              <Upload
                customRequest={customUploadAction}
                beforeUpload={(file) => {
                  const erro = validarArquivo(file, { permitePdf: true });
                  if (erro) {
                    message.error(erro);
                    return Upload.LIST_IGNORE;
                  }
                  return false;
                }}
                fileList={ccmeiFileList}
                onChange={({ fileList }: any) => setCcmeiFileList(fileList)}
                listType="text"
                maxCount={1}
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>Carregar CCMEI</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="emailEstabelecimento"
          label="E-mail de Contato Principal"
          rules={[
            {
              required: true,
              message: "O e-mail é obrigatório para identificação!",
            },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "E-mail inválido!",
            },
          ]}
        >
          <Input
            name="emailEstabelecimento"
            placeholder="contato@email.com"
            onChange={handleStripEmojiChange}
          />
        </Form.Item>

        <Form.Item name="motivo" label="Motivo da exclusão (Opcional)">
          <TextArea
            name="motivo"
            rows={3}
            placeholder="Sua opinião é importante para nós. Se puder, nos diga por que está saindo."
            onChange={handleStripEmojiChange}
          />
        </Form.Item>
        <Form.Item
          name="confirmacao"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(
                      new Error("Você precisa confirmar a exclusão!"),
                    ),
            },
          ]}
        >
          <Checkbox>
            Sim, eu entendo que esta ação é irreversível e desejo excluir meu
            cadastro.
          </Checkbox>
        </Form.Item>
      </section>
      <Form.Item>
        <Button
          type="primary"
          danger
          htmlType="submit"
          block
          loading={loading}
          style={{ height: 45, fontSize: "1rem" }}
        >
          Confirmar Exclusão MEI
        </Button>
      </Form.Item>
    </Form>
  );
}
