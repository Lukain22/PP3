import { createTheme } from '@mui/material/styles';

export type ThemeMode = 'light' | 'dark';

export function createAppTheme(mode: ThemeMode) {
  return createTheme({
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif'
    },
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: { default: '#F8FAFC', paper: '#ffffff' },
            divider: '#E2E8F0'
          }
        : {
            primary: { main: '#60a5fa' },
            background: { default: '#0b1220', paper: '#111827' },
            divider: '#243044'
          })
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: mode === 'dark' ? '#162033' : '#fafbfc'
          }
        }
      }
    }
  });
}
