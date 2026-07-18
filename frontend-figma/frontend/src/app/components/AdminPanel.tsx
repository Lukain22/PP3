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
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TimerIcon from '@mui/icons-material/Timer';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';
import { getTicketTypeLabel, getTicketTypeColor } from '../../lib/ticketTypes';
import {
  getPriorityLabel,
  getPriorityColor,
  getSlaStatusLabel,
  getSlaStatusColor,
  isIncident
} from '../../lib/sla';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  type: string;
  group_id: number | null;
  group_name: string | null;
  sla_status?: string | null;
  category?: string | null;
  subcategory?: string | null;
  created_at: string;
  updated_at?: string;
  user_id: number;
  user_email: string;
}

interface GroupOption {
  id: number;
  name: string;
}

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'on-hold', label: 'En espera' },
  { value: 'resolved', label: 'Resueltos' }
];

const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

export default function AdminPanel() {
  const navigate = useNavigate();
  const PAGE_SIZE = 20;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [groupFilter, setGroupFilter] = useState('');
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

  const loadTickets = async (currentPage: number, currentStatus: string, currentGroupId: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
    if (currentStatus) params.set('status', currentStatus);
    if (currentGroupId) params.set('group_id', currentGroupId);

    const result = await apiCall(`/admin/tickets?${params}`);
    if (!result) return;
    if (result.response.ok) {
      setTickets(Array.isArray(result.data.data) ? result.data.data : []);
      setTotal(result.data.total ?? 0);
      setTotalPages(result.data.totalPages ?? 1);
    }
    setLoading(false);
  };

  const loadGroups = async () => {
    const result = await apiCall('/admin/groups');
    if (result?.response.ok) {
      setGroups(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => { loadGroups(); }, []);
  useEffect(() => { loadTickets(page, statusFilter, groupFilter); }, [page, statusFilter, groupFilter]);

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
        case 'priority-desc': return (priorityWeight[b.priority || ''] || 0) - (priorityWeight[a.priority || ''] || 0);
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

  const handleGroupChange = async (ticketId: number, newGroupId: number) => {
    setBusyId(ticketId);
    try {
      const result = await apiCall(`/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ group_id: newGroupId })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo actualizar'); return; }
      const groupName = groups.find((g) => g.id === newGroupId)?.name || '';
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, group_id: newGroupId, group_name: groupName } : t))
      );
      toast.success('Grupo actualizado');
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
      await loadTickets(page, statusFilter, groupFilter);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (displayTickets.length === 0) return;
    const rows = [
      ['ID', 'Usuario', 'Titulo', 'Tipo', 'Grupo', 'Estado', 'Prioridad', 'SLA', 'Fecha'],
      ...displayTickets.map((t) => [
        t.id,
        `"${t.user_email}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        t.type || 'incident',
        `"${(t.group_name || '').replace(/"/g, '""')}"`,
        t.status,
        isIncident(t.type) ? (t.priority || 'medium') : '',
        isIncident(t.type) ? (t.sla_status || '') : '',
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

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <SupportShell
      title="Panel de administración"
      subtitle={loading ? 'Cargando...' : `${total} ticket${total === 1 ? '' : 's'} · pág. ${page}/${totalPages}`}
    >

      {/* Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Buscar en esta página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 2, minWidth: 400 }}
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
          <TextField
            select
            size="small"
            label="Grupo"
            value={groupFilter}
            onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todos los grupos</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            startIcon={<GroupWorkIcon />}
            onClick={() => navigate('/admin/groups')}
          >
            Grupos
          </Button>
          <Button
            variant="outlined"
            startIcon={<TimerIcon />}
            onClick={() => navigate('/admin/sla')}
          >
            SLA
          </Button>
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
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
        >
          <Table sx={{ minWidth: 1280 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 110 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 110 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 110 }}>SLA</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Fecha</TableCell>
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
                  <TableCell sx={{ minWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
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
                      value={ticket.group_id ?? ''}
                      disabled={busyId === ticket.id || groups.length === 0}
                      onChange={(e) => handleGroupChange(ticket.id, Number(e.target.value))}
                      fullWidth
                    >
                      {groups.map((g) => (
                        <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                      ))}
                    </TextField>
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
                      {TICKET_STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    {isIncident(ticket.type) ? (
                      <Chip
                        label={getPriorityLabel(ticket.priority)}
                        color={getPriorityColor(ticket.priority || 'medium')}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {isIncident(ticket.type) && ticket.sla_status ? (
                      <Chip
                        label={getSlaStatusLabel(ticket.sla_status)}
                        color={getSlaStatusColor(ticket.sla_status)}
                        size="small"
                      />
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
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
