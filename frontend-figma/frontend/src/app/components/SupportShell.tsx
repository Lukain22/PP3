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
import AddIcon from '@mui/icons-material/Add';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { isAdmin, isTechnician, clearAuth, getHomePath, getRole } from '../../lib/auth';
import { getTicketsPath } from '../../lib/ticketViews';

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
  const canCreateTicket = !isTechnician();

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
        <Toolbar sx={{ gap: 1.5, minHeight: { xs: 56, sm: 64 } }}>
          <Box
            component="img"
            alt="Logo"
            src="/logo-itb.png"
            sx={{ height: 32, width: 32, borderRadius: 1, cursor: 'pointer', flexShrink: 0 }}
            onClick={() => navigate(isAdmin() ? '/dashboard' : getHomePath())}
          />

          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, lineHeight: 1.2, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}
          >
            Soporte Técnico
          </Typography>

          <Button
            size="small"
            variant="text"
            onClick={() => navigate(getTicketsPath(getRole()))}
            sx={{ flexShrink: 0, fontWeight: 500, ml: { xs: 0, sm: -0.5 } }}
          >
            Solicitudes
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          {isAdmin() && (
            <Tooltip title="Administración">
              <IconButton onClick={() => navigate('/admin')} size="small" color="primary" sx={{ flexShrink: 0 }}>
                <AdminPanelSettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Notificaciones (próximamente)">
            <span>
              <IconButton size="small" disabled aria-label="Notificaciones">
                <NotificationsNoneIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {canCreateTicket && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-ticket')}
              sx={{ flexShrink: 0, display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Nueva solicitud
            </Button>
          )}
          {canCreateTicket && (
            <Tooltip title="Nueva solicitud">
              <IconButton
                color="primary"
                size="small"
                onClick={() => navigate('/create-ticket')}
                sx={{ display: { xs: 'inline-flex', sm: 'none' }, bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Créditos">
            <IconButton onClick={() => navigate('/credits')} size="small" sx={{ flexShrink: 0 }}>
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
            sx={{ flexShrink: 0 }}
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
