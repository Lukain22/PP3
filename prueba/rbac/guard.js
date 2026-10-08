const { getRequestAccess } = require('./service');

const DENIED = 'No tenés permiso para realizar esta acción';

const assertPermission = async (req, res, code) => {
  try {
    const access = await getRequestAccess(req);
    if (access.has(code)) return true;
    res.status(403).json({ message: DENIED });
    return false;
  } catch (err) {
    console.error('Error validando permiso:', err.code || err.message);
    res.status(500).json({ message: 'Error al validar permisos' });
    return false;
  }
};

const assertAll = async (req, res, codes) => {
  for (const code of codes) {
    const ok = await assertPermission(req, res, code);
    if (!ok) return false;
  }
  return true;
};

/**
 * Valida los cambios de un ticket según el permiso que corresponde a cada campo.
 * La denegación de un grupo gana sobre "todos los grupos" cuando se combinan roles.
 */
const assertTicketMutation = async (req, res, oldTicket, body) => {
  try {
    const access = await getRequestAccess(req);
    const needed = new Set();
    const isOwner = Number(oldTicket.user_id) === Number(req.user.id);
    const accountRole = req.user.role;

    if (body.status !== undefined && body.status !== oldTicket.status) {
      if (body.status === 'resolved') needed.add('tickets.resolve');
      else if (oldTicket.status === 'resolved') needed.add('tickets.reopen');
      else if (body.status === 'closed') needed.add('tickets.close');
      else needed.add('tickets.edit');
    }

    const contentFields = ['title', 'description'];
    const staffFields = ['priority', 'type', 'category', 'subcategory'];
    const touchesContent = contentFields.some((field) => body[field] !== undefined);
    const touchesStaff = staffFields.some((field) => body[field] !== undefined);

    if (touchesStaff) needed.add('tickets.edit');
    if (touchesContent && !(isOwner && accountRole === 'user')) needed.add('tickets.edit');

    if (body.group_id !== undefined && Number(body.group_id || 0) !== Number(oldTicket.group_id || 0)) {
      needed.add('assignments.transfer');
      const target = Number(body.group_id);
      if (target && !access.canTransferTo(target)) {
        res.status(403).json({ message: 'No podés derivar tickets a ese grupo' });
        return false;
      }
    }

    if (body.technician_id !== undefined && Number(body.technician_id || 0) !== Number(oldTicket.technician_id || 0)) {
      const nextId = Number(body.technician_id) || null;
      if (nextId && nextId === Number(req.user.id)) needed.add('assignments.self');
      else needed.add('assignments.others');
    }

    for (const code of needed) {
      if (!access.has(code)) {
        res.status(403).json({ message: DENIED });
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Error validando cambio de ticket:', err.code || err.message);
    res.status(500).json({ message: 'Error al validar permisos' });
    return false;
  }
};

const requirePermission = (...codes) => async (req, res, next) => {
  try {
    const access = await getRequestAccess(req);
    if (codes.some((code) => access.has(code))) return next();
    return res.status(403).json({ message: DENIED });
  } catch (err) {
    console.error('Error validando permiso:', err.code || err.message);
    return res.status(500).json({ message: 'Error al validar permisos' });
  }
};

const requireViewWrite = (action) => async (req, res, next) => {
  const code = action === 'create' ? 'views.create' : 'views.edit';
  const ok = await assertPermission(req, res, code);
  if (!ok) return;
  if (req.body && req.body.visibility === 'group') {
    const shareOk = await assertPermission(req, res, 'views.share');
    if (!shareOk) return;
  }
  next();
};

module.exports = {
  assertPermission,
  assertAll,
  assertTicketMutation,
  requirePermission,
  requireViewWrite
};
