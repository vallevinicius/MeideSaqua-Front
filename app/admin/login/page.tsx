"use client";

import React, { useState } from "react";
import { Form, Input, Button, message, Card, Row, Col } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { iniciarSessaoAdmin } from "@/lib/session";

// URL da sua API backend
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminLoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // O token fica em cookie httpOnly definido pelo servidor.
        localStorage.removeItem("admin_token");
        iniciarSessaoAdmin(data.expiresAt);
        message.success("Login bem-sucedido!");
        router.push("/admin/dashboard");
      } else {
        message.error(data.message || "Usuário ou senha inválidos.");
      }
    } catch (error) {
      console.error("Erro de conexão:", error);
      message.error("Não foi possível conectar ao servidor. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Row justify="center" className="w-full">
        <Col xs={24} sm={16} md={12} lg={8}>
          <Card
            title={
              <div className="text-center text-2xl font-bold text-gray-800">
                Painel do Administrador
              </div>
            }
            variant="borderless"
            className="shadow-2xl rounded-lg"
          >
            <Form
              name="admin_login"
              initialValues={{ remember: true }}
              onFinish={handleLogin}
              autoComplete="off"
            >
              <Form.Item
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Por favor, insira o nome de usuário!",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Usuário"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Por favor, insira a senha!" },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Senha"
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                >
                  Entrar
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminLoginPage;
