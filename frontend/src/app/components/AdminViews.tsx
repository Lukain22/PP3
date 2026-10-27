import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { toast } from 'sonner';
import { clearAuth, getToken } from '../../lib/auth';
import { rowsFromStored, rowsToListFilters } from '../../lib/viewFilters';
import { normalizeTicketColumns, STAFF_DEFAULT_COLUMNS } from '../../lib/ticketColumns';
import { attachViewColumns, viewFiltersToPayload, type TicketView } from '../../lib/ticketViews';
import SupportShell from './SupportShell';
import ViewEditorDialog, { type ViewEditorValues } from './ViewEditorDialog';

const API_URL = import.meta.env.VITE_API_URL as string;

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
    fontWeight: 600,
    bgcolor: 'background.tableHeader'
  },
  '& .MuiChip-root': {
    height: 22,
    fontSize: '0.75rem'
  }
};

const emptyDraft = (): ViewEditorValues => ({
  name: '',
  visibility: 'personal',
  share_group_id: '',
  share_group_ids: [],
  rows: [],
  columns: [...STAFF_DEFAULT_COLUMNS],
  sort_by: 'date-desc'
});

export default function AdminViews() {
  const navigate = useNavigate();
  const [views, setViews] = useState<TicketView[]>([]);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TicketView | null>(null);
  const [draft, setDraft] = useState<ViewEditorValues>(emptyDraft);
  const [editorKey, setEditorKey] = useState(0);

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
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
      clearAuth();
      navigate('/');
      return null;
    }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const loadViews = async () => {
    const result = await apiCall('/admin/views');
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'No se pudieron cargar las vistas');
      return;
    }
    setViews(Array.isArray(result.data) ? result.data : []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [viewsResult, groupsResult] = await Promise.all([
        apiCall('/admin/views'),
        apiCall('/admin/groups')
      ]);
      if (cancelled) return;
      if (viewsResult?.response.ok) setViews(Array.isArray(viewsResult.data) ? viewsResult.data : []);
      else if (viewsResult) toast.error(viewsResult.data.message || 'No se pudieron cargar las vistas');
      if (groupsResult?.response.ok) {
        const list = Array.isArray(groupsResult.data) ? groupsResult.data : groupsResult.data.groups;
        setGroups(Array.isArray(list) ? list.map((group: { id: number; name: string }) => ({ id: group.id, name: group.name })) : []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleViews = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return views;
    return views.filter((view) => {
      const groupsText = (view.share_groups || []).map((group) => group.name || '').join(' ');
      return [view.name, view.creator_email || '', groupsText]
        .join(' ')
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [views, search]);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft());
    setEditorKey((key) => key + 1);
    setDialogOpen(true);
  };

  const openEdit = (view: TicketView) => {
    const groupIds = (view.share_groups?.length
      ? view.share_groups.map((group) => group.id)
      : (view.share_group_id ? [view.share_group_id] : [])
    );
    setEditing(view);
    setDraft({
      name: view.name,
      visibility: view.visibility === 'public' ? 'public' : 'personal',
      share_group_id: groupIds[0] ?? '',
      share_group_ids: view.visibility === 'public' ? [] : groupIds,
      rows: rowsFromStored(view.filters),
      columns: normalizeTicketColumns(view.filters?.columns) || [...STAFF_DEFAULT_COLUMNS],
      sort_by: view.sort_by || 'date-desc'
    });
    setEditorKey((key) => key + 1);
    setDialogOpen(true);
  };

  const handleSave = async (values: ViewEditorValues) => {
    const listFilters = rowsToListFilters(values.rows);
    const filters = attachViewColumns(
      viewFiltersToPayload(listFilters, values.rows.map((row) => row.field)),
      values.columns
    );
    setSaving(true);
    try {
      const result = await apiCall(editing ? `/admin/views/${editing.id}` : '/admin/views', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: values.name,
          scope: 'tickets',
          visibility: values.visibility,
          share_group_id: values.share_group_ids?.[0] ?? null,
          share_group_ids: values.share_group_ids || [],
          filters,
          sort_by: values.sort_by
        })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar la vista');
        return;
      }
      toast.success(editing ? 'Vista actualizada' : 'Vista creada');
      setDialogOpen(false);
      await loadViews();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const toggleHidden = async (view: TicketView) => {
    setBusyId(view.id);
    try {
      const result = await apiCall(`/admin/views/${view.id}/hidden`, {
        method: 'PATCH',
        body: JSON.stringify({ hidden: !view.hidden })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo actualizar la vista');
        return;
      }
      toast.success(view.hidden ? 'Vista visible' : 'Vista oculta');
      await loadViews();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (view: TicketView) => {
    if (!window.confirm(`¿Eliminar la vista "${view.name}"?`)) return;
    setBusyId(view.id);
    try {
      const result = await apiCall(`/admin/views/${view.id}`, { method: 'DELETE' });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo eliminar la vista');
        return;
      }
      toast.success('Vista eliminada');
      await loadViews();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <SupportShell
      title="Vistas"
      
      backTo="/admin"
      breadcrumbs={[{ label: 'Administración', to: '/admin' }, { label: 'Vistas' }]}
      headerAction={(
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar vista"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }
            }}
            sx={{ width: 220, '& .MuiInputBase-root': { height: 30 } }}
          />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ height: 30 }}>
            Nueva vista
          </Button>
        </Stack>
      )}
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
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
              overflow: 'hidden'
            }}
          >
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table stickyHeader size="small" sx={denseTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Creador</TableCell>
                    <TableCell sx={{ width: 140 }}>Fecha</TableCell>
                    <TableCell sx={{ width: 110 }}>Visibilidad</TableCell>
                    <TableCell>Grupos</TableCell>
                    <TableCell sx={{ width: 100 }}>Estado</TableCell>
                    <TableCell sx={{ width: 120 }} align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleViews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                          {search.trim() ? 'Sin resultados para esa búsqueda.' : 'No hay vistas.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : visibleViews.map((view) => {
                    const groupNames = (view.share_groups || [])
                      .map((group) => group.name)
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <TableRow key={view.id} hover sx={{ opacity: view.hidden ? 0.55 : 1 }}>
                        <TableCell sx={{ fontWeight: 600, maxWidth: 240 }}>
                          <Typography variant="body2" noWrap title={view.name} sx={{ fontWeight: 600 }}>
                            {view.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" color="text.secondary" noWrap title={view.creator_email || ''}>
                            {view.creator_email || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{view.created_at ? formatDate(view.created_at) : '—'}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={view.visibility === 'public' ? 'Pública' : 'Privada'}
                            color={view.visibility === 'public' ? 'primary' : 'default'}
                            variant={view.visibility === 'public' ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="body2" color="text.secondary" noWrap title={groupNames}>
                            {groupNames || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={view.hidden ? 'Oculta' : 'Visible'}
                            color={view.hidden ? 'warning' : 'success'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title={view.hidden ? 'Mostrar' : 'Ocultar'}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label={view.hidden ? 'Mostrar vista' : 'Ocultar vista'}
                                disabled={busyId === view.id}
                                onClick={() => toggleHidden(view)}
                              >
                                {view.hidden ? <VisibilityOutlinedIcon fontSize="small" /> : <VisibilityOffOutlinedIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <span>
                              <IconButton size="small" aria-label="Editar vista" disabled={busyId === view.id} onClick={() => openEdit(view)}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                aria-label="Eliminar vista"
                                disabled={busyId === view.id}
                                onClick={() => handleDelete(view)}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ flexShrink: 0, px: 1.5, py: 0.5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="body2" color="text.secondary">
                {search.trim() && visibleViews.length !== views.length
                  ? `${visibleViews.length} de ${views.length} vistas`
                  : `${views.length} vista${views.length === 1 ? '' : 's'}`}
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>

      <ViewEditorDialog
        key={editorKey}
        open={dialogOpen}
        saving={saving}
        title={editing ? 'Editar vista' : 'Nueva vista'}
        initial={draft}
        groups={groups}
        apiCall={apiCall}
        adminMode
        onClose={() => !saving && setDialogOpen(false)}
        onSubmit={handleSave}
      />
    </SupportShell>
  );
}
