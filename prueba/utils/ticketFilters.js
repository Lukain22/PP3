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

const VALID_SUBCATEGORIES = {
  Hardware: ['Computadora / Notebook', 'Impresora', 'Proyector', 'Periféricos', 'Otro'],
  Software: ['Sistema operativo', 'Aplicaciones', 'Correo electrónico', 'Antivirus', 'Otro'],
  'Red / Conectividad': ['Internet', 'Wi-Fi', 'Red local', 'VPN', 'Otro'],
  'Acceso / Cuentas': ['Contraseña olvidada', 'Permisos', 'Usuario nuevo', 'Campus virtual', 'Otro'],
  Otro: ['Consulta general', 'Otro']
};

const VALID_SUBCATEGORY_VALUES = [...new Set(Object.values(VALID_SUBCATEGORIES).flat())];
const VIEW_FILTER_FIELDS = ['type', 'status', 'priority', 'group', 'technician', 'category', 'subcategory', 'created'];

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
  const types = parseAllowedList(query.type, VALID_TYPES);
  if (types.length === 1) {
    conditions.push('t.type = ?');
    params.push(types[0]);
  } else if (types.length > 1) {
    conditions.push(`t.type IN (${types.map(() => '?').join(', ')})`);
    params.push(...types);
  }

  const priorities = parseAllowedList(query.priorities || query.priority, VALID_PRIORITIES);
  if (priorities.length === 1) {
    conditions.push('t.priority = ?');
    params.push(priorities[0]);
  } else if (priorities.length > 1) {
    conditions.push(`t.priority IN (${priorities.map(() => '?').join(', ')})`);
    params.push(...priorities);
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

const likeContains = (value) => {
  const escaped = String(value).trim().replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
};

const likeClause = (expression) => `${expression} LIKE ? ESCAPE '\\\\'`;

const STATUS_TEXT_MATCHES = [
  { value: 'open', label: 'abierto' },
  { value: 'in-progress', label: 'en proceso' },
  { value: 'on-hold', label: 'en espera' },
  { value: 'resolved', label: 'resuelto' }
];

const matchStatusText = (value) => {
  const needle = String(value || '').trim().toLowerCase();
  if (!needle) return [];
  return STATUS_TEXT_MATCHES
    .filter((status) => status.label.includes(needle) || status.value.includes(needle))
    .map((status) => status.value);
};

const appendExtendedListFilters = (conditions, params, query) => {
  appendListFilters(conditions, params, query);

  if (query.ticket_id && String(query.ticket_id).trim()) {
    const digits = String(query.ticket_id).replace(/\D/g, '');
    if (digits) {
      conditions.push(likeClause('CAST(t.id AS CHAR)'));
      params.push(likeContains(digits));
    }
  }

  if (query.title && String(query.title).trim()) {
    conditions.push(likeClause('t.title'));
    params.push(likeContains(query.title));
  }

  if (query.user_email && String(query.user_email).trim()) {
    conditions.push(likeClause('u.email'));
    params.push(likeContains(query.user_email));
  }

  if (query.group_name && String(query.group_name).trim()) {
    conditions.push(likeClause('g.name'));
    params.push(likeContains(query.group_name));
  }

  if (query.assignee && String(query.assignee).trim()) {
    const raw = String(query.assignee).trim();
    const needle = raw.toLowerCase();
    const matchesUnassigned = 'sin asignar'.startsWith(needle) || (needle.length >= 4 && 'sin asignar'.includes(needle));
    if (matchesUnassigned) {
      conditions.push(`(t.technician_id IS NULL OR ${likeClause('tech.email')})`);
    } else {
      conditions.push(likeClause('tech.email'));
    }
    params.push(likeContains(raw));
  }

  if (query.status_q && String(query.status_q).trim()) {
    const statuses = matchStatusText(query.status_q);
    if (statuses.length === 0) {
      conditions.push('1 = 0');
    } else if (statuses.length === 1) {
      conditions.push('t.status = ?');
      params.push(statuses[0]);
    } else {
      conditions.push(`t.status IN (${statuses.map(() => '?').join(', ')})`);
      params.push(...statuses);
    }
  }

  if (query.category_q && String(query.category_q).trim()) {
    conditions.push(likeClause('t.category'));
    params.push(likeContains(query.category_q));
  }

  if (query.subcategory && String(query.subcategory).trim()) {
    conditions.push(likeClause('t.subcategory'));
    params.push(likeContains(query.subcategory));
  }

  if (query.date_on && /^\d{4}-\d{2}-\d{2}$/.test(String(query.date_on))) {
    conditions.push('DATE(t.created_at) = ?');
    params.push(String(query.date_on));
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

  if (query.subcategories) {
    const subcategories = String(query.subcategories)
      .split(',')
      .map((part) => part.trim())
      .filter((part) => VALID_SUBCATEGORY_VALUES.includes(part));
    if (subcategories.length === 1) {
      conditions.push('t.subcategory = ?');
      params.push(subcategories[0]);
    } else if (subcategories.length > 1) {
      conditions.push(`t.subcategory IN (${subcategories.map(() => '?').join(', ')})`);
      params.push(...subcategories);
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

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
};

const parseAllowedList = (value, allowed) => [...new Set(
  asList(value)
    .flatMap((item) => String(item).split(','))
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item))
)];

const parseIdList = (value) => [...new Set(
  asList(value)
    .map((item) => parseInt(item, 10))
    .filter((id) => Number.isInteger(id) && id > 0)
)];

const isIsoDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeViewFilters = (raw) => {
  const filters = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  const result = {};

  const types = parseAllowedList(asList(filters.types).length ? filters.types : filters.type, VALID_TYPES);
  const priorities = parseAllowedList(asList(filters.priorities).length ? filters.priorities : filters.priority, VALID_PRIORITIES);
  const groupIds = parseIdList(asList(filters.filter_group_ids).length ? filters.filter_group_ids : (filters.filter_group_id ?? filters.group_id));
  const technicianIds = parseIdList(asList(filters.technician_ids).length ? filters.technician_ids : filters.technician_id);
  const categories = parseAllowedList(filters.categories, VALID_CATEGORIES);
  const subcategories = parseAllowedList(filters.subcategories, VALID_SUBCATEGORY_VALUES);
  const statuses = parseAllowedList(filters.status, VALID_STATUSES);

  if (types.length === 1) result.type = types[0];
  if (types.length) result.types = types;
  if (priorities.length === 1) result.priority = priorities[0];
  if (priorities.length) result.priorities = priorities;
  if (groupIds.length === 1) {
    result.filter_group_id = groupIds[0];
    result.group_id = groupIds[0];
  }
  if (groupIds.length) result.filter_group_ids = groupIds;
  if (groupIds.length && technicianIds.length === 1) result.technician_id = technicianIds[0];
  if (groupIds.length && technicianIds.length) result.technician_ids = technicianIds;
  if (statuses.length) result.status = statuses;
  if (categories.length) result.categories = categories;
  if (subcategories.length) result.subcategories = subcategories;

  let dateFrom = isIsoDate(filters.date_from) ? filters.date_from : null;
  let dateTo = isIsoDate(filters.date_to) ? filters.date_to : null;
  if (dateFrom && dateTo && dateFrom > dateTo) {
    const swap = dateFrom;
    dateFrom = dateTo;
    dateTo = swap;
  }
  if (dateFrom) result.date_from = dateFrom;
  if (dateTo) result.date_to = dateTo;

  if (Array.isArray(filters.filter_order)) {
    const order = [...new Set(filters.filter_order.filter((field) => VIEW_FILTER_FIELDS.includes(field)))];
    if (order.length) result.filter_order = order;
  }

  return result;
};

const TICKET_ORDER_BY = {
  'id-asc': 't.id ASC',
  'id-desc': 't.id DESC',
  'title-asc': 't.title ASC, t.id DESC',
  'title-desc': 't.title DESC, t.id DESC',
  'description-asc': 't.description ASC, t.id DESC',
  'description-desc': 't.description DESC, t.id DESC',
  'user-asc': 'u.email ASC, t.id DESC',
  'user-desc': 'u.email DESC, t.id DESC',
  'group-asc': 'g.name ASC, t.id DESC',
  'group-desc': 'g.name DESC, t.id DESC',
  'assignee-asc': 'tech.email IS NULL, tech.email ASC, t.id DESC',
  'assignee-desc': 'tech.email IS NULL, tech.email DESC, t.id DESC',
  'type-asc': "FIELD(t.type, 'incident', 'requirement') ASC, t.id DESC",
  'type-desc': "FIELD(t.type, 'requirement', 'incident') ASC, t.id DESC",
  'status-asc': "FIELD(t.status, 'open', 'in-progress', 'on-hold', 'resolved') ASC, t.id DESC",
  'status-desc': "FIELD(t.status, 'resolved', 'on-hold', 'in-progress', 'open') ASC, t.id DESC",
  'priority-asc': "FIELD(t.priority, 'low', 'medium', 'high') ASC, t.id DESC",
  'priority-desc': "FIELD(t.priority, 'high', 'medium', 'low') ASC, t.id DESC",
  'category-asc': 't.category ASC, t.id DESC',
  'category-desc': 't.category DESC, t.id DESC',
  'subcategory-asc': 't.subcategory ASC, t.id DESC',
  'subcategory-desc': 't.subcategory DESC, t.id DESC',
  'date-asc': 't.created_at ASC, t.id ASC',
  'date-desc': 't.created_at DESC, t.id DESC'
};

const STAFF_ONLY_SORTS = new Set([
  'user-asc',
  'user-desc',
  'group-asc',
  'group-desc',
  'assignee-asc',
  'assignee-desc',
  'category-asc',
  'category-desc',
  'subcategory-asc',
  'subcategory-desc'
]);

const resolveTicketOrderBy = (sort, profile = 'staff') => {
  const key = typeof sort === 'string' ? sort : '';
  if (!TICKET_ORDER_BY[key]) return TICKET_ORDER_BY['date-desc'];
  if (profile === 'user' && STAFF_ONLY_SORTS.has(key)) return TICKET_ORDER_BY['date-desc'];
  return TICKET_ORDER_BY[key];
};

const filtersToQuery = (filters) => {
  const normalized = normalizeViewFilters(filters);
  const query = {};

  if (normalized.types?.length) query.type = normalized.types.join(',');
  else if (normalized.type) query.type = normalized.type;
  if (normalized.priorities?.length) query.priority = normalized.priorities.join(',');
  else if (normalized.priority) query.priority = normalized.priority;
  if (normalized.filter_group_ids?.length > 1) query.group_ids = normalized.filter_group_ids.join(',');
  else if (normalized.filter_group_id) query.group_id = String(normalized.filter_group_id);
  if (normalized.technician_ids?.length) query.technician_ids = normalized.technician_ids.join(',');
  else if (normalized.technician_id) query.technician_ids = String(normalized.technician_id);
  if (normalized.status?.length) query.status = normalized.status.join(',');
  if (normalized.categories?.length) query.categories = normalized.categories.join(',');
  if (normalized.subcategories?.length) query.subcategories = normalized.subcategories.join(',');
  if (normalized.date_from) query.date_from = normalized.date_from;
  if (normalized.date_to) query.date_to = normalized.date_to;

  return query;
};

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_TYPES,
  VALID_CATEGORIES,
  VALID_SUBCATEGORIES,
  parseStatusFilter,
  appendListFilters,
  appendExtendedListFilters,
  normalizeViewFilters,
  filtersToQuery,
  resolveTicketOrderBy
};
