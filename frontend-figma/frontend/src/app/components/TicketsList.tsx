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
  TableFooter,
  Chip,
  Checkbox,
  CircularProgress,
  TextField,
  MenuItem,
  InputAdornment,
  Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth, getRole } from '../../lib/auth';
import { getTicketTypeLabel, getTicketTypeColor } from '../../lib/ticketTypes';
import {
  getPriorityLabel,
  getPriorityColor,
  isIncident
} from '../../lib/sla';
import { TICKET_STATUS_OPTIONS, getTicketStatusLabel, getTicketStatusColor } from '../../lib/ticketStatus';
import InlineEditSelect from './InlineEditSelect';
import TicketViewSelect from './TicketViewSelect';
import StaffTableHeadRow, { SortableHeaderCell } from './StaffTableColumnFilters';
import {
  type TicketSort,
  type TicketSortKey,
  sortFromViewSort,
  sortToQuery,
  toggleColumnSort
} from '../../lib/ticketTable';
import {
  type ActiveViewSelection,
  type ListMode,
  type TicketListFilters,
  type TicketView,
  type StaffColumnFilters,
  buildTicketQueryParams,
  emptyStaffColumnFilters,
  getDefaultSystemView,
  getSystemViewsForRole,
  getTicketsApiPath,
  hasActiveStaffColumnFilters,
  parseViewItemKey,
  resolveTicketViewItemKey,
  saveLastTicketView,
  selectionFromCustomView,
  selectionFromSystemView,
  staffColumnFiltersFromView,
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

function TicketsTableFooter({
  colSpan,
  total,
  page,
  totalPages,
  onPageChange
}: {
  colSpan: number;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <TableFooter>
      <TableRow>
        <TableCell
          colSpan={colSpan}
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fafbfc',
            py: 1.25,
            px: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              {total} solicitud{total === 1 ? '' : 'es'}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                aria-label="Página anterior"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 88, textAlign: 'center' }}>
                Pág. {page} / {totalPages}
              </Typography>
              <IconButton
                size="small"
                aria-label="Página siguiente"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
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
  const [columnFilters, setColumnFilters] = useState<StaffColumnFilters>(
    () => staffColumnFiltersFromView(initialSelection.filters)
  );
  const [columnSort, setColumnSort] = useState<TicketSort>(() => sortFromViewSort(initialSelection.sortBy));
  const [sortEngaged, setSortEngaged] = useState(false);
  const [listReady, setListReady] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [filterRowOpen, setFilterRowOpen] = useState(false);
  const [focusColumn, setFocusColumn] = useState<TicketSortKey | null>(null);

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

  const loadTickets = async (
    currentPage: number,
    filters: TicketListFilters,
    mode: ListMode,
    sort: TicketSort,
    staffFilters?: StaffColumnFilters
  ) => {
    if (!listReady) setLoading(true);
    const params = buildTicketQueryParams(
      currentPage,
      PAGE_SIZE,
      filters,
      mode === 'admin' || mode === 'technician' ? staffFilters : undefined,
      sortToQuery(sort)
    );
    const result = await apiCall(`${getTicketsApiPath(mode)}?${params}`);
    if (!result) return;
    if (result.response.ok) {
      setTickets(Array.isArray(result.data.data) ? result.data.data : []);
      setTotal(result.data.total ?? 0);
      setTotalPages(result.data.totalPages ?? 1);
    }
    setListReady(true);
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

      if (!param || !parsed) {
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
          setColumnSort(sortFromViewSort(next.sortBy));
          setSortEngaged(false);
          setPage(1);
          setColumnFilters(staffColumnFiltersFromView(next.filters));
          setSelectedIds(new Set());
          setFilterRowOpen(false);
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
            setColumnSort(sortFromViewSort(next.sortBy));
            setSortEngaged(false);
            setPage(1);
            setSearch('');
            setColumnFilters(staffColumnFiltersFromView(next.filters));
            setSelectedIds(new Set());
            setFilterRowOpen(false);
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
    if (!viewReady) return;
    loadTickets(
      page,
      listFilters,
      listMode,
      columnSort,
      isStaffTable ? columnFilters : undefined
    );
  }, [page, listFilters, listMode, viewReady, columnFilters, isStaffTable, columnSort]);

  const applySelection = (next: ActiveViewSelection) => {
    setSelection(next);
    setListFilters({ ...next.filters });
    setListMode(next.listMode);
    setSortBy(next.sortBy);
    setColumnSort(sortFromViewSort(next.sortBy));
    setSortEngaged(false);
    setPage(1);
    setSearch('');
    setColumnFilters(staffColumnFiltersFromView(next.filters));
    setSelectedIds(new Set());
    setFilterRowOpen(false);

    const viewParam =
      next.kind === 'system' && next.key
        ? systemViewKeyToItemKey(next.key)
        : next.kind === 'custom' && next.viewId
          ? viewIdToItemKey(next.viewId)
          : '';
    if (viewParam) saveLastTicketView(role, viewParam);
    navigate(viewParam ? `/tickets?view=${viewParam}` : '/tickets', { replace: true });
  };

  const applyColumnFilters = (next: StaffColumnFilters) => {
    setColumnFilters(next);
    setPage(1);
    setSearch('');
  };

  const clearColumnFilters = () => {
    setColumnFilters(emptyStaffColumnFilters());
    setPage(1);
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
    if (isStaffTable) return tickets;

    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.user_email || '').toLowerCase().includes(q) ||
        (t.technician_email || '').toLowerCase().includes(q) ||
        String(t.id).includes(q)
    );
  }, [tickets, search, isStaffTable]);

  const visibleIds = useMemo(() => displayTickets.map((ticket) => ticket.id), [displayTickets]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected;

  const toggleVisibleSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRowSelection = (ticketId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const handleFilterToggle = (key: TicketSortKey) => {
    if (!filterRowOpen) {
      setFilterRowOpen(true);
      setFocusColumn(key);
      return;
    }
    if (focusColumn === key) {
      setFilterRowOpen(false);
      return;
    }
    setFocusColumn(key);
  };

  const handleColumnSort = (key: TicketSortKey) => {
    setSortEngaged(true);
    setColumnSort((current) => (
      sortEngaged ? toggleColumnSort(current, key) : { key, direction: key === 'date' ? 'desc' : 'asc' }
    ));
    setPage(1);
  };

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
      setSelectedIds((prev) => {
        if (!prev.has(ticketId)) return prev;
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
      await loadTickets(page, listFilters, listMode, columnSort, isStaffTable ? columnFilters : undefined);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    const selectedOnPage = selectedIds.size
      ? displayTickets.filter((ticket) => selectedIds.has(ticket.id))
      : [];
    const rowsToExport = selectedOnPage.length > 0 ? selectedOnPage : displayTickets;
    if (rowsToExport.length === 0) return;
    const rows = [
      ['ID', 'Usuario', 'Título', 'Grupo', 'Asignado a', 'Estado', 'Categoría', 'Subcategoría', 'Fecha'],
      ...rowsToExport.map((t) => [
        t.id,
        `"${(t.user_email || '').replace(/"/g, '""')}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.group_name || '').replace(/"/g, '""')}"`,
        `"${(t.technician_email || '').replace(/"/g, '""')}"`,
        t.status,
        `"${(t.category || '').replace(/"/g, '""')}"`,
        `"${(t.subcategory || '').replace(/"/g, '""')}"`,
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
    (!isStaffTable && search) ||
    selection.kind === 'custom' ||
    listFilters.type ||
    listFilters.priority ||
    (isStaffTable
      ? hasActiveStaffColumnFilters(columnFilters)
      : listFilters.group_id || listFilters.status);

  const emptyMessage = isStaffTable
    ? hasActiveFilters
      ? 'Sin resultados para esa búsqueda.'
      : listMode === 'technician'
        ? 'No hay solicitudes en tus grupos.'
        : 'No hay solicitudes en el sistema.'
    : hasActiveFilters
      ? 'Sin resultados para esa búsqueda.'
      : 'No tenés solicitudes. Creá una nueva.';

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    setSearch('');
  };

  const staffTableColSpan = canEditAll ? 11 : 10;
  const userTableColSpan = 7;

  return (
    <SupportShell title="Solicitudes">
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
          {!isStaffTable && (
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
      </Paper>

      {isStaffTable && selectedIds.size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5, px: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
          </Typography>
          <Button size="small" onClick={() => setSelectedIds(new Set())}>
            Quitar selección
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : isStaffTable ? (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
        >
          <Table sx={{ minWidth: 1480 }}>
            <TableHead>
              <StaffTableHeadRow
                canEditAll={canEditAll}
                sort={columnSort}
                highlightSort={sortEngaged}
                onSort={handleColumnSort}
                filters={columnFilters}
                filterRowOpen={filterRowOpen}
                focusColumn={focusColumn}
                onFilterToggle={handleFilterToggle}
                onCloseFilterRow={() => setFilterRowOpen(false)}
                onApply={applyColumnFilters}
                onClear={clearColumnFilters}
                allSelected={allVisibleSelected}
                indeterminate={someVisibleSelected}
                onToggleAll={toggleVisibleSelection}
                visibleCount={visibleIds.length}
              />
            </TableHead>
            <TableBody>
              {displayTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={staffTableColSpan} sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">{emptyMessage}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  hover
                  selected={selectedIds.has(ticket.id)}
                  sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(ticket.id)}
                      onChange={() => toggleRowSelection(ticket.id)}
                      inputProps={{ 'aria-label': `Seleccionar ticket ${ticket.id}` }}
                      sx={{ p: 0.5 }}
                    />
                  </TableCell>
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
                    <Typography variant="caption" sx={{ fontWeight: ticket.category ? 600 : 400, lineHeight: 1.3 }}>
                      {ticket.category || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color={ticket.subcategory ? 'text.secondary' : 'text.disabled'} sx={{ lineHeight: 1.3 }}>
                      {ticket.subcategory || '—'}
                    </Typography>
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
                ))
              )}
            </TableBody>
            <TicketsTableFooter
              colSpan={staffTableColSpan}
              total={total}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </Table>
        </TableContainer>
      ) : displayTickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Paper>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <SortableHeaderCell label="#" sortKey="id" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} width={64} />
                <SortableHeaderCell label="Título" sortKey="title" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} minWidth={200} />
                <SortableHeaderCell label="Descripción" sortKey="description" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} minWidth={280} />
                <SortableHeaderCell label="Tipo" sortKey="type" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} minWidth={110} />
                <SortableHeaderCell label="Estado" sortKey="status" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} minWidth={130} />
                <SortableHeaderCell label="Prioridad" sortKey="priority" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} minWidth={110} />
                <SortableHeaderCell label="Fecha" sortKey="date" sort={columnSort} highlightSort={sortEngaged} onSort={handleColumnSort} minWidth={120} />
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
            <TicketsTableFooter
              colSpan={userTableColSpan}
              total={total}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </Table>
        </TableContainer>
      )}
    </SupportShell>
  );
}
