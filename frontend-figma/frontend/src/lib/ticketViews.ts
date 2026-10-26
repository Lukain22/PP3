import { canWatchTickets, type UserRole } from './auth';
import { normalizeTicketColumns, type TicketColumnKey } from './ticketColumns';

export interface TicketViewFilters {
  type?: string | null;
  types?: string[];
  filter_group_id?: number | null;
  filter_group_ids?: number[];
  group_id?: number | null;
  technician_id?: number | null;
  technician_ids?: number[];
  status?: string[];
  priority?: string | null;
  priorities?: string[];
  categories?: string[];
  subcategories?: string[];
  date_from?: string | null;
  date_to?: string | null;
  due_from?: string | null;
  due_to?: string | null;
  resolved_from?: string | null;
  resolved_to?: string | null;
  filter_order?: string[];
  columns?: TicketColumnKey[];
}

export interface TicketView {
  id: number;
  name: string;
  scope: string;
  visibility: 'personal' | 'group' | 'public';
  share_group_id: number | null;
  share_group_name: string | null;
  share_groups?: { id: number; name: string | null }[];
  hidden?: boolean;
  audience?: 'user' | 'technician' | 'both' | null;
  filters: TicketViewFilters;
  sort_by: string;
  sort_order?: number;
  creator_email: string | null;
  is_owner: boolean;
  created_at?: string;
}

export type ListMode = 'admin' | 'technician' | 'user' | 'watch';

export type SystemViewKey =
  | 'all_requests'
  | 'all_my_groups'
  | 'watched_requests'
  | 'all_my_requests'
  | 'resolved_my_requests'
  | 'pending_my_requests';

export interface SystemViewDefinition {
  key: SystemViewKey;
  name: string;
  roles: UserRole[];
  listMode: ListMode;
  filters: TicketListFilters;
  sortBy: string;
}

export interface TicketListFilters {
  type: string;
  group_id: string;
  technician_id: string;
  status: string;
  priority: string;
  category: string;
  subcategory: string;
  date_from: string;
  date_to: string;
  due_from: string;
  due_to: string;
  resolved_from: string;
  resolved_to: string;
}

export interface ActiveViewSelection {
  kind: 'system' | 'custom';
  key?: SystemViewKey;
  viewId?: number;
  name: string;
  listMode: ListMode;
  filters: TicketListFilters;
  sortBy: string;
  columns?: TicketColumnKey[];
}

export const emptyTicketListFilters = (): TicketListFilters => ({
  type: '',
  group_id: '',
  technician_id: '',
  status: '',
  priority: '',
  category: '',
  subcategory: '',
  date_from: '',
  date_to: '',
  due_from: '',
  due_to: '',
  resolved_from: '',
  resolved_to: ''
});

export const SYSTEM_VIEWS: SystemViewDefinition[] = [
  {
    key: 'all_requests',
    name: 'Todas las solicitudes',
    roles: ['admin'],
    listMode: 'admin',
    filters: emptyTicketListFilters(),
    sortBy: 'date-desc'
  },
  {
    key: 'all_my_groups',
    name: 'Todos mis grupos',
    roles: ['admin', 'technician'],
    listMode: 'technician',
    filters: emptyTicketListFilters(),
    sortBy: 'date-desc'
  },
  {
    key: 'watched_requests',
    name: 'Solicitudes visibles',
    roles: ['user'],
    listMode: 'watch',
    filters: emptyTicketListFilters(),
    sortBy: 'date-desc'
  },
  {
    key: 'all_my_requests',
    name: 'Todas mis solicitudes',
    roles: ['admin', 'technician', 'user'],
    listMode: 'user',
    filters: emptyTicketListFilters(),
    sortBy: 'date-desc'
  },
  {
    key: 'resolved_my_requests',
    name: 'Mis solicitudes resueltas',
    roles: ['user'],
    listMode: 'user',
    filters: { ...emptyTicketListFilters(), status: 'resolved' },
    sortBy: 'date-desc'
  },
  {
    key: 'pending_my_requests',
    name: 'Mis solicitudes pendientes',
    roles: ['admin', 'technician', 'user'],
    listMode: 'user',
    filters: { ...emptyTicketListFilters(), status: 'open,in-progress,on-hold' },
    sortBy: 'date-desc'
  }
];

