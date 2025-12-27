/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0f172a", // Deep dark blue
                primary: "#3b82f6", // Blue
                secondary: "#64748b", // Slate
                accent: "#10b981", // Emerald
                danger: "#ef4444", // Red
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
