import {
  Badge,
  Button,
  DEFAULT_THEME,
  Paper,
  Table,
  Title,
  createTheme,
} from '@mantine/core'

// Bundled with the app (@fontsource-variable/inter, imported in main.tsx), so the
// dispatcher's Windows workstations render the same face as development.
const fontFamily =
  '"Inter Variable", Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

/**
 * AeroFlow's visual language (task 030).
 *
 * Screens say what a colour *means* — success, warning, danger, info — and the
 * theme decides which palette that is. Neutral stays Mantine's `gray`, and the
 * primary action colour is `blue`.
 */
export const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: 'md',
  fontFamily,
  colors: {
    success: DEFAULT_THEME.colors.teal,
    warning: DEFAULT_THEME.colors.orange,
    danger: DEFAULT_THEME.colors.red,
    info: DEFAULT_THEME.colors.blue,
  },
  // A working tool: page titles sit just above the data, not over it.
  headings: {
    fontFamily,
    fontWeight: '650',
    sizes: {
      h1: { fontSize: '1.625rem', lineHeight: '1.25' },
      h2: { fontSize: '1.375rem', lineHeight: '1.3' },
      h3: { fontSize: '1.125rem', lineHeight: '1.35' },
      h4: { fontSize: '1rem', lineHeight: '1.4' },
      h5: { fontSize: '0.9375rem', lineHeight: '1.4' },
      h6: { fontSize: '0.875rem', lineHeight: '1.4' },
    },
  },
  components: {
    Badge: Badge.extend({
      defaultProps: { variant: 'light', radius: 'sm' },
    }),
    Button: Button.extend({
      defaultProps: { radius: 'md' },
    }),
    Paper: Paper.extend({
      defaultProps: { radius: 'md' },
    }),
    Table: Table.extend({
      defaultProps: { verticalSpacing: 'sm', highlightOnHover: true },
    }),
    Title: Title.extend({
      defaultProps: { textWrap: 'balance' },
    }),
  },
})
