const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseStatusFilter,
  appendListFilters,
  appendExtendedListFilters,
  normalizeViewFilters,
  filtersToQuery,
  resolveTicketOrderBy
} = require('../utils/ticketFilters');

test('parseStatusFilter se queda con estados válidos', () => {
  assert.deepEqual(parseStatusFilter(undefined), []);
  assert.deepEqual(parseStatusFilter(' open, nope ,in-progress, '), ['open', 'in-progress']);
});

test('appendListFilters arma condiciones y parámetros sin tocar la base', () => {
  const conditions = [];
  const params = [];
  appendListFilters(conditions, params, {
    type: 'incident,requirement,otro',
    priority: 'low',
    group_ids: '3,3,0,-1,8',
    status: 'resolved,bogus'
  });

  assert.deepEqual(conditions, [
    't.type IN (?, ?)',
    't.priority = ?',
    't.group_id IN (?, ?)',
    't.status = ?'
  ]);
  assert.deepEqual(params, ['incident', 'requirement', 'low', 3, 8, 'resolved']);
});

test('appendExtendedListFilters escapa comodines LIKE y traduce el texto de estado', () => {
  const byTitle = [];
  const titleParams = [];
  appendExtendedListFilters(byTitle, titleParams, { title: ' 50%_off ' });
  assert.deepEqual(byTitle, ["t.title LIKE ? ESCAPE '\\\\'"]);
  assert.deepEqual(titleParams, ['%50\\%\\_off%']);

  const byStatus = [];
  const statusParams = [];
  appendExtendedListFilters(byStatus, statusParams, { status_q: 'en' });
  assert.deepEqual(byStatus, ['t.status IN (?, ?, ?)']);
  assert.deepEqual(statusParams, ['open', 'in-progress', 'on-hold']);

  const none = [];
  const noneParams = [];
  appendExtendedListFilters(none, noneParams, { status_q: 'zzz' });
  assert.deepEqual(none, ['1 = 0']);
  assert.deepEqual(noneParams, []);
});

test('normalizeViewFilters limpia listas, invierte rangos de fecha y descarta columnas ajenas', () => {
  const result = normalizeViewFilters({
    types: ['incident', 'nope', 'incident'],
    status: ['open', 'bogus'],
    filter_group_ids: [1, 0, -2, 1, '4'],
    technician_ids: [9],
    date_from: '2026-05-10',
    date_to: '2026-05-01',
    due_from: 'ayer',
    filter_order: ['status', 'nope', 'type', 'status'],
    columns: ['id', 'secret', 'title']
  });

  assert.deepEqual(result.types, ['incident']);
  assert.equal(result.type, 'incident');
  assert.deepEqual(result.status, ['open']);
  assert.deepEqual(result.filter_group_ids, [1, 4]);
  assert.equal(result.filter_group_id, undefined);
  assert.deepEqual(result.technician_ids, [9]);
  assert.equal(result.date_from, '2026-05-01');
  assert.equal(result.date_to, '2026-05-10');
  assert.equal(result.due_from, undefined);
  assert.deepEqual(result.filter_order, ['status', 'type']);
  assert.deepEqual(result.columns, ['id', 'title']);
});

test('filtersToQuery serializa los filtros ya normalizados', () => {
  const query = filtersToQuery({
    types: ['incident', 'requirement'],
    priorities: ['high'],
    filter_group_ids: [2, 5],
    status: ['open', 'on-hold'],
    categories: ['Hardware', 'Inventada'],
    date_from: '2026-01-02',
    date_to: '2026-01-01'
  });

  assert.deepEqual(query, {
    type: 'incident,requirement',
    priority: 'high',
    group_ids: '2,5',
    status: 'open,on-hold',
    categories: 'Hardware',
    date_from: '2026-01-01',
    date_to: '2026-01-02'
  });
});

test('resolveTicketOrderBy usa el orden pedido y cae a fecha descendente', () => {
  assert.equal(resolveTicketOrderBy('title-asc'), 't.title ASC, t.id DESC');
  assert.equal(resolveTicketOrderBy('user-asc', 'staff'), 'u.email ASC, t.id DESC');
  assert.equal(resolveTicketOrderBy('user-asc', 'user'), 't.created_at DESC, t.id DESC');
  assert.equal(resolveTicketOrderBy('no-existe'), 't.created_at DESC, t.id DESC');
  assert.equal(resolveTicketOrderBy(null), 't.created_at DESC, t.id DESC');
});
