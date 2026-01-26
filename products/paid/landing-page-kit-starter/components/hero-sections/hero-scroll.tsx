"use client";
import React from "react";
import { ContainerScroll } from "../../components/ui/container-scroll-animation";
import { BackgroundBeams } from "../../components/ui/background-beams";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden antialiased bg-neutral-950 min-h-screen">
      <BackgroundBeams className="opacity-40" />
      <div className="flex flex-col overflow-hidden relative w-full">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-white dark:text-white mb-8">
                Build your next SaaS <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-500">
                  With Superpowers
                </span>
              </h1>
            </>
          }
        >
          <div className="flex items-center justify-center h-full bg-neutral-800 rounded-2xl">
              <span className="text-white text-2xl font-bold">Your Dashboard Screenshot Here</span>
          </div>
          {/*
            <Image
                src={`/dashboard-preview.png`}
                alt="hero"
                height={720}
                width={1400}
                priority
                className="mx-auto rounded-2xl object-cover h-full object-left-top"
                draggable={false}
            />
           */}
        </ContainerScroll>
      </div>

      <div className="flex justify-center gap-4 -mt-20 md:-mt-40 z-20 mb-20">
        <Link
          href="#"
          className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          Get Started
        </Link>
        <Link
          href="#"
          className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 px-6 font-medium text-neutral-400 hover:bg-neutral-800 transition-colors"
        >
          Documentation
        </Link>
      </div>
    </div>
  );
}
