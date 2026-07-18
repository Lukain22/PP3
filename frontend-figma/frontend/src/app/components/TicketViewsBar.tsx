import { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import { toast } from 'sonner';
import {
  type TicketView,
  type TicketListFilters,
  viewFiltersToPayload,
  emptyTicketListFilters
} from '../../lib/ticketViews';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';
import { TICKET_TYPE_OPTIONS } from '../../lib/ticketTypes';

interface GroupOption {
  id: number;
  name: string;
}

interface TicketViewsBarProps {
  scope: 'admin' | 'technician';
  groups: GroupOption[];
  currentFilters: TicketListFilters;
  currentSortBy: string;
  activeViewId: number | null;
  apiCall: (path: string, options?: RequestInit) => Promise<{ response: Response; data: any } | null>;
  onApplyView: (view: TicketView | null, filters: TicketListFilters, sortBy: string) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' }
];

export default function TicketViewsBar({
  scope,
  groups,
  currentFilters,
  currentSortBy,
  activeViewId,
  apiCall,
  onApplyView
}: TicketViewsBarProps) {
  const [views, setViews] = useState<TicketView[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<TicketView | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    visibility: 'personal' as 'personal' | 'group',
    share_group_id: '' as number | '',
    type: '',
    filter_group_id: '',
    status: [] as string[],
    priority: '',
    sort_by: 'date-desc'
  });

  const loadViews = async () => {
    const result = await apiCall(`/views?scope=${scope}`);
    if (result?.response.ok) {
      setViews(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => { loadViews(); }, [scope]);

  const openCreateDialog = () => {
    setEditingView(null);
    setForm({
      name: '',
      visibility: 'personal',
      share_group_id: '',
      type: currentFilters.type,
      filter_group_id: currentFilters.group_id,
      status: currentFilters.status ? currentFilters.status.split(',').filter(Boolean) : [],
      priority: currentFilters.priority,
      sort_by: currentSortBy
    });
    setDialogOpen(true);
  };

  const openEditDialog = (view: TicketView) => {
    setEditingView(view);
    setForm({
      name: view.name,
      visibility: view.visibility,
      share_group_id: view.share_group_id ?? '',
      type: view.filters.type || '',
      filter_group_id: view.filters.filter_group_id
        ? String(view.filters.filter_group_id)
        : view.filters.group_id
          ? String(view.filters.group_id)
          : '',
      status: view.filters.status || [],
      priority: view.filters.priority || '',
      sort_by: view.sort_by || 'date-desc'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (form.visibility === 'group' && !form.share_group_id) {
      toast.error('Seleccioná un grupo para compartir');
      return;
    }

    const filters = viewFiltersToPayload({
      type: form.type,
      group_id: form.filter_group_id,
      status: form.status.join(','),
      priority: form.priority
    });

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        scope,
        visibility: form.visibility,
        share_group_id: form.visibility === 'group' ? form.share_group_id : null,
        filters,
        sort_by: form.sort_by
      };

      const result = await apiCall(editingView ? `/views/${editingView.id}` : '/views', {
        method: editingView ? 'PATCH' : 'POST',
        body: JSON.stringify(payload)
      });

      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar la vista');
        return;
      }

      toast.success(editingView ? 'Vista actualizada' : 'Vista creada');
      setDialogOpen(false);
      await loadViews();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (view: TicketView) => {
    if (!window.confirm(`¿Eliminar la vista "${view.name}"?`)) return;
    const result = await apiCall(`/views/${view.id}`, { method: 'DELETE' });
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'No se pudo eliminar');
      return;
    }
    toast.success('Vista eliminada');
    if (activeViewId === view.id) {
      onApplyView(null, emptyTicketListFilters(), 'date-desc');
    }
    await loadViews();
  };

  return (
    <>
      <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center" sx={{ mb: 2 }}>
        <Chip
          label="Todos"
          onClick={() => onApplyView(null, emptyTicketListFilters(), currentSortBy)}
          color={activeViewId === null ? 'primary' : 'default'}
          variant={activeViewId === null ? 'filled' : 'outlined'}
        />
        {views.map((view) => (
          <Box key={view.id} sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <Chip
              icon={view.visibility === 'group' ? <GroupsIcon /> : <PersonIcon />}
              label={view.name}
              onClick={() => onApplyView(view, {
                type: view.filters.type || '',
                group_id: view.filters.filter_group_id
                  ? String(view.filters.filter_group_id)
                  : view.filters.group_id
                    ? String(view.filters.group_id)
                    : '',
                status: view.filters.status?.join(',') || '',
                priority: view.filters.priority || ''
              }, view.sort_by || 'date-desc')}
              color={activeViewId === view.id ? 'primary' : 'default'}
              variant={activeViewId === view.id ? 'filled' : 'outlined'}
            />
            {view.is_owner && (
              <>
                <Tooltip title="Editar vista">
                  <IconButton size="small" onClick={() => openEditDialog(view)}>
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar vista">
                  <IconButton size="small" color="error" onClick={() => handleDelete(view)}>
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ))}
        <Tooltip title="Guardar vista con filtros actuales">
          <Chip
            icon={<AddIcon />}
            label="Nueva vista"
            onClick={openCreateDialog}
            variant="outlined"
            clickable
          />
        </Tooltip>
      </Stack>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingView ? 'Editar vista' : 'Nueva vista'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              autoFocus
            />
            <TextField
              select
              label="Visibilidad"
              value={form.visibility}
              onChange={(e) => setForm({
                ...form,
                visibility: e.target.value as 'personal' | 'group',
                share_group_id: e.target.value === 'personal' ? '' : form.share_group_id
              })}
              fullWidth
            >
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="group">Compartida con grupo</MenuItem>
            </TextField>
            {form.visibility === 'group' && (
              <TextField
                select
                label="Grupo con acceso"
                value={form.share_group_id}
                onChange={(e) => setForm({ ...form, share_group_id: Number(e.target.value) })}
                fullWidth
              >
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              label="Tipo (filtro)"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value, priority: e.target.value === 'requirement' ? '' : form.priority })}
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              {TICKET_TYPE_OPTIONS.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Grupo (filtro)"
              value={form.filter_group_id}
              onChange={(e) => setForm({ ...form, filter_group_id: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Todos</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>
              ))}
            </TextField>
            <FormControl fullWidth>
              <InputLabel id="view-status-label">Estado (filtro)</InputLabel>
              <Select
                labelId="view-status-label"
                multiple
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as string[] })}
                input={<OutlinedInput label="Estado (filtro)" />}
                renderValue={(selected) =>
                  selected.map((s) => TICKET_STATUS_OPTIONS.find((o) => o.value === s)?.label || s).join(', ')
                }
              >
                {TICKET_STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    <Checkbox checked={form.status.includes(s.value)} />
                    <ListItemText primary={s.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              select
              label="Prioridad (filtro)"
              value={form.priority}
              disabled={form.type === 'requirement'}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              fullWidth
            >
              <MenuItem value="">Todas</MenuItem>
              {PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Orden"
              value={form.sort_by}
              onChange={(e) => setForm({ ...form, sort_by: e.target.value })}
              fullWidth
            >
              <MenuItem value="date-desc">Más recientes</MenuItem>
              <MenuItem value="date-asc">Más antiguos</MenuItem>
              <MenuItem value="priority-desc">Prioridad alta primero</MenuItem>
              <MenuItem value="title-asc">Título A-Z</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