export function getSystemViewsForRole(role: UserRole): SystemViewDefinition[] {
  return SYSTEM_VIEWS.filter((view) => {
    if (view.key === 'watched_requests') return role === 'user' && canWatchTickets();
    return view.roles.includes(role);
  });
}

export function getDefaultSystemView(role: UserRole): SystemViewDefinition {
  if (role === 'admin') return SYSTEM_VIEWS.find((v) => v.key === 'all_requests')!;
  if (role === 'technician') return SYSTEM_VIEWS.find((v) => v.key === 'all_my_groups')!;
  if (role === 'user' && canWatchTickets()) return SYSTEM_VIEWS.find((v) => v.key === 'watched_requests')!;
  return SYSTEM_VIEWS.find((v) => v.key === 'all_my_requests')!;
}

export function systemViewKeyToItemKey(key: SystemViewKey): string {
  return `system:${key}`;
}

export function viewIdToItemKey(viewId: number): string {
  return `view:${viewId}`;
}

export function parseViewItemKey(itemKey: string): { kind: 'system' | 'custom'; key?: SystemViewKey; viewId?: number } | null {
  if (itemKey.startsWith('system:')) {
    return { kind: 'system', key: itemKey.slice(7) as SystemViewKey };
  }
  if (itemKey.startsWith('view:')) {
    const viewId = parseInt(itemKey.slice(5), 10);
    if (!viewId) return null;
    return { kind: 'custom', viewId };
  }
  return null;
}

export function buildDefaultViewOrder(role: UserRole): string[] {
  return getSystemViewsForRole(role).map((view) => systemViewKeyToItemKey(view.key));
}

export function sortViewItems<T extends { itemKey: string }>(
  items: T[],
  order: string[]
): T[] {
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...items].sort((a, b) => {
    const aRank = rank.get(a.itemKey);
    const bRank = rank.get(b.itemKey);
    if (aRank === undefined && bRank === undefined) return 0;
    if (aRank === undefined) return 1;
    if (bRank === undefined) return -1;
    return aRank - bRank;
  });
}

const joinStored = (list?: Array<string | number> | null, single?: string | number | null) => {
  if (Array.isArray(list) && list.length > 0) return list.map(String).join(',');
  if (single !== undefined && single !== null && String(single) !== '') return String(single);
  return '';
};

export function filtersFromView(view: TicketView): TicketListFilters {
  const f = view.filters || {};
  const groupId = joinStored(f.filter_group_ids, f.filter_group_id ?? f.group_id);
  return {
    type: joinStored(f.types, f.type),
    group_id: groupId,
    technician_id: groupId ? joinStored(f.technician_ids, f.technician_id) : '',
    status: f.status?.length ? f.status.join(',') : '',
    priority: joinStored(f.priorities, f.priority),
    category: joinStored(f.categories),
    subcategory: joinStored(f.subcategories),
    date_from: f.date_from || '',
    date_to: f.date_to || '',
    due_from: f.due_from || '',
    due_to: f.due_to || '',
    resolved_from: f.resolved_from || '',
    resolved_to: f.resolved_to || ''
  };
}

export interface StaffColumnFilters {
  ticketId: string;
  title: string;
  user: string;
  group: string;
  assignee: string;
  status: string;
  category: string;
  subcategory: string;
  date: string;
}

export const emptyStaffColumnFilters = (): StaffColumnFilters => ({
  ticketId: '',
  title: '',
  user: '',
  group: '',
  assignee: '',
  status: '',
  category: '',
  subcategory: '',
  date: ''
});

export function staffColumnFiltersFromView(_filters: TicketListFilters): StaffColumnFilters {
  return emptyStaffColumnFilters();
}

