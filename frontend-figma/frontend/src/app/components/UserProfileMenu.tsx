import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { clearAuth, getEmail, getRoleLabel, getUserInitials } from '../../lib/auth';

export default function UserProfileMenu() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const email = getEmail();
  const roleLabel = getRoleLabel();
  const open = Boolean(anchorEl);

  const handleLogout = () => {
    setAnchorEl(null);
    clearAuth();
    navigate('/');
  };

  return (
    <>
      <Tooltip title="Mi perfil">
        <IconButton
          size="small"
          aria-label="Mi perfil"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ flexShrink: 0, p: 0.25 }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {getUserInitials(email)}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 260, mt: 0.75 }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Conectado como
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {email || 'Usuario'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {roleLabel}
          </Typography>
        </Box>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar sesión"
            primaryTypographyProps={{ sx: { color: 'error.main', fontWeight: 500 } }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
