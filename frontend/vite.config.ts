// frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()], // Ya no necesitas el plugin de tailwindcss
});