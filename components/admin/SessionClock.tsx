"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { encerrarSessaoAdmin } from "@/lib/session";

const formatar = (segundos: number) => {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

// Mostra quanto falta para a sessão acabar e leva ao login quando termina.
export default function SessionClock() {
  const router = useRouter();
  const [restante, setRestante] = useState<number | null>(null);

  useEffect(() => {
    const verificar = () => {
      const expira = parseInt(localStorage.getItem("admin_token_expiry") ?? "", 10);
      if (!expira) return;
      const diff = Math.floor((expira - Date.now()) / 1000);
      if (diff <= 0) {
        void encerrarSessaoAdmin();
        router.push("/admin/login");
      } else {
        setRestante(diff);
      }
    };
    verificar();
    const intervalo = setInterval(verificar, 1000);
    return () => clearInterval(intervalo);
  }, [router]);

  if (restante === null) return null;
  const acabando = restante < 1800;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
        acabando ? "bg-amber-50 text-amber-800" : "text-slate-500"
      }`}
      role={acabando ? "status" : undefined}
    >
      <Clock className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span>
        Sessão: <span className="tabular-nums font-medium">{formatar(restante)}</span>
      </span>
    </div>
  );
}
