import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import { toast } from 'sonner';
import type { UserRole } from '../../lib/auth';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';
import { TICKET_TYPE_OPTIONS } from '../../lib/ticketTypes';
import {
  type ActiveViewSelection,
  type SystemViewDefinition,
  type TicketListFilters,
  type TicketView,
  buildDefaultViewOrder,
  getSystemViewsForRole,
  parseViewItemKey,
  selectionFromCustomView,
  selectionFromSystemView,
  sortViewItems,
  systemViewKeyToItemKey,
  viewFiltersToPayload,
  viewIdToItemKey
} from '../../lib/ticketViews';

interface GroupOption {
  id: number;
  name: string;
}

interface TicketViewSelectProps {
  role: UserRole;
  groups: GroupOption[];
  selection: ActiveViewSelection;
  currentFilters: TicketListFilters;
  currentSortBy: string;
  apiCall: (path: string, options?: RequestInit) => Promise<{ response: Response; data: any } | null>;
  onApply: (selection: ActiveViewSelection) => void;
}

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' }
];

type ViewMenuItem =
  | { itemKey: string; kind: 'system'; system: SystemViewDefinition }
  | { itemKey: string; kind: 'custom'; view: TicketView };

export default function TicketViewSelect({
  role,
  groups,
  selection,
  currentFilters,
  currentSortBy,
  apiCall,
  onApply
}: TicketViewSelectProps) {
  const [customViews, setCustomViews] = useState<TicketView[]>([]);
  const [layoutOrder, setLayoutOrder] = useState<string[]>(buildDefaultViewOrder(role));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderDraft, setOrderDraft] = useState<string[]>([]);
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

  const systemViews = useMemo(() => getSystemViewsForRole(role), [role]);

  const loadData = async () => {
    const [viewsResult, layoutResult] = await Promise.all([
      apiCall('/views?scope=tickets'),
      apiCall('/views/layout')
    ]);
    if (viewsResult?.response.ok) {
      setCustomViews(Array.isArray(viewsResult.data) ? viewsResult.data : []);
    }
    if (layoutResult?.response.ok && Array.isArray(layoutResult.data.order) && layoutResult.data.order.length > 0) {
      setLayoutOrder(layoutResult.data.order);
    } else {
      setLayoutOrder(buildDefaultViewOrder(role));
    }
  };

  useEffect(() => { loadData(); }, [role]);

  const menuItems = useMemo(() => {
    const systemItems: ViewMenuItem[] = systemViews.map((system) => ({
      itemKey: systemViewKeyToItemKey(system.key),
      kind: 'system',
      system
    }));
    const customItems: ViewMenuItem[] = customViews.map((view) => ({
      itemKey: viewIdToItemKey(view.id),
      kind: 'custom',
      view
    }));
    return sortViewItems([...systemItems, ...customItems], layoutOrder);
  }, [systemViews, customViews, layoutOrder]);

  const selectValue =
    selection.kind === 'system' && selection.key
      ? systemViewKeyToItemKey(selection.key)
      : selection.kind === 'custom' && selection.viewId
        ? viewIdToItemKey(selection.viewId)
        : '';

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const itemKey = event.target.value;
    if (itemKey === '__create__') {
      openCreateDialog();
      return;
    }
    if (itemKey === '__order__') {
      openOrderDialog();
      return;
    }

    const parsed = parseViewItemKey(itemKey);
    if (!parsed) return;

    if (parsed.kind === 'system' && parsed.key) {
      const system = systemViews.find((view) => view.key === parsed.key);
      if (system) onApply(selectionFromSystemView(system));
      return;
    }

    if (parsed.kind === 'custom' && parsed.viewId) {
      const view = customViews.find((item) => item.id === parsed.viewId);
      if (view) onApply(selectionFromCustomView(view, role));
    }
  };

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

  const openOrderDialog = () => {
    setOrderDraft(menuItems.map((item) => item.itemKey));
    setOrderDialogOpen(true);
  };

  const moveOrderItem = (index: number, direction: -1 | 1) => {
    const next = [...orderDraft];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrderDraft(next);
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const result = await apiCall('/views/layout', {
        method: 'PUT',
        body: JSON.stringify({ order: orderDraft })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar el orden');
        return;
      }
      setLayoutOrder(orderDraft);
      setOrderDialogOpen(false);
      toast.success('Orden de vistas guardado');
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveView = async () => {
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
        scope: 'tickets',
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
      await loadData();
      if (!editingView) {
        onApply(selectionFromCustomView(result.data as TicketView, role));
      }
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
    await loadData();
  };

  const labelForItemKey = (itemKey: string) => {
    const parsed = parseViewItemKey(itemKey);
    if (!parsed) return itemKey;
    if (parsed.kind === 'system' && parsed.key) {
      return systemViews.find((view) => view.key === parsed.key)?.name || itemKey;
    }
    if (parsed.kind === 'custom' && parsed.viewId) {
      return customViews.find((view) => view.id === parsed.viewId)?.name || itemKey;
    }
    return itemKey;
  };

  return (
    <>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="ticket-view-select-label">Vista</InputLabel>
        <Select
          labelId="ticket-view-select-label"
          label="Vista"
          value={selectValue}
          onChange={handleSelectChange}
          renderValue={() => (
            <Stack direction="row" spacing={1} alignItems="center">
              <StarIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{selection.name}</Typography>
            </Stack>
          )}
        >
          {menuItems.map((item) => (
            <MenuItem key={item.itemKey} value={item.itemKey}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                {item.kind === 'system' ? (
                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                ) : item.view.visibility === 'group' ? (
                  <GroupsIcon sx={{ fontSize: 16 }} />
                ) : (
                  <PersonIcon sx={{ fontSize: 16 }} />
                )}
                <ListItemText
                  primary={item.kind === 'system' ? item.system.name : item.view.name}
                  secondary={
                    item.kind === 'custom' && !item.view.is_owner
                      ? `Compartida · ${item.view.creator_email || ''}`
                      : item.kind === 'system'
                        ? 'Vista general'
                        : item.view.visibility === 'group'
                          ? `Compartida · ${item.view.share_group_name || ''}`
                          : 'Personal'
                  }
                />
                {item.kind === 'custom' && item.view.is_owner && (
                  <Stack direction="row" onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => openEditDialog(item.view)}>
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.view)}>
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                )}
              </Stack>
            </MenuItem>
          ))}
          <MenuItem value="__create__">
            <AddIcon sx={{ fontSize: 18, mr: 1 }} />
            Crear vista con filtros actuales
          </MenuItem>
          <MenuItem value="__order__">
            Ordenar vistas favoritas
          </MenuItem>
        </Select>
      </FormControl>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingView ? 'Editar vista' : 'Nueva vista'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus />
            <TextField select label="Visibilidad" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as 'personal' | 'group', share_group_id: e.target.value === 'personal' ? '' : form.share_group_id })} fullWidth>
              <MenuItem value="personal">Personal</MenuItem>
              <MenuItem value="group">Compartida con grupo</MenuItem>
            </TextField>
            {form.visibility === 'group' && (
              <TextField select label="Grupo con acceso" value={form.share_group_id} onChange={(e) => setForm({ ...form, share_group_id: Number(e.target.value) })} fullWidth>
                {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </TextField>
            )}
            <TextField select label="Tipo (filtro)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, priority: e.target.value === 'requirement' ? '' : form.priority })} fullWidth>
              <MenuItem value="">Todos</MenuItem>
              {TICKET_TYPE_OPTIONS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField select label="Grupo (filtro)" value={form.filter_group_id} onChange={(e) => setForm({ ...form, filter_group_id: e.target.value })} fullWidth>
              <MenuItem value="">Todos</MenuItem>
              {groups.map((g) => <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>)}
            </TextField>
            <FormControl fullWidth>
              <InputLabel id="view-status-label">Estado (filtro)</InputLabel>
              <Select labelId="view-status-label" multiple value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as string[] })} input={<OutlinedInput label="Estado (filtro)" />} renderValue={(selected) => selected.map((s) => TICKET_STATUS_OPTIONS.find((o) => o.value === s)?.label || s).join(', ')}>
                {TICKET_STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    <Checkbox checked={form.status.includes(s.value)} />
                    <ListItemText primary={s.label} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField select label="Prioridad (filtro)" value={form.priority} disabled={form.type === 'requirement'} onChange={(e) => setForm({ ...form, priority: e.target.value })} fullWidth>
              <MenuItem value="">Todas</MenuItem>
              {PRIORITY_OPTIONS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </TextField>
            <TextField select label="Orden" value={form.sort_by} onChange={(e) => setForm({ ...form, sort_by: e.target.value })} fullWidth>
              <MenuItem value="date-desc">Más recientes</MenuItem>
              <MenuItem value="date-asc">Más antiguos</MenuItem>
              <MenuItem value="priority-desc">Prioridad alta primero</MenuItem>
              <MenuItem value="title-asc">Título A-Z</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveView} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={orderDialogOpen} onClose={() => !saving && setOrderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Orden de vistas favoritas</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {orderDraft.map((itemKey, index) => (
              <Stack key={itemKey} direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ flex: 1 }}>{labelForItemKey(itemKey)}</Typography>
                <IconButton size="small" disabled={index === 0} onClick={() => moveOrderItem(index, -1)}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={index === orderDraft.length - 1} onClick={() => moveOrderItem(index, 1)}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={saveOrder} disabled={saving}>{saving ? 'Guardando...' : 'Guardar orden'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
