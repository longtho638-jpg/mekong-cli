import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    bg: "#0a0a0f",
                    surface: "#12121a",
                    border: "#1e1e2e",
                    cyan: "#00f0ff",
                    magenta: "#ff00aa",
                    purple: "#8b5cf6",
                    green: "#00ff88",
                    yellow: "#ffd700",
                    red: "#ff3366",
                },
            },
            fontFamily: {
                mono: ["JetBrains Mono", "Fira Code", "monospace"],
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            animation: {
                "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
                "grid-flow": "grid-flow 20s linear infinite",
                "text-shimmer": "text-shimmer 3s ease-in-out infinite",
                "float": "float 6s ease-in-out infinite",
                "scan-line": "scan-line 8s linear infinite",
            },
            keyframes: {
                "glow-pulse": {
                    "0%": { opacity: "0.4", filter: "blur(20px)" },
                    "100%": { opacity: "0.8", filter: "blur(30px)" },
                },
                "grid-flow": {
                    "0%": { transform: "translateY(0)" },
                    "100%": { transform: "translateY(-50%)" },
                },
                "text-shimmer": {
                    "0%, 100%": { backgroundPosition: "0% 50%" },
                    "50%": { backgroundPosition: "100% 50%" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                },
                "scan-line": {
                    "0%": { transform: "translateY(-100%)" },
                    "100%": { transform: "translateY(100vh)" },
                },
            },
            backgroundImage: {
                "cyber-grid":
                    "linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)",
            },
            backgroundSize: {
                "cyber-grid": "60px 60px",
            },
        },
    },
    plugins: [],
};

export default config;
