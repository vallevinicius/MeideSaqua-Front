import React from "react";
import { validarArquivo } from "@/lib/arquivos";
import { Button, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

export const CommonTitle = ({ title }: { title: string }) => (
  <h2
    className="relative text-2xl font-semibold text-gray-800 mb-6 pl-4 
    before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-1 
    before:bg-gradient-to-t from-[#017DB9] to-[#22c362]"
  >
    {title}
  </h2>
);

export const customUploadAction = ({ onSuccess }: any) => {
  setTimeout(() => onSuccess("ok"), 500);
};

// --- ESTE É O COMPONENTE QUE BLOQUEIA O PDF ---
export const ImageUpload = ({
  fileList,
  onChange,
  maxCount,
  helpText,
  label,
}: any) => {
  const beforeUpload = (file: File) => {
    const erro = validarArquivo(file);
    if (erro) {
      message.error(erro);
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      <Upload
        customRequest={customUploadAction}
        fileList={fileList}
        onChange={onChange}
        listType="picture"
        maxCount={maxCount}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        beforeUpload={beforeUpload}
      >
        <Button icon={<UploadOutlined />}>Selecionar Imagem</Button>
      </Upload>
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );
};
