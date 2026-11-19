import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, currentDir, '');
  let baseUrl = env.FIS_BASE_URL;
  if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
  return {
    plugins: [react()],
    envPrefix: ['FIS_', 'VITE_'],
    resolve: {
      alias: {
        '@': resolve(currentDir, 'src'),
        '@ulis/components': resolve(currentDir, 'src/packages/components/index.tsx'),
      },
    },
    server: {
      host: true,
      port: 5173,
    },
    base: baseUrl ?? '/',
  };
});
