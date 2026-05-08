import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function TicketsList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [tickets] = useState<TicketData[]>([
    {
      id: 'T-001',
      title: 'Página de inicio de sesión no responde',
      description: 'Los usuarios no pueden iniciar sesión',
      status: 'open',
      priority: 'high',
      createdAt: '2026-05-06'
    },
    {
      id: 'T-002',
      title: 'Tiempo de espera de conexión a base de datos',
      description: 'La conexión se agota después de 30 segundos',
      status: 'in-progress',
      priority: 'high',
      createdAt: '2026-05-05'
    },
    {
      id: 'T-003',
      title: 'Actualizar función de perfil de usuario',
      description: 'Agregar capacidad para actualizar foto de perfil',
      status: 'in-progress',
      priority: 'medium',
      createdAt: '2026-05-04'
    },
    {
      id: 'T-004',
      title: 'Corregir error tipográfico en panel',
      description: 'Error ortográfico en el panel principal',
      status: 'resolved',
      priority: 'low',
      createdAt: '2026-05-03'
    },
    {
      id: 'T-005',
      title: 'Notificación por correo no funciona',
      description: 'Los usuarios no reciben notificaciones',
      status: 'open',
      priority: 'medium',
      createdAt: '2026-05-02'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'warning';
      case 'in-progress':
        return 'info';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'ABIERTO';
      case 'in-progress':
        return 'EN PROGRESO';
      case 'resolved':
        return 'RESUELTO';
      default:
        return status.toUpperCase();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'ALTA';
      case 'medium':
        return 'MEDIA';
      case 'low':
        return 'BAJA';
      default:
        return priority.toUpperCase();
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const statusFilter = new URLSearchParams(location.search).get('status');
  const filteredTickets = statusFilter
    ? tickets.filter((t) => t.status === statusFilter)
    : tickets;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <AppBar position="static" color="primary" elevation={0} sx={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexGrow: 1, minWidth: 0 }}>
            <Box
              component="img"
              alt="Logo"
              src="/logo-itb.png"
              sx={{
                height: 28,
                width: 28,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.92)',
                p: 0.5
              }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Soporte Técnico
            </Typography>
          </Box>

          <Tooltip title="Créditos">
            <IconButton
              color="inherit"
              onClick={() => navigate('/credits')}
              size="small"
              sx={{
                mr: 0.75,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Lista de Tickets
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
            >
              Volver
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/create-ticket')}
              sx={{ px: 3 }}
            >
              + Nuevo Ticket
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 500 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} hover>
                  <TableCell>{ticket.id}</TableCell>
                  <TableCell>{ticket.title}</TableCell>
                  <TableCell>{ticket.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(ticket.status)}
                      color={getStatusColor(ticket.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPriorityLabel(ticket.priority)}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{ticket.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
}
