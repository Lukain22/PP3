import { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Chip,
  IconButton,
  Tooltip
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
  emptyTicketListFilters,
  filtersFromView
} from '../../lib/ticketViews';
import { rowsFromListFilters, rowsFromStored, rowsToListFilters } from '../../lib/viewFilters';
import ViewEditorDialog, { type ViewEditorValues } from './ViewEditorDialog';

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

const emptyDraft = (): ViewEditorValues => ({
  name: '',
  visibility: 'personal',
  share_group_id: '',
  rows: [],
  sort_by: 'date-desc'
});

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
  const [editorKey, setEditorKey] = useState(0);
  const [draft, setDraft] = useState<ViewEditorValues>(emptyDraft());

  const loadViews = async () => {
    const result = await apiCall(`/views?scope=${scope}`);
    if (result?.response.ok) {
      setViews(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => { loadViews(); }, [scope]);

  const openCreateDialog = () => {
    setEditingView(null);
    setEditorKey((key) => key + 1);
    setDraft({
      name: '',
      visibility: 'personal',
      share_group_id: '',
      rows: rowsFromListFilters(currentFilters),
      sort_by: currentSortBy
    });
    setDialogOpen(true);
  };

  const openEditDialog = (view: TicketView) => {
    setEditingView(view);
    setEditorKey((key) => key + 1);
    setDraft({
      name: view.name,
      visibility: view.visibility,
      share_group_id: view.share_group_id ?? '',
      rows: rowsFromStored(view.filters),
      sort_by: view.sort_by || 'date-desc'
    });
    setDialogOpen(true);
  };

  const handleSave = async (values: ViewEditorValues) => {
    const filters = viewFiltersToPayload(
      rowsToListFilters(values.rows),
      values.rows.map((row) => row.field)
    );

    setSaving(true);
    try {
      const payload = {
        name: values.name,
        scope,
        visibility: values.visibility,
        share_group_id: values.visibility === 'group' ? values.share_group_id : null,
        filters,
        sort_by: values.sort_by
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
              onClick={() => onApplyView(view, filtersFromView(view), view.sort_by || 'date-desc')}
              color={activeViewId === view.id ? 'primary' : 'default'}
              variant={activeViewId === view.id ? 'filled' : 'outlined'}
            />
            {view.is_owner && !view.audience && (
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

      <ViewEditorDialog
        key={editorKey}
        open={dialogOpen}
        saving={saving}
        title={editingView ? 'Editar vista' : 'Nueva vista'}
        initial={draft}
        groups={groups}
        apiCall={apiCall}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
      />
    </>
  );
}
