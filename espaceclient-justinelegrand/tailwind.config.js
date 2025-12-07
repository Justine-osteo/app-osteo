/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        fond: '#F3D8DD',
        accent: '#B05F63',
        hover: '#6E4B42',
      },
      fontFamily: {
        titre: ['var(--font-title)', 'cursive'],
        texte: ['var(--font-sans)', 'sans-serif'],
      },

    },
  },
  plugins: [],
};
