import type { TicketSortKey } from './ticketTable';

export type TicketColumnKey =
  | 'id'
  | 'title'
  | 'description'
  | 'user'
  | 'group'
  | 'assignee'
  | 'type'
  | 'status'
  | 'priority'
  | 'category'
  | 'subcategory'
  | 'created'
  | 'due'
  | 'sla_status';

export interface TicketColumnMeta {
  key: TicketColumnKey;
  label: string;
  sortKey: TicketSortKey;
  minWidth: number;
}

export const TICKET_COLUMNS: TicketColumnMeta[] = [
  { key: 'id', label: 'ID', sortKey: 'id', minWidth: 72 },
  { key: 'title', label: 'Título', sortKey: 'title', minWidth: 200 },
  { key: 'description', label: 'Descripción', sortKey: 'description', minWidth: 220 },
  { key: 'user', label: 'Usuario', sortKey: 'user', minWidth: 180 },
  { key: 'group', label: 'Grupo', sortKey: 'group', minWidth: 150 },
  { key: 'assignee', label: 'Asignado a', sortKey: 'assignee', minWidth: 180 },
  { key: 'type', label: 'Tipo', sortKey: 'type', minWidth: 120 },
  { key: 'status', label: 'Estado', sortKey: 'status', minWidth: 140 },
  { key: 'priority', label: 'Prioridad', sortKey: 'priority', minWidth: 120 },
  { key: 'category', label: 'Categoría', sortKey: 'category', minWidth: 140 },
  { key: 'subcategory', label: 'Subcategoría', sortKey: 'subcategory', minWidth: 150 },
  { key: 'created', label: 'Fecha de creación', sortKey: 'date', minWidth: 160 },
  { key: 'due', label: 'Fecha de vencimiento', sortKey: 'due', minWidth: 170 },
  { key: 'sla_status', label: 'Estado de vencimiento', sortKey: 'sla', minWidth: 180 }
];

const COLUMN_KEYS = new Set<TicketColumnKey>(TICKET_COLUMNS.map((column) => column.key));

export const STAFF_DEFAULT_COLUMNS: TicketColumnKey[] = [
  'id',
  'title',
  'user',
  'group',
  'assignee',
  'status',
  'category',
  'subcategory',
  'created'
];

export const USER_DEFAULT_COLUMNS: TicketColumnKey[] = [
  'id',
  'title',
  'description',
  'type',
  'status',
  'priority',
  'created'
];

export function ticketColumnMeta(key: TicketColumnKey): TicketColumnMeta {
  return TICKET_COLUMNS.find((column) => column.key === key) || TICKET_COLUMNS[0];
}

export function normalizeTicketColumns(raw: unknown): TicketColumnKey[] | null {
  if (!Array.isArray(raw)) return null;
  const columns = raw.filter(
    (key): key is TicketColumnKey => typeof key === 'string' && COLUMN_KEYS.has(key as TicketColumnKey)
  );
  const unique = [...new Set(columns)];
  return unique.length ? unique : null;
}

export function columnsForList(
  selection: { kind: string; columns?: TicketColumnKey[] | null },
  staff: boolean
): TicketColumnKey[] {
  if (selection.kind === 'custom' && selection.columns?.length) return selection.columns;
  return staff ? STAFF_DEFAULT_COLUMNS : USER_DEFAULT_COLUMNS;
}
