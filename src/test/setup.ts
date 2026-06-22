import '@testing-library/jest-dom/vitest'

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

class ResizeObserverMock implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
