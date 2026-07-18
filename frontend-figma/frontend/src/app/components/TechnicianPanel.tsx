import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Stack,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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
import { getTicketStatusLabel, getTicketStatusColor } from '../../lib/ticketStatus';

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
  created_at: string;
  user_email: string;
}

interface Group {
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

export default function TechnicianPanel() {
  const navigate = useNavigate();
  const PAGE_SIZE = 20;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const loadData = async (currentPage: number, currentStatus: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE) });
    if (currentStatus) params.set('status', currentStatus);

    const [ticketsResult, groupsResult] = await Promise.all([
      apiCall(`/technician/tickets?${params}`),
      groups.length ? Promise.resolve(null) : apiCall('/technician/groups')
    ]);

    if (ticketsResult?.response.ok) {
      setTickets(Array.isArray(ticketsResult.data.data) ? ticketsResult.data.data : []);
      setTotal(ticketsResult.data.total ?? 0);
      setTotalPages(ticketsResult.data.totalPages ?? 1);
    }

    if (groupsResult?.response.ok) {
      setGroups(Array.isArray(groupsResult.data) ? groupsResult.data : []);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(page, statusFilter); }, [page, statusFilter]);

  const displayTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.user_email.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.group_name || '').toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <SupportShell
      title="Panel técnico"
      subtitle={
        loading
          ? 'Cargando...'
          : `${total} ticket${total === 1 ? '' : 's'} en tus grupos${groups.length ? ` · ${groups.map((g) => g.name).join(', ')}` : ''}`
      }
      breadcrumbs={[{ label: 'Técnico' }]}
    >
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TextField
          size="small"
          placeholder="Buscar en esta página..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            )
          }}
        />
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : displayTickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary">
            {groups.length === 0
              ? 'No tenés grupos asignados. Contactá a un administrador.'
              : search || statusFilter
                ? 'Sin resultados para esa búsqueda.'
                : 'No hay tickets en tus grupos.'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
        >
          <Table sx={{ minWidth: 1100 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 110 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 160 }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 180 }}>Solicitante</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 130 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>SLA</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{ticket.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{ticket.title}</Typography>
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
                    <Typography variant="caption">{ticket.group_name || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {ticket.user_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getTicketStatusLabel(ticket.status)}
                      color={getTicketStatusColor(ticket.status)}
                      size="small"
                    />
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
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(ticket.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
