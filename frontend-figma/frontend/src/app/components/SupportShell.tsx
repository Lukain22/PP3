import type { ReactNode } from 'react';
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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BuildIcon from '@mui/icons-material/Build';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { isAdmin, isTechnician, clearAuth, getHomePath } from '../../lib/auth';

type Crumb = { label: string; to?: string };

interface SupportShellProps {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  breadcrumbs?: Crumb[];
  backTo?: string;
  headerAction?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
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
  backTo,
  headerAction,
  maxWidth = false
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
            onClick={() => navigate(getHomePath())}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Soporte Técnico
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Portal de tickets
            </Typography>
          </Box>
          <Link
            component="button"
            underline="hover"
            onClick={() => navigate('/tickets')}
            sx={{
              cursor: 'pointer',
              border: 0,
              bgcolor: 'transparent',
              font: 'inherit',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'primary.main',
              flexShrink: 0,
              alignSelf: 'center',
              ml: 1.5
            }}
          >
            Solicitudes
          </Link>
          <Box sx={{ flexGrow: 1 }} />

          {/* <UiModeToggle /> */}

          {isTechnician() && (
            <Tooltip title="Panel técnico">
              <IconButton onClick={() => navigate('/panel-tecnico')} size="small" color="primary">
                <BuildIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {isAdmin() && (
            <Tooltip title="Panel de administración">
              <IconButton onClick={() => navigate('/admin')} size="small" color="primary">
                <AdminPanelSettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Créditos">
            <IconButton onClick={() => navigate('/credits')} size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              clearAuth();
              navigate('/');
            }}
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={maxWidth}
        disableGutters={maxWidth === false}
        sx={{
          py: 3,
          px: maxWidth === false ? { xs: 2, sm: 3, md: 4, xl: 5 } : undefined,
          width: '100%'
        }}
      >
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

        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {backTo && (
            <Tooltip title="Volver">
              <IconButton
                onClick={() => navigate(backTo)}
                aria-label="Volver"
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  mt: 0.25
                }}
              >
                <ArrowBackIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.35rem', md: '1.75rem' } }}>
                {title}
              </Typography>
              {headerAction}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {children}
      </Container>
    </Box>
  );
}
