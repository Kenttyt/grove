/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_SHOW_SYSTEM_STATUS?: string
  // add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}