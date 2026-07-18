import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  ListItemButton,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Popover,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<TicketView | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const didDragRef = useRef(false);
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
  const menuOpen = Boolean(menuAnchor);

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

  const closeMenu = () => {
    setMenuAnchor(null);
    setDraggingKey(null);
    setDragOverKey(null);
  };

  const applyViewItem = (item: ViewMenuItem) => {
    if (item.kind === 'system') {
      onApply(selectionFromSystemView(item.system));
      return;
    }
    onApply(selectionFromCustomView(item.view, role));
  };

  const handleViewClick = (item: ViewMenuItem) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    applyViewItem(item);
    closeMenu();
  };

  const persistOrder = async (next: string[]) => {
    const previous = layoutOrder;
    setLayoutOrder(next);
    setReordering(true);

    try {
      const result = await apiCall('/views/layout', {
        method: 'PUT',
        body: JSON.stringify({ order: next })
      });
      if (!result?.response.ok) {
        setLayoutOrder(previous);
        toast.error(result?.data.message || 'No se pudo guardar el orden');
      }
    } catch {
      setLayoutOrder(previous);
      toast.error('Error conectando con el backend');
    } finally {
      setReordering(false);
    }
  };

  const reorderViews = async (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;

    const order = menuItems.map((item) => item.itemKey);
    const from = order.indexOf(sourceKey);
    const to = order.indexOf(targetKey);
    if (from < 0 || to < 0) return;

    const next = [...order];
    next.splice(from, 1);
    next.splice(to, 0, sourceKey);
    await persistOrder(next);
  };

  const openCreateDialog = () => {
    closeMenu();
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
    closeMenu();
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

  const renderViewIcon = (item: ViewMenuItem) => {
    if (item.kind === 'system') {
      return <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
    }
    if (item.view.visibility === 'group') {
      return <GroupsIcon sx={{ fontSize: 16 }} />;
    }
    return <PersonIcon sx={{ fontSize: 16 }} />;
  };

  return (
    <>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="ticket-view-select-label" shrink>Vista</InputLabel>
        <OutlinedInput
          id="ticket-view-select-label"
          readOnly
          label="Vista"
          notched
          value={selection.name}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{ cursor: 'pointer', bgcolor: '#fff' }}
          startAdornment={
            <StarIcon sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
          }
        />
      </FormControl>

      <Popover
        open={menuOpen}
        anchorEl={menuAnchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              width: menuAnchor?.offsetWidth || 320,
              maxHeight: 420,
              overflow: 'auto'
            }
          }
        }}
      >
        <Box sx={{ py: 0.5 }}>
          {menuItems.map((item) => {
            const isActive =
              (item.kind === 'system' && selection.kind === 'system' && selection.key === item.system.key) ||
              (item.kind === 'custom' && selection.kind === 'custom' && selection.viewId === item.view.id);
            const isDragging = draggingKey === item.itemKey;
            const isDragOver = dragOverKey === item.itemKey && draggingKey !== item.itemKey;

            return (
              <ListItemButton
                key={item.itemKey}
                draggable={!reordering}
                selected={isActive}
                onClick={() => handleViewClick(item)}
                onDragStart={(e) => {
                  didDragRef.current = true;
                  setDraggingKey(item.itemKey);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', item.itemKey);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverKey(item.itemKey);
                }}
                onDragLeave={() => {
                  if (dragOverKey === item.itemKey) setDragOverKey(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  const sourceKey = e.dataTransfer.getData('text/plain') || draggingKey;
                  if (sourceKey) {
                    await reorderViews(sourceKey, item.itemKey);
                  }
                  setDraggingKey(null);
                  setDragOverKey(null);
                }}
                onDragEnd={() => {
                  setDraggingKey(null);
                  setDragOverKey(null);
                }}
                sx={{
                  py: 1,
                  opacity: isDragging ? 0.45 : 1,
                  cursor: reordering ? 'wait' : 'grab',
                  bgcolor: isDragOver ? 'action.hover' : undefined,
                  borderTop: isDragOver ? '2px solid' : '2px solid transparent',
                  borderColor: isDragOver ? 'primary.main' : 'transparent',
                  '&:active': { cursor: 'grabbing' }
                }}
              >
                <DragIndicatorIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 0.5, flexShrink: 0 }} />
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {renderViewIcon(item)}
                </Box>
                <ListItemText
                  primary={item.kind === 'system' ? item.system.name : item.view.name}
                  sx={{ minWidth: 0 }}
                />
                {item.kind === 'custom' && item.view.is_owner && (
                  <Stack direction="row" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(item.view);
                      }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.view);
                      }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                )}
              </ListItemButton>
            );
          })}

          <Divider sx={{ my: 0.5 }} />

          <ListItemButton onClick={openCreateDialog}>
            <AddIcon sx={{ fontSize: 18, mr: 1.5 }} />
            <ListItemText primary="Crear vista con filtros actuales" />
          </ListItemButton>
        </Box>
      </Popover>

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
    </>
  );
}
