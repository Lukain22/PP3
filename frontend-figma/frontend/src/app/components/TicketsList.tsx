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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth, getRole, isStaff } from '../../lib/auth';
import { TICKET_TYPE_OPTIONS, getTicketTypeLabel, getTicketTypeColor } from '../../lib/ticketTypes';
import {
  getPriorityLabel,
  getPriorityColor,
  isIncident
} from '../../lib/sla';
import { TICKET_STATUS_OPTIONS, getTicketStatusLabel, getTicketStatusColor } from '../../lib/ticketStatus';
import InlineEditSelect from './InlineEditSelect';
import TicketViewSelect from './TicketViewSelect';
import {
  type ActiveViewSelection,
  type ListMode,
  type TicketListFilters,
  type TicketView,
  buildTicketQueryParams,
  getDefaultSystemView,
  getSystemViewsForRole,
  getTicketsApiPath,
  parseViewItemKey,
  resolveTicketViewItemKey,
  saveLastTicketView,
  selectionFromCustomView,
  selectionFromSystemView,
  systemViewKeyToItemKey,
  viewIdToItemKey
} from '../../lib/ticketViews';

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
  technician_id?: number | null;
  technician_email?: string | null;
  sla_status?: string | null;
  category?: string | null;
  subcategory?: string | null;
  created_at: string;
  updated_at?: string;
  user_id: number;
  user_email?: string;
}

interface GroupOption {
  id: number;
  name: string;
}

interface TechnicianOption {
  id: number;
  email: string;
}

const statusFilters = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'on-hold', label: 'En espera' },
  { value: 'resolved', label: 'Resueltos' }
];

const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

function resolveInitialSelection(search: string, role: ReturnType<typeof getRole>): ActiveViewSelection {
  const itemKey = resolveTicketViewItemKey(search, role);
  const parsed = parseViewItemKey(itemKey);
  if (parsed?.kind === 'system' && parsed.key) {
    const system = getSystemViewsForRole(role).find((view) => view.key === parsed.key);
    if (system) return selectionFromSystemView(system);
  }
  return selectionFromSystemView(getDefaultSystemView(role));
}

