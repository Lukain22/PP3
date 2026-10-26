import { useEffect, useState, type ReactNode } from 'react';
import { Box, Checkbox, IconButton, TableCell, TableRow, TextField, Tooltip } from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import { STAFF_DEFAULT_COLUMNS, ticketColumnMeta, type TicketColumnKey } from '../../lib/ticketColumns';
import type { StaffColumnFilters } from '../../lib/ticketViews';
import { emptyStaffColumnFilters, hasActiveStaffColumnFilters } from '../../lib/ticketViews';
import {
  type TicketSort,
  type TicketSortKey,
  isColumnFilterActive
} from '../../lib/ticketTable';

export type { StaffColumnFilters };
export { hasActiveStaffColumnFilters };

const headerCellSx = {
  fontWeight: 600,
  bgcolor: '#fafbfc',
  whiteSpace: 'nowrap',
  py: 0.625,
  '& .col-affordance': { opacity: 0 },
  '&:hover .col-affordance, &:focus-within .col-affordance': { opacity: 1 },
  '& .col-affordance.is-persistent': { opacity: 1 }
};

const affordanceButtonSx = {
  border: 0,
  background: 'none',
  padding: 0,
  margin: 0,
  font: 'inherit',
  color: 'inherit',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.25,
  lineHeight: 1
};

function CloseFiltersIcon() {
  return (
    <Box sx={{ position: 'relative', width: 20, height: 20, display: 'inline-flex' }}>
      <FilterListIcon sx={{ fontSize: 20 }} />
      <CloseIcon
        sx={{
          position: 'absolute',
          right: -4,
          bottom: -3,
          fontSize: 13,
          bgcolor: '#f5f7fa',
          borderRadius: '50%'
        }}
      />
    </Box>
  );
}

function SortGlyph({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  const Icon = active && direction === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon;
  return <Icon sx={{ fontSize: 15 }} />;
}

export function SortableHeaderCell({
  label,
  sortKey,
  sort,
  onSort,
  filterActive = false,
  filtersOpen = false,
  highlightSort = false,
  onFilter,
  align,
  minWidth,
  width
}: {
  label: string;
  sortKey: TicketSortKey;
  sort: TicketSort;
  onSort: (key: TicketSortKey) => void;
  filterActive?: boolean;
  filtersOpen?: boolean;
  highlightSort?: boolean;
  onFilter?: (key: TicketSortKey) => void;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: number;
}) {
  const active = highlightSort && sort.key === sortKey;
  const nextDirection = !active ? (sortKey === 'date' ? 'desc' : 'asc') : sort.direction === 'asc' ? 'desc' : 'asc';
  const sortLabel = nextDirection === 'asc'
    ? `Ordenar ${label} de menor a mayor`
    : `Ordenar ${label} de mayor a menor`;

  return (
    <TableCell
      align={align}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      sx={{
        ...headerCellSx,
        minWidth,
        width,
        color: active || filterActive ? 'primary.main' : 'inherit',
        boxShadow: (theme) =>
          filterActive ? `inset 0 -2px 0 ${theme.palette.primary.main}` : 'none'
      }}
    >
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, maxWidth: '100%' }}>
        <Box
          component="button"
          type="button"
          aria-label={sortLabel}
          onClick={() => onSort(sortKey)}
          sx={{ ...affordanceButtonSx, fontWeight: 600 }}
        >
          {label}
          <Box
            component="span"
            className={active ? 'col-affordance is-persistent' : 'col-affordance'}
            aria-hidden
            sx={{ display: 'inline-flex', color: active ? 'primary.main' : 'text.disabled' }}
          >
            <SortGlyph active={active} direction={sort.direction} />
          </Box>
        </Box>
        {onFilter && (
          <Box
            component="button"
            type="button"
            className={filterActive || filtersOpen ? 'col-affordance is-persistent' : 'col-affordance'}
            aria-label={`Filtrar ${label}`}
            aria-expanded={filtersOpen}
            aria-pressed={filterActive}
            onClick={() => onFilter(sortKey)}
            sx={{ ...affordanceButtonSx, color: filterActive ? 'primary.main' : 'text.disabled' }}
          >
            <FilterListIcon sx={{ fontSize: 15 }} />
          </Box>
        )}
      </Box>
    </TableCell>
  );
}

function PlainHeaderCell({
  title,
  align,
  minWidth,
  width,
  children
}: {
  title?: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: number;
  children?: ReactNode;
}) {
  return (
    <TableCell align={align} sx={{ ...headerCellSx, minWidth, width }}>
      {children ?? title}
    </TableCell>
  );
}

function FilterField({
  id,
  value,
  placeholder,
  onChange,
  type = 'text',
  inputMode
}: {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: 'numeric' | 'text';
}) {
  return (
    <TextField
      id={id}
      size="small"
      fullWidth
      placeholder={placeholder}
      value={value}
      type={type}
      onChange={(event) => onChange(event.target.value)}
      inputProps={{ 'aria-label': placeholder, inputMode, autoComplete: 'off' }}
      sx={{
        '& .MuiOutlinedInput-root': { bgcolor: '#fff', fontSize: 13 },
        '& .MuiOutlinedInput-input': { py: 0.7 }
      }}
    />
  );
}

const FILTERABLE_COLUMNS = new Set<TicketColumnKey>([
  'id', 'title', 'user', 'group', 'assignee', 'status', 'category', 'subcategory', 'created'
]);

