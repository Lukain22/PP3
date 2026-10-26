import { useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import { es } from 'date-fns/locale';
import { format, isValid, parse, startOfMonth, endOfMonth, startOfYear, subDays, subMonths } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { toast } from 'sonner';
import { CATEGORIES } from '../../lib/categories';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';
import { TICKET_TYPE_OPTIONS } from '../../lib/ticketTypes';
import {
  VIEW_FILTER_FIELDS,
  isDateFilterField,
  priorityApplies,
  subcategoryOptions,
  viewFilterIssue,
  type ViewFilterField,
  type ViewFilterRow
} from '../../lib/viewFilters';

export interface ViewEditorValues {
  name: string;
  visibility: 'personal' | 'group';
  share_group_id: number | '';
  rows: ViewFilterRow[];
  sort_by: string;
}

interface ViewEditorDialogProps {
  open: boolean;
  saving: boolean;
  title: string;
  initial: ViewEditorValues;
  groups: { id: number; name: string }[];
  apiCall: (path: string, options?: RequestInit) => Promise<{ response: Response; data: any } | null>;
  onClose: () => void;
  onSubmit: (values: ViewEditorValues) => void;
}

interface Choice {
  value: string;
  label: string;
}

const PRIORITY_OPTIONS: Choice[] = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' }
];

const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

function parseDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(date) ? date : undefined;
}

function formatDay(value: string, fallback: string) {
  const date = parseDay(value);
  return date ? format(date, 'dd/MM/yyyy') : fallback;
}

function OptionMenu({
  options,
  selected,
  multiple = false,
  onChange,
  disabled = false,
  placeholder = 'Seleccionar',
  error = false,
  searchable
}: {
  options: Choice[];
  selected: string[];
  multiple?: boolean;
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  searchable?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const open = Boolean(anchor);
  const showSearch = searchable ?? (multiple || options.length > 5);
  const filtered = options.filter((option) => fold(option.label).includes(fold(query.trim())));
  const selectedLabels = selected
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean);
  const summary = selectedLabels.length ? selectedLabels.join(', ') : placeholder;
  const allSelected = options.length > 0 && options.every((option) => selected.includes(option.value));

  const close = () => {
    setAnchor(null);
    setQuery('');
  };

  const toggle = (value: string) => {
    if (!multiple) {
      onChange([value]);
      close();
      return;
    }
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <>
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-expanded={open}
        onClick={(event) => {
          if (!disabled) setAnchor(event.currentTarget);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setAnchor(event.currentTarget);
          }
        }}
        sx={{
          minHeight: 40,
          px: 1.25,
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          border: '1px solid',
          borderColor: error ? 'error.main' : open ? 'primary.main' : '#c5d0dc',
          boxShadow: open ? '0 0 0 3px rgba(25, 118, 210, 0.12)' : 'none',
          borderRadius: 1,
          bgcolor: disabled ? '#f3f6f9' : '#fff',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'border-color 120ms ease, box-shadow 120ms ease',
          '&:hover': disabled ? undefined : { borderColor: error ? 'error.main' : '#7f93a8' }
        }}
      >
        <Typography
          noWrap
          title={summary}
          sx={{ flex: 1, fontSize: 14, color: selectedLabels.length ? 'text.primary' : 'text.secondary' }}
        >
          {summary}
        </Typography>
        <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
      </Box>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              width: Math.max(anchor?.clientWidth || 0, 260),
              borderRadius: 1.5,
              border: '1px solid #e1e8f0'
            }
          }
        }}
      >
        {showSearch && (
          <Box sx={{ p: 1, borderBottom: '1px solid #e8eef5' }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="Buscar..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
          </Box>
        )}
        {multiple && options.length > 0 && (
          <Stack direction="row" sx={{ px: 1, py: 0.5, borderBottom: '1px solid #e8eef5' }}>
            <Button
              size="small"
              disabled={allSelected}
              onClick={() => {
                const visible = filtered.map((option) => option.value);
                onChange(query.trim() ? [...new Set([...selected, ...visible])] : visible);
              }}
              sx={{ textTransform: 'none', fontSize: 12.5 }}
            >
              Seleccionar todos
            </Button>
            <Button
              size="small"
              disabled={selected.length === 0}
              onClick={() => onChange([])}
              sx={{ textTransform: 'none', fontSize: 12.5 }}
            >
              Deseleccionar todos
            </Button>
          </Stack>
        )}
        <Box sx={{ maxHeight: 280, overflow: 'auto', py: 0.5 }}>
          {filtered.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
              Sin resultados
            </Typography>
          )}
          {filtered.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <ListItemButton
                key={option.value}
                selected={checked}
                onClick={() => toggle(option.value)}
                sx={{ py: 0.6, minHeight: 36 }}
              >
                {multiple && <Checkbox size="small" checked={checked} tabIndex={-1} sx={{ p: 0.5, mr: 1 }} />}
                <ListItemText
                  primary={option.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: checked ? 600 : 400 }}
                />
              </ListItemButton>
            );
          })}
        </Box>
      </Popover>
    </>
  );
}

