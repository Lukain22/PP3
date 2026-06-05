import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLocation } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'sonner';
import SupportShell from './SupportShell';

const API_URL = 'http://localhost:3000';

type SortOption = 'date-desc' | 'date-asc' | 'priority-desc' | 'priority-asc' | 'title-asc';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: number;
}

const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'resolved', label: 'Resueltos' }
];

export default function TicketsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const statusFilter = new URLSearchParams(location.search).get('status') || '';

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

  const setStatusFilter = (status: string) => {
    if (status) {
      navigate(`/tickets?status=${status}`);
    } else {
      navigate('/tickets');
    }
  };

  const displayTickets = useMemo(() => {
    let list = [...tickets];

    if (statusFilter) {
      list = list.filter((t) => t.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority-desc':
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        case 'priority-asc':
          return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title, 'es');
        case 'date-desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [tickets, statusFilter, search, sortBy]);

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' | 'default' => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    if (priority === 'low') return 'success';
    return 'default';
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'high') return 'Alta';
    if (priority === 'medium') return 'Media';
    if (priority === 'low') return 'Baja';
    return priority;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  const truncate = (text: string, max = 80) =>
    text.length > max ? `${text.slice(0, max)}…` : text;

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
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
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

  const exportCsv = () => {
    if (displayTickets.length === 0) return;
    const rows = [
      ['ID', 'Titulo', 'Descripcion', 'Estado', 'Prioridad', 'Fecha'],
      ...displayTickets.map((t) => [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        new Date(t.created_at).toISOString()
      ])
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tickets.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo CSV descargado');
  };

  return (
    <SupportShell
      title="Mis solicitudes"
      subtitle={
        loading
          ? 'Cargando...'
          : `${displayTickets.length} ticket${displayTickets.length === 1 ? '' : 's'} mostrados`
      }
      breadcrumbs={[
        { label: 'Inicio', to: '/dashboard' },
        { label: 'Solicitudes' }
      ]}
    >
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por ID, título o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />
          <TextField
            select
            size="small"
            label="Ordenar"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="date-desc">Más recientes</MenuItem>
            <MenuItem value="date-asc">Más antiguos</MenuItem>
            <MenuItem value="priority-desc">Prioridad alta primero</MenuItem>
            <MenuItem value="priority-asc">Prioridad baja primero</MenuItem>
            <MenuItem value="title-asc">Título A-Z</MenuItem>
          </TextField>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/create-ticket')}>
            Nueva solicitud
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportCsv}
            disabled={loading || displayTickets.length === 0}
          >
            Exportar CSV
          </Button>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
          {statusFilters.map((f) => (
            <Chip
              key={f.value || 'all'}
              label={f.label}
              onClick={() => setStatusFilter(f.value)}
              color={statusFilter === f.value ? 'primary' : 'default'}
              variant={statusFilter === f.value ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : displayTickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Sin resultados
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {search
              ? 'Probá con otras palabras o quitá el filtro.'
              : statusFilter
                ? 'No hay tickets con ese estado.'
                : 'Creá tu primera solicitud de soporte.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/create-ticket')}>
            Crear solicitud
          </Button>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 72 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Solicitud</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 150 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 96 }} align="center">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  hover
                  sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{ticket.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ticket.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {truncate(ticket.description)}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <TextField
                      select
                      size="small"
                      value={ticket.status}
                      disabled={busyId === ticket.id}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      fullWidth
                    >
                      <MenuItem value="open">Abierto</MenuItem>
                      <MenuItem value="in-progress">En proceso</MenuItem>
                      <MenuItem value="resolved">Resuelto</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPriorityLabel(ticket.priority)}
                      color={getPriorityColor(ticket.priority)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(ticket.created_at)}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Ver detalle">
                      <IconButton size="small" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
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
    </SupportShell>
  );
}
