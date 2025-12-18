/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
            },
            colors: {
                'matrix-green': '#00ff41',
                'mekong-gold': '#ffd700',
                'mekong-silt': '#8b6914',
            },
            animation: {
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
