/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: { cyan: '#00FFF0', pink: '#FF007F', purple: '#8A2BE2', blue: '#00BFFF', yellow: '#FFD700', green: '#00FF7F', red: '#FF0040' }
      },
      fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
    },
  },
  plugins: [],
}