function truncateDescription(text: string, max = 80): string {
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default function TicketsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const PAGE_SIZE = 20;

  const initialSelection = resolveInitialSelection(location.search, role);
  const customViewParam = parseViewItemKey(resolveTicketViewItemKey(location.search, role));

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [groupTechnicians, setGroupTechnicians] = useState<Record<number, TechnicianOption[]>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewReady, setViewReady] = useState(customViewParam?.kind !== 'custom');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<ActiveViewSelection>(initialSelection);
  const [listFilters, setListFilters] = useState<TicketListFilters>(initialSelection.filters);
  const [listMode, setListMode] = useState<ListMode>(initialSelection.listMode);
  const [sortBy, setSortBy] = useState(initialSelection.sortBy);
  const [page, setPage] = useState(1);

  const isStaffTable = listMode === 'admin' || listMode === 'technician';
  const canEditAll = listMode === 'admin';

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

  const loadTickets = async (currentPage: number, filters: TicketListFilters, mode: ListMode) => {
    setLoading(true);
    const params = buildTicketQueryParams(currentPage, PAGE_SIZE, filters);
    const result = await apiCall(`${getTicketsApiPath(mode)}?${params}`);
    if (!result) return;
    if (result.response.ok) {
      setTickets(Array.isArray(result.data.data) ? result.data.data : []);
      setTotal(result.data.total ?? 0);
      setTotalPages(result.data.totalPages ?? 1);
    }
    setLoading(false);
  };

  const loadGroups = async (mode: ListMode) => {
    if (mode === 'user') {
      setGroups([]);
      return;
    }
    const path = mode === 'admin' ? '/admin/groups' : '/technician/groups';
    const result = await apiCall(path);
    if (result?.response.ok) {
      setGroups(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => {
    const resolved = resolveTicketViewItemKey(location.search, role);
    const current = new URLSearchParams(location.search).get('view');
    if (current !== resolved) {
      navigate(`/tickets?view=${resolved}`, { replace: true });
    }
  }, [location.search, role, navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadView = async () => {
      const param = new URLSearchParams(location.search).get('view');
      const parsed = param ? parseViewItemKey(param) : null;

      if (!parsed) {
        return;
      }

      saveLastTicketView(role, param);

      if (parsed.kind === 'system' && parsed.key) {
        const system = getSystemViewsForRole(role).find((view) => view.key === parsed.key);
        if (!cancelled && system) {
          const next = selectionFromSystemView(system);
          setSelection(next);
          setListFilters({ ...next.filters });
          setListMode(next.listMode);
          setSortBy(next.sortBy);
          setPage(1);
        }
      } else if (parsed.kind === 'custom' && parsed.viewId) {
        const result = await apiCall('/views?scope=tickets');
        if (!cancelled && result?.response.ok) {
          const views = Array.isArray(result.data) ? result.data : [];
          const view = views.find((item: TicketView) => item.id === parsed.viewId);
          if (view) {
            const next = selectionFromCustomView(view, role);
            setSelection(next);
            setListFilters({ ...next.filters });
            setListMode(next.listMode);
            setSortBy(next.sortBy);
            setPage(1);
            setSearch('');
          } else {
            const fallback = systemViewKeyToItemKey(getDefaultSystemView(role).key);
            saveLastTicketView(role, fallback);
            navigate(`/tickets?view=${fallback}`, { replace: true });
          }
        }
      }

      if (!cancelled) setViewReady(true);
    };

    loadView();
    return () => { cancelled = true; };
  }, [location.search, role]);

  useEffect(() => { if (viewReady) loadGroups(listMode); }, [listMode, viewReady]);
  useEffect(() => {
    if (viewReady) loadTickets(page, listFilters, listMode);
  }, [page, listFilters, listMode, viewReady]);

  const applySelection = (next: ActiveViewSelection) => {
    setSelection(next);
    setListFilters({ ...next.filters });
    setListMode(next.listMode);
    setSortBy(next.sortBy);
    setPage(1);
    setSearch('');

    const viewParam =
      next.kind === 'system' && next.key
        ? systemViewKeyToItemKey(next.key)
        : next.kind === 'custom' && next.viewId
          ? viewIdToItemKey(next.viewId)
          : '';
    if (viewParam) saveLastTicketView(role, viewParam);
    navigate(viewParam ? `/tickets?view=${viewParam}` : '/tickets', { replace: true });
  };

  const updateFilters = (patch: Partial<TicketListFilters>) => {
    const nextFilters = { ...listFilters, ...patch };
    setListFilters(nextFilters);
    setSelection((prev) => ({ ...prev, filters: nextFilters }));
    setPage(1);
    setSearch('');
  };

  useEffect(() => {
    if (!isStaffTable || groups.length === 0) return;
    const loadTechnicians = async () => {
      const groupPath = (id: number) =>
        listMode === 'admin' ? `/admin/groups/${id}` : `/technician/groups/${id}`;
      const entries = await Promise.all(
        groups.map(async (group) => {
          const result = await apiCall(groupPath(group.id));
          return [group.id, result?.response.ok ? result.data.technicians || [] : []] as const;
        })
      );
      setGroupTechnicians(Object.fromEntries(entries));
    };
    loadTechnicians();
  }, [groups, isStaffTable, listMode]);

  const displayTickets = useMemo(() => {
    let list = [...tickets];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.user_email || '').toLowerCase().includes(q) ||
          (t.technician_email || '').toLowerCase().includes(q) ||
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
  }, [tickets, search, sortBy]);

  const patchPath = (ticketId: number) =>
    canEditAll ? `/admin/tickets/${ticketId}` : `/tickets/${ticketId}`;

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    setBusyId(ticketId);
    try {
      const result = await apiCall(patchPath(ticketId), {
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

  const handleTechnicianChange = async (ticketId: number, newTechnicianId: number | null, groupId: number | null) => {
    setBusyId(ticketId);
    try {
      const result = await apiCall(patchPath(ticketId), {
        method: 'PATCH',
        body: JSON.stringify({ technician_id: newTechnicianId })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo actualizar'); return; }
      const technicianEmail = newTechnicianId
        ? (groupTechnicians[groupId || 0] || []).find((tech) => tech.id === newTechnicianId)?.email || ''
        : '';
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, technician_id: newTechnicianId, technician_email: technicianEmail || null }
            : t
        )
      );
      toast.success('Técnico actualizado');
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
      await loadTickets(page, listFilters, listMode);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (displayTickets.length === 0) return;
    const rows = [
      ['ID', 'Usuario', 'Título', 'Grupo', 'Asignado a', 'Estado', 'Categoría', 'Fecha'],
      ...displayTickets.map((t) => [
        t.id,
        `"${(t.user_email || '').replace(/"/g, '""')}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.group_name || '').replace(/"/g, '""')}"`,
        `"${(t.technician_email || '').replace(/"/g, '""')}"`,
        t.status,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        new Date(t.created_at).toISOString()
      ])
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'solicitudes.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  const hasActiveFilters =
    search ||
    selection.kind === 'custom' ||
    listFilters.type ||
    listFilters.group_id ||
    listFilters.status ||
    listFilters.priority;

  const emptyMessage = isStaffTable
    ? hasActiveFilters
      ? 'Sin resultados para esa búsqueda.'
      : listMode === 'technician'
        ? 'No hay solicitudes en tus grupos.'
        : 'No hay solicitudes en el sistema.'
    : hasActiveFilters
      ? 'Sin resultados para esa búsqueda.'
      : 'No tenés solicitudes. Creá una nueva.';

  return (
    <SupportShell
      title="Solicitudes"
      subtitle={
        loading
          ? 'Cargando...'
          : `${total} solicitud${total === 1 ? '' : 'es'} · pág. ${page}/${totalPages}`
      }
    >
      <Paper elevation={0} sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <TicketViewSelect
          role={role}
          groups={groups}
          selection={selection}
          currentFilters={listFilters}
          currentSortBy={sortBy}
          apiCall={apiCall}
          onApply={applySelection}
        />

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Buscar en esta página..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 2, minWidth: 280 }}
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
            onChange={(e) => {
              setSortBy(e.target.value);
              setSelection((prev) => ({ ...prev, sortBy: e.target.value }));
            }}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="date-desc">Más recientes</MenuItem>
            <MenuItem value="date-asc">Más antiguos</MenuItem>
            <MenuItem value="priority-desc">Prioridad alta primero</MenuItem>
            <MenuItem value="title-asc">Título A-Z</MenuItem>
          </TextField>
          {isStaffTable && (
            <>
              <TextField
                select
                size="small"
                label="Tipo"
                value={listFilters.type}
                onChange={(e) =>
                  updateFilters({
                    type: e.target.value,
                    priority: e.target.value === 'requirement' ? '' : listFilters.priority
                  })
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {TICKET_TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Grupo"
                value={listFilters.group_id}
                onChange={(e) => updateFilters({ group_id: e.target.value })}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">{listMode === 'technician' ? 'Todos mis grupos' : 'Todos los grupos'}</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Prioridad"
                value={listFilters.priority}
                disabled={listFilters.type === 'requirement'}
                onChange={(e) => updateFilters({ priority: e.target.value })}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="low">Baja</MenuItem>
              </TextField>
            </>
          )}
          {isStaffTable && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportCsv}
              disabled={loading || displayTickets.length === 0}
            >
              Exportar CSV
            </Button>
          )}
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
          {statusFilters.map((f) => (
            <Chip
              key={f.value || 'all'}
              label={f.label}
              onClick={() => updateFilters({ status: f.value })}
              color={!listFilters.status.includes(',') && listFilters.status === f.value ? 'primary' : 'default'}
              variant={!listFilters.status.includes(',') && listFilters.status === f.value ? 'filled' : 'outlined'}
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
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Paper>
      ) : isStaffTable ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
        >
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Ticket</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>Asignado a</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 160 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 140 }}>Categoría</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Fecha</TableCell>
                {canEditAll && (
                  <TableCell sx={{ fontWeight: 600, width: 96 }} align="center">Acciones</TableCell>
                )}
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
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {ticket.user_email || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canEditAll ? (
                      <InlineEditSelect
                        value={ticket.group_id ?? ''}
                        disabled={busyId === ticket.id || groups.length === 0}
                        display={
                          <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                            {ticket.group_name || '—'}
                          </Typography>
                        }
                        onChange={(val) => handleGroupChange(ticket.id, Number(val))}
                      >
                        {groups.map((g) => (
                          <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                        ))}
                      </InlineEditSelect>
                    ) : (
                      <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                        {ticket.group_name || '—'}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineEditSelect
                      value={ticket.technician_id ?? ''}
                      disabled={busyId === ticket.id || !ticket.group_id}
                      display={
                        ticket.technician_email ? (
                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                            {ticket.technician_email}
                          </Typography>
                        ) : (
                          <Typography variant="caption" fontWeight={700}>
                            Sin asignar
                          </Typography>
                        )
                      }
                      onChange={(val) =>
                        handleTechnicianChange(ticket.id, val ? Number(val) : null, ticket.group_id)
                      }
                    >
                      <MenuItem value=""><em>Sin asignar</em></MenuItem>
                      {(groupTechnicians[ticket.group_id || 0] || []).map((tech) => (
                        <MenuItem key={tech.id} value={tech.id}>{tech.email}</MenuItem>
                      ))}
                    </InlineEditSelect>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineEditSelect
                      value={ticket.status}
                      disabled={busyId === ticket.id}
                      display={
                        <Chip
                          label={getTicketStatusLabel(ticket.status)}
                          color={getTicketStatusColor(ticket.status)}
                          size="small"
                        />
                      }
                      onChange={(val) => handleStatusChange(ticket.id, val)}
                    >
                      {TICKET_STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </InlineEditSelect>
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
                  {canEditAll && (
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 280 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 110 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 130 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 110 }}>Prioridad</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Fecha</TableCell>
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
                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                      {ticket.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                      }}
                      title={ticket.description}
                    >
                      {truncateDescription(ticket.description)}
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
