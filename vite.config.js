import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function dualModeEntryPlugin() {
  return {
    name: 'azrya-dual-mode-entry',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(
          /<!-- VITE_ENTRY_START -->[\s\S]*?<!-- VITE_ENTRY_END -->/,
          '<script type="module" src="/src/main.jsx"></script>'
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [dualModeEntryPlugin(), react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/app.css';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
