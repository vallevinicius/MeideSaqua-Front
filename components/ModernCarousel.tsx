"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { categories } from "@/constants/categories"; 

// A interface para os slides agora usa a estrutura das suas categorias
interface Slide {
  id: string;
  title: string;
  backgroundimg: string;
}

interface ModernCarouselProps {
  currentCategoryId: string; // ID da categoria atual para não a repetir
  interval?: number;
}

export default function ModernCarousel({
  currentCategoryId,
  interval = 5000,
}: ModernCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [displaySlides, setDisplaySlides] = useState<Slide[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    const otherCategories = categories.filter(
      (cat) => cat.id !== currentCategoryId
    );

    const shuffled = [...otherCategories].sort(() => 0.5 - Math.random());

    setDisplaySlides(shuffled.slice(0, 5));
  }, [currentCategoryId]); //  efeito executado sempre que a categoria da página muda

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(() => {
    if (displaySlides.length === 0) return;

    resetTimeout();
    timeoutRef.current = setTimeout(() => {
      setCurrent((prevIndex) =>
        prevIndex === displaySlides.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => resetTimeout();
  }, [current, interval, displaySlides]);

  const handleRedirect = (categoryId: string) => {
    router.push(`/categoria/${categoryId}`);
  };

  const goToSlide = (index: number) => setCurrent(index);
  const prevSlide = () => {
    if (displaySlides.length === 0) return;
    setCurrent(current === 0 ? displaySlides.length - 1 : current - 1);
  };
  const nextSlide = () => {
    if (displaySlides.length === 0) return;
    setCurrent(current === displaySlides.length - 1 ? 0 : current + 1);
  };

  // Se não houver slides para mostrar, não renderiza nada
  if (displaySlides.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-blue-600">
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {displaySlides.map((slide, idx) => (
          <div key={idx} className="min-w-full h-full relative flex-shrink-0">
            <Image
              src={slide.backgroundimg || "/placeholder.jpg"}
              alt={slide.title}
              fill
              className="object-cover w-full h-full"
              sizes="100vw"
              priority={idx === 0}
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <div className="absolute bottom-9 left-1/2 transform -translate-x-1/2 w-auto text-center z-10">
              <button
                onClick={() => handleRedirect(slide.id)}
                className="min-w-[180px] w-fit max-w-[280px] rounded-2xl border-2 border-dashed border-white/80 
                 bg-black/20 px-3 py-2 font-bold uppercase text-white
                 transition-all duration-300 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:rounded-md
                 hover:shadow-[4px_4px_16px_rgba(0,0,0,0.4)] active:translate-x-[0px] active:translate-y-[0px] 
                 active:rounded-2xl active:shadow-none backdrop-blur-lg text-sm whitespace-normal break-words"
              >
                {slide.title}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {displaySlides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              current === idx ? "bg-white" : "bg-white/50"
            }`}
          ></button>
        ))}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full z-10"
      >
        <ChevronLeft className="w-5 h-5 text-blue-700" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full z-10"
      >
        <ChevronRight className="w-5 h-5 text-blue-700" />
      </button>
    </div>
  );
}