function DateRangeField({
  from,
  to,
  onChange
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [bound, setBound] = useState<'from' | 'to'>('from');
  const currentYear = new Date().getFullYear();
  const activeValue = bound === 'from' ? from : to;

  const apply = (nextFrom: string, nextTo: string) => {
    if (nextFrom && nextTo && nextFrom > nextTo) onChange(nextTo, nextFrom);
    else onChange(nextFrom, nextTo);
  };

  const applyPreset = (start: Date, end: Date) => {
    onChange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    setAnchor(null);
  };

  const today = new Date();
  const previousMonth = subMonths(today, 1);
  const presets = [
    { label: 'Hoy', run: () => applyPreset(today, today) },
    { label: 'Últimos 7 días', run: () => applyPreset(subDays(today, 6), today) },
    { label: 'Últimos 30 días', run: () => applyPreset(subDays(today, 29), today) },
    { label: 'Este mes', run: () => applyPreset(startOfMonth(today), endOfMonth(today)) },
    { label: 'Mes anterior', run: () => applyPreset(startOfMonth(previousMonth), endOfMonth(previousMonth)) },
    { label: 'Este año', run: () => applyPreset(startOfYear(today), today) }
  ];

  const openBound = (target: HTMLElement, next: 'from' | 'to') => {
    setBound(next);
    setAnchor(target);
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
        <DateBound label={formatDay(from, 'Desde')} active={Boolean(anchor) && bound === 'from'} onClick={(event) => openBound(event.currentTarget, 'from')} />
        <Typography sx={{ color: 'text.secondary', flexShrink: 0 }}>→</Typography>
        <DateBound label={formatDay(to, 'Hasta')} active={Boolean(anchor) && bound === 'to'} onClick={(event) => openBound(event.currentTarget, 'to')} />
      </Stack>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.5, borderRadius: 1.5, border: '1px solid #e1e8f0' } } }}
      >
        <Stack direction="row" sx={{ alignItems: 'stretch' }}>
          <Stack spacing={0.25} sx={{ p: 1, width: 168, borderRight: '1px solid #e8eef5' }}>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                onClick={preset.run}
                sx={{ justifyContent: 'flex-start', textTransform: 'none', color: 'text.primary', fontWeight: 500, px: 1 }}
              >
                {preset.label}
              </Button>
            ))}
          </Stack>
          <Box sx={{ p: 1, '& .rdp': { margin: 0, '--rdp-accent-color': '#1976d2', '--rdp-background-color': '#e3f2fd' } }}>
            <DayPicker
              key={`${bound}-${activeValue || 'empty'}`}
              mode="single"
              locale={es}
              weekStartsOn={1}
              captionLayout="dropdown-buttons"
              fromYear={2020}
              toYear={currentYear + 1}
              defaultMonth={parseDay(activeValue) || new Date()}
              selected={parseDay(activeValue)}
              onSelect={(date) => {
                if (!date) return;
                const iso = format(date, 'yyyy-MM-dd');
                apply(bound === 'from' ? iso : from, bound === 'to' ? iso : to);
              }}
            />
          </Box>
        </Stack>
      </Popover>
    </>
  );
}

