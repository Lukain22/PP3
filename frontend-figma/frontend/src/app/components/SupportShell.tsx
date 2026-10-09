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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationBell from './NotificationBell';
import UserProfileMenu from './UserProfileMenu';
import { isAdmin, getHomePath, getRole, can } from '../../lib/auth';
import { getTicketsPath } from '../../lib/ticketViews';

type Crumb = { label: string; to?: string };

interface SupportShellProps {
  children: ReactNode;
  title: string;
  subtitle?: ReactNode;
  breadcrumbs?: Crumb[];
  backTo?: string;
  headerAction?: ReactNode;
  headerActionInline?: boolean;
  headerActionGrow?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  compact?: boolean;
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
  headerActionInline = false,
  headerActionGrow = false,
  maxWidth = false,
  compact = false
}: SupportShellProps) {
  const navigate = useNavigate();
  const canCreateTicket = can('tickets.create');

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f0f2f5',
      ...(compact && {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      })
    }}>
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
            onClick={() => navigate('/dashboard')}
            sx={{ flexShrink: 0, fontWeight: 500, ml: { xs: 0, sm: -0.5 } }}
          >
            Inicio
          </Button>

          <Button
            size="small"
            variant="text"
            onClick={() => navigate(getTicketsPath(getRole()))}
            sx={{ flexShrink: 0, fontWeight: 500 }}
          >
            Solicitudes
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          {can('admin.access') && (
            <Tooltip title="Administración">
              <IconButton onClick={() => navigate('/admin')} size="small" color="primary" sx={{ flexShrink: 0 }}>
                <AdminPanelSettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <NotificationBell />

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

          <UserProfileMenu />
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={maxWidth}
        disableGutters={maxWidth === false}
        sx={{
          py: compact ? 1.25 : 3,
          px: maxWidth === false ? (compact ? { xs: 1.5, sm: 2 } : { xs: 2, sm: 3, md: 4, xl: 5 }) : undefined,
          width: '100%',
          ...(compact && {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column'
          })
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

        <Box sx={{ mb: compact ? 1 : 2.5, display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: headerActionInline ? 'flex-start' : 'space-between',
                gap: headerActionInline ? 3 : 2,
                flexWrap: 'wrap'
              }}
            >
              <Typography
                variant={compact ? 'h6' : 'h4'}
                sx={{
                  fontWeight: 600,
                  fontSize: compact ? '1.125rem' : { xs: '1.35rem', md: '1.75rem' },
                  lineHeight: compact ? 1.2 : undefined,
                  flexShrink: 0
                }}
              >
                {title}
              </Typography>
              {headerActionGrow ? (
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                  {headerAction}
                </Box>
              ) : (
                headerAction
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={compact ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}>
          {children}
        </Box>
      </Container>
    </Box>
  );
}
