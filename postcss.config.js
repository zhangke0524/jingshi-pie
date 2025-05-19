import postcssTailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

/** @type {import('postcss').Config} */
export default {
  plugins: [
    postcssTailwind,
    autoprefixer,
  ],
};