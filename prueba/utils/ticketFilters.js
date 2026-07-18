const VALID_STATUSES = ['open', 'in-progress', 'on-hold', 'resolved'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_TYPES = ['incident', 'requirement'];

const parseStatusFilter = (statusQuery) => {
  if (!statusQuery) return [];
  return String(statusQuery)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => VALID_STATUSES.includes(s));
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

  if (query.group_id) {
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
  parseStatusFilter,
  appendListFilters,
  normalizeViewFilters,
  filtersToQuery
};
