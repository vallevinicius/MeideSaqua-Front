"use client";

import React from "react";
import { ConfigProvider } from "antd";
import ptBR from "antd/locale/pt_BR";

// Tema do antd para o painel: cores da marca, cantos e fonte iguais ao restante do portal.
export default function AdminTheme({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        token: {
          colorPrimary: "#027DB9",
          colorSuccess: "#5E9B14",
          colorWarning: "#C77700",
          colorError: "#D6336C",
          colorInfo: "#027DB9",
          colorText: "#0E2A3A",
          colorTextSecondary: "#52687A",
          colorBorder: "#D5E0E8",
          colorBorderSecondary: "#E3EBF1",
          colorBgLayout: "#F2F6F9",
          borderRadius: 10,
          fontFamily: "var(--font-poppins), system-ui, sans-serif",
        },
        components: {
          Card: { borderRadiusLG: 14, headerFontSize: 15 },
          Tabs: { itemSelectedColor: "#02608F", inkBarColor: "#027DB9" },
          Button: { controlHeight: 38, primaryShadow: "none", defaultShadow: "none" },
          Input: { controlHeight: 40 },
          Modal: { borderRadiusLG: 16 },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
