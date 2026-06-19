import type { PropsWithChildren } from 'react'

import { MantineProvider } from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import { QueryClientProvider } from '@tanstack/react-query'

import { queryClient } from '@/app/providers/queryClient'
import { theme } from '@/app/theme/theme'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  )
}
