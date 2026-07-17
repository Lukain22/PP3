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
  Stack,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PeopleIcon from '@mui/icons-material/People';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';
import { getTicketTypeLabel, getTicketTypeColor } from '../../lib/ticketTypes';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
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
  const PAGE_SIZE = 20;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);

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

  const loadTickets = async (currentPage: number, currentStatus: string, currentUserEmail: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
    if (currentStatus) params.set('status', currentStatus);
    if (currentUserEmail.trim()) params.set('user_email', currentUserEmail.trim());

    const result = await apiCall(`/admin/tickets?${params}`);
    if (!result) return;
    if (result.response.ok) {
      setTickets(Array.isArray(result.data.data) ? result.data.data : []);
      setTotal(result.data.total ?? 0);
      setTotalPages(result.data.totalPages ?? 1);
    }
    setLoading(false);
  };

  useEffect(() => { loadTickets(page, statusFilter, userEmailFilter); }, [page, statusFilter, userEmailFilter]);

  const displayTickets = useMemo(() => {
    let list = [...tickets];

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
      ['ID', 'Usuario', 'Titulo', 'Tipo', 'Estado', 'Prioridad', 'Fecha'],
      ...displayTickets.map((t) => [
        t.id,
        `"${t.user_email}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        t.type || 'incident',
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

  return (
    <SupportShell
      title="Panel de administración"
      subtitle={loading ? 'Cargando...' : `${total} ticket${total === 1 ? '' : 's'}${userEmailFilter ? ` · usuario: ${userEmailFilter}` : ''} · pág. ${page}/${totalPages}`}
      breadcrumbs={[{ label: 'Admin' }]}
    >

      {/* Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          {/* Filtro por usuario — server-side */}
          <TextField
            size="small"
            placeholder="Filtrar por correo de usuario..."
            value={userEmailFilter}
            onChange={(e) => { setUserEmailFilter(e.target.value); setPage(1); }}
            sx={{ flex: 1, minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PeopleIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: userEmailFilter ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setUserEmailFilter(''); setPage(1); }}>
                    ✕
                  </IconButton>
                </InputAdornment>
              ) : undefined
            }}
          />
          {/* Búsqueda local (título / ID en la página actual) */}
          <TextField
            size="small"
            placeholder="Buscar en esta página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 180 }}
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
              onClick={() => { setStatusFilter(f.value); setPage(1); setSearch(''); }}
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
                <TableCell sx={{ fontWeight: 600, width: 110 }}>Tipo</TableCell>
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
                    <Chip
                      label={getTicketTypeLabel(ticket.type || 'incident')}
                      color={getTicketTypeColor(ticket.type || 'incident')}
                      size="small"
                      variant="outlined"
                    />
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
