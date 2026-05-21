/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MOCK_AUTH?: string;
  readonly VITE_DEV_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
