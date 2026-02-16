/// <reference types="vite/client" />

  readonly VITE_USE_MOCK: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_FMP_API_KEY: string
  readonly VITE_FINNHUB_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
