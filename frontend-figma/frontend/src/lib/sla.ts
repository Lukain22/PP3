export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met' | 'paused';

export const SLA_STATUS_LABELS: Record<SlaStatus, string> = {
  on_track: 'En plazo',
  at_risk: 'Por vencer',
  breached: 'Vencido',
  met: 'Cumplido',
  paused: 'SLA pausado'
};

export const SLA_STATUS_COLORS: Record<SlaStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  on_track: 'success',
  at_risk: 'warning',
  breached: 'error',
  met: 'info',
  paused: 'default'
};

export function getSlaStatusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return SLA_STATUS_LABELS[status as SlaStatus] || status;
}

export function getSlaStatusColor(status: string | null | undefined): 'success' | 'warning' | 'error' | 'info' | 'default' {
  if (!status) return 'default';
  return SLA_STATUS_COLORS[status as SlaStatus] || 'default';
}

export function formatSlaDeadline(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('es-ES', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function isIncident(type: string | null | undefined): boolean {
  return type === 'incident';
}

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta'
};

export function getPriorityLabel(priority: string | null | undefined): string {
  if (!priority) return '—';
  return PRIORITY_LABELS[priority] || priority;
}

export function getPriorityColor(priority: string): 'default' | 'info' | 'warning' | 'error' {
  if (priority === 'high') return 'error';
  if (priority === 'medium') return 'warning';
  if (priority === 'low') return 'info';
  return 'default';
}
