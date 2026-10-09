import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import TimerIcon from '@mui/icons-material/Timer';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SupportShell from './SupportShell';
import { can } from '../../lib/auth';

const sections = [
  {
    title: 'Grupos',
    description: 'Organizá equipos de resolución y asigná técnicos.',
    icon: <GroupWorkIcon fontSize="large" color="primary" />,
    to: '/admin/groups',
    permission: 'admin.groups'
  },
  {
    title: 'SLA',
    description: 'Configurá tiempos de respuesta y resolución por prioridad.',
    icon: <TimerIcon fontSize="large" color="primary" />,
    to: '/admin/sla',
    permission: 'admin.settings'
  },
  {
    title: 'Usuarios',
    description: 'Gestioná cuentas, perfiles y pertenencia a grupos.',
    icon: <PeopleIcon fontSize="large" color="primary" />,
    to: '/admin/users',
    permission: 'admin.users'
  },
  {
    title: 'Roles',
    description: 'Definí roles, permisos y a qué grupos puede derivar cada uno.',
    icon: <AdminPanelSettingsIcon fontSize="large" color="primary" />,
    to: '/admin/roles',
    permission: 'admin.roles'
  },
  {
    title: 'Soluciones',
    description: 'Base de conocimiento para reutilizar resoluciones por grupo.',
    icon: <MenuBookIcon fontSize="large" color="primary" />,
    to: '/admin/solutions',
    permission: ['kb.create', 'kb.edit', 'kb.delete', 'kb.publish', 'kb.approve']
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
        {sections.filter((section) => Array.isArray(section.permission) ? section.permission.some((code) => can(code)) : can(section.permission)).map((section) => (
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
                gap: 1.5
              }}
            >
              <Box>{section.icon}</Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                {section.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {section.description}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate(section.to)}
              >
                Abrir
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </SupportShell>
  );
}
