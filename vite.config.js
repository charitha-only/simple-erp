import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/simple-erp/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        audio: resolve(__dirname, 'audio.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        files: resolve(__dirname, 'files.html'),
        pdf: resolve(__dirname, 'pdf.html'),
        profile: resolve(__dirname, 'profile.html'),
        signup: resolve(__dirname, 'signup.html')
      }
    }
  }
});
