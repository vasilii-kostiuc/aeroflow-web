import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import { App } from '@/app/App'
import { configureAuth } from '@/features/auth/model/configureAuth'

import '@/index.css'

configureAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
