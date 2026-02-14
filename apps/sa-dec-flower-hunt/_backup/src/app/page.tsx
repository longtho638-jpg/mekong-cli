"use client";

import { FLOWERS } from "@/data/flowers";

export default function Home() {
  return (
    <div className="pb-20">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 px-4 py-3 border-b border-stone-100">
        <h1 className="font-serif text-xl font-bold text-red-600">
          🌸 Sa Đéc 2026
        </h1>
      </header>

      {/* 2. Feed Loop */}
      <div className="flex flex-col">
        {FLOWERS.map((flower) => (
          /* 3. Card Design */
          <div key={flower.id} className="relative w-full aspect-[3/4] mb-2">
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flower.image}
              alt={flower.name}
              className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            {/* Text */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-2xl font-bold text-white mb-1">
                {flower.name}
              </h2>
              <p className="text-sm font-bold text-yellow-300 uppercase tracking-wider">
                {flower.vibe}
              </p>
            </div>

            {/* Action Button */}
            <button className="absolute bottom-4 right-4 bg-white text-black px-5 py-2 rounded-full font-bold shadow-lg transform hover:scale-110 active:scale-95 transition-all text-sm flex items-center gap-1">
              Chi Tiết
              <span>-&gt;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
