"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
    children: ReactNode;
    showRadialGradient?: boolean;
}

export const AuroraBackground = ({
    className,
    children,
    showRadialGradient = true,
    ...props
}: AuroraBackgroundProps) => {
    return (
        <main>
            <div
                className={cn(
                    "relative flex flex-col h-[100vh] items-center justify-center bg-slate-950 text-white transition-bg",
                    className
                )}
                {...props}
            >
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className={cn(
                            `
            [--aurora:repeating-linear-gradient(100deg,#3b82f6_10%,#8b5cf6_15%,#06b6d4_20%,#10b981_25%,#3b82f6_30%)]
            [background-image:var(--aurora)]
            [background-size:300%_200%]
            [background-position:50%_50%]
            pointer-events-none
            absolute
            -inset-[10px]
            opacity-50
            blur-[10px]
            invert-0
            will-change-transform
            `,
                            "[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]",
                            showRadialGradient &&
                            "[background-image:radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),transparent_50%),var(--aurora)]"
                        )}
                        style={{
                            animation: "aurora 60s linear infinite",
                        }}
                    ></div>
                </div>
                {children}
            </div>
            <style jsx>{`
        @keyframes aurora {
          0% {
            background-position: 50% 50%, 50% 50%;
          }
          100% {
            background-position: 350% 50%, 350% 50%;
          }
        }
      `}</style>
        </main>
    );
};
