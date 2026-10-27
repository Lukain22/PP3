const db = require('../db/db');

const DEFAULT_POLICIES = {
  high:   { response_hours: 2,  resolution_hours: 8  },
  medium: { response_hours: 4,  resolution_hours: 24 },
  low:    { response_hours: 8,  resolution_hours: 48 }
};

const VALID_SLA_STATUSES = ['on_track', 'at_risk', 'breached', 'met', 'paused'];
const STATUS_ON_HOLD = 'on-hold';

let cachedPolicies = null;

const clearPolicyCache = () => {
  cachedPolicies = null;
};

const initSlaPoliciesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS sla_policies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      priority VARCHAR(20) NOT NULL UNIQUE,
      response_hours INT NOT NULL,
      resolution_hours INT NOT NULL
    )
  `;

  db.query(sql, (err) => {
    if (err) {
      console.log('Error creando tabla sla_policies:', err);
      return;
    }
    console.log('Tabla sla_policies lista');

    db.query('SELECT COUNT(*) AS count FROM sla_policies', (countErr, rows) => {
      if (countErr) return;
      if (rows[0].count > 0) return;

      const entries = Object.entries(DEFAULT_POLICIES);
      let pending = entries.length;
      entries.forEach(([priority, policy]) => {
        db.query(
          'INSERT INTO sla_policies (priority, response_hours, resolution_hours) VALUES (?, ?, ?)',
          [priority, policy.response_hours, policy.resolution_hours],
          () => {
            pending -= 1;
            if (pending === 0) console.log('Políticas SLA iniciales cargadas');
          }
        );
      });
    });
  });
};

const loadPolicies = (callback) => {
  if (cachedPolicies) {
    callback(null, cachedPolicies);
    return;
  }

  db.query('SELECT priority, response_hours, resolution_hours FROM sla_policies', (err, rows) => {
    if (err) {
      callback(err);
      return;
    }

    const policies = { ...DEFAULT_POLICIES };
    rows.forEach((row) => {
      policies[row.priority] = {
        response_hours: row.response_hours,
        resolution_hours: row.resolution_hours
      };
    });

    cachedPolicies = policies;
    callback(null, policies);
  });
};

const addHours = (baseDate, hours) =>
  new Date(new Date(baseDate).getTime() + hours * 60 * 60 * 1000);

const calculateSlaDates = (createdAt, priority, policies) => {
  const policy = policies[priority] || policies.medium || DEFAULT_POLICIES.medium;
  return {
    sla_response_due: addHours(createdAt, policy.response_hours),
    sla_resolution_due: addHours(createdAt, policy.resolution_hours)
  };
};

const computeSlaStatus = (ticket) => {
  if (ticket.type !== 'incident') return null;
  if (ticket.status === STATUS_ON_HOLD) return 'paused';

  const now = new Date();
  const resolutionDue = ticket.sla_resolution_due ? new Date(ticket.sla_resolution_due) : null;
  const responseDue = ticket.sla_response_due ? new Date(ticket.sla_response_due) : null;

  if (ticket.status === 'resolved') {
    const resolvedAt = ticket.updated_at ? new Date(ticket.updated_at) : now;
    if (resolutionDue && resolvedAt <= resolutionDue) return 'met';
    return 'breached';
  }

  if (resolutionDue && now > resolutionDue) return 'breached';
  if (responseDue && now > responseDue) return 'at_risk';

  if (resolutionDue && ticket.created_at) {
    const created = new Date(ticket.created_at);
    const totalMs = resolutionDue.getTime() - created.getTime();
    const remainingMs = resolutionDue.getTime() - now.getTime();
    if (totalMs > 0 && remainingMs / totalMs < 0.25) return 'at_risk';
  }

  return 'on_track';
};

const clearSlaFields = () => ({
  sla_response_due: null,
  sla_resolution_due: null,
  sla_status: null,
  sla_paused_at: null
});

const buildIncidentSla = (ticket, policies) => {
  const priority = ticket.priority || 'medium';
  const dates = calculateSlaDates(ticket.created_at || new Date(), priority, policies);
  const merged = { ...ticket, type: 'incident', priority, ...dates };
  return {
    priority,
    sla_response_due: dates.sla_response_due,
    sla_resolution_due: dates.sla_resolution_due,
    sla_paused_at: null,
    sla_status: computeSlaStatus(merged)
  };
};

const resolveSlaForTicket = (ticket, policies, overrides = {}) => {
  const merged = { ...ticket, ...overrides };
  const type = merged.type || 'incident';

  if (type !== 'incident') {
    return { priority: null, ...clearSlaFields() };
  }

  return buildIncidentSla(merged, policies);
};

const enrichTicket = (ticket) => {
  if (!ticket || ticket.type !== 'incident') {
    return { ...ticket, sla_status: null };
  }
  return { ...ticket, sla_status: computeSlaStatus(ticket) };
};

const enrichTickets = (tickets) => tickets.map(enrichTicket);

const applySlaFieldsToUpdate = (oldTicket, updates, policies) => {
  const merged = { ...oldTicket, ...updates };

  if (merged.type !== 'incident') {
    return {
      priority: null,
      sla_response_due: null,
      sla_resolution_due: null,
      sla_status: null,
      sla_paused_at: null
    };
  }

  const oldStatus = oldTicket.status;
  const newStatus = updates.status !== undefined ? updates.status : oldTicket.status;

  let responseDue = oldTicket.sla_response_due ? new Date(oldTicket.sla_response_due) : null;
  let resolutionDue = oldTicket.sla_resolution_due ? new Date(oldTicket.sla_resolution_due) : null;
  let pausedAt = oldTicket.sla_paused_at ? new Date(oldTicket.sla_paused_at) : null;
  let priority = merged.priority || 'medium';

  const needsFullRecalc =
    updates.priority !== undefined ||
    (updates.type === 'incident' && oldTicket.type !== 'incident') ||
    (!responseDue && !resolutionDue);

  if (needsFullRecalc && newStatus !== STATUS_ON_HOLD) {
    const built = buildIncidentSla(merged, policies);
    responseDue = built.sla_response_due;
    resolutionDue = built.sla_resolution_due;
    priority = built.priority;
    pausedAt = null;
  }

  if (updates.status !== undefined && newStatus !== oldStatus) {
    if (newStatus === STATUS_ON_HOLD && oldStatus !== STATUS_ON_HOLD) {
      pausedAt = new Date();
    }

    if (oldStatus === STATUS_ON_HOLD && newStatus !== STATUS_ON_HOLD) {
      if (pausedAt) {
        const pauseMs = Date.now() - pausedAt.getTime();
        if (responseDue) responseDue = new Date(responseDue.getTime() + pauseMs);
        if (resolutionDue) resolutionDue = new Date(resolutionDue.getTime() + pauseMs);
      }
      pausedAt = null;
    }
  }

  const ticketForStatus = {
    ...merged,
    priority,
    sla_response_due: responseDue,
    sla_resolution_due: resolutionDue,
    status: newStatus
  };

  const slaStatus = newStatus === STATUS_ON_HOLD
    ? 'paused'
    : computeSlaStatus(ticketForStatus);

  return {
    priority,
    sla_response_due: formatDateForDb(responseDue),
    sla_resolution_due: formatDateForDb(resolutionDue),
    sla_paused_at: pausedAt ? formatDateForDb(pausedAt) : null,
    sla_status: slaStatus
  };
};

const appendSlaToFields = (fields, values, updates, slaFields) => {
  Object.entries(slaFields).forEach(([key, val]) => {
    fields.push(`${key} = ?`);
    values.push(val);
    updates[key] = val;
  });
};

const formatDateForDb = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

module.exports = {
  VALID_SLA_STATUSES,
  STATUS_ON_HOLD,
  initSlaPoliciesTable,
  loadPolicies,
  clearPolicyCache,
  calculateSlaDates,
  computeSlaStatus,
  clearSlaFields,
  buildIncidentSla,
  resolveSlaForTicket,
  enrichTicket,
  enrichTickets,
  applySlaFieldsToUpdate,
  appendSlaToFields,
  formatDateForDb
};
