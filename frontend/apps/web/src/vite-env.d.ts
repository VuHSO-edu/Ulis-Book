/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly FIS_APP_NAME: string;
  readonly FIS_API_BASE_URL: string;
  readonly FIS_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
