/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#05070A",
        surface: "#0D1117",
        primary: "#00F2FE", // Neon Cyan
        secondary: "#7000FF", // Electric Purple
        accent: "#00D1FF",
        muted: "#8B949E",
        border: "rgba(255, 255, 255, 0.1)",
        glass: "rgba(13, 17, 23, 0.7)",
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      backgroundImage: {
        "quantum-gradient": "linear-gradient(135deg, #00F2FE 0%, #7000FF 100%)",
        "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0, 242, 254, 0.3)",
        "neon-purple": "0 0 20px rgba(112, 0, 255, 0.3)",
      },
    },
  },
  plugins: [],
}
