import { useEffect } from 'react'

import { Text } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useBlocker } from 'react-router'

export const UNSAVED_CHANGES_TITLE = 'Отменить несохранённые изменения?'
export const UNSAVED_CHANGES_MESSAGE = 'Изменения, которые вы не сохранили, будут потеряны.'

/** Ask before discarding unsaved edits; runs `onDiscard` when the user agrees. */
export function confirmDiscardChanges(onDiscard: () => void, onKeep?: () => void): void {
  modals.openConfirmModal({
    title: UNSAVED_CHANGES_TITLE,
    children: <Text size="sm">{UNSAVED_CHANGES_MESSAGE}</Text>,
    labels: { confirm: 'Отменить изменения', cancel: 'Остаться' },
    confirmProps: { color: 'red' },
    onConfirm: onDiscard,
    onCancel: onKeep,
  })
}

/**
 * While `dirty`, keep the user from silently losing edits: in-app navigation
 * (including search-param changes such as `?tab=`) asks for confirmation, and
 * closing or reloading the browser tab triggers the browser's own prompt.
 */
export function useUnsavedChangesGuard(dirty: boolean): void {
  const blocker = useBlocker(dirty)

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    confirmDiscardChanges(
      () => blocker.proceed(),
      () => blocker.reset(),
    )
  }, [blocker])

  useEffect(() => {
    if (!dirty) return

    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)

    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
}
