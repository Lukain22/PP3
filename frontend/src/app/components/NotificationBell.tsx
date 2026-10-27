import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Tooltip,
  Typography
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { clearAuth, getToken } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

export interface AppNotification {
  id: number;
  ticket_id: number;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
  actor_email?: string | null;
  ticket_title?: string;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const apiCall = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      clearAuth();
      navigate('/');
      return null;
    }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }, [navigate]);

  const refreshUnreadCount = useCallback(async () => {
    const result = await apiCall('/notifications/unread-count');
    if (result?.response.ok) {
      setUnreadCount(Number(result.data.count) || 0);
    }
  }, [apiCall]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const result = await apiCall('/notifications?limit=20');
    if (result?.response.ok && Array.isArray(result.data)) {
      setItems(result.data);
    }
    await refreshUnreadCount();
    setLoading(false);
  }, [apiCall, refreshUnreadCount]);

  useEffect(() => {
    refreshUnreadCount();
    const interval = window.setInterval(refreshUnreadCount, 45000);
    return () => window.clearInterval(interval);
  }, [refreshUnreadCount]);

  const openMenu = async (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    await loadNotifications();
  };

  const closeMenu = () => setAnchorEl(null);

  const handleOpenNotification = async (item: AppNotification) => {
    if (!item.read_at) {
      await apiCall(`/notifications/${item.id}/read`, { method: 'PATCH' });
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    closeMenu();
    navigate(`/tickets/${item.ticket_id}`);
  };

  const handleMarkAllRead = async () => {
    const result = await apiCall('/notifications/read-all', { method: 'PATCH' });
    if (!result?.response.ok) return;
    setItems((prev) => prev.map((entry) => ({ ...entry, read_at: entry.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  const menuOpen = Boolean(anchorEl);

  return (
    <>
      <Tooltip title="Notificaciones">
        <IconButton size="small" aria-label="Notificaciones" onClick={openMenu}>
          <Badge color="error" badgeContent={unreadCount > 0 ? unreadCount : undefined} max={99}>
            <NotificationsNoneIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={menuOpen}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 360, maxWidth: '95vw', maxHeight: 420, display: 'flex', flexDirection: 'column' }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              Marcar todas
            </Button>
          )}
        </Box>

        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ px: 2, py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No tenés notificaciones.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ overflow: 'auto' }}>
            {items.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleOpenNotification(item)}
                sx={{
                  alignItems: 'flex-start',
                  bgcolor: item.read_at ? undefined : 'action.hover',
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <ListItemText
                  primary={item.title}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary" sx={{ display: 'block' }}>
                        {item.message}
                      </Typography>
                      <Typography component="span" variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
                        {formatWhen(item.created_at)}
                      </Typography>
                    </>
                  }
                  primaryTypographyProps={{ fontWeight: item.read_at ? 400 : 600, fontSize: '0.9rem' }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Popover>
    </>
  );
}
