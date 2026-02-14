import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--color-bg)",
                foreground: "var(--color-text)",
                primary: "var(--color-primary)",
                secondary: "var(--color-secondary)",
                accent: "var(--color-accent)",
                stone: {
                    900: "#1C1917",
                },
            },
            fontFamily: {
                sans: ["var(--font-quicksand)", "sans-serif"],
                serif: ["var(--font-merriweather)", "serif"],
            },
            borderRadius: {
                "3xl": "1.5rem",
            },
            boxShadow: {
                "soft-red": "0 10px 40px -10px rgba(217, 65, 65, 0.2)",
            },
        },
    },
    plugins: [],
};
export default config;
