/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f7f8fa",
        panel: "#ffffff",
        primary: "#1a73e8",
        muted: "#64748b",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [],
}