function DateBound({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event as unknown as MouseEvent<HTMLElement>);
        }
      }}
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 40,
        px: 1.25,
        display: 'flex',
        alignItems: 'center',
        border: '1px solid',
        borderColor: active ? 'primary.main' : '#c5d0dc',
        borderRadius: 1,
        bgcolor: '#fff',
        cursor: 'pointer',
        '&:hover': { borderColor: '#7f93a8' }
      }}
    >
      <Typography noWrap sx={{ fontSize: 14, color: label === 'Desde' || label === 'Hasta' ? 'text.secondary' : 'text.primary' }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function ViewEditorDialog({
  open,
  saving,
  title,
  initial,
  groups,
  apiCall,
  onClose,
  onSubmit
}: ViewEditorDialogProps) {
  const [name, setName] = useState(initial.name);
  const [visibility, setVisibility] = useState(initial.visibility);
  const [shareGroupId, setShareGroupId] = useState<number | ''>(initial.share_group_id);
  const [rows, setRows] = useState<ViewFilterRow[]>(initial.rows);
  const [assignees, setAssignees] = useState<{ id: number; email: string }[]>([]);
  const [addAnchor, setAddAnchor] = useState<HTMLElement | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [showIssues, setShowIssues] = useState(false);

  const groupKey = rows.find((row) => row.field === 'group')?.values.join(',') || '';
  const apiCallRef = useRef(apiCall);
  apiCallRef.current = apiCall;

  useEffect(() => {
    if (!open) return;
    const ids = groupKey ? groupKey.split(',') : [];
    if (!ids.length) {
      setAssignees([]);
      setRows((current) => current.map((row) => (
        row.field === 'technician' && row.values.length ? { ...row, values: [] } : row
      )));
      return;
    }

    let cancelled = false;
    Promise.all(ids.map((id) => apiCallRef.current(`/tickets/assignees?group_id=${id}`))).then((results) => {
      if (cancelled) return;
      const people = new Map<number, { id: number; email: string }>();
      results.forEach((result) => {
        if (!result?.response.ok || !Array.isArray(result.data)) return;
        result.data.forEach((person: { id: number; email: string }) => {
          if (person?.id) people.set(person.id, person);
        });
      });
      const list = [...people.values()].sort((a, b) => a.email.localeCompare(b.email, 'es'));
      setAssignees(list);
      const allowed = new Set(list.map((person) => String(person.id)));
      setRows((current) => current.map((row) => {
        if (row.field !== 'technician') return row;
        const next = row.values.filter((value) => allowed.has(value));
        return next.length === row.values.length ? row : { ...row, values: next };
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [open, groupKey]);

  const usedFields = new Set(rows.map((row) => row.field));
  const availableFields = VIEW_FILTER_FIELDS.filter((item) => !usedFields.has(item.field));
  const categoryValues = rows.find((row) => row.field === 'category')?.values ?? [];
  const categoryKey = categoryValues.join(',');

  useEffect(() => {
    const allowed = new Set(subcategoryOptions(categoryKey ? categoryKey.split(',') : []).map((option) => option.value));
    setRows((current) => current.map((row) => {
      if (row.field !== 'subcategory') return row;
      const next = row.values.filter((value) => allowed.has(value));
      return next.length === row.values.length ? row : { ...row, values: next };
    }));
  }, [categoryKey]);

  const updateRow = (id: string, patch: Partial<ViewFilterRow>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const moveRow = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    setRows((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const addField = (field: ViewFilterField) => {
    setRows((current) => [...current, { id: `f-${Date.now().toString(36)}`, field, values: [] }]);
    setAddAnchor(null);
  };

  const choicesFor = (row: ViewFilterRow): Choice[] => {
    if (row.field === 'type') return TICKET_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }));
    if (row.field === 'status') return TICKET_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label }));
    if (row.field === 'priority') return PRIORITY_OPTIONS;
    if (row.field === 'group') return groups.map((group) => ({ value: String(group.id), label: group.name }));
    if (row.field === 'technician') return assignees.map((person) => ({ value: String(person.id), label: person.email }));
    if (row.field === 'category') return CATEGORIES.map((category) => ({ value: category, label: category }));
    if (row.field === 'subcategory') return subcategoryOptions(categoryValues);
    return [];
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (visibility === 'group' && !shareGroupId) {
      toast.error('Seleccioná un grupo para compartir');
      return;
    }
    const issue = rows.map((row) => viewFilterIssue(row, rows)).find(Boolean);
    if (issue) {
      setShowIssues(true);
      toast.error(issue);
      return;
    }
    onSubmit({
      name: name.trim(),
      visibility,
      share_group_id: visibility === 'group' ? shareGroupId : '',
      rows,
      sort_by: initial.sort_by || 'date-desc'
    });
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {title}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, fontWeight: 400 }}>
          Seleccioná filtros para definir qué tickets muestra esta vista.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              alignItems: 'end',
              gridTemplateColumns: visibility === 'group'
                ? { xs: '1fr', md: 'minmax(0, 1.35fr) 248px minmax(180px, 1fr)' }
                : { xs: '1fr', sm: 'minmax(0, 1fr) 248px' }
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <FieldLabel>Nombre</FieldLabel>
              <TextField
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nombre de la vista"
                fullWidth
                autoFocus
                size="small"
                sx={outlinedFieldSx}
              />
            </Box>
            <Box>
              <FieldLabel>Visibilidad</FieldLabel>
              <Box
                role="group"
                aria-label="Visibilidad"
                sx={{
                  height: 40,
                  display: 'flex',
                  p: '3px',
                  gap: '3px',
                  border: '1px solid #c5d0dc',
                  borderRadius: 1,
                  bgcolor: '#f4f7fb'
                }}
              >
                {([
                  { value: 'personal' as const, label: 'Personal', icon: PersonIcon },
                  { value: 'group' as const, label: 'Compartida', icon: GroupsIcon }
                ]).map((option) => {
                  const selected = visibility === option.value;
                  const Icon = option.icon;
                  return (
                    <Box
                      key={option.value}
                      component="button"
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setVisibility(option.value);
                        if (option.value === 'personal') setShareGroupId('');
                      }}
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        border: 0,
                        borderRadius: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.75,
                        px: 1,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 13.5,
                        fontWeight: selected ? 600 : 500,
                        color: selected ? 'primary.main' : 'text.secondary',
                        bgcolor: selected ? '#fff' : 'transparent',
                        boxShadow: selected ? '0 1px 2px rgba(15, 23, 42, 0.08)' : 'none',
                        '&:hover': { color: selected ? 'primary.main' : 'text.primary' }
                      }}
                    >
                      <Icon sx={{ fontSize: 16 }} />
                      {option.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>
            {visibility === 'group' && (
              <Box sx={{ minWidth: 0 }}>
                <FieldLabel>Grupo con acceso</FieldLabel>
                <OptionMenu
                  options={groups.map((group) => ({ value: String(group.id), label: group.name }))}
                  selected={shareGroupId ? [String(shareGroupId)] : []}
                  placeholder="Seleccionar grupo"
                  error={showIssues && !shareGroupId}
                  onChange={(values) => setShareGroupId(values[0] ? Number(values[0]) : '')}
                />
              </Box>
            )}
          </Box>

          <Divider />

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2, mb: 1.25 }}>
              Filtros
            </Typography>
            {rows.length === 0 && (
              <Box sx={{ px: 1.5, py: 1.75, mb: 1.25, borderRadius: 1.5, bgcolor: '#f7f9fc', border: '1px dashed #d5dee8' }}>
                <Typography variant="body2" color="text.secondary">
                  Todavía no hay filtros. La vista incluye todos los tickets que podés ver.
                </Typography>
              </Box>
            )}
            <Stack spacing={1}>
              {rows.map((row, index) => {
                const issue = showIssues ? viewFilterIssue(row, rows) : null
                const fieldChoices = VIEW_FILTER_FIELDS
                  .filter((item) => item.field === row.field || !usedFields.has(item.field))
                  .map((item) => ({ value: item.field, label: item.label }));
                const technicianLocked = row.field === 'technician' && !groupKey;
                const priorityLocked = row.field === 'priority' && !priorityApplies(rows);
                return (
                  <Box key={row.id}>
                    {index > 0 && (
                      <Typography sx={{ pl: 0.5, py: 0.25, fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
                        y
                      </Typography>
                    )}
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="flex-start"
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOver(index);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const from = Number(event.dataTransfer.getData('text/plain'));
                        if (Number.isInteger(from)) moveRow(from, index);
                        setDragOver(null);
                      }}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: dragOver === index ? '#eef5fc' : '#f7f9fc',
                        border: '1px solid #e6edf5'
                      }}
                    >
                      <Tooltip title="Arrastrá para reordenar">
                        <Box
                          draggable
                          aria-label="Arrastrar filtro"
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', String(index));
                            event.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => setDragOver(null)}
                          sx={{ mt: 2.75, display: 'flex', cursor: 'grab', color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                        >
                          <DragIndicatorIcon fontSize="small" />
                        </Box>
                      </Tooltip>
                      <Stack spacing={0.25} sx={{ mt: 2.15 }}>
                        <IconButton size="small" aria-label="Subir filtro" disabled={index === 0} onClick={() => moveRow(index, index - 1)}>
                          <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" aria-label="Bajar filtro" disabled={index === rows.length - 1} onClick={() => moveRow(index, index + 1)}>
                          <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                      <Box sx={{ width: { xs: 140, sm: 190 }, flexShrink: 0 }}>
                        <FieldLabel>Campo</FieldLabel>
                        <OptionMenu
                          options={fieldChoices}
                          selected={[row.field]}
                          onChange={(values) => {
                            const field = values[0] as ViewFilterField | undefined;
                            if (!field || field === row.field) return;
                            updateRow(row.id, { field, values: [] });
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <FieldLabel>Valor</FieldLabel>
                        {isDateFilterField(row.field) ? (
                          <DateRangeField
                            from={row.values[0] || ''}
                            to={row.values[1] || ''}
                            onChange={(from, to) => updateRow(row.id, { values: [from, to] })}
                          />
                        ) : (
                          <OptionMenu
                            multiple
                            options={choicesFor(row)}
                            selected={row.values}
                            disabled={technicianLocked || priorityLocked}
                            placeholder={
                              priorityLocked
                                ? 'No aplica a requerimientos'
                                : technicianLocked
                                  ? 'Elegí un grupo primero'
                                  : 'Seleccionar'
                            }
                            error={Boolean(issue)}
                            onChange={(values) => updateRow(row.id, { values })}
                          />
                        )}
                        {issue && (
                          <Typography sx={{ mt: 0.5, fontSize: 12, color: 'error.main' }}>{issue}</Typography>
                        )}
                        {priorityLocked && (
                          <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary' }}>
                            La prioridad solo aplica a incidentes.
                          </Typography>
                        )}
                      </Box>
                      <Tooltip title="Eliminar filtro">
                        <IconButton
                          aria-label="Eliminar filtro"
                          onClick={() => setRows((current) => current.filter((item) => item.id !== row.id))}
                          sx={{ mt: 2.4 }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Button
              startIcon={<AddIcon />}
              disabled={availableFields.length === 0}
              onClick={(event) => setAddAnchor(event.currentTarget)}
              sx={{
                mt: 1.5,
                px: 1.5,
                minHeight: 40,
                border: '1px dashed #b7c4d2',
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                justifyContent: 'flex-start'
              }}
            >
              Agregar filtro
            </Button>
            <Menu anchorEl={addAnchor} open={Boolean(addAnchor)} onClose={() => setAddAnchor(null)}>
              {availableFields.map((item) => (
                <MenuItem key={item.field} onClick={() => addField(item.field)} sx={{ minHeight: 40, fontSize: 14 }}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const outlinedFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: 40,
    bgcolor: '#fff',
    fontSize: 14,
    '& fieldset': { borderColor: '#c5d0dc' },
    '&:hover fieldset': { borderColor: '#7f93a8' },
    '&.Mui-focused fieldset': { borderWidth: 1, borderColor: 'primary.main' }
  },
  '& .MuiOutlinedInput-input': { px: 1.5, py: 0 }
};

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography sx={{ mb: 0.75, fontSize: 12, fontWeight: 600, letterSpacing: 0.2, color: 'text.secondary' }}>
      {children}
    </Typography>
  );
}
