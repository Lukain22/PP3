export interface TicketViewFilters {
  type?: string | null;
  filter_group_id?: number | null;
  group_id?: number | null;
  status?: string[];
  priority?: string | null;
}

export interface TicketView {
  id: number;
  name: string;
  scope: 'admin' | 'technician';
  visibility: 'personal' | 'group';
  share_group_id: number | null;
  share_group_name: string | null;
  filters: TicketViewFilters;
  sort_by: string;
  creator_email: string | null;
  is_owner: boolean;
}

export interface TicketListFilters {
  type: string;
  group_id: string;
  status: string;
  priority: string;
}

export const emptyTicketListFilters = (): TicketListFilters => ({
  type: '',
  group_id: '',
  status: '',
  priority: ''
});

export function filtersFromView(view: TicketView): TicketListFilters {
  const f = view.filters;
  const groupId = f.filter_group_id ?? f.group_id;
  return {
    type: f.type || '',
    group_id: groupId ? String(groupId) : '',
    status: f.status?.length ? f.status.join(',') : '',
    priority: f.priority || ''
  };
}

export function buildTicketQueryParams(
  page: number,
  limit: number,
  filters: TicketListFilters
): URLSearchParams {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.type) params.set('type', filters.type);
  if (filters.group_id) params.set('group_id', filters.group_id);
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  return params;
}

export function viewFiltersToPayload(filters: TicketListFilters): TicketViewFilters {
  const payload: TicketViewFilters = {};
  if (filters.type) payload.type = filters.type;
  if (filters.group_id) payload.filter_group_id = Number(filters.group_id);
  if (filters.priority) payload.priority = filters.priority;
  if (filters.status) {
    payload.status = filters.status.split(',').filter(Boolean);
  }
  return payload;
}

export function hasActiveFilters(filters: TicketListFilters): boolean {
  return !!(filters.type || filters.group_id || filters.status || filters.priority);
}
