"use client";

import { validarArquivo } from "@/lib/arquivos";
import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Select,
  Row,
  Col,
  Checkbox,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import dynamic from "next/dynamic";
import { CommonTitle, customUploadAction } from "./SharedUI";
import { areasAtuacao, tagsPorCategoria } from "@/constants/mei-options";
import {
  maskCPF,
  maskCNPJ,
  maskPhone,
  stripEmojis,
  getQuillTextLength,
  onFinishFailed,
} from "@/lib/utils-mei";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "@/app/cadastro-mei/quill-styles.css";

const { Option } = Select;
const { TextArea } = Input;
const MAX_QUILL_LENGTH = 500;

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

export default function UpdateForm({ form, onFinish, loading }: any) {
  const [logoFileList, setLogoFileList] = useState([]);
  const [portfolioFileList, setPortfolioFileList] = useState([]);
  const [ccmeiFileList, setCcmeiFileList] = useState([]);
  const [quillTextLength, setQuillTextLength] = useState(0);

  // Handlers internos para manter o funcionamento original
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
    onFinish(values, {
      logo: logoFileList[0],
      portfolio: portfolioFileList,
      ccmei: ccmeiFileList[0],
    });
  };

  // Trava para impedir PDF no Portfólio
  const beforePortfolioUpload = (file: any) => {
    const erro = validarArquivo(file);
    if (erro) {
      message.error(erro);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const beforeCcmeiUpload = (file: any) => {
    const erro = validarArquivo(file, { permitePdf: true });
    if (erro) {
      message.error(erro);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      autoComplete="off"
      onFinishFailed={onFinishFailed}
      onValuesChange={(changed) => {
        if (changed.descricao !== undefined)
          setQuillTextLength(getQuillTextLength(changed.descricao));
      }}
    >
      <section className="mb-8 border-t pt-4">
        <CommonTitle title="Identificação do Negócio" />
        <p className="text-gray-600 mb-6 -mt-4">
          Para iniciar a atualização, confirme os dados de identificação do
          negócio e do responsável.
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
              name="nomeFantasia"
              label="Nome Fantasia do Negócio"
              rules={[
                {
                  required: true,
                  message: "O Nome Fantasia é obrigatório para identificação!",
                },
              ]}
            >
              <Input
                name="nomeFantasia"
                placeholder="Nome Fantasia"
                onChange={handleStripEmojiChange}
              />
            </Form.Item>
          </Col>
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
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
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
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="ccmeiFile"
              label="Certificado CCMEI Atual"
              rules={[
                {
                  required: true,
                  message:
                    "O Certificado CCMEI é obrigatório para identificação!",
                },
                () => ({
                  validator(_, value) {
                    if (ccmeiFileList.length > 0) return Promise.resolve();
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
                beforeUpload={beforeCcmeiUpload}
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
      </section>

      <section className="mb-8 border-t pt-4">
        <CommonTitle title="Informações para Atualizar" />
        <p className="text-gray-600 mb-6 -mt-4">
          Preencha apenas os campos que deseja alterar. Os campos deixados em
          branco não serão modificados.
        </p>

        <Form.Item
          label="Nova Logo (Opcional)"
          help="Envie 1 nova imagem para substituir a logo atual. (.png, .jpg, .jpeg)"
        >
          <Upload
            customRequest={customUploadAction}
            fileList={logoFileList}
            onChange={({ fileList }: any) => setLogoFileList(fileList)}
            listType="picture"
            maxCount={1}
            accept="image/png, image/jpeg, image/jpg image/webp"
            beforeUpload={beforePortfolioUpload}
          >
            <Button icon={<UploadOutlined />}>Carregar Nova Logo</Button>
          </Upload>
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="contatoEstabelecimento"
              label="Novo Telefone / WhatsApp"
              rules={[
                {
                  pattern: /^\(\d{2}\) \d{5}-\d{4}$/,
                  message: "Telefone inválido!",
                },
              ]}
            >
              <Input
                placeholder="(22) 99999-9999"
                name="contatoEstabelecimento"
                onChange={(e) => handleMaskChange(e, maskPhone)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="locais" label="Novas Áreas de Atuação">
          <Select mode="multiple" allowClear placeholder="Selecione os bairros">
            {areasAtuacao.map((area) => (
              <Option key={area} value={area}>
                {area}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="descricaoDiferencial"
          label="Novo Diferencial (Resumo)"
        >
          <TextArea
            name="descricaoDiferencial"
            rows={2}
            showCount
            maxLength={130}
            placeholder="Descreva brevemente qual é o atrativo do seu produto ou serviço."
            onChange={handleStripEmojiChange}
          />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Nova Descrição do seu trabalho"
          help={
            <div className="flex justify-between w-full">
              <span>Se preenchido, substituirá a descrição atual.</span>
              <span
                className={
                  quillTextLength > MAX_QUILL_LENGTH
                    ? "text-red-500 font-medium"
                    : "text-gray-500"
                }
              >
                {quillTextLength}/{MAX_QUILL_LENGTH}
              </span>
            </div>
          }
        >
          <ReactQuill
            theme="snow"
            modules={quillModules}
            placeholder="Fale um pouco mais detalhadamente do seu trabalho faz..."
            style={{ minHeight: "10px" }}
          />
        </Form.Item>

        <Form.Item
          name="outrasAlteracoes"
          label="Outras Alterações (Opcional)"
          help="Se precisar alterar algo que não está no formulário (ex: Categoria, Endereço, Instagram, etc.), descreva aqui."
        >
          <TextArea
            name="outrasAlteracoes"
            rows={3}
            placeholder="Ex: Por favor, alterar o Instagram para @novo_mei e o endereço para Rua Nova, 123."
            onChange={handleStripEmojiChange}
          />
        </Form.Item>

        <Form.Item
          name="tagsInvisiveis"
          label="Novas Tags de Busca (Até 5)"
          help="Selecione até 5 tags. As novas tags substituirão as atuais."
          rules={[
            {
              validator: (_, value) =>
                value && value.length > 5
                  ? Promise.reject(new Error("Selecione no máximo 5 tags!"))
                  : Promise.resolve(),
            },
          ]}
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="Selecione as tags"
            maxTagCount={5}
          >
            {[...new Set(Object.values(tagsPorCategoria).flat())].map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="portfolio"
          label="Novas Fotos do Portfólio (até 4)"
          help="A qualidade e quantidade de imagens enviadas aqui irão substituir as atuais."
        >
          <Upload
            customRequest={customUploadAction}
            fileList={portfolioFileList}
            onChange={({ fileList }: any) => setPortfolioFileList(fileList)}
            listType="picture"
            multiple
            maxCount={4}
            accept="image/png, image/jpeg, image/jpg image/webp"
            beforeUpload={beforePortfolioUpload}
          >
            <Button icon={<UploadOutlined />}>Carregar Novas Imagens</Button>
          </Upload>
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
                      new Error("Você precisa confirmar esta caixa."),
                    ),
            },
          ]}
        >
          <Checkbox>
            Confirmo que as informações são verdadeiras e de minha
            responsabilidade. Estou ciente de que poderão ser usadas pela
            Prefeitura para divulgação e apoio ao empreendedorismo em Saquarema,
            de acordo com a Lei Geral de Proteção de Dados.
          </Checkbox>
        </Form.Item>
      </section>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={loading}
          style={{ height: 45, fontSize: "1rem" }}
        >
          Enviar Atualização
        </Button>
      </Form.Item>
    </Form>
  );
}
