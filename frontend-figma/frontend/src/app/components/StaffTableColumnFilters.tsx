import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  Checkbox,
  InputAdornment,
  ListItemText,
  MenuItem,
  Popover,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { CATEGORIES } from '../../lib/categories';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';
import type { StaffColumnFilters } from '../../lib/ticketViews';
import { hasActiveStaffColumnFilters } from '../../lib/ticketViews';

export type { StaffColumnFilters };
export { hasActiveStaffColumnFilters };

interface FilterOption {
  value: string;
  label: string;
}

const headerCellSx = {
  fontWeight: 600,
  bgcolor: '#fafbfc'
};

const filterPanelSx = {
  bgcolor: '#f5f7fa',
  border: '1px solid',
  borderColor: 'divider',
  borderTop: '2px solid',
  borderTopColor: 'primary.main',
  borderRadius: '0 0 8px 8px',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
  overflow: 'hidden'
};

function FilterPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={filterPanelSx}>
      <Box
        sx={{
          px: 1.5,
          py: 0.75,
          bgcolor: '#fafbfc',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Filtrar · {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
}

function MultiSelectFilterContent({
  options,
  selected,
  searchable = false,
  onChange
}: {
  options: FilterOption[];
  selected: string[];
  searchable?: boolean;
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggleValue = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  };

  return (
    <Box sx={{ width: 260, maxHeight: 300, display: 'flex', flexDirection: 'column', bgcolor: '#f5f7fa' }}>
      {searchable && (
        <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Box>
      )}

      <Box sx={{ overflow: 'auto', py: 0.5 }}>
        {filteredOptions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>
            Sin resultados
          </Typography>
        ) : (
          filteredOptions.map((option) => (
            <MenuItem key={option.value} dense onClick={() => toggleValue(option.value)} sx={{ py: 0.25 }}>
              <Checkbox size="small" checked={selected.includes(option.value)} sx={{ p: 0.5, mr: 0.5 }} />
              <ListItemText
                primary={option.label}
                primaryTypographyProps={{ variant: 'body2', sx: { wordBreak: 'break-word' } }}
              />
            </MenuItem>
          ))
        )}
      </Box>

      {selected.length > 0 && (
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
          <Button size="small" fullWidth onClick={() => onChange([])}>
            Limpiar
          </Button>
        </Box>
      )}
    </Box>
  );
}

function FilterableHeaderCell({
  title,
  active,
  align,
  minWidth,
  width,
  children
}: {
  title: string;
  active?: boolean;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: number;
  children: ReactNode;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <TableCell
      align={align}
      onClick={(e) => setAnchorEl(e.currentTarget)}
      sx={{
        ...headerCellSx,
        minWidth,
        width,
        cursor: 'pointer',
        userSelect: 'none',
        color: active ? 'primary.main' : 'inherit',
        boxShadow: (theme) =>
          open || active ? `inset 0 -2px 0 ${theme.palette.primary.main}` : 'none',
        '&:hover': { bgcolor: '#f5f7fa' }
      }}
    >
      {title}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0,
              bgcolor: 'transparent',
              boxShadow: 'none',
              overflow: 'visible'
            }
          }
        }}
      >
        <FilterPanel title={title}>{children}</FilterPanel>
      </Popover>
    </TableCell>
  );
}

function PlainHeaderCell({
  title,
  align,
  minWidth,
  width
}: {
  title: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: number;
}) {
  return (
    <TableCell align={align} sx={{ ...headerCellSx, minWidth, width }}>
      {title}
    </TableCell>
  );
}

interface StaffTableHeadRowProps {
  canEditAll: boolean;
  groups: { id: number; name: string }[];
  technicians: { id: number; email: string }[];
  filters: StaffColumnFilters;
  onChange: (patch: Partial<StaffColumnFilters>) => void;
  onClear: () => void;
}

