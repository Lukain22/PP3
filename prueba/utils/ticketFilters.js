const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TYPES = ['incident', 'requirement'];

const VALID_CATEGORIES = [
  'Hardware',
  'Software',
  'Red / Conectividad',
  'Acceso / Cuentas',
  'Otro'
];

const parseStatusFilter = (statusQuery) => {
  if (!statusQuery) return [];
  return String(statusQuery)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => VALID_STATUSES.includes(s));
};

const parseCsvPositiveInts = (value) => {
  if (!value) return [];
  return [...new Set(
    String(value)
      .split(',')
      .map((part) => parseInt(part.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0)
  )];
};

const appendListFilters = (conditions, params, query) => {
  if (query.type && VALID_TYPES.includes(query.type)) {
    conditions.push('t.type = ?');
    params.push(query.type);
  }

  if (query.priority && VALID_PRIORITIES.includes(query.priority)) {
    conditions.push('t.priority = ?');
    params.push(query.priority);
  }

  const groupIds = parseCsvPositiveInts(query.group_ids);
  if (groupIds.length === 1) {
    conditions.push('t.group_id = ?');
    params.push(groupIds[0]);
  } else if (groupIds.length > 1) {
    conditions.push(`t.group_id IN (${groupIds.map(() => '?').join(', ')})`);
    params.push(...groupIds);
  } else if (query.group_id) {
    const groupId = parseInt(query.group_id, 10);
    if (groupId) {
      conditions.push('t.group_id = ?');
      params.push(groupId);
    }
  }

  const statuses = parseStatusFilter(query.status);
  if (statuses.length === 1) {
    conditions.push('t.status = ?');
    params.push(statuses[0]);
  } else if (statuses.length > 1) {
    conditions.push(`t.status IN (${statuses.map(() => '?').join(', ')})`);
    params.push(...statuses);
  }
};

const appendExtendedListFilters = (conditions, params, query) => {
  appendListFilters(conditions, params, query);

  const ticketId = parseInt(query.ticket_id, 10);
  if (ticketId) {
    conditions.push('t.id = ?');
    params.push(ticketId);
  }

  if (query.title && String(query.title).trim()) {
    conditions.push('t.title LIKE ?');
    params.push(`%${String(query.title).trim()}%`);
  }

  if (query.user_email && String(query.user_email).trim()) {
    conditions.push('u.email LIKE ?');
    params.push(`%${String(query.user_email).trim()}%`);
  }

  if (query.technician_ids) {
    const parts = String(query.technician_ids)
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const unassigned = parts.includes('unassigned');
    const technicianIds = parts
      .filter((part) => part !== 'unassigned')
      .map((part) => parseInt(part, 10))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (unassigned && technicianIds.length > 0) {
      conditions.push(`(t.technician_id IS NULL OR t.technician_id IN (${technicianIds.map(() => '?').join(', ')}))`);
      params.push(...technicianIds);
    } else if (unassigned) {
      conditions.push('t.technician_id IS NULL');
    } else if (technicianIds.length === 1) {
      conditions.push('t.technician_id = ?');
      params.push(technicianIds[0]);
    } else if (technicianIds.length > 1) {
      conditions.push(`t.technician_id IN (${technicianIds.map(() => '?').join(', ')})`);
      params.push(...technicianIds);
    }
  }

  if (query.categories) {
    const categories = String(query.categories)
      .split(',')
      .map((part) => part.trim())
      .filter((part) => VALID_CATEGORIES.includes(part));
    if (categories.length === 1) {
      conditions.push('t.category = ?');
      params.push(categories[0]);
    } else if (categories.length > 1) {
      conditions.push(`t.category IN (${categories.map(() => '?').join(', ')})`);
      params.push(...categories);
    }
  }

  if (query.date_from && /^\d{4}-\d{2}-\d{2}$/.test(String(query.date_from))) {
    conditions.push('DATE(t.created_at) >= ?');
    params.push(String(query.date_from));
  }

  if (query.date_to && /^\d{4}-\d{2}-\d{2}$/.test(String(query.date_to))) {
    conditions.push('DATE(t.created_at) <= ?');
    params.push(String(query.date_to));
  }
};

const normalizeViewFilters = (raw) => {
  const filters = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  const result = {};

  if (filters.type && VALID_TYPES.includes(filters.type)) {
    result.type = filters.type;
  }

  if (filters.priority && VALID_PRIORITIES.includes(filters.priority)) {
    result.priority = filters.priority;
  }

  const groupId = filters.filter_group_id ?? filters.group_id;
  if (groupId !== null && groupId !== undefined && groupId !== '') {
    const parsed = parseInt(groupId, 10);
    if (parsed) result.filter_group_id = parsed;
  }

  if (Array.isArray(filters.status)) {
    const statuses = filters.status.filter((s) => VALID_STATUSES.includes(s));
    if (statuses.length > 0) result.status = statuses;
  } else if (filters.status && VALID_STATUSES.includes(filters.status)) {
    result.status = [filters.status];
  }

  return result;
};

const filtersToQuery = (filters) => {
  const normalized = normalizeViewFilters(filters);
  const query = {};

  if (normalized.type) query.type = normalized.type;
  if (normalized.priority) query.priority = normalized.priority;
  if (normalized.filter_group_id) query.group_id = String(normalized.filter_group_id);
  if (normalized.status?.length) query.status = normalized.status.join(',');

  return query;
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_TYPES,
  VALID_CATEGORIES,
  parseStatusFilter,
  appendListFilters,
  appendExtendedListFilters,
  normalizeViewFilters,
  filtersToQuery
};
