"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  Checkbox,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { Slider } from "@/components/ui/slider";
import dynamic from "next/dynamic";
import { CommonTitle, customUploadAction } from "./SharedUI";
import {
  areasAtuacao,
  categorias,
  tagsPorCategoria,
  canaisDeVendaOpcoes,
} from "@/constants/mei-options";
import {
  maskCPF,
  maskCNPJ,
  maskCNAE,
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

export default function RegisterForm({ form, onFinish, loading }: any) {
  const [logoFileList, setLogoFileList] = useState([]);
  const [portfolioFileList, setPortfolioFileList] = useState([]);
  const [ccmeiFileList, setCcmeiFileList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quillTextLength, setQuillTextLength] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);

  const handleSubmit = (values: any) => {
    // Agora o 'values' virá 100% sincronizado com a máscara
    onFinish(values, {
      logo: logoFileList[0],
      portfolio: portfolioFileList,
      ccmei: ccmeiFileList[0],
    });
  };

  const beforeImageUpload = (file: any) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error(`${file.name} não é uma imagem válida!`);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
      onValuesChange={(changed) => {
        if (changed.descricao !== undefined)
          setQuillTextLength(getQuillTextLength(changed.descricao));
      }}
    >
      <section className="mb-8 border-t pt-4">
        <CommonTitle title="Informações do Responsável" />
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nome_responsavel"
              label="Nome Completo do Responsável"
              rules={[
                { required: true, message: "Insira o nome do responsável!" },
              ]}
              normalize={(v) => stripEmojis(v)}
            >
              <Input placeholder="Ex: João da Silva" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="cpf_responsavel"
              label="CPF do Responsável"
              rules={[
                { required: true, message: "O CPF é obrigatório!" },
                {
                  pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                  message: "CPF incompleto ou inválido!",
                },
              ]}
              normalize={(v) => maskCPF(stripEmojis(v))}
            >
              <Input placeholder="000.000.000-00" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="emailEstabelecimento"
          label="E-mail de Contato Principal"
          rules={[
            { required: true, message: "O e-mail é obrigatório!" },
            {
              pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Formato de e-mail inválido!",
            },
          ]}
          normalize={(v) => stripEmojis(v)}
        >
          <Input placeholder="contato@email.com" />
        </Form.Item>
      </section>

      <section className="mb-8 border-t pt-4">
        <CommonTitle title="Informações do Negócio" />
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="nomeFantasia"
              label="Nome Fantasia"
              rules={[
                { required: true, message: "Insira o nome do seu negócio!" },
              ]}
              normalize={(v) => stripEmojis(v)}
            >
              <Input placeholder="Ex: Salão da Maria" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            {/* O SEGREDO ESTÁ NO NORMALIZE: Ele garante que o Form receba o valor mascarado sempre */}
            <Form.Item
              name="cnpj"
              label="CNPJ"
              rules={[
                { required: true, message: "O CNPJ é obrigatório!" },
                {
                  pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                  message: "CNPJ incompleto ou inválido!",
                },
              ]}
              normalize={(v) => maskCNPJ(stripEmojis(v))}
            >
              <Input placeholder="00.000.000/0001-00" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="ccmeiFile"
          label="Certificado CCMEI"
          rules={[
            { required: true, message: "O Certificado CCMEI é obrigatório!" },
            () => ({
              validator(_, value) {
                if (ccmeiFileList.length > 0) return Promise.resolve();
                return Promise.reject(
                  new Error("Envie o Certificado CCMEI (PDF ou Imagem)!"),
                );
              },
            }),
          ]}
          help="Anexe o Certificado de Condição de Microempreendedor Individual (PDF ou Imagem)."
        >
          <Upload
            customRequest={customUploadAction}
            fileList={ccmeiFileList}
            onChange={({ fileList }: any) => setCcmeiFileList(fileList)}
            listType="text"
            maxCount={1}
            accept=".pdf,.jpg,.jpeg,.png"
          >
            <Button icon={<UploadOutlined />}>Carregar Arquivo</Button>
          </Upload>
        </Form.Item>

        <Form.Item
          name="categoria"
          label="Categoria Principal"
          rules={[{ required: true, message: "Selecione uma categoria!" }]}
        >
          <Select
            placeholder="Selecione a categoria principal"
            onSelect={(v: string) => {
              setSelectedCategory(v);
              form.setFieldsValue({ tagsInvisiveis: [] });
            }}
          >
            {categorias.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {selectedCategory ? (
          <Form.Item
            name="tagsInvisiveis"
            label={`Tags de Busca Sugeridas (${selectedCategory})`}
            help="Selecione no máximo 5 tags para facilitar a busca do seu negócio."
            rules={[
              { required: true, message: "Selecione pelo menos uma tag!" },
              {
                validator: (_, v) =>
                  v && v.length > 5
                    ? Promise.reject(new Error("Selecione no máximo 5 tags!"))
                    : Promise.resolve(),
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Selecione até 5 tags"
              maxTagCount={5}
            >
              {tagsPorCategoria[selectedCategory]?.map((tag) => (
                <Option key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          <p className="text-gray-600 mb-6 mt-2 text-sm">
            *Selecione uma Categoria na seção "Informações do Negócio" para ver
            as Tags sugeridas.*
          </p>
        )}

        <Form.Item
          name="cnae"
          label="CNAE (Atividade Principal)"
          rules={[
            { required: true, message: "O CNAE é obrigatório!" },
            {
              pattern: /^\d{4}-\d\/\d{2}$/,
              message: "CNAE incompleto ou inválido!",
            },
          ]}
          normalize={(v) => maskCNAE(stripEmojis(v))}
        >
          <Input placeholder="0000-0/00" />
        </Form.Item>

        <Form.Item
          name="venda"
          label="Como você vende ou divulga seus produtos ou serviços?"
          help="Selecione todas as opções que se aplicam."
          rules={[
            { required: true, message: "Selecione pelo menos um canal." },
          ]}
        >
          <Checkbox.Group
            options={canaisDeVendaOpcoes}
            className="flex flex-col space-y-1 ml-4"
          />
        </Form.Item>

        <Form.Item
          name="escala"
          label="Diga o quanto você acredita que ter seu perfil no MEIdeSaquá irá impulsionar seu negócio."
          help="Em uma escala de 0 a 10, onde 0 = nenhum impacto e 10 = impacto muito positivo"
          rules={[{ required: true, message: "Por favor, avalie o impacto!" }]}
        >
          <>
            <Slider
              value={[sliderValue]}
              max={10}
              step={1}
              onValueChange={(v) => {
                setSliderValue(v[0]);
                form.setFieldsValue({ escala: v[0] });
              }}
            />
            <div className="text-center font-bold text-lg text-[#017DB9] mt-2">
              {sliderValue}
            </div>
          </>
        </Form.Item>
      </section>

      <section className="mb-8 border-t pt-4">
        <CommonTitle title="Contato e Localização" />
        <Form.Item
          name="contatoEstabelecimento"
          label="Telefone / WhatsApp do Estabelecimento"
          rules={[
            { required: true, message: "Insira um contato!" },
            {
              pattern: /^\(\d{2}\) \d{5}-\d{4}$/,
              message: "Telefone incompleto ou inválido!",
            },
          ]}
          normalize={(v) => maskPhone(stripEmojis(v))}
        >
          <Input placeholder="(22) 99999-9999" />
        </Form.Item>
        <Form.Item
          name="endereco"
          label="Endereço Físico do estabelecimento (se houver)"
          normalize={(v) => stripEmojis(v)}
        >
          <Input placeholder="Este endereço aparecerá no perfil do seu negócio, para o público." />
        </Form.Item>
        <Form.Item
          name="areasAtuacao"
          label="Áreas de Atuação"
          rules={[
            { required: true, message: "Selecione pelo menos uma área!" },
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Selecione os bairros que você atende"
          >
            {areasAtuacao.map((area) => (
              <Option key={area} value={area}>
                {area}
              </Option>
            ))}
          </Select>
        </Form.Item>
      </section>

      <section className="mb-8 border-t pt-5">
        <CommonTitle title="Detalhes e Mídia" />
        <Form.Item
          name="descricao"
          label="Descrição do seu Serviço/Produto"
          rules={[
            { required: true, message: "Por favor, descreva seu trabalho!" },
            {
              validator: (_, value) => {
                const len = getQuillTextLength(value);
                return len > MAX_QUILL_LENGTH
                  ? Promise.reject(`Máximo ${MAX_QUILL_LENGTH} caracteres.`)
                  : Promise.resolve();
              },
            },
          ]}
          help={
            <div className="flex justify-end w-full">
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
            placeholder="Conte um pouco sobre o seu negócio!"
          />
        </Form.Item>

        <Form.Item
          name="descricaoDiferencial"
          label="Qual o seu diferencial?"
          rules={[
            {
              required: true,
              message: "Por favor, informe o seu diferencial!",
            },
          ]}
          normalize={(v) => stripEmojis(v)}
        >
          <TextArea
            rows={2}
            showCount
            maxLength={130}
            placeholder="Descreva brevemente qual é o atrativo do seu produto ou serviço."
          />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="website"
              label="Website (Opcional)"
              normalize={(v) => stripEmojis(v)}
            >
              <Input placeholder="Cole o link da sua página" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="instagram"
              label="Instagram (Opcional)"
              normalize={(v) => stripEmojis(v)}
            >
              <Input placeholder="Cole o link do seu perfil" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Sua Logo"
              help="Envie 1 imagem para o perfil. (.png, .jpg, .jpeg)"
            >
              <Upload
                customRequest={customUploadAction}
                fileList={logoFileList}
                onChange={({ fileList }: any) => setLogoFileList(fileList)}
                listType="picture"
                maxCount={1}
                accept="image/png,image/jpeg,image/webp"
                beforeUpload={beforeImageUpload}
              >
                <Button icon={<UploadOutlined />}>Carregar Logo</Button>
              </Upload>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="portfolio"
              label="Imagens do seu Produto ou Serviço"
              help="Envie até 4 imagens. (.png, .jpg, .jpeg)"
              rules={[
                { required: true, message: "Por favor, Adicione imagens!" },
                () => ({
                  validator(_, value) {
                    if (portfolioFileList.length > 0) return Promise.resolve();
                    return Promise.reject(
                      new Error("Por favor, Adicione pelo menos uma imagem!"),
                    );
                  },
                }),
              ]}
            >
              <Upload
                customRequest={customUploadAction}
                fileList={portfolioFileList}
                onChange={({ fileList }: any) => setPortfolioFileList(fileList)}
                listType="picture"
                multiple
                maxCount={4}
                accept="image/png,image/jpeg,image/webp"
                beforeUpload={beforeImageUpload}
              >
                <Button icon={<UploadOutlined />}>Carregar Portfólio</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="confirmacao"
          valuePropName="checked"
          rules={[
            {
              validator: (_, v) =>
                v
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

      <Button
        type="primary"
        htmlType="submit"
        block
        loading={loading}
        style={{ height: 45, fontSize: "1rem" }}
      >
        Enviar Cadastro
      </Button>
    </Form>
  );
}
