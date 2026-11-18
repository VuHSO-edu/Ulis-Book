import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let baseUrl = env.FIS_BASE_URL;
  if (baseUrl && !baseUrl.endsWith('/')) baseUrl += '/';
  return {
    plugins: [react()],
    envPrefix: ['FIS_', 'VITE_'],
    resolve: {
      alias: { '@': resolve(process.cwd(), 'src') },
    },
    server: {
      host: true,
      port: 5173,
    },
    base: baseUrl ?? '/',
  };
});