export function appendStaffColumnFilters(params: URLSearchParams, filters: StaffColumnFilters) {
  if (filters.ticketId.trim()) params.set('ticket_id', filters.ticketId.trim());
  if (filters.title.trim()) params.set('title', filters.title.trim());
  if (filters.user.trim()) params.set('user_email', filters.user.trim());
  if (filters.group.trim()) params.set('group_name', filters.group.trim());
  if (filters.assignee.trim()) params.set('assignee', filters.assignee.trim());
  if (filters.status.trim()) params.set('status_q', filters.status.trim());
  if (filters.category.trim()) params.set('category_q', filters.category.trim());
  if (filters.subcategory.trim()) params.set('subcategory', filters.subcategory.trim());
  if (filters.date) params.set('date_on', filters.date);
}

export function hasActiveStaffColumnFilters(filters: StaffColumnFilters): boolean {
  return Boolean(
    filters.ticketId.trim() ||
    filters.title.trim() ||
    filters.user.trim() ||
    filters.group.trim() ||
    filters.assignee.trim() ||
    filters.status.trim() ||
    filters.category.trim() ||
    filters.subcategory.trim() ||
    filters.date
  );
}

export function buildTicketQueryParams(
  page: number,
  limit: number,
  filters: TicketListFilters,
  staffColumnFilters?: StaffColumnFilters,
  sort?: string
): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (sort) params.set('sort', sort);
  if (filters.type) params.set('type', filters.type);
  if (filters.priority) params.set('priority', filters.priority);
  const groupIds = String(filters.group_id || '').split(',').map((part) => part.trim()).filter(Boolean);
  if (groupIds.length === 1) params.set('group_id', groupIds[0]);
  else if (groupIds.length > 1) params.set('group_ids', groupIds.join(','));
  if (groupIds.length > 0 && filters.technician_id) params.set('technician_ids', filters.technician_id);
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('categories', filters.category);
  if (filters.subcategory) params.set('subcategories', filters.subcategory);
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.due_from) params.set('due_from', filters.due_from);
  if (filters.due_to) params.set('due_to', filters.due_to);
  if (filters.resolved_from) params.set('resolved_from', filters.resolved_from);
  if (filters.resolved_to) params.set('resolved_to', filters.resolved_to);
  if (staffColumnFilters) appendStaffColumnFilters(params, staffColumnFilters);
  return params;
}

const splitFilter = (value?: string | null) => String(value || '').split(',').map((part) => part.trim()).filter(Boolean);

const positiveIds = (value?: string | null) => splitFilter(value)
  .map((part) => Number(part))
  .filter((id) => Number.isInteger(id) && id > 0);

export function viewFiltersToPayload(filters: TicketListFilters, order: string[] = []): TicketViewFilters {
  const types = splitFilter(filters.type);
  const statuses = splitFilter(filters.status);
  const priorities = splitFilter(filters.priority);
  const groupIds = positiveIds(filters.group_id);
  const technicianIds = groupIds.length ? positiveIds(filters.technician_id) : [];
  const categories = splitFilter(filters.category);
  const subcategories = splitFilter(filters.subcategory);
  const payload: TicketViewFilters = {};

  if (types.length === 1) payload.type = types[0];
  if (types.length) payload.types = types;
  if (groupIds.length === 1) {
    payload.filter_group_id = groupIds[0];
    payload.group_id = groupIds[0];
  }
  if (groupIds.length) payload.filter_group_ids = groupIds;
  if (technicianIds.length === 1) payload.technician_id = technicianIds[0];
  if (technicianIds.length) payload.technician_ids = technicianIds;
  if (statuses.length) payload.status = statuses;
  if (priorities.length === 1) payload.priority = priorities[0];
  if (priorities.length) payload.priorities = priorities;
  if (categories.length) payload.categories = categories;
  if (subcategories.length) payload.subcategories = subcategories;
  if (filters.date_from) payload.date_from = filters.date_from;
  if (filters.date_to) payload.date_to = filters.date_to;
  if (filters.due_from) payload.due_from = filters.due_from;
  if (filters.due_to) payload.due_to = filters.due_to;
  if (filters.resolved_from) payload.resolved_from = filters.resolved_from;
  if (filters.resolved_to) payload.resolved_to = filters.resolved_to;
  if (order.length) payload.filter_order = order;

  return payload;
}

