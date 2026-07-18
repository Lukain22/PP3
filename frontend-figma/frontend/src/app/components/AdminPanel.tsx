import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Chip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import TimerIcon from '@mui/icons-material/Timer';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupportShell from './SupportShell';

const sections = [
  {
    title: 'Grupos',
    description: 'Organizá equipos de resolución y asigná técnicos.',
    icon: <GroupWorkIcon fontSize="large" color="primary" />,
    to: '/admin/groups'
  },
  {
    title: 'SLA',
    description: 'Configurá tiempos de respuesta y resolución por prioridad.',
    icon: <TimerIcon fontSize="large" color="primary" />,
    to: '/admin/sla'
  },
  {
    title: 'Usuarios',
    description: 'Gestioná cuentas, roles y pertenencia a grupos.',
    icon: <PeopleIcon fontSize="large" color="primary" />,
    to: '/admin/users'
  },
  {
    title: 'Roles',
    description: 'Próximamente: permisos granulares por rol.',
    icon: <AdminPanelSettingsIcon fontSize="large" color="disabled" />,
    to: '',
    disabled: true
  }
];

export default function AdminPanel() {
  const navigate = useNavigate();

  return (
    <SupportShell
      title="Administración"
      subtitle="Configuración del sistema de soporte"
    >
      <Grid container spacing={2.5}>
        {sections.map((section) => (
          <Grid key={section.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                height: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                opacity: section.disabled ? 0.72 : 1
              }}
            >
              <Box>{section.icon}</Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                  {section.title}
                </Typography>
                {section.disabled && <Chip label="Próximamente" size="small" />}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {section.description}
              </Typography>
              <Button
                variant={section.disabled ? 'outlined' : 'contained'}
                disabled={section.disabled}
                onClick={() => section.to && navigate(section.to)}
              >
                {section.disabled ? 'En desarrollo' : 'Abrir'}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </SupportShell>
  );
}
