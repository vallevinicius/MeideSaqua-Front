"use client";

import React, { useEffect, useState } from "react";
import { Alert } from "antd";
import { useRouter, usePathname } from "next/navigation";
import { encerrarSessaoAdmin } from "@/lib/session";

export default function AdminTokenTimer() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/login") return;

    const checkTime = () => {
      const expiryStr = localStorage.getItem("admin_token_expiry");
      if (!expiryStr) return;

      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      const diff = Math.floor((expiry - now) / 1000);

      if (diff <= 0) {
        void encerrarSessaoAdmin();
        router.push("/admin/login");
      } else {
        setTimeLeft(diff);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  if (timeLeft === null || pathname === "/admin/login") return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const isWarning = timeLeft < 1800;

  return (
    <div className="sticky top-0 z-[100] w-full shadow-sm">
      <Alert
        message={
          <div className="text-center text-sm font-medium">
            Tempo restante de login ativo:{" "}
            <span className="font-mono ml-2 font-bold">{formattedTime}</span>
          </div>
        }
        type={isWarning ? "error" : "info"}
        banner
      />
    </div>
  );
}
