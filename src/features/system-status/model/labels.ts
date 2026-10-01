import type { ComponentState } from './types'

export const stateLabels: Record<ComponentState, string> = {
  ok: 'Работает',
  warning: 'Внимание',
  down: 'Не работает',
  unknown: 'Неизвестно',
}

/** Semantic theme colors (task 030). */
export const stateColors: Record<ComponentState, string> = {
  ok: 'success',
  warning: 'warning',
  down: 'danger',
  unknown: 'gray',
}

export const overallTitles: Record<ComponentState, string> = {
  ok: 'Все компоненты работают',
  warning: 'Есть предупреждения',
  down: 'Есть неработающие компоненты',
  unknown: 'Состояние части компонентов неизвестно',
}
