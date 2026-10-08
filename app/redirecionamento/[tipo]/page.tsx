"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { registrarVisualizacao } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

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
  }, [countdown, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] p-4 font-sans overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="mb-10 bg-white/5 p-5 rounded-[2rem] backdrop-blur-md border border-white/5 shadow-2xl"
        >
          <Image
            src="/LogoMeideSaqua.png"
            alt="Logo MeideSaqua"
            width={160}
            height={160}
            className="drop-shadow-lg object-contain"
          />
        </motion.div>

        <div className="flex flex-col items-center gap-6 w-full px-8 py-10 rounded-3xl bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <h1 className="text-lg font-medium text-slate-200 tracking-tight text-center">
            Preparando seu ambiente
          </h1>
          
          <div className="relative flex items-center justify-center w-20 h-20">
            <motion.svg
              className="absolute w-full h-full text-sky-400 drop-shadow-md"
              viewBox="0 0 100 100"
            >
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: { duration: 2, ease: "linear" },
                  opacity: { duration: 0.3 }
                }}
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="opacity-10"
              />
            </motion.svg>
            
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown}
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="text-3xl font-light text-white tabular-nums tracking-tighter"
              >
                {countdown}
              </motion.span>
            </AnimatePresence>
          </div>

          <p className="text-slate-400 text-sm font-medium text-center leading-relaxed">
            Ação concluída com sucesso. <br/> Você será redirecionado em instantes.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RedirecionamentoPage;
