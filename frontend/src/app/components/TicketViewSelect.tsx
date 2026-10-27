import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemButton,
  ListItemText,
  OutlinedInput,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { toast } from 'sonner';
import { can, canWatchTickets, type UserRole } from '../../lib/auth';
import { normalizeTicketColumns, STAFF_DEFAULT_COLUMNS } from '../../lib/ticketColumns';
import { rowsFromListFilters, rowsFromStored, rowsToListFilters } from '../../lib/viewFilters';
import ViewEditorDialog, { type ViewEditorValues } from './ViewEditorDialog';
import {
  type ActiveViewSelection,
  type SystemViewDefinition,
  type TicketListFilters,
  type TicketView,
  buildDefaultViewOrder,
  getFavoriteViewKeys,
  getSystemViewsForRole,
  saveFavoriteViewKeys,
  selectionFromCustomView,
  selectionFromSystemView,
  sortViewItems,
  systemViewKeyToItemKey,
  attachViewColumns,
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
  inline?: boolean;
}

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
  onApply,
  inline = false
}: TicketViewSelectProps) {
  const [customViews, setCustomViews] = useState<TicketView[]>([]);
  const [layoutOrder, setLayoutOrder] = useState<string[]>(buildDefaultViewOrder(role));
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>(() => getFavoriteViewKeys(role));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [viewQuery, setViewQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingView, setEditingView] = useState<TicketView | null>(null);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const didDragRef = useRef(false);
  const [editorKey, setEditorKey] = useState(0);
  const [draft, setDraft] = useState<ViewEditorValues>({
    name: '',
    visibility: 'personal',
    share_group_id: '',
    rows: [],
    columns: [...STAFF_DEFAULT_COLUMNS],
    sort_by: 'date-desc'
  });

  const systemViews = useMemo(() => getSystemViewsForRole(role), [role]);
  const seesSharedViews = role !== 'user' || canWatchTickets();
  const menuOpen = Boolean(menuAnchor);

  const loadData = async () => {
    const [viewsResult, layoutResult] = await Promise.all([
      apiCall('/views?scope=tickets'),
      apiCall('/views/layout')
    ]);
    if (viewsResult?.response.ok) {
      setCustomViews(Array.isArray(viewsResult.data) ? viewsResult.data : []);
    }
    if (
      layoutResult?.response.ok &&
      Array.isArray(layoutResult.data.order) &&
      layoutResult.data.order.length > 0
    ) {
      setLayoutOrder(layoutResult.data.order);
    } else {
      setLayoutOrder(buildDefaultViewOrder(role));
    }
  };

  useEffect(() => {
    setFavoriteKeys(getFavoriteViewKeys(role));
    loadData();
  }, [role]);

  const menuItems = useMemo(() => {
    const systemItems: ViewMenuItem[] = systemViews.map((system) => ({
      itemKey: systemViewKeyToItemKey(system.key),
      kind: 'system',
      system
    }));
    if (!seesSharedViews) return systemItems;
    const customItems: ViewMenuItem[] = customViews.map((view) => ({
      itemKey: viewIdToItemKey(view.id),
      kind: 'custom',
      view
    }));
    return sortViewItems([...systemItems, ...customItems], layoutOrder);
  }, [seesSharedViews, systemViews, customViews, layoutOrder]);

  const visibleMenuItems = useMemo(() => {
    const query = viewQuery.trim().toLocaleLowerCase();
    if (!query) return menuItems;
    return menuItems.filter((item) => {
      const name = item.kind === 'system' ? item.system.name : item.view.name;
      return name.toLocaleLowerCase().includes(query);
    });
  }, [menuItems, viewQuery]);

  const closeMenu = () => {
    setMenuAnchor(null);
    setViewQuery('');
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

  const persistOrder = async (next: string[], nextFavorites: string[] = favoriteKeys) => {
    const previous = layoutOrder;
    const previousFavorites = favoriteKeys;
    setLayoutOrder(next);
    setFavoriteKeys(nextFavorites);
    saveFavoriteViewKeys(role, nextFavorites);
    setReordering(true);

    try {
      const result = await apiCall('/views/layout', {
        method: 'PUT',
        body: JSON.stringify({ order: next })
      });
      if (!result?.response.ok) {
        setLayoutOrder(previous);
        setFavoriteKeys(previousFavorites);
        saveFavoriteViewKeys(role, previousFavorites);
        toast.error(result?.data.message || 'No se pudo guardar el orden');
      }
    } catch {
      setLayoutOrder(previous);
      setFavoriteKeys(previousFavorites);
      saveFavoriteViewKeys(role, previousFavorites);
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
    const nextFavorites = next.filter((key) => favoriteKeys.includes(key));
    await persistOrder(next, nextFavorites);
  };

  const toggleFavorite = async (itemKey: string) => {
    const order = menuItems.map((item) => item.itemKey);
    const currentFavorites = favoriteKeys.filter((key) => order.includes(key));
    const isFavorite = currentFavorites.includes(itemKey);

    const nextFavorites = isFavorite
      ? currentFavorites.filter((key) => key !== itemKey)
      : [...currentFavorites, itemKey];

    const favoriteSet = new Set(nextFavorites);
    const rest = order.filter((key) => !favoriteSet.has(key));
    const nextOrder = [...nextFavorites, ...rest];
    await persistOrder(nextOrder, nextFavorites);
  };

  const openCreateDialog = () => {
    closeMenu();
    setEditingView(null);
    setEditorKey((key) => key + 1);
    setDraft({
      name: '',
      visibility: 'personal',
      share_group_id: '',
      rows: rowsFromListFilters(currentFilters),
      columns: [...STAFF_DEFAULT_COLUMNS],
      sort_by: currentSortBy
    });
    setDialogOpen(true);
  };

  const openEditDialog = (view: TicketView) => {
    closeMenu();
    setEditingView(view);
    setEditorKey((key) => key + 1);
    setDraft({
      name: view.name,
      visibility: view.visibility,
      share_group_id: view.share_group_id ?? '',
      rows: rowsFromStored(view.filters),
      columns: normalizeTicketColumns(view.filters?.columns) || [...STAFF_DEFAULT_COLUMNS],
      sort_by: view.sort_by || 'date-desc'
    });
    setDialogOpen(true);
  };

  const handleSaveView = async (values: ViewEditorValues) => {
    const listFilters = rowsToListFilters(values.rows);
    const filters = attachViewColumns(
      viewFiltersToPayload(
        listFilters,
        values.rows.map((row) => row.field)
      ),
      values.columns
    );

    setSaving(true);
    try {
      const payload = {
        name: values.name,
        scope: 'tickets',
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
      await loadData();
      onApply(selectionFromCustomView(result.data as TicketView, role));
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
    const removedKey = viewIdToItemKey(view.id);
    const nextFavorites = favoriteKeys.filter((key) => key !== removedKey);
    if (nextFavorites.length !== favoriteKeys.length) {
      setFavoriteKeys(nextFavorites);
      saveFavoriteViewKeys(role, nextFavorites);
    }
    await loadData();
  };

  return (
    <>
      <FormControl
        fullWidth={!inline}
        size="small"
        sx={
          inline
            ? { width: { xs: '100%', sm: 260 }, maxWidth: 280, flex: { xs: '1 1 100%', sm: '0 1 260px' } }
            : { mb: 2 }
        }
      >
        {!inline && (
          <InputLabel id="ticket-view-select-label" shrink>
            Vista
          </InputLabel>
        )}
        <OutlinedInput
          id="ticket-view-select-label"
          readOnly
          label={inline ? undefined : 'Vista'}
          notched={!inline}
          value={selection.name}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          aria-label="Vista"
          sx={
            inline
              ? {
                  cursor: 'pointer',
                  bgcolor: 'background.paper',
                  height: 30,
                  borderRadius: 1.5,
                  fontSize: '0.8125rem',
                  '& .MuiOutlinedInput-input': { py: 0, px: 0.25 }
                }
              : { cursor: 'pointer', bgcolor: 'background.paper' }
          }
          startAdornment={
            <StarIcon sx={{ fontSize: inline ? 15 : 18, color: 'primary.main', mr: inline ? 0.5 : 1 }} />
          }
          endAdornment={
            inline ? <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} /> : undefined
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
              width: Math.max(menuAnchor?.offsetWidth || 260, 280),
              maxHeight: 420,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }
          }
        }}
      >
        <Box sx={{ py: 0.5, overflow: 'auto', flex: '1 1 auto', minHeight: 0 }}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: 'background.paper',
              px: 1,
              pt: 0.5,
              pb: 1
            }}
          >
            <TextField
              autoFocus
              size="small"
              fullWidth
              placeholder="Buscar vista..."
              value={viewQuery}
              onChange={(e) => setViewQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Box>
          {visibleMenuItems.map((item) => {
            const isActive =
              (item.kind === 'system' && selection.kind === 'system' && selection.key === item.system.key) ||
              (item.kind === 'custom' && selection.kind === 'custom' && selection.viewId === item.view.id);
            const isDragging = draggingKey === item.itemKey;
            const isDragOver = dragOverKey === item.itemKey && draggingKey !== item.itemKey;
            const isFavorite = favoriteKeys.includes(item.itemKey);

            return (
              <ListItemButton
                key={item.itemKey}
                draggable={seesSharedViews && !reordering}
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
                  position: 'relative',
                  py: 1,
                  pr: 1,
                  overflow: 'hidden',
                  opacity: isDragging ? 0.45 : 1,
                  cursor: seesSharedViews ? (reordering ? 'wait' : 'grab') : 'pointer',
                  bgcolor: isDragOver ? 'action.hover' : undefined,
                  borderTop: isDragOver ? '2px solid' : '2px solid transparent',
                  borderColor: isDragOver ? 'primary.main' : 'transparent',
                  '&:active': { cursor: 'grabbing' },
                  '&:hover, &:focus-within': {
                    pr: item.kind === 'custom' && item.view.is_owner ? 14 : 5.5
                  },
                  '& .view-row-actions': {
                    opacity: 0,
                    visibility: 'hidden',
                    pointerEvents: 'none'
                  },
                  '&:hover .view-row-actions, &:focus-within .view-row-actions': {
                    opacity: 1,
                    visibility: 'visible',
                    pointerEvents: 'auto'
                  }
                }}
              >
                {seesSharedViews && (
                  <DragIndicatorIcon sx={{ fontSize: 18, color: 'text.disabled', mr: 0.5, flexShrink: 0 }} />
                )}
                {item.kind === 'custom' && (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {item.view.visibility === 'public' ? (
                      <PublicIcon sx={{ fontSize: 16 }} />
                    ) : item.view.visibility === 'group' ? (
                      <GroupsIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 16 }} />
                    )}
                  </Box>
                )}
                <ListItemText
                  primary={item.kind === 'system' ? item.system.name : item.view.name}
                  slotProps={{ primary: { noWrap: true } }}
                  sx={{ minWidth: 0, my: 0 }}
                />
                <Stack
                  className="view-row-actions"
                  direction="row"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  sx={{
                    position: 'absolute',
                    right: 4,
                    top: 0,
                    bottom: 0,
                    alignItems: 'center',
                    pl: 0.5
                  }}
                >
                  <Tooltip title={isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}>
                    <IconButton
                      size="small"
                      aria-label={isFavorite ? 'Quitar de favoritas' : 'Marcar como favorita'}
                      aria-pressed={isFavorite}
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleFavorite(item.itemKey);
                      }}
                      sx={{ cursor: 'pointer', '&:active': { cursor: 'pointer' } }}
                    >
                      {isFavorite ? (
                        <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      ) : (
                        <StarBorderIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  {item.kind === 'custom' &&
                    item.view.is_owner &&
                    !item.view.audience &&
                    item.view.visibility !== 'public' && (
                      <>
                        <Tooltip title="Editar vista">
                          <IconButton
                            size="small"
                            aria-label="Editar vista"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(item.view);
                            }}
                            sx={{ cursor: 'pointer', '&:active': { cursor: 'pointer' } }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar vista">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="Eliminar vista"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.view);
                            }}
                            sx={{ cursor: 'pointer', '&:active': { cursor: 'pointer' } }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                </Stack>
              </ListItemButton>
            );
          })}

          {visibleMenuItems.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
              Ninguna vista coincide
            </Typography>
          )}
        </Box>
        {(role !== 'user' || can('views.create')) && (
          <Box
            sx={{
              flexShrink: 0,
              px: 0.75,
              py: 0.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'action.hover'
            }}
          >
            <Button
              fullWidth
              variant="contained"
              disableElevation
              onClick={openCreateDialog}
              startIcon={<AddIcon />}
              sx={{
                minHeight: 22,
                height: 22,
                px: 1,
                py: 0,
                borderRadius: 1,
                textTransform: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: 0.15,
                '& .MuiButton-startIcon': {
                  mr: 0.4,
                  ml: 0,
                  '& svg': { fontSize: 14 }
                }
              }}
            >
              Nueva vista
            </Button>
          </Box>
        )}
      </Popover>

      <ViewEditorDialog
        key={editorKey}
        open={dialogOpen}
        saving={saving}
        title={editingView ? 'Editar vista' : 'Nueva vista'}
        initial={draft}
        groups={groups}
        apiCall={apiCall}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSaveView}
      />
    </>
  );
}
