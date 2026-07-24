import type { AnnouncementType, BoardStatus, DispatcherActionType } from './types'

export const dispatcherActions: DispatcherActionType[] = [
  'check_in_opening',
  'check_in_closing',
  'boarding_invitation',
  'arrival',
]

export const actionLabels: Record<DispatcherActionType, string> = {
  check_in_opening: 'Начало регистрации',
  check_in_closing: 'Окончание регистрации',
  boarding_invitation: 'Посадка',
  arrival: 'Прибытие',
}

/**
 * Labels for every announcement type the queue screen can show, including the
 * continuation series the dispatcher never launches by hand.
 */
export const announcementTypeLabels: Record<AnnouncementType, string> = {
  ...actionLabels,
  check_in_continuation: 'Продолжение регистрации',
  supplementary: 'Дополнительное объявление',
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

const FINISHED_STATUSES: BoardStatus[] = [
  'boarding',
  'arrival_announced',
  'completed',
  'cancelled',
]

/**
 * A run has reached the final status of its lifecycle and is ready to be
 * superseded by a new run. boarding/arrival_announced are reachable today;
 * completed/cancelled are reserved for a future completion action.
 */
export function isFinishedStatus(status: BoardStatus): boolean {
  return FINISHED_STATUSES.includes(status)
}

/**
 * Whether the card is in an active registration cycle. For the dispatcher both a
 * `scheduled` occurrence (created but not acted upon) and a *finished* one (its
 * run is over and the card is ready for a new run) read as "not started":
 * registration is not currently in progress. The occurrence is an implementation
 * detail, so the board collapses these into a single "not started" state.
 */
export function isBoardStarted(status: BoardStatus): boolean {
  return (
    status !== 'not_started' &&
    status !== 'scheduled' &&
    !isFinishedStatus(status)
  )
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
