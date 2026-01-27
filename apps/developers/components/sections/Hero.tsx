"use client";
import React from "react";
import { ContainerScroll } from "../ui/ContainerScroll";
import { BackgroundBeams } from "../ui/BackgroundBeams";
import Link from "next/link";
import Image from "next/image";

export function Hero() {
    return (
        <div className="relative flex flex-col items-center justify-center overflow-hidden antialiased bg-black">
            <BackgroundBeams className="opacity-40" />
            <div className="flex flex-col overflow-hidden relative">
                <ContainerScroll
                    titleComponent={
                        <>
                            <h1 className="text-4xl font-semibold text-white dark:text-white mb-8">
                                Run a professional agency <br />
                                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-500">
                                    From Your Terminal
                                </span>
                            </h1>
                        </>
                    }
                >
                    <Image
                        src={`/dashboard-preview.png`}
                        alt="hero"
                        height={720}
                        width={1400}
                        priority
                        className="mx-auto rounded-2xl object-cover h-full object-left-top"
                        draggable={false}
                    />
                </ContainerScroll>
            </div>

            <div className="flex justify-center gap-4 -mt-20 md:-mt-40 z-20 mb-20">
                <Link
                    href="/auth/signup"
                    className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                >
                    Start Free Trial
                </Link>
                <Link
                    href="#demo"
                    className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 px-6 font-medium text-neutral-400 hover:bg-neutral-800 transition-colors"
                >
                    View Documentation
                </Link>
            </div>
        </div>
    );
}
