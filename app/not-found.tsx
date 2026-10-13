"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <Image
            className="mb-8 cursor-pointer"
            src="/LogoMeideSaqua.png"
            alt="Logo MeideSaqua"
            width={200}
            height={200}
            priority
          />
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.08 }}
        className="w-full max-w-md"
      >
        <Card className="w-full rounded-2xl border border-gray-200/80 bg-white/95 shadow-xl shadow-gray-200/50 backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
              <Compass className="h-8 w-8 animate-pulse text-blue-600" />
            </div>
            <span className="text-xs font-semibold tracking-widest text-blue-600 uppercase">
              Erro 404
            </span>
            <CardTitle className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              Página não encontrada
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center pt-1 pb-4">
            <p className="text-sm leading-relaxed text-gray-600">
              O endereço acessado não existe, foi movido ou pode estar
              temporariamente indisponível.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:flex-1 h-11 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar página
            </Button>

            <Button
              asChild
              className="w-full sm:flex-1 h-11 bg-blue-600 font-medium text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Início
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
