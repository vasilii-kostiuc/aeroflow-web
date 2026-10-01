export type ComponentState = 'ok' | 'warning' | 'down' | 'unknown'

export type ComponentStatus = {
  key: string
  name: string
  status: ComponentState
  detail: string
}

export type SystemStatus = {
  checkedAt: string
  overall: ComponentState
  components: ComponentStatus[]
}

/** A problem the dispatcher must know about: announcements may not sound. */
export type SystemAlert = {
  key: string
  message: string
}
