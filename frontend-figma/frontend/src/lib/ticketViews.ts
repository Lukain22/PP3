import type { UserRole } from './auth';

export interface TicketViewFilters {
  type?: string | null;
  filter_group_id?: number | null;
  group_id?: number | null;
  technician_id?: number | null;
  status?: string[];
  priority?: string | null;
}

export interface TicketView {
  id: number;
  name: string;
  scope: string;
  visibility: 'personal' | 'group';
  share_group_id: number | null;
  share_group_name: string | null;
  filters: TicketViewFilters;
  sort_by: string;
  sort_order?: number;
  creator_email: string | null;
  is_owner: boolean;
}

export type ListMode = 'admin' | 'technician' | 'user';

export type SystemViewKey =
  | 'all_requests'
  | 'all_my_groups'
  | 'all_my_requests'
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
}

export interface ActiveViewSelection {
  kind: 'system' | 'custom';
  key?: SystemViewKey;
  viewId?: number;
  name: string;
  listMode: ListMode;
  filters: TicketListFilters;
  sortBy: string;
}

export const emptyTicketListFilters = (): TicketListFilters => ({
  type: '',
  group_id: '',
  technician_id: '',
  status: '',
  priority: ''
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
    key: 'all_my_requests',
    name: 'Todas mis solicitudes',
    roles: ['admin', 'technician', 'user'],
    listMode: 'user',
    filters: emptyTicketListFilters(),
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
  return SYSTEM_VIEWS.filter((view) => view.roles.includes(role));
}

export function getDefaultSystemView(role: UserRole): SystemViewDefinition {
  if (role === 'admin') return SYSTEM_VIEWS.find((v) => v.key === 'all_requests')!;
  if (role === 'technician') return SYSTEM_VIEWS.find((v) => v.key === 'all_my_groups')!;
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

export function filtersFromView(view: TicketView): TicketListFilters {
  const f = view.filters;
  const groupId = f.filter_group_id ?? f.group_id;
  return {
    type: f.type || '',
    group_id: groupId ? String(groupId) : '',
    technician_id: groupId && f.technician_id ? String(f.technician_id) : '',
    status: f.status?.length ? f.status.join(',') : '',
    priority: f.priority || ''
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
  if (filters.group_id) params.set('group_id', filters.group_id);
  if (filters.group_id && filters.technician_id) params.set('technician_ids', filters.technician_id);
  if (filters.status) params.set('status', filters.status);
  if (staffColumnFilters) appendStaffColumnFilters(params, staffColumnFilters);
  return params;
}

export function viewFiltersToPayload(filters: TicketListFilters): TicketViewFilters {
  const payload: TicketViewFilters = {};
  if (filters.type) payload.type = filters.type;
  if (filters.group_id) payload.filter_group_id = Number(filters.group_id);
  if (filters.group_id && filters.technician_id) payload.technician_id = Number(filters.technician_id);
  if (filters.priority) payload.priority = filters.priority;
  if (filters.status) {
    payload.status = filters.status.split(',').filter(Boolean);
  }
  return payload;
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

  return {
    kind: 'custom',
    viewId: view.id,
    name: view.name,
    listMode,
    filters: filtersFromView(view),
    sortBy: view.sort_by || 'date-desc'
  };
}

export function getTicketsApiPath(listMode: ListMode): string {
  if (listMode === 'admin') return '/admin/tickets';
  if (listMode === 'technician') return '/technician/tickets';
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
    if (parsed?.kind === 'custom' && parsed.viewId) {
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
    if (parsed?.kind === 'custom' && parsed.viewId) {
      return last;
    }
  }

  return systemViewKeyToItemKey(getDefaultSystemView(role).key);
}

export function getTicketsPath(role: UserRole, search = ''): string {
  return `/tickets?view=${resolveTicketViewItemKey(search, role)}`;
}