export function attachViewColumns(filters: TicketViewFilters, columns: TicketColumnKey[]): TicketViewFilters {
  const normalized = normalizeTicketColumns(columns);
  return normalized ? { ...filters, columns: normalized } : filters;
}

export function selectionFromSystemView(view: SystemViewDefinition): ActiveViewSelection {
  return {
    kind: 'system',
    key: view.key,
    name: view.name,
    listMode: view.listMode,
    filters: { ...view.filters },
    sortBy: view.sortBy
  };
}

export function selectionFromCustomView(view: TicketView, role: UserRole): ActiveViewSelection {
  let listMode: ListMode = 'user';
  if (role === 'admin') listMode = 'admin';
  else if (role === 'technician') listMode = 'technician';
  else if (canWatchTickets()) listMode = 'watch';

  return {
    kind: 'custom',
    viewId: view.id,
    name: view.name,
    listMode,
    filters: filtersFromView(view),
    sortBy: view.sort_by || 'date-desc',
    columns: normalizeTicketColumns(view.filters?.columns) || undefined
  };
}

export function getTicketsApiPath(listMode: ListMode): string {
  if (listMode === 'admin') return '/admin/tickets';
  if (listMode === 'technician') return '/technician/tickets';
  if (listMode === 'watch') return '/tickets/watched';
  return '/tickets';
}

export function getDefaultTicketsPath(role: UserRole): string {
  return getTicketsPath(role);
}

const LAST_TICKET_VIEW_KEY = 'pp3-tickets-last-view';

export function saveLastTicketView(role: UserRole, itemKey: string): void {
  try {
    const raw = localStorage.getItem(LAST_TICKET_VIEW_KEY);
    const map: Partial<Record<UserRole, string>> = raw ? JSON.parse(raw) : {};
    map[role] = itemKey;
    localStorage.setItem(LAST_TICKET_VIEW_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function getLastTicketViewItemKey(role: UserRole): string | null {
  try {
    const raw = localStorage.getItem(LAST_TICKET_VIEW_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Partial<Record<UserRole, string>>;
    return map[role] ?? null;
  } catch {
    return null;
  }
}

const FAVORITE_VIEWS_KEY = 'pp3-ticket-view-favorites';

export function getFavoriteViewKeys(role: UserRole): string[] {
  try {
    const raw = localStorage.getItem(FAVORITE_VIEWS_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Partial<Record<UserRole, string[]>>;
    const list = map[role];
    return Array.isArray(list) ? list.filter((key) => typeof key === 'string' && key.length > 0) : [];
  } catch {
    return [];
  }
}

export function saveFavoriteViewKeys(role: UserRole, keys: string[]): void {
  try {
    const raw = localStorage.getItem(FAVORITE_VIEWS_KEY);
    const map: Partial<Record<UserRole, string[]>> = raw ? JSON.parse(raw) : {};
    map[role] = keys;
    localStorage.setItem(FAVORITE_VIEWS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function resolveTicketViewItemKey(search: string, role: UserRole): string {
  const param = new URLSearchParams(search).get('view');
  if (param) {
    const parsed = parseViewItemKey(param);
    if (parsed?.kind === 'system' && parsed.key) {
      const allowed = getSystemViewsForRole(role).some((view) => view.key === parsed.key);
      if (allowed) return param;
    }
    if (role !== 'user' && parsed?.kind === 'custom' && parsed.viewId) {
      return param;
    }
  }

  const last = getLastTicketViewItemKey(role);
  if (last) {
    const parsed = parseViewItemKey(last);
    if (parsed?.kind === 'system' && parsed.key) {
      const allowed = getSystemViewsForRole(role).some((view) => view.key === parsed.key);
      if (allowed) return last;
    }
    if (role !== 'user' && parsed?.kind === 'custom' && parsed.viewId) {
      return last;
    }
  }

  return systemViewKeyToItemKey(getDefaultSystemView(role).key);
}

export function getTicketsPath(role: UserRole, search = ''): string {
  return `/tickets?view=${resolveTicketViewItemKey(search, role)}`;
}
