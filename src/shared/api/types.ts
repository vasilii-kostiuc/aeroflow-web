export type ApiError = {
  status: number
  code?: string
  message: string
  violations?: Record<string, string[]>
}

export type ApiResponse<TData> = {
  success: boolean
  data: TData
  message: string
  errors: Array<{
    message: string
    field?: string | null
    code?: string | null
  }>
}