export default function StaffTableHeadRow({
  canEditAll,
  groups,
  technicians,
  filters,
  onChange,
  onClear
}: StaffTableHeadRowProps) {
  const groupOptions = groups.map((group) => ({ value: String(group.id), label: group.name }));
  const technicianOptions = [
    { value: 'unassigned', label: 'Sin asignar' },
    ...technicians.map((tech) => ({ value: String(tech.id), label: tech.email }))
  ];
  const statusOptions = TICKET_STATUS_OPTIONS.map((status) => ({
    value: status.value,
    label: status.label
  }));
  const categoryOptions = CATEGORIES.map((category) => ({ value: category, label: category }));

  const fieldBox = (content: ReactNode) => (
    <Box sx={{ p: 1.5, width: 240, bgcolor: '#f5f7fa' }}>{content}</Box>
  );

  return (
    <TableRow sx={{ bgcolor: '#fafbfc' }}>
      <FilterableHeaderCell title="#" width={64} active={Boolean(filters.ticketId.trim())}>
        {fieldBox(
          <TextField
            size="small"
            fullWidth
            autoFocus
            placeholder="Buscar por ID"
            value={filters.ticketId}
            onChange={(e) => onChange({ ticketId: e.target.value.replace(/\D/g, '') })}
            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            sx={{ bgcolor: '#fff' }}
          />
        )}
      </FilterableHeaderCell>

      <FilterableHeaderCell title="Ticket" minWidth={200} active={Boolean(filters.title.trim())}>
        {fieldBox(
          <TextField
            size="small"
            fullWidth
            autoFocus
            placeholder="Buscar ticket..."
            value={filters.title}
            onChange={(e) => onChange({ title: e.target.value })}
            sx={{ bgcolor: '#fff' }}
          />
        )}
      </FilterableHeaderCell>

      <PlainHeaderCell title="Usuario" minWidth={200} />

      <FilterableHeaderCell title="Grupo" minWidth={180} active={filters.groupIds.length > 0}>
        <MultiSelectFilterContent
          searchable
          options={groupOptions}
          selected={filters.groupIds.map(String)}
          onChange={(next) => onChange({ groupIds: next.map(Number).filter(Boolean) })}
        />
      </FilterableHeaderCell>

      <FilterableHeaderCell title="Asignado a" minWidth={180} active={filters.technicianKeys.length > 0}>
        <MultiSelectFilterContent
          searchable
          options={technicianOptions}
          selected={filters.technicianKeys}
          onChange={(next) => onChange({ technicianKeys: next })}
        />
      </FilterableHeaderCell>

      <FilterableHeaderCell title="Estado" minWidth={160} active={filters.statuses.length > 0}>
        <MultiSelectFilterContent
          options={statusOptions}
          selected={filters.statuses}
          onChange={(next) => onChange({ statuses: next })}
        />
      </FilterableHeaderCell>

      <FilterableHeaderCell title="Categoría" minWidth={140} active={filters.categories.length > 0}>
        <MultiSelectFilterContent
          options={categoryOptions}
          selected={filters.categories}
          onChange={(next) => onChange({ categories: next })}
        />
      </FilterableHeaderCell>

      <FilterableHeaderCell
        title="Fecha"
        minWidth={120}
        active={Boolean(filters.dateFrom || filters.dateTo)}
      >
        {fieldBox(
          <Stack spacing={1.25}>
            <TextField
              size="small"
              type="date"
              label="Desde"
              value={filters.dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ bgcolor: '#fff' }}
            />
            <TextField
              size="small"
              type="date"
              label="Hasta"
              value={filters.dateTo}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ bgcolor: '#fff' }}
            />
            {hasActiveStaffColumnFilters(filters) && (
              <Button size="small" variant="text" onClick={onClear} sx={{ alignSelf: 'flex-start', px: 0.5 }}>
                Limpiar todos los filtros
              </Button>
            )}
          </Stack>
        )}
      </FilterableHeaderCell>

      {canEditAll && <PlainHeaderCell title="Acciones" width={96} align="center" />}
    </TableRow>
  );
}
