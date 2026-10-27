export const TICKET_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'] as const;

export type TicketStatus = typeof TICKET_STATUSES[number];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Abierto',
  'in-progress': 'En proceso',
  'on-hold': 'En espera',
  resolved: 'Resuelto'
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, 'warning' | 'info' | 'default' | 'success'> = {
  open: 'warning',
  'in-progress': 'info',
  'on-hold': 'default',
  resolved: 'success'
};

export const TICKET_STATUS_OPTIONS = TICKET_STATUSES.map((value) => ({
  value,
  label: TICKET_STATUS_LABELS[value]
}));

export function getTicketStatusLabel(status: string): string {
  return TICKET_STATUS_LABELS[status as TicketStatus] || status;
}

export function getTicketStatusColor(status: string): 'warning' | 'info' | 'default' | 'success' {
  return TICKET_STATUS_COLORS[status as TicketStatus] || 'default';
}
