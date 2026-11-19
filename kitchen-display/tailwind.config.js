/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {
            colors: {
                kitchen: {
                    dark: '#111827',
                    card: '#1f2937',
                    border: '#374151',
                },
            },
            fontFamily: {
                mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
            },
        },
    },
    plugins: [],
};
