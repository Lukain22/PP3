import type { StaffColumnFilters } from './ticketViews';

export type TicketSortKey =
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
  | 'date';

export type SortDirection = 'asc' | 'desc';

export interface TicketSort {
  key: TicketSortKey;
  direction: SortDirection;
}

const DATE_FIRST_DIRECTION: SortDirection = 'desc';

export function sortToQuery(sort: TicketSort): string {
  return `${sort.key}-${sort.direction}`;
}

export function sortFromViewSort(sortBy: string): TicketSort {
  switch (sortBy) {
    case 'date-asc':
      return { key: 'date', direction: 'asc' };
    case 'date-desc':
      return { key: 'date', direction: 'desc' };
    case 'title-asc':
      return { key: 'title', direction: 'asc' };
    case 'title-desc':
      return { key: 'title', direction: 'desc' };
    case 'priority-asc':
      return { key: 'priority', direction: 'asc' };
    case 'priority-desc':
      return { key: 'priority', direction: 'desc' };
    default:
      return { key: 'date', direction: 'desc' };
  }
}

export function toggleColumnSort(current: TicketSort, key: TicketSortKey): TicketSort {
  if (current.key !== key) {
    return { key, direction: key === 'date' ? DATE_FIRST_DIRECTION : 'asc' };
  }
  return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
}

export function isColumnFilterActive(filters: StaffColumnFilters, key: TicketSortKey): boolean {
  switch (key) {
    case 'id':
      return Boolean(filters.ticketId.trim());
    case 'title':
      return Boolean(filters.title.trim());
    case 'user':
      return Boolean(filters.user.trim());
    case 'group':
      return Boolean(filters.group.trim());
    case 'assignee':
      return Boolean(filters.assignee.trim());
    case 'status':
      return Boolean(filters.status.trim());
    case 'category':
      return Boolean(filters.category.trim());
    case 'subcategory':
      return Boolean(filters.subcategory.trim());
    case 'date':
      return Boolean(filters.date);
    default:
      return false;
  }
}
