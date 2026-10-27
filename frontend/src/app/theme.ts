import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeBackground {
    tableHeader: string;
  }
}

export type ThemeMode = 'light' | 'dark';

const tableHeader = {
  light: '#fafbfc',
  dark: '#162033'
} as const;

export function createAppTheme(mode: ThemeMode) {
  return createTheme({
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif'
    },
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            background: { default: '#F8FAFC', paper: '#ffffff', tableHeader: tableHeader.light },
            divider: '#E2E8F0'
          }
        : {
            primary: { main: '#60a5fa' },
            background: { default: '#0b1220', paper: '#111827', tableHeader: tableHeader.dark },
            divider: '#243044'
          })
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: tableHeader[mode]
          },
          stickyHeader: {
            backgroundColor: tableHeader[mode]
          }
        }
      }
    }
  });
}
