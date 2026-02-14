"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Page Error:", error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-stone-950 text-white relative">
            {/* Background */}
            <div className="fixed inset-0 z-0">
                <img src="/assets/digital-twins/agrios_market_hyperreal_1765367468134.png" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-stone-950/80" />
            </div>

            <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
                <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong!</h2>
                <div className="bg-stone-900/90 p-6 rounded-lg shadow-sm border border-red-500/30 w-full text-left overflow-auto mb-6">
                    <p className="font-mono text-sm text-red-400 break-words whitespace-pre-wrap">
                        {error.message}
                    </p>
                    {error.stack && (
                        <details className="mt-4">
                            <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-400">Stack Trace</summary>
                            <pre className="mt-2 text-xs text-stone-500 overflow-auto max-h-64">
                                {error.stack}
                            </pre>
                        </details>
                    )}
                </div>
                <Button onClick={() => reset()} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white">
                    Try again
                </Button>
            </div>
        </div>
    );
}
