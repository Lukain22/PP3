const test = require('node:test');
const assert = require('node:assert/strict');

const { rejectDirectResolve, missingResolveFields } = require('../utils/resolveRules');

test('rejectDirectResolve solo bloquea el paso a resuelto desde otro estado', () => {
  const message = rejectDirectResolve('open', 'resolved');
  assert.equal(
    message,
    'Para resolver el ticket cargá la resolución, un técnico asignado y la categoría con su subcategoría'
  );
  assert.equal(rejectDirectResolve('in-progress', 'resolved'), message);
  assert.equal(rejectDirectResolve('resolved', 'resolved'), null);
  assert.equal(rejectDirectResolve('open', 'on-hold'), null);
});

test('missingResolveFields exige técnico, categoría y subcategoría', () => {
  assert.equal(
    missingResolveFields(null),
    'No se puede resolver un ticket sin un técnico asignado'
  );
  assert.equal(
    missingResolveFields({ category: 'Hardware', subcategory: 'Impresora' }),
    'No se puede resolver un ticket sin un técnico asignado'
  );
  assert.equal(
    missingResolveFields({ technician_id: 4, category: 'Hardware' }),
    'No se puede resolver un ticket sin categoría y subcategoría'
  );
  assert.equal(
    missingResolveFields({ technician_id: 4, category: 'Hardware', subcategory: 'Impresora' }),
    null
  );
});
