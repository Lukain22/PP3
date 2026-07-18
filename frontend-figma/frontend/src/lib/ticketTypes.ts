export const TICKET_TYPES = ['incident', 'requirement'] as const;

export type TicketType = typeof TICKET_TYPES[number];

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  incident: 'Incidente',
  requirement: 'Requerimiento'
};

export const TICKET_TYPE_HINTS: Record<TicketType, string> = {
  incident: 'Algo dejó de funcionar o falla',
  requirement: 'Pedido nuevo, acceso o cambio'
};

export const TICKET_TYPE_OPTIONS = TICKET_TYPES.map((value) => ({
  value,
  label: TICKET_TYPE_LABELS[value],
  hint: TICKET_TYPE_HINTS[value]
}));

export function getTicketTypeLabel(type: string): string {
  return TICKET_TYPE_LABELS[type as TicketType] || type;
}

export function getTicketTypeColor(type: string): 'error' | 'info' | 'default' {
  if (type === 'incident') return 'error';
  if (type === 'requirement') return 'info';
  return 'default';
}

export const HISTORY_FIELD_LABELS: Record<string, string> = {
  type: 'Tipo',
  status: 'Estado',
  priority: 'Prioridad',
  title: 'Asunto',
  description: 'Descripción',
  category: 'Categoría',
  subcategory: 'Subcategoría',
  sla_status: 'Estado SLA',
  sla_response_due: 'Vencimiento respuesta',
  sla_resolution_due: 'Vencimiento resolución',
  group_id: 'Grupo'
};

export const HISTORY_VALUE_LABELS: Record<string, Record<string, string>> = {
  type: TICKET_TYPE_LABELS,
  status: { open: 'Abierto', 'in-progress': 'En proceso', 'on-hold': 'En espera', resolved: 'Resuelto' },
  priority: { low: 'Baja', medium: 'Media', high: 'Alta' },
  sla_status: {
    on_track: 'En plazo',
    at_risk: 'Por vencer',
    breached: 'Vencido',
    met: 'Cumplido',
    paused: 'En espera (SLA pausado)'
  }
};

export function formatHistoryValue(field: string | null, value: string | null): string {
  if (value == null || value === '') return '—';
  if (field && HISTORY_VALUE_LABELS[field]?.[value]) {
    return HISTORY_VALUE_LABELS[field][value];
  }
  if (field === 'description' && value.length > 80) {
    return `${value.slice(0, 80)}…`;
  }
  return value;
}
