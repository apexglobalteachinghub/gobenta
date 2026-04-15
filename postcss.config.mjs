/** PostCSS pipeline: Tailwind v4 + vendor prefixes for broad browser support */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};

export default config;
