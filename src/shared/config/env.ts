const coreApiUrl = import.meta.env.VITE_CORE_API_URL?.trim()

export const env = {
  coreApiUrl: coreApiUrl || '/api',
} as const
