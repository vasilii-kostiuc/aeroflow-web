import type {
  BoardStatus,
  DispatcherActionType,
  DispatcherFilterType,
} from './types'

export const dispatcherActions: DispatcherActionType[] = [
  'check_in_opening',
  'check_in_closing',
  'boarding_invitation',
  'arrival',
]

/** Action filters shown on the board: the four launch actions plus "start next run". */
export const dispatcherFilters: DispatcherFilterType[] = [
  ...dispatcherActions,
  'start_next_run',
]

export const actionLabels: Record<DispatcherActionType, string> = {
  check_in_opening: 'Начало регистрации',
  check_in_closing: 'Окончание регистрации',
  boarding_invitation: 'Посадка',
  arrival: 'Прибытие',
}

export const filterLabels: Record<DispatcherFilterType, string> = {
  ...actionLabels,
  start_next_run: 'Новый запуск',
}

export const statusLabels: Record<BoardStatus, string> = {
  not_started: 'Не начат',
  scheduled: 'Запланирован',
  check_in_open: 'Регистрация открыта',
  check_in_closed: 'Регистрация закрыта',
  boarding: 'Посадка',
  arrival_announced: 'Прибытие объявлено',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

/**
 * For the dispatcher a `scheduled` occurrence (created but not yet acted upon)
 * is indistinguishable from a card without an occurrence: registration has not
 * started either way. The occurrence is an implementation detail, so the board
 * collapses both into a single "not started" state.
 */
export function isBoardStarted(status: BoardStatus): boolean {
  return status !== 'not_started' && status !== 'scheduled'
}

export function boardStatusLabel(status: BoardStatus): string {
  return isBoardStarted(status) ? statusLabels[status] : statusLabels.not_started
}

export function actionRequiresCounters(action: DispatcherActionType): boolean {
  return action === 'check_in_opening'
}

export function actionRequiresGate(action: DispatcherActionType): boolean {
  return action === 'boarding_invitation'
}
