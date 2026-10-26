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
  Checkbox,
  CircularProgress,
  TextField,
  Menu,
  MenuItem,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import StatusBadge from './StatusBadge';
import { getToken, clearAuth, getRole, getEmail, can } from '../../lib/auth';
import { isIncident } from '../../lib/sla';
import { TICKET_STATUS_OPTIONS, getTicketStatusLabel } from '../../lib/ticketStatus';
import InlineEditSelect from './InlineEditSelect';
import ResolveTicketDialog from './ResolveTicketDialog';
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
import { downloadTableExport, type ExportFormat } from '../../lib/tableExport';

const API_URL = import.meta.env.VITE_API_URL as string;

function TicketTypeMark({ type }: { type?: string | null }) {
  const incident = isIncident(type);
  const label = incident ? 'Incidente' : 'Requerimiento';
  return (
    <Tooltip title={label}>
      <Box
        component="span"
        aria-label={label}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: 16,
          color: incident ? '#B91C1C' : '#1E3A8A'
        }}
      >
        {incident ? (
          <AssignmentLateOutlinedIcon sx={{ fontSize: 16 }} />
        ) : (
          <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
        )}
      </Box>
    </Tooltip>
  );
}

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
  const plain = (text || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  if (!plain) return '—';
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

const denseTableSx = {
  '& .MuiTableCell-root': {
    py: 0.5,
    px: 1,
    fontSize: '0.8125rem',
    lineHeight: 1.3
  },
  '& .MuiTableCell-head': {
    py: 0.625,
    fontSize: '0.75rem',
    fontWeight: 600
  },
  '& .MuiChip-root': {
    height: 22,
    fontSize: '0.75rem'
  }
};

function TicketsTableFooter({
  total,
  page,
  totalPages,
  onPageChange
}: {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 1.5,
        py: 0.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fafbfc'
      }}
    >
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
  const [transferGroups, setTransferGroups] = useState<GroupOption[]>([]);
  const [groupTechnicians, setGroupTechnicians] = useState<Record<number, TechnicianOption[]>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewReady, setViewReady] = useState(customViewParam?.kind !== 'custom');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [resolveTicket, setResolveTicket] = useState<Ticket | null>(null);
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
  const [exporting, setExporting] = useState(false);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);

  const isStaffTable = listMode === 'admin' || listMode === 'technician';
  const canEditAll = listMode === 'admin';
  const canChangeGroup = canEditAll || listMode === 'technician';
  const groupChoices = listMode === 'technician' ? transferGroups : groups;

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
      const data = Array.isArray(result.data.data) ? result.data.data : [];
      const nextTotal = result.data.total ?? 0;
      const nextPages = result.data.totalPages ?? 1;
      setTickets(data);
      setTotal(nextTotal);
      setTotalPages(Math.max(nextPages, 1));
      if (data.length === 0 && currentPage > 1 && currentPage > nextPages) {
        setPage(Math.max(nextPages, 1));
      }
      setListReady(true);
      setLoading(false);
      return data;
    }
    setListReady(true);
    setLoading(false);
  };

  const loadGroups = async (mode: ListMode) => {
    if (mode === 'user') {
      setGroups([]);
      setTransferGroups([]);
      return;
    }
    if (mode === 'technician') {
      const [memberResult, transferResult] = await Promise.all([
        apiCall('/technician/groups'),
        apiCall('/tickets/transfer-groups')
      ]);
      if (memberResult?.response.ok) {
        setGroups(Array.isArray(memberResult.data) ? memberResult.data : []);
      }
      if (transferResult?.response.ok) {
        setTransferGroups(Array.isArray(transferResult.data) ? transferResult.data : []);
      }
      return;
    }
    const result = await apiCall('/admin/groups');
    if (result?.response.ok) {
      setGroups(Array.isArray(result.data) ? result.data : []);
    }
    setTransferGroups([]);
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

  const assigneeGroupKey = useMemo(() => {
    const ids = new Set<number>();
    groupChoices.forEach((group) => ids.add(Number(group.id)));
    tickets.forEach((ticket) => {
      if (ticket.group_id) ids.add(Number(ticket.group_id));
    });
    return [...ids].filter((id) => id > 0).sort((a, b) => a - b).join(',');
  }, [groupChoices, tickets]);

  useEffect(() => {
    if (!isStaffTable || !assigneeGroupKey) {
      setGroupTechnicians({});
      return;
    }
    let cancelled = false;
    const loadTechnicians = async () => {
      const entries = await Promise.all(
        assigneeGroupKey.split(',').map(async (id) => {
          const result = await apiCall(`/tickets/assignees?group_id=${id}`);
          const list = result?.response.ok && Array.isArray(result.data) ? result.data : [];
          return [Number(id), list] as const;
        })
      );
      if (!cancelled) setGroupTechnicians(Object.fromEntries(entries));
    };
    loadTechnicians();
    return () => { cancelled = true; };
  }, [isStaffTable, assigneeGroupKey]);

  const displayTickets = useMemo(() => {
    if (isStaffTable) return tickets;

    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        truncateDescription(t.description, 10000).toLowerCase().includes(q) ||
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

  const reloadCurrentView = async (ticketId: number) => {
    const visible = await loadTickets(
      page,
      listFilters,
      listMode,
      columnSort,
      isStaffTable ? columnFilters : undefined
    );
    if (!visible || visible.some((ticket) => ticket.id === ticketId)) return;
    setSelectedIds((prev) => {
      if (!prev.has(ticketId)) return prev;
      const next = new Set(prev);
      next.delete(ticketId);
      return next;
    });
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    if (newStatus === 'resolved') {
      const current = tickets.find((ticket) => ticket.id === ticketId);
      if (current && current.status !== 'resolved') {
        if (!can('tickets.resolve')) {
          toast.error('No tenés permiso para resolver este ticket');
          return;
        }
        setResolveTicket(current);
        return;
      }
    }
    setBusyId(ticketId);
    try {
      const result = await apiCall(patchPath(ticketId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo actualizar'); return; }
      toast.success('Estado actualizado');
      await reloadCurrentView(ticketId);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const handleGroupChange = async (ticketId: number, newGroupId: number) => {
    setBusyId(ticketId);
    try {
      const current = tickets.find((ticket) => ticket.id === ticketId);
      const members = groupTechnicians[newGroupId] || [];
      const keepAssignee = Boolean(
        current?.technician_id && members.some((tech) => tech.id === current.technician_id)
      );
      const result = await apiCall(patchPath(ticketId), {
        method: 'PATCH',
        body: JSON.stringify(
          keepAssignee
            ? { group_id: newGroupId }
            : { group_id: newGroupId, technician_id: null }
        )
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo actualizar'); return; }
      toast.success('Grupo actualizado');
      await reloadCurrentView(ticketId);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const handleTechnicianChange = async (ticketId: number, newTechnicianId: number | null) => {
    setBusyId(ticketId);
    try {
      const result = await apiCall(patchPath(ticketId), {
        method: 'PATCH',
        body: JSON.stringify({ technician_id: newTechnicianId })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo actualizar'); return; }
      toast.success('Técnico actualizado');
      await reloadCurrentView(ticketId);
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

  const fetchTicketsForExport = async () => {
    const collected: Ticket[] = [];
    let currentPage = 1;
    let pages = 1;
    while (currentPage <= pages) {
      const params = buildTicketQueryParams(
        currentPage,
        100,
        listFilters,
        isStaffTable ? columnFilters : undefined,
        sortToQuery(columnSort)
      );
      const result = await apiCall(`${getTicketsApiPath(listMode)}?${params}`);
      if (!result?.response.ok) {
        throw new Error(result?.data?.message || 'No se pudieron obtener las solicitudes');
      }
      const batch = Array.isArray(result.data.data) ? result.data.data as Ticket[] : [];
      collected.push(...batch);
      pages = Number(result.data.totalPages) || 1;
      if (batch.length === 0) break;
      currentPage += 1;
      if (collected.length > 20000) {
        throw new Error('La exportación supera los 20.000 registros');
      }
    }
    return selectedIds.size > 0 ? collected.filter((ticket) => selectedIds.has(ticket.id)) : collected;
  };

  const exportTickets = async (format: ExportFormat) => {
    setExportAnchor(null);
    setExporting(true);
    try {
      const rows = await fetchTicketsForExport();
      if (rows.length === 0) {
        toast.error('No hay registros para exportar');
        return;
      }
      const filename = await downloadTableExport({
        filenameBase: 'Tickets',
        format,
        rows,
        meta: { generatedBy: getEmail() },
        columns: [
          { header: 'ID', value: (ticket) => ticket.id, width: 10 },
          { header: 'Ticket', value: (ticket) => ticket.title, width: 36 },
          { header: 'Usuario', value: (ticket) => ticket.user_email || '', width: 28 },
          { header: 'Grupo', value: (ticket) => ticket.group_name || '', width: 22 },
          { header: 'Asignado a', value: (ticket) => ticket.technician_email || 'Sin asignar', width: 28 },
          { header: 'Estado', value: (ticket) => getTicketStatusLabel(ticket.status), width: 16 },
          { header: 'Categoría', value: (ticket) => ticket.category || '', width: 18 },
          { header: 'Subcategoría', value: (ticket) => ticket.subcategory || '', width: 20 },
          {
            header: 'Fecha',
            value: (ticket) => {
              const date = new Date(ticket.created_at);
              return Number.isNaN(date.getTime()) ? '' : date;
            },
            width: 14
          }
        ]
      });
      toast.success(`Archivo descargado: ${filename}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo exportar');
    } finally {
      setExporting(false);
    }
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

  return (
    <SupportShell
      compact
      title="Solicitudes"
      headerActionGrow
      headerAction={
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          width: '100%',
          minWidth: 0,
          '& .MuiInputBase-root': { minHeight: 30 }
        }}>
          <TicketViewSelect
            inline
            role={role}
            groups={groups}
            selection={selection}
            currentFilters={listFilters}
            currentSortBy={sortBy}
            apiCall={apiCall}
            onApply={applySelection}
          />
          {!isStaffTable && (
            <TextField
              size="small"
              placeholder="Buscar en esta página..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: { xs: '100%', sm: 280 },
                maxWidth: 320,
                flex: { xs: '1 1 160px', sm: '0 1 280px' },
                '& .MuiInputBase-root': { height: 30, bgcolor: '#fff' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {isStaffTable && (
            <>
              <Tooltip title="Exportar">
                <span>
                  <IconButton
                    aria-label="Exportar"
                    color="primary"
                    onClick={(event) => setExportAnchor(event.currentTarget)}
                    disabled={loading || exporting || total === 0}
                  >
                    {exporting ? <CircularProgress size={18} /> : <FileDownloadIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              <Menu
                anchorEl={exportAnchor}
                open={Boolean(exportAnchor)}
                onClose={() => setExportAnchor(null)}
              >
                <MenuItem onClick={() => void exportTickets('xlsx')}>Excel (.xlsx)</MenuItem>
                <MenuItem onClick={() => void exportTickets('csv')}>CSV (.csv)</MenuItem>
              </Menu>
            </>
          )}
        </Box>
      }
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {isStaffTable && selectedIds.size > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 0.75, px: 0.5, flexShrink: 0 }}>
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
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: '#fff',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden'
          }}
        >
          <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 1480, ...denseTableSx }}>
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
                  <TableCell sx={{ minWidth: 200, maxWidth: 320 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <TicketTypeMark type={ticket.type} />
                      <Typography variant="body2" noWrap title={ticket.title} sx={{ fontWeight: 600, minWidth: 0 }}>
                        {ticket.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="caption" color="text.secondary" noWrap title={ticket.user_email || ''}>
                      {ticket.user_email || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canChangeGroup ? (
                      <InlineEditSelect
                        value={ticket.group_id ?? ''}
                        disabled={busyId === ticket.id || groupChoices.length === 0}
                        display={
                          <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                            {ticket.group_name || '—'}
                          </Typography>
                        }
                        onChange={(val) => handleGroupChange(ticket.id, Number(val))}
                      >
                        {(ticket.group_id && !groupChoices.some((g) => g.id === ticket.group_id)
                          ? [{ id: ticket.group_id, name: ticket.group_name || 'Grupo actual' }, ...groupChoices]
                          : groupChoices
                        ).map((g) => (
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
                        handleTechnicianChange(ticket.id, val ? Number(val) : null)
                      }
                    >
                      <MenuItem value=""><em>Sin asignar</em></MenuItem>
                      {(groupTechnicians[Number(ticket.group_id) || 0] || []).map((tech) => (
                        <MenuItem key={tech.id} value={tech.id}>{tech.email}</MenuItem>
                      ))}
                    </InlineEditSelect>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineEditSelect
                      value={ticket.status}
                      disabled={busyId === ticket.id}
                      display={<StatusBadge kind="status" value={ticket.status} />}
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
                  {canEditAll && can('tickets.delete') && (
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
          </Table>
          </TableContainer>
          <TicketsTableFooter
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Paper>
      ) : displayTickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: '#fff',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden'
          }}
        >
          <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 900, ...denseTableSx }}>
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
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <TicketTypeMark type={ticket.type} />
                      <Typography variant="body2" noWrap title={ticket.title} sx={{ fontWeight: 600, minWidth: 0 }}>
                        {ticket.title}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography variant="caption" color="text.secondary" noWrap title={truncateDescription(ticket.description, 500)}>
                      {truncateDescription(ticket.description)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="type" value={ticket.type} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="status" value={ticket.status} />
                  </TableCell>
                  <TableCell>
                    {isIncident(ticket.type) ? (
                      <StatusBadge kind="priority" value={ticket.priority} />
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
          <TicketsTableFooter
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Paper>
      )}
      </Box>
      <ResolveTicketDialog
        open={Boolean(resolveTicket)}
        ticket={resolveTicket}
        onClose={() => setResolveTicket(null)}
        onResolved={() => {
          const resolvedId = resolveTicket?.id;
          setResolveTicket(null);
          if (resolvedId) void reloadCurrentView(resolvedId);
        }}
      />
    </SupportShell>
  );
}
