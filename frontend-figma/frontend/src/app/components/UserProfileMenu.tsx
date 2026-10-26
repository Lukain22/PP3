import { useState, type ReactNode } from 'react';
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
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { toast } from 'sonner';
import { clearAuth, getEmail, getRole, getUserInitials } from '../../lib/auth';
import type { Language } from '../../lib/i18n';
import { usePreferences } from '../PreferencesProvider';

export default function UserProfileMenu() {
  const navigate = useNavigate();
  const { t, theme, language, setTheme, setLanguage } = usePreferences();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const email = getEmail();
  const open = Boolean(anchorEl);
  const roleKey = getRole() === 'admin' ? 'role.admin' : getRole() === 'technician' ? 'role.technician' : 'role.user';

  const handleLogout = () => {
    setAnchorEl(null);
    clearAuth();
    navigate('/');
  };

  const changeTheme = async (next: 'light' | 'dark') => {
    if (next === theme) return;
    try {
      await setTheme(next);
    } catch {
      toast.error(language === 'en' ? 'Could not save appearance' : 'No se pudo guardar la apariencia');
    }
  };

  const changeLanguage = async (next: Language) => {
    if (next === language) return;
    try {
      await setLanguage(next);
    } catch {
      toast.error(next === 'en' ? 'Could not save language' : 'No se pudo guardar el idioma');
    }
  };

  return (
    <>
      <Tooltip title={t('profile.menu')}>
        <IconButton
          size="small"
          aria-label={t('profile.menu')}
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
            sx: { width: 280, mt: 0.75 }
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {t('profile.signedIn')}
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
            {email || t('role.user')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {t('profile.role')}: {t(roleKey)}
          </Typography>
        </Box>

        <Divider />

        <Box sx={{ px: 2, py: 1.25 }} onClick={(event) => event.stopPropagation()}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            {t('profile.appearance')}
          </Typography>
          <Segment
            ariaLabel={t('profile.appearance')}
            value={theme}
            options={[
              { value: 'light', label: t('profile.light'), icon: <LightModeOutlinedIcon sx={{ fontSize: 16 }} /> },
              { value: 'dark', label: t('profile.dark'), icon: <DarkModeOutlinedIcon sx={{ fontSize: 16 }} /> }
            ]}
            onChange={(value) => changeTheme(value as 'light' | 'dark')}
          />
        </Box>

        <Box sx={{ px: 2, pt: 0.25, pb: 1.25 }} onClick={(event) => event.stopPropagation()}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            {t('profile.language')}
          </Typography>
          <Segment
            ariaLabel={t('profile.language')}
            value={language}
            options={[
              { value: 'es', label: 'Español' },
              { value: 'en', label: 'English' }
            ]}
            onChange={(value) => changeLanguage(value as Language)}
          />
        </Box>

        <Divider />

        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={t('profile.logout')}
            primaryTypographyProps={{ sx: { color: 'error.main', fontWeight: 500 } }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}

function Segment({
  ariaLabel,
  value,
  options,
  onChange
}: {
  ariaLabel: string;
  value: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  onChange: (value: string) => void;
}) {
  return (
    <Box
      role="group"
      aria-label={ariaLabel}
      sx={{
        height: 36,
        display: 'flex',
        p: '3px',
        gap: '3px',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'action.hover'
      }}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              minWidth: 0,
              border: 0,
              borderRadius: 0.75,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              px: 1,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 13,
              fontWeight: selected ? 600 : 500,
              color: selected ? 'primary.main' : 'text.secondary',
              bgcolor: selected ? 'background.paper' : 'transparent',
              boxShadow: selected ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none'
            }}
          >
            {option.icon}
            {option.label}
          </Box>
        );
      })}
    </Box>
  );
}
