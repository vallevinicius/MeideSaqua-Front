"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { registrarVisualizacao } from "@/lib/api";

const RedirecionamentoPage = ({ params }: { params: { tipo: string } }) => {
  const [countdown, setCountdown] = useState(2);
  const router = useRouter();

  const jaContabilizou = useRef(false);

  useEffect(() => {
    if (!jaContabilizou.current) {
      jaContabilizou.current = true;

      if (params.tipo === "mei") {
        registrarVisualizacao("REDIRECIONAMENTO_ANZOL_MEI");
      } else if (params.tipo === "usuario") {
        registrarVisualizacao("REDIRECIONAMENTO_ANZOL_USUARIO");
      }
    }
  }, [params.tipo]);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router, params.tipo]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Image
        className="mb-10"
        src="/LogoMeideSaqua.png"
        alt="Logo MeideSaqua"
        width={200}
        height={200}
      />
      <Card className="w-full max-w-md rounded-xl shadow-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">
            Redirecionando...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 relative flex items-center justify-center h-16 w-16">
            <Loader2 className="h-full w-full animate-spin text-blue-500 absolute" />
            <span className="text-2xl font-bold text-gray-800 absolute">
              {countdown}
            </span>
          </div>

          <p className="text-gray-600">
            Ação concluída com sucesso! Você será redirecionado em {countdown} segundos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RedirecionamentoPage;
