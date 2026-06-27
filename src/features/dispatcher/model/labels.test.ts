import { describe, expect, it } from 'vitest'

import { boardStatusLabel, isBoardStarted } from './labels'

describe('board status display', () => {
  it('treats scheduled the same as not_started', () => {
    expect(isBoardStarted('not_started')).toBe(false)
    expect(isBoardStarted('scheduled')).toBe(false)
    expect(boardStatusLabel('scheduled')).toBe(boardStatusLabel('not_started'))
  })

  it('keeps real lifecycle statuses distinct', () => {
    expect(isBoardStarted('check_in_open')).toBe(true)
    expect(boardStatusLabel('check_in_open')).toBe('Регистрация открыта')
    expect(boardStatusLabel('check_in_closed')).toBe('Регистрация закрыта')
  })

  it('shows a finished run as not started (ready for a new run)', () => {
    expect(isBoardStarted('boarding')).toBe(false)
    expect(boardStatusLabel('boarding')).toBe(boardStatusLabel('not_started'))
    expect(boardStatusLabel('arrival_announced')).toBe(
      boardStatusLabel('not_started'),
    )
  })
})
