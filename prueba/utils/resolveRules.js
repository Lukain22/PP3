const DIRECT_RESOLVE_MESSAGE =
  'Para resolver el ticket cargá la resolución, un técnico asignado y la categoría con su subcategoría';

function rejectDirectResolve(oldStatus, nextStatus) {
  if (nextStatus === 'resolved' && oldStatus !== 'resolved') return DIRECT_RESOLVE_MESSAGE;
  return null;
}

function missingResolveFields(ticket) {
  if (!ticket || !ticket.technician_id) {
    return 'No se puede resolver un ticket sin un técnico asignado';
  }
  if (!ticket.category || !ticket.subcategory) {
    return 'No se puede resolver un ticket sin categoría y subcategoría';
  }
  return null;
}

module.exports = { rejectDirectResolve, missingResolveFields };
