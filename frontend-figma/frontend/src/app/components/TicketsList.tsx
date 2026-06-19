import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
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
  Stack,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth, isAdmin } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;
const PAGE_SIZE = 20;

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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [page, setPage] = useState(1);

  const statusFilter = new URLSearchParams(location.search).get('status') || '';

  const setStatusFilter = (status: string) => {
    setPage(1);
    navigate(status ? `/tickets?status=${status}` : '/tickets');
  };

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
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const loadTickets = async (currentPage: number, currentStatus: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
    if (currentStatus) params.set('status', currentStatus);

    const result = await apiCall(`/tickets?${params}`);
    if (!result) return;
    if (result.response.ok) {
      setTickets(Array.isArray(result.data.data) ? result.data.data : []);
      setTotal(result.data.total ?? 0);
      setTotalPages(result.data.totalPages ?? 1);
    }
    setLoading(false);
  };

  // Recarga cuando cambia página o filtro de estado
  useEffect(() => {
    loadTickets(page, statusFilter);
  }, [page, statusFilter]);

  // Resetear a página 1 cuando cambia el filtro de URL
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const displayTickets = useMemo(() => {
    let list = [...tickets];

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
        case 'date-asc':      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority-desc': return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        case 'priority-asc':  return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
        case 'title-asc':     return a.title.localeCompare(b.title, 'es');
        default:              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [tickets, search, sortBy]);

  const getPriorityColor = (p: string): 'error' | 'warning' | 'success' | 'default' =>
    p === 'high' ? 'error' : p === 'medium' ? 'warning' : p === 'low' ? 'success' : 'default';

  const getPriorityLabel = (p: string) =>
    p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : p === 'low' ? 'Baja' : p;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  const truncate = (text: string, max = 80) =>
    text.length > max ? `${text.slice(0, max)}…` : text;

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setBusyId(ticketId);
    try {
      const result = await apiCall(`/tickets/${ticketId}`, {
        method: 'PUT',
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
      const result = await apiCall(`/tickets/${ticketId}`, { method: 'DELETE' });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo eliminar'); return; }
      toast.success('Ticket eliminado');
      await loadTickets(page, statusFilter);
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

  const subtitleText = loading
    ? 'Cargando...'
    : `${total} ticket${total === 1 ? '' : 's'} en total · página ${page} de ${totalPages}`;

  return (
    <SupportShell
      title="Mis solicitudes"
      subtitle={subtitleText}
      breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Solicitudes' }]}
    >
      {/* Barra de filtros */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar en esta página..."
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
            select size="small" label="Ordenar" value={sortBy}
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
            variant="outlined" startIcon={<FileDownloadIcon />}
            onClick={exportCsv} disabled={loading || displayTickets.length === 0}
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
          <Typography variant="h6" sx={{ mb: 1 }}>Sin resultados</Typography>
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
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 72 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Solicitud</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 150 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Fecha</TableCell>
                {isAdmin() && <TableCell sx={{ fontWeight: 600, width: 96 }} align="center">Acciones</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTickets.map((ticket) => (
                <TableRow
                  key={ticket.id} hover
                  sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{ticket.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{ticket.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{truncate(ticket.description)}</Typography>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {isAdmin() ? (
                      <TextField
                        select size="small" value={ticket.status}
                        disabled={busyId === ticket.id}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="open">Abierto</MenuItem>
                        <MenuItem value="in-progress">En proceso</MenuItem>
                        <MenuItem value="resolved">Resuelto</MenuItem>
                      </TextField>
                    ) : (
                      <Chip
                        label={ticket.status === 'open' ? 'Abierto' : ticket.status === 'in-progress' ? 'En proceso' : 'Resuelto'}
                        color={ticket.status === 'open' ? 'warning' : ticket.status === 'in-progress' ? 'info' : 'success'}
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={getPriorityLabel(ticket.priority)} color={getPriorityColor(ticket.priority)} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(ticket.created_at)}</TableCell>
                  {isAdmin() && (
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton color="error" size="small" disabled={busyId === ticket.id}
                            onClick={() => handleDelete(ticket.id, ticket.title)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginación */}
      {!loading && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => { setPage(val); setSearch(''); }}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </SupportShell>
  );
}
