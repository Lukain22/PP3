import { useNavigate } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  Container,
  Breadcrumbs,
  Link
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import UiModeToggle from './UiModeToggle';

type Crumb = { label: string; to?: string };

interface SupportShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function toggleUiMode() {
  const current = localStorage.getItem('ui-mode') || 'modern';
  localStorage.setItem('ui-mode', current === 'classic' ? 'modern' : 'classic');
  window.location.reload();
}

export function isClassicUi() {
  return localStorage.getItem('ui-mode') === 'classic';
}

export default function SupportShell({
  children,
  title,
  subtitle,
  breadcrumbs,
  maxWidth = 'lg'
}: SupportShellProps) {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f0f2f5' }}>
      <AppBar
        position="static"
        elevation={0}
        sx={{
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <Box
            component="img"
            alt="Logo"
            src="/logo-itb.png"
            sx={{ height: 32, width: 32, borderRadius: 1, cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Soporte Técnico
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Portal de tickets
            </Typography>
          </Box>

          <UiModeToggle />

          <Tooltip title="Créditos">
            <IconButton onClick={() => navigate('/credits')} size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth={maxWidth} sx={{ py: 3 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 1.5 }}>
            {breadcrumbs.map((crumb, i) =>
              crumb.to ? (
                <Link
                  key={i}
                  component="button"
                  underline="hover"
                  color="inherit"
                  onClick={() => navigate(crumb.to!)}
                  sx={{ cursor: 'pointer', border: 0, bgcolor: 'transparent', font: 'inherit' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={i} color="text.primary" variant="body2">
                  {crumb.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}

        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.35rem', md: '1.75rem' } }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {children}
      </Container>
    </Box>
  );
}
