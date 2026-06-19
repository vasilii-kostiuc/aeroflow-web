import { createTheme } from '@mantine/core'

const fontFamily =
  'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily,
  headings: {
    fontFamily,
  },
})
