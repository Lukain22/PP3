import { CATEGORIES, SUBCATEGORIES, type Category } from './categories';
import {
  emptyTicketListFilters,
  type TicketListFilters,
  type TicketViewFilters
} from './ticketViews';

export type ViewFilterField =
  | 'type'
  | 'status'
  | 'priority'
  | 'group'
  | 'technician'
  | 'category'
  | 'subcategory'
  | 'created';

export interface ViewFilterRow {
  id: string;
  field: ViewFilterField;
  values: string[];
}

export const VIEW_FILTER_FIELDS: { field: ViewFilterField; label: string }[] = [
  { field: 'type', label: 'Tipo' },
  { field: 'status', label: 'Estado' },
  { field: 'priority', label: 'Prioridad' },
  { field: 'group', label: 'Grupo' },
  { field: 'technician', label: 'Asignado a' },
  { field: 'category', label: 'Categoría' },
  { field: 'subcategory', label: 'Subcategoría' },
  { field: 'created', label: 'Fecha de creación' }
];

const FIELD_ORDER = VIEW_FILTER_FIELDS.map((item) => item.field);

const splitCsv = (value?: string | null) => String(value || '')
  .split(',')
  .map((part) => part.trim())
  .filter(Boolean);

const nextRowId = () => `f-${Math.random().toString(36).slice(2, 9)}`;

const sortRows = (rows: ViewFilterRow[], order?: string[]) => {
  const rank = new Map((order?.length ? order : FIELD_ORDER).map((field, index) => [field, index]));
  return [...rows].sort((a, b) => (rank.get(a.field) ?? 99) - (rank.get(b.field) ?? 99));
};

export function rowsFromListFilters(filters: TicketListFilters): ViewFilterRow[] {
  const rows: ViewFilterRow[] = [];
  const add = (field: ViewFilterField, values: string[]) => {
    if (values.length) rows.push({ id: nextRowId(), field, values });
  };

  add('type', splitCsv(filters.type));
  add('group', splitCsv(filters.group_id));
  add('technician', splitCsv(filters.technician_id));
  add('status', splitCsv(filters.status));
  add('priority', splitCsv(filters.priority));
  add('category', splitCsv(filters.category));
  add('subcategory', splitCsv(filters.subcategory));
  if (filters.date_from || filters.date_to) {
    rows.push({
      id: nextRowId(),
      field: 'created',
      values: [filters.date_from || '', filters.date_to || '']
    });
  }

  return sortRows(rows);
}

export function rowsFromStored(filters: TicketViewFilters | null | undefined): ViewFilterRow[] {
  const source = filters || {};
  const rows: ViewFilterRow[] = [];
  const add = (field: ViewFilterField, values: Array<string | number>) => {
    const clean = values.map((value) => String(value).trim()).filter(Boolean);
    if (clean.length) rows.push({ id: nextRowId(), field, values: clean });
  };

  add('type', source.types?.length ? source.types : splitCsv(source.type));
  add('status', source.status || []);
  add('priority', source.priorities?.length ? source.priorities : splitCsv(source.priority));

  const groups = source.filter_group_ids?.length
    ? source.filter_group_ids
    : splitCsv(source.filter_group_id ? String(source.filter_group_id) : source.group_id ? String(source.group_id) : '');
  add('group', groups);

  if (groups.length) {
    const technicians = source.technician_ids?.length
      ? source.technician_ids
      : (source.technician_id ? [source.technician_id] : []);
    add('technician', technicians);
  }

  add('category', source.categories || []);
  add('subcategory', source.subcategories || []);
  if (source.date_from || source.date_to) {
    rows.push({
      id: nextRowId(),
      field: 'created',
      values: [source.date_from || '', source.date_to || '']
    });
  }

  return sortRows(rows, source.filter_order);
}

export function priorityApplies(rows: ViewFilterRow[]) {
  const types = rows.find((row) => row.field === 'type')?.values ?? [];
  return !(types.length === 1 && types[0] === 'requirement');
}

export function rowsToListFilters(rows: ViewFilterRow[]): TicketListFilters {
  const next = emptyTicketListFilters();
  const applyPriority = priorityApplies(rows);

  for (const row of rows) {
    if (row.field === 'created') {
      next.date_from = row.values[0] || '';
      next.date_to = row.values[1] || '';
      continue;
    }
    if (row.field === 'priority' && !applyPriority) continue;
    const csv = row.values.filter(Boolean).join(',');
    if (!csv) continue;
    if (row.field === 'type') next.type = csv;
    if (row.field === 'status') next.status = csv;
    if (row.field === 'priority') next.priority = csv;
    if (row.field === 'group') next.group_id = csv;
    if (row.field === 'technician') next.technician_id = csv;
    if (row.field === 'category') next.category = csv;
    if (row.field === 'subcategory') next.subcategory = csv;
  }

  if (!next.group_id) next.technician_id = '';
  return next;
}

export function viewFilterIssue(row: ViewFilterRow, rows: ViewFilterRow[]): string | null {
  if (row.field === 'priority' && !priorityApplies(rows)) return null;
  if (row.field === 'technician') {
    const groups = rows.find((item) => item.field === 'group')?.values ?? [];
    if (!groups.length) return 'Elegí un grupo para ver sus técnicos';
  }
  if (row.field === 'created') {
    if (!row.values[0] && !row.values[1]) return 'Elegí al menos una fecha';
    return null;
  }
  if (!row.values.length) return 'Elegí al menos un valor';
  return null;
}

export function subcategoryOptions(categoryValues: string[]) {
  const categories = (categoryValues.length ? categoryValues : [...CATEGORIES])
    .filter((category): category is Category => CATEGORIES.includes(category as Category));
  const seen = new Set<string>();
  const options: { value: string; label: string }[] = [];
  for (const category of categories) {
    for (const subcategory of SUBCATEGORIES[category] || []) {
      if (seen.has(subcategory)) continue;
      seen.add(subcategory);
      options.push({ value: subcategory, label: subcategory });
    }
  }
  return options;
}
