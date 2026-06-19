import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
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
import PeopleIcon from '@mui/icons-material/People';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string | null;
  subcategory?: string | null;
  created_at: string;
  updated_at?: string;
  user_id: number;
  user_email: string;
}

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'resolved', label: 'Resueltos' }
];

const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

export default function AdminPanel() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) { navigate('/'); return null; }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 401) { clearAuth(); navigate('/'); return null; }
    if (response.status === 403) { navigate('/dashboard'); return null; }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const loadTickets = async () => {
    const result = await apiCall('/admin/tickets');
    if (!result) return;
    if (result.response.ok) {
      setTickets(Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const displayTickets = useMemo(() => {
    let list = [...tickets];

    if (statusFilter) list = list.filter((t) => t.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.user_email.toLowerCase().includes(q) ||
          String(t.id).includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority-desc': return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        case 'title-asc': return a.title.localeCompare(b.title, 'es');
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [tickets, statusFilter, search, sortBy]);

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setBusyId(ticketId);
    try {
      const result = await apiCall(`/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo actualizar'); return; }
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: newStatus } : t));
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
      const result = await apiCall(`/admin/tickets/${ticketId}`, { method: 'DELETE' });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo eliminar'); return; }
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
      ['ID', 'Usuario', 'Titulo', 'Estado', 'Prioridad', 'Fecha'],
      ...displayTickets.map((t) => [
        t.id,
        `"${t.user_email}"`,
        `"${t.title.replace(/"/g, '""')}"`,
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
    link.download = 'tickets-admin.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    if (status === 'open') return 'warning';
    if (status === 'in-progress') return 'info';
    if (status === 'resolved') return 'success';
    return 'default';
  };

  const getStatusLabel = (s: string) =>
    s === 'open' ? 'Abierto' : s === 'in-progress' ? 'En proceso' : s === 'resolved' ? 'Resuelto' : s;

  const getPriorityColor = (p: string): 'error' | 'warning' | 'success' | 'default' =>
    p === 'high' ? 'error' : p === 'medium' ? 'warning' : p === 'low' ? 'success' : 'default';

  const getPriorityLabel = (p: string) =>
    p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : p === 'low' ? 'Baja' : p;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  const stats = [
    { label: 'Total', value: tickets.length, color: '#1e3a5f' },
    { label: 'Abiertos', value: tickets.filter((t) => t.status === 'open').length, color: '#b45309' },
    { label: 'En proceso', value: tickets.filter((t) => t.status === 'in-progress').length, color: '#1d4ed8' },
    { label: 'Resueltos', value: tickets.filter((t) => t.status === 'resolved').length, color: '#047857' }
  ];

  return (
    <SupportShell
      title="Panel de administración"
      subtitle="Gestión global de todos los tickets del sistema."
      breadcrumbs={[{ label: 'Admin' }]}
    >
      {/* Estadísticas */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
        {stats.map((s) => (
          <Paper key={s.label} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: s.color }}>
              {loading ? '—' : s.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por ID, título o usuario..."
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
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="date-desc">Más recientes</MenuItem>
            <MenuItem value="date-asc">Más antiguos</MenuItem>
            <MenuItem value="priority-desc">Prioridad alta primero</MenuItem>
            <MenuItem value="title-asc">Título A-Z</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => navigate('/admin/users')}
          >
            Usuarios
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

      {/* Tabla */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : displayTickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary">
            {search || statusFilter ? 'Sin resultados para esa búsqueda.' : 'No hay tickets en el sistema.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 180 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 150 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 130 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Fecha</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 96 }} align="center">Acciones</TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {ticket.user_email}
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
                  <TableCell>
                    {ticket.category ? (
                      <Stack spacing={0.25}>
                        <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {ticket.category}
                        </Typography>
                        {ticket.subcategory && (
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                            {ticket.subcategory}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
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
