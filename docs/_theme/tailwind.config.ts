import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default <Partial<Config>>{
  theme: {
    extend: {
      fontFamily: {
        sans: ["nunito", "sans-serif", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        yellow: {
          50: '#FEFDF7',
          100: '#FDFCEF',
          200: '#FAF6D6',
          300: '#F7F1BD',
          400: '#F2E78C',
          500: '#ECDC5A',
          600: '#D4C651',
          700: '#8E8436',
          800: '#6A6329',
          900: '#47421B',
          950: '#2F2C12',
        },
        theme: {
          50: "#fff8eb",
          100: "#ffedc6",
          200: "#ffd888",
          300: "#ffbe4a",
          400: "#ffac33",
          500: "#f98007",
          600: "#dd5b02",
          700: "#b73c06",
          800: "#942e0c",
          900: "#7a260d",
          950: "#461102",
        },
      },
    },
  },
};