function ColumnFilterField({
  column,
  draft,
  onChange
}: {
  column: TicketColumnKey;
  draft: StaffColumnFilters;
  onChange: (next: StaffColumnFilters) => void;
}) {
  const field = (placeholder: string, value: string, patch: (value: string) => StaffColumnFilters, extra?: { type?: string; inputMode?: 'numeric' | 'text' }) => (
    <FilterField
      id={`ticket-filter-${ticketColumnMeta(column).sortKey}`}
      value={value}
      placeholder={placeholder}
      type={extra?.type}
      inputMode={extra?.inputMode}
      onChange={(next) => onChange(patch(next))}
    />
  );

  switch (column) {
    case 'id':
      return field('Filtrar ID', draft.ticketId, (value) => ({ ...draft, ticketId: value.replace(/\D/g, '') }), { inputMode: 'numeric' });
    case 'title':
      return field('Filtrar ticket', draft.title, (value) => ({ ...draft, title: value }));
    case 'user':
      return field('Filtrar usuario', draft.user, (value) => ({ ...draft, user: value }));
    case 'group':
      return field('Filtrar grupo', draft.group, (value) => ({ ...draft, group: value }));
    case 'assignee':
      return field('Filtrar asignado', draft.assignee, (value) => ({ ...draft, assignee: value }));
    case 'status':
      return field('Filtrar estado', draft.status, (value) => ({ ...draft, status: value }));
    case 'category':
      return field('Filtrar categoría', draft.category, (value) => ({ ...draft, category: value }));
    case 'subcategory':
      return field('Filtrar subcategoría', draft.subcategory, (value) => ({ ...draft, subcategory: value }));
    case 'created':
      return field('Filtrar fecha', draft.date, (value) => ({ ...draft, date: value }), { type: 'date' });
    default:
      return null;
  }
}

interface StaffTableHeadRowProps {
  columns?: TicketColumnKey[];
  canEditAll: boolean;
  sort: TicketSort;
  highlightSort: boolean;
  onSort: (key: TicketSortKey) => void;
  filters: StaffColumnFilters;
  filterRowOpen: boolean;
  focusColumn: TicketSortKey | null;
  onFilterToggle: (key: TicketSortKey) => void;
  onCloseFilterRow: () => void;
  onApply: (next: StaffColumnFilters) => void;
  onClear: () => void;
  allSelected: boolean;
  indeterminate: boolean;
  onToggleAll: () => void;
  visibleCount: number;
}

export default function StaffTableHeadRow({
  columns = STAFF_DEFAULT_COLUMNS,
  canEditAll,
  sort,
  highlightSort,
  onSort,
  filters,
  filterRowOpen,
  focusColumn,
  onFilterToggle,
  onCloseFilterRow,
  onApply,
  onClear,
  allSelected,
  indeterminate,
  onToggleAll,
  visibleCount
}: StaffTableHeadRowProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  useEffect(() => {
    if (!filterRowOpen || !focusColumn) return;
    const field = document.getElementById(`ticket-filter-${focusColumn}`);
    field?.focus();
  }, [filterRowOpen, focusColumn]);

  const filterProps = (key: TicketSortKey) => ({
    sortKey: key,
    sort,
    onSort,
    highlightSort,
    filterActive: isColumnFilterActive(filters, key),
    onFilter: onFilterToggle,
    filtersOpen: filterRowOpen
  });

  return (
    <>
      <TableRow sx={{ bgcolor: '#fafbfc' }}>
        <PlainHeaderCell width={72}>
          <Checkbox
            size="small"
            checked={allSelected}
            indeterminate={indeterminate}
            disabled={visibleCount === 0}
            onChange={onToggleAll}
            inputProps={{ 'aria-label': 'Seleccionar tickets visibles' }}
            sx={{ p: 0.5 }}
          />
        </PlainHeaderCell>
        {columns.map((column) => {
          const meta = ticketColumnMeta(column);
          return (
            <SortableHeaderCell
              key={column}
              label={meta.label}
              minWidth={meta.minWidth}
              width={column === 'id' ? 72 : undefined}
              {...filterProps(meta.sortKey)}
              onFilter={FILTERABLE_COLUMNS.has(column) ? onFilterToggle : undefined}
            />
          );
        })}
        {canEditAll && <PlainHeaderCell title="Acciones" width={88} align="center" />}
      </TableRow>
      {filterRowOpen && (
        <TableRow
          sx={{ bgcolor: '#f5f7fa' }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCloseFilterRow();
            if (event.key === 'Enter') {
              event.preventDefault();
              onApply(draft);
            }
          }}
        >
          <TableCell sx={{ py: 0.75, px: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
              <Tooltip title="Cerrar filtros">
                <IconButton size="small" aria-label="Cerrar filtros" onClick={onCloseFilterRow}>
                  <CloseFiltersIcon />
                </IconButton>
              </Tooltip>
              {(hasActiveStaffColumnFilters(draft) || hasActiveStaffColumnFilters(filters)) && (
                <Tooltip title="Limpiar filtros">
                  <IconButton
                    size="small"
                    aria-label="Limpiar filtros"
                    onClick={() => {
                      setDraft(emptyStaffColumnFilters());
                      onClear();
                    }}
                  >
                    <FilterAltOffIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </TableCell>
          {columns.map((column) => (
            <TableCell key={column} sx={{ py: 0.75, px: 1 }}>
              <ColumnFilterField column={column} draft={draft} onChange={setDraft} />
            </TableCell>
          ))}
          {canEditAll && <TableCell />}
        </TableRow>
      )}
    </>
  );
}
