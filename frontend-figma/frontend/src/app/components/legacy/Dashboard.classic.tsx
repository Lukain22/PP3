import { useEffect, useState } from 'react';
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
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import UiModeToggle from '../UiModeToggle';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    fetch(`${API_URL}/tickets`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return [];
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const stats = [
    { label: 'Total', value: tickets.length, color: '#111827' },
    { label: 'Abiertos', value: tickets.filter((t) => t.status === 'open').length, color: '#b45309' },
    { label: 'En Proceso', value: tickets.filter((t) => t.status === 'in-progress').length, color: '#1d4ed8' },
    { label: 'Resueltos', value: tickets.filter((t) => t.status === 'resolved').length, color: '#047857' }
  ];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const getStatusLabel = (status: string) => {
    if (status === 'open') return 'ABIERTO';
    if (status === 'in-progress') return 'EN PROGRESO';
    if (status === 'resolved') return 'RESUELTO';
    return status.toUpperCase();
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    if (status === 'open') return 'warning';
    if (status === 'in-progress') return 'info';
    if (status === 'resolved') return 'success';
    return 'default';
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const recentTickets = tickets.slice(0, 5);

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

          <UiModeToggle />
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

      <Container maxWidth={false} disableGutters sx={{ py: 3, px: { xs: 2, sm: 3, md: 4, xl: 5 } }}>
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            Mis Tickets
          </Typography>
          <Button
            variant="contained"
            size="medium"
            onClick={() => navigate('/create-ticket')}
            sx={{ px: 3 }}
          >
            + Nuevo Ticket
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((stat) => (
            <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
              <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <CardContent sx={{ py: 2, px: 2.5, textAlign: 'center' }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ display: 'block', lineHeight: 1.2, letterSpacing: '0.08em' }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 600, mt: 0.75, color: stat.color }}>
                    {loading ? '—' : stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)', mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Tickets Recientes
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={32} />
              </Box>
            ) : recentTickets.length === 0 ? (
              <Typography color="text.secondary">No tienes tickets aún. Crea el primero.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                    <TableCell sx={{ fontWeight: 500 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>Título</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>Fecha</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentTickets.map((ticket) => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>{ticket.title}</TableCell>
                      <TableCell>
                        <Chip label={getStatusLabel(ticket.status)} color={getStatusColor(ticket.status)} size="small" />
                      </TableCell>
                      <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
              Accesos Rápidos
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              <Button variant="outlined" onClick={() => navigate('/tickets')}>
                Ver Todos los Tickets
              </Button>
              <Button variant="outlined" onClick={() => navigate('/tickets?status=open')}>
                Mis Tickets Abiertos
              </Button>
              <Button variant="outlined" onClick={() => navigate('/tickets?status=resolved')}>
                Historial
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
