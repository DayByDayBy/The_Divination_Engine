/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_REPORTING: string
  readonly VITE_ENABLE_PERFORMANCE_MONITORING: string
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_ENABLE_AI_INTERPRETATIONS: string
  readonly VITE_ENABLE_USER_AUTH: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_GOOGLE_ANALYTICS_ID?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
  glob(pattern: string): Record<string, () => Promise<any>>
  glob<E>(pattern: string, options: { eager: true }): Record<string, E>
}
