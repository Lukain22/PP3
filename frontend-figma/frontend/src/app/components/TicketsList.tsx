import { useEffect, useState } from 'react';
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
  Chip,
  CircularProgress,
  TextField,
  MenuItem
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';

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

export default function TicketsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' | 'default' => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    if (priority === 'low') return 'success';
    return 'default';
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'high') return 'ALTA';
    if (priority === 'medium') return 'MEDIA';
    if (priority === 'low') return 'BAJA';
    return priority.toUpperCase();
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/');
      return null;
    }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setBusyId(ticketId);

    try {
      const result = await apiCall(`/tickets/${ticketId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (!result) return;

      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo actualizar');
        return;
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      toast.success('Estado actualizado');
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (ticketId: number, title: string) => {
    if (!window.confirm(`¿Eliminar el ticket "${title}"?`)) return;

    setBusyId(ticketId);

    try {
      const result = await apiCall(`/tickets/${ticketId}`, { method: 'DELETE' });

      if (!result) return;

      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo eliminar');
        return;
      }

      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast.success('Ticket eliminado');
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
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
            <Button variant="outlined" onClick={() => navigate('/dashboard')}>
              Volver
            </Button>
            <Button variant="contained" onClick={() => navigate('/create-ticket')} sx={{ px: 3 }}>
              + Nuevo Ticket
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredTickets.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <Typography color="text.secondary">
              {statusFilter ? 'No hay tickets con ese estado.' : 'No tienes tickets. Crea uno nuevo.'}
            </Typography>
          </Paper>
        ) : (
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
                  <TableCell sx={{ fontWeight: 500 }} align="center">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} hover>
                    <TableCell>#{ticket.id}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>{ticket.description}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <TextField
                        select
                        size="small"
                        value={ticket.status}
                        disabled={busyId === ticket.id}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="open">Abierto</MenuItem>
                        <MenuItem value="in-progress">En Proceso</MenuItem>
                        <MenuItem value="resolved">Resuelto</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getPriorityLabel(ticket.priority)}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Eliminar ticket">
                        <span>
                          <IconButton
                            color="error"
                            size="small"
                            disabled={busyId === ticket.id}
                            onClick={() => handleDelete(ticket.id, ticket.title)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
