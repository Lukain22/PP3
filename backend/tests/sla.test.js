const test = require('node:test');
const assert = require('node:assert/strict');

const dbModulePath = require.resolve('../db/db');
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: {
    query() {},
    getConnection() {}
  }
};

const { buildIncidentSla, formatDateForDb } = require('../utils/sla');

const POLICIES = {
  high: { response_hours: 2, resolution_hours: 8 },
  medium: { response_hours: 4, resolution_hours: 24 },
  low: { response_hours: 8, resolution_hours: 48 }
};

const hoursFrom = (date, hours) => date.getTime() + hours * 60 * 60 * 1000;

test('formatDateForDb devuelve null sin fecha y arma YYYY-MM-DD HH:MM:SS en UTC', () => {
  assert.equal(formatDateForDb(null), null);
  assert.equal(formatDateForDb(''), null);
  assert.equal(formatDateForDb(new Date('2026-03-01T08:15:45.000Z')), '2026-03-01 08:15:45');
  assert.equal(formatDateForDb('2026-03-01T08:15:45.000Z'), '2026-03-01 08:15:45');
});

test('buildIncidentSla calcula vencimientos según la prioridad y deja el SLA en curso', () => {
  const created = new Date(Date.now() + 60 * 60 * 1000);
  const result = buildIncidentSla({ priority: 'high', created_at: created, status: 'open' }, POLICIES);

  assert.equal(result.priority, 'high');
  assert.equal(result.sla_paused_at, null);
  assert.equal(result.sla_response_due.getTime(), hoursFrom(created, 2));
  assert.equal(result.sla_resolution_due.getTime(), hoursFrom(created, 8));
  assert.equal(result.sla_status, 'on_track');
});

test('buildIncidentSla usa prioridad media y marca pausa o incumplimiento', () => {
  const created = new Date();
  const medium = buildIncidentSla({ created_at: created, status: 'open' }, POLICIES);
  assert.equal(medium.priority, 'medium');
  assert.equal(medium.sla_response_due.getTime(), hoursFrom(created, 4));
  assert.equal(medium.sla_resolution_due.getTime(), hoursFrom(created, 24));

  const paused = buildIncidentSla(
    { priority: 'low', created_at: created, status: 'on-hold' },
    POLICIES
  );
  assert.equal(paused.sla_status, 'paused');
  assert.equal(paused.sla_paused_at, null);

  const overdue = new Date(Date.now() - 10 * 60 * 60 * 1000);
  const breached = buildIncidentSla({ priority: 'high', created_at: overdue, status: 'open' }, POLICIES);
  assert.equal(breached.sla_status, 'breached');
});
