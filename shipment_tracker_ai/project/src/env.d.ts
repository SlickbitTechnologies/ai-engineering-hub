/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_ENABLE_REAL_TIME_UPDATES: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_MAPS_API_KEY: string
  readonly VITE_WEATHER_API_KEY: string
  readonly VITE_DEFAULT_TIMEZONE: string
  readonly VITE_MAX_TEMPERATURE_THRESHOLD: string
  readonly VITE_MIN_TEMPERATURE_THRESHOLD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 