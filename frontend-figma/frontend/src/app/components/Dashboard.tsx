import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Paper,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SupportShell from './SupportShell';

const API_URL = 'http://localhost:3000';

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
    { label: 'Total', value: tickets.length, color: '#1e3a5f' },
    { label: 'Abiertos', value: tickets.filter((t) => t.status === 'open').length, color: '#b45309' },
    { label: 'En proceso', value: tickets.filter((t) => t.status === 'in-progress').length, color: '#1d4ed8' },
    { label: 'Resueltos', value: tickets.filter((t) => t.status === 'resolved').length, color: '#047857' }
  ];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

  const getStatusLabel = (status: string) => {
    if (status === 'open') return 'Abierto';
    if (status === 'in-progress') return 'En proceso';
    if (status === 'resolved') return 'Resuelto';
    return status;
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    if (status === 'open') return 'warning';
    if (status === 'in-progress') return 'info';
    if (status === 'resolved') return 'success';
    return 'default';
  };

  const recentTickets = tickets.slice(0, 5);

  return (
    <SupportShell
      title="Panel de soporte"
      subtitle="Resumen de tus solicitudes y accesos rápidos."
      breadcrumbs={[{ label: 'Inicio' }]}
    >
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={6} md={3} key={stat.label}>
            <Card
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: stat.color }}>
                  {loading ? '—' : stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/create-ticket')}>
          Nueva solicitud
        </Button>
        <Button variant="outlined" startIcon={<ListAltIcon />} onClick={() => navigate('/tickets')}>
          Ver todas
        </Button>
        <Button variant="outlined" onClick={() => navigate('/tickets?status=open')}>
          Solo abiertos
        </Button>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafbfc' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Actividad reciente
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : recentTickets.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay solicitudes. Creá la primera.</Typography>
            <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/create-ticket')}>
              Crear solicitud
            </Button>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate('/tickets')}
                >
                  <TableCell>{ticket.id}</TableCell>
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
      </Paper>
    </SupportShell>
  );
}
