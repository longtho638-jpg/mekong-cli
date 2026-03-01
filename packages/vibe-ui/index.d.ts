/**
 * 🎨 VIBE UI - Aura Elite Design System
 *
 * Pattern 106: Composite Layout Animation Orchestration
 * Pattern 95: Reusable Component Topologies
 */
import type { ReactNode } from "react";
export declare const colors: {
    readonly primary: {
        readonly 50: "#f0f9ff";
        readonly 100: "#e0f2fe";
        readonly 500: "#0ea5e9";
        readonly 600: "#0284c7";
        readonly 900: "#0c4a6e";
    };
    readonly accent: {
        readonly 50: "#faf5ff";
        readonly 500: "#a855f7";
        readonly 600: "#9333ea";
    };
    readonly success: {
        readonly 500: "#22c55e";
        readonly 600: "#16a34a";
    };
    readonly dark: {
        readonly bg: "#0f172a";
        readonly card: "#1e293b";
        readonly border: "#334155";
    };
};
export declare const gradients: {
    readonly aura: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    readonly vibe: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
    readonly ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
    readonly sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
};
export declare const animations: {
    readonly fadeIn: {
        readonly initial: {
            readonly opacity: 0;
        };
        readonly animate: {
            readonly opacity: 1;
        };
        readonly exit: {
            readonly opacity: 0;
        };
    };
    readonly fadeInUp: {
        readonly initial: {
            readonly opacity: 0;
            readonly y: 20;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly y: 0;
        };
        readonly exit: {
            readonly opacity: 0;
            readonly y: -20;
        };
    };
    readonly slideInLeft: {
        readonly initial: {
            readonly opacity: 0;
            readonly x: -50;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly x: 0;
        };
    };
    readonly scaleIn: {
        readonly initial: {
            readonly opacity: 0;
            readonly scale: 0.9;
        };
        readonly animate: {
            readonly opacity: 1;
            readonly scale: 1;
        };
    };
    readonly stagger: (delay?: number) => {
        animate: {
            transition: {
                staggerChildren: number;
            };
        };
    };
};
export declare const transitions: {
    readonly spring: {
        readonly type: "spring";
        readonly stiffness: 300;
        readonly damping: 30;
    };
    readonly smooth: {
        readonly duration: 0.3;
        readonly ease: "easeInOut";
    };
    readonly bounce: {
        readonly type: "spring";
        readonly stiffness: 500;
        readonly damping: 25;
    };
};
export interface ButtonProps {
    variant: "primary" | "secondary" | "ghost" | "vibe";
    size: "sm" | "md" | "lg";
    loading?: boolean;
    children: ReactNode;
}
export interface CardProps {
    variant: "default" | "glass" | "gradient";
    hover?: boolean;
    children: ReactNode;
}
export interface BadgeProps {
    variant: "success" | "warning" | "error" | "info" | "vibe";
    size: "sm" | "md";
    children: ReactNode;
}
export interface CardProps {
    variant: "default" | "glass" | "gradient";
    hover?: boolean;
    children: React.ReactNode;
}
export interface BadgeProps {
    variant: "success" | "warning" | "error" | "info" | "vibe";
    size: "sm" | "md";
    children: React.ReactNode;
}
export declare const vibeClasses: {
    readonly glass: "backdrop-blur-xl bg-white/10 border border-white/20";
    readonly gradientText: "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent";
    readonly hoverScale: "transition-transform hover:scale-105";
    readonly hoverGlow: "hover:shadow-lg hover:shadow-purple-500/25";
    readonly focusRing: "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2";
};
declare const _default: {
    colors: {
        readonly primary: {
            readonly 50: "#f0f9ff";
            readonly 100: "#e0f2fe";
            readonly 500: "#0ea5e9";
            readonly 600: "#0284c7";
            readonly 900: "#0c4a6e";
        };
        readonly accent: {
            readonly 50: "#faf5ff";
            readonly 500: "#a855f7";
            readonly 600: "#9333ea";
        };
        readonly success: {
            readonly 500: "#22c55e";
            readonly 600: "#16a34a";
        };
        readonly dark: {
            readonly bg: "#0f172a";
            readonly card: "#1e293b";
            readonly border: "#334155";
        };
    };
    gradients: {
        readonly aura: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        readonly vibe: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
        readonly ocean: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
        readonly sunset: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)";
    };
    animations: {
        readonly fadeIn: {
            readonly initial: {
                readonly opacity: 0;
            };
            readonly animate: {
                readonly opacity: 1;
            };
            readonly exit: {
                readonly opacity: 0;
            };
        };
        readonly fadeInUp: {
            readonly initial: {
                readonly opacity: 0;
                readonly y: 20;
            };
            readonly animate: {
                readonly opacity: 1;
                readonly y: 0;
            };
            readonly exit: {
                readonly opacity: 0;
                readonly y: -20;
            };
        };
        readonly slideInLeft: {
            readonly initial: {
                readonly opacity: 0;
                readonly x: -50;
            };
            readonly animate: {
                readonly opacity: 1;
                readonly x: 0;
            };
        };
        readonly scaleIn: {
            readonly initial: {
                readonly opacity: 0;
                readonly scale: 0.9;
            };
            readonly animate: {
                readonly opacity: 1;
                readonly scale: 1;
            };
        };
        readonly stagger: (delay?: number) => {
            animate: {
                transition: {
                    staggerChildren: number;
                };
            };
        };
    };
    transitions: {
        readonly spring: {
            readonly type: "spring";
            readonly stiffness: 300;
            readonly damping: 30;
        };
        readonly smooth: {
            readonly duration: 0.3;
            readonly ease: "easeInOut";
        };
        readonly bounce: {
            readonly type: "spring";
            readonly stiffness: 500;
            readonly damping: 25;
        };
    };
    vibeClasses: {
        readonly glass: "backdrop-blur-xl bg-white/10 border border-white/20";
        readonly gradientText: "bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent";
        readonly hoverScale: "transition-transform hover:scale-105";
        readonly hoverGlow: "hover:shadow-lg hover:shadow-purple-500/25";
        readonly focusRing: "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2";
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map