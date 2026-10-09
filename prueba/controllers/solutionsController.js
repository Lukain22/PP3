const db = require('../db/db');
const { getUserGroupIds } = require('../utils/groups');
const { sanitizeDescription, isEmptyDescription } = require('../utils/richText');
const { VALID_CATEGORIES, VALID_SUBCATEGORIES } = require('../utils/ticketFilters');
const { assertPermission } = require('../rbac/guard');
const { getRequestAccess } = require('../rbac/service');

const query = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const normalizeTags = (value) => {
  if (value == null || value === '') return null;
  const tags = [...new Set(
    String(value)
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => tag.slice(0, 40))
  )].slice(0, 20);
  return tags.length ? tags.join(', ') : null;
};

const normalizeCategory = (category, subcategory) => {
  const nextCategory = category ? String(category).trim() : null;
  const nextSubcategory = subcategory ? String(subcategory).trim() : null;
  if (nextCategory && !VALID_CATEGORIES.includes(nextCategory)) {
    return { error: 'Categoría inválida' };
  }
  if (nextSubcategory) {
    const allowed = VALID_SUBCATEGORIES[nextCategory] || [];
    if (!allowed.includes(nextSubcategory)) {
      return { error: 'Subcategoría inválida para esa categoría' };
    }
  }
  return { category: nextCategory || null, subcategory: nextSubcategory || null };
};

const attachGroups = async (rows) => {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const links = await query(
    `SELECT sg.solution_id, g.id, g.name
     FROM solution_groups sg
     JOIN \`groups\` g ON g.id = sg.group_id
     WHERE sg.solution_id IN (?)
     ORDER BY g.name ASC`,
    [ids]
  );
  const bySolution = new Map();
  links.forEach((link) => {
    const list = bySolution.get(link.solution_id) || [];
    list.push({ id: link.id, name: link.name });
    bySolution.set(link.solution_id, list);
  });
  return rows.map((row) => ({
    ...row,
    share_all: Boolean(row.share_all),
    groups: bySolution.get(row.id) || []
  }));
};

const replaceGroups = async (solutionId, groupIds) => {
  await query('DELETE FROM solution_groups WHERE solution_id = ?', [solutionId]);
  if (!groupIds.length) return;
  await query(
    'INSERT INTO solution_groups (solution_id, group_id) VALUES ?',
    [groupIds.map((groupId) => [solutionId, groupId])]
  );
};

const parseGroupIds = async (shareAll, rawIds) => {
  if (shareAll) return [];
  const ids = [...new Set((Array.isArray(rawIds) ? rawIds : []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
  if (!ids.length) return { error: 'Elegí al menos un grupo o compartila con todos' };
  const rows = await query('SELECT id FROM `groups` WHERE id IN (?)', [ids]);
  if (rows.length !== ids.length) return { error: 'Hay grupos inválidos' };
  return ids;
};

const canSeeSolution = (solution, groupIds, seesAll) => {
  if (seesAll) return true;
  if (solution.share_all) return true;
  const allowed = new Set((solution.groups || []).map((group) => group.id));
  return groupIds.some((id) => allowed.has(id));
};

exports.listSolutions = async (req, res) => {
  try {
    const rows = await query(
      `SELECT s.*,
              cu.email AS created_by_email,
              uu.email AS updated_by_email,
              au.email AS approved_by_email
       FROM solutions s
       JOIN users cu ON cu.id = s.created_by
       LEFT JOIN users uu ON uu.id = s.updated_by
       LEFT JOIN users au ON au.id = s.approved_by
       ORDER BY s.updated_at DESC`
    );
    res.json(await attachGroups(rows));
  } catch (err) {
    console.error('Error listando soluciones:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener soluciones' });
  }
};

exports.getSolution = async (req, res) => {
  try {
    const rows = await query(
      `SELECT s.*,
              cu.email AS created_by_email,
              uu.email AS updated_by_email,
              au.email AS approved_by_email
       FROM solutions s
       JOIN users cu ON cu.id = s.created_by
       LEFT JOIN users uu ON uu.id = s.updated_by
       LEFT JOIN users au ON au.id = s.approved_by
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Solución no encontrada' });
    const [solution] = await attachGroups(rows);
    res.json(solution);
  } catch (err) {
    console.error('Error obteniendo solución:', err.code || err.message);
    res.status(500).json({ message: 'Error al obtener la solución' });
  }
};

exports.listSolutionGroups = async (_req, res) => {
  try {
    const groups = await query('SELECT id, name FROM `groups` ORDER BY name ASC');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener grupos' });
  }
};

exports.createSolution = async (req, res) => {
  try {
    const title = String(req.body.title || '').trim().slice(0, 200);
    const content = sanitizeDescription(req.body.content);
    if (!title || isEmptyDescription(content)) {
      return res.status(400).json({ message: 'El título y el contenido son requeridos' });
    }
    const classified = normalizeCategory(req.body.category, req.body.subcategory);
    if (classified.error) return res.status(400).json({ message: classified.error });
    const shareAll = Boolean(req.body.share_all);
    const groupIds = await parseGroupIds(shareAll, req.body.group_ids);
    if (groupIds.error) return res.status(400).json({ message: groupIds.error });

    const result = await query(
      `INSERT INTO solutions
        (title, content, category, subcategory, tags, status, approval_status, share_all, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, 'active', 'pending', ?, ?, ?)`,
      [title, content, classified.category, classified.subcategory, normalizeTags(req.body.tags), shareAll ? 1 : 0, req.user.id, req.user.id]
    );
    await replaceGroups(result.insertId, groupIds);
    res.status(201).json({ id: result.insertId, message: 'Solución creada' });
  } catch (err) {
    console.error('Error creando solución:', err.code || err.message);
    res.status(500).json({ message: 'Error al crear la solución' });
  }
};

exports.updateSolution = async (req, res) => {
  try {
    const rows = await query('SELECT * FROM solutions WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Solución no encontrada' });
    const current = rows[0];
    const title = String(req.body.title || '').trim().slice(0, 200);
    const content = sanitizeDescription(req.body.content);
    if (!title || isEmptyDescription(content)) {
      return res.status(400).json({ message: 'El título y el contenido son requeridos' });
    }
    const classified = normalizeCategory(req.body.category, req.body.subcategory);
    if (classified.error) return res.status(400).json({ message: classified.error });
    const shareAll = Boolean(req.body.share_all);
    const groupIds = await parseGroupIds(shareAll, req.body.group_ids);
    if (groupIds.error) return res.status(400).json({ message: groupIds.error });

    const access = await getRequestAccess(req);
    const keepsApproval = current.approval_status === 'approved' && access.has('kb.approve')
      && content === current.content && title === current.title;
    const approvalStatus = keepsApproval ? 'approved' : 'pending';

    await query(
      `UPDATE solutions
       SET title = ?, content = ?, category = ?, subcategory = ?, tags = ?, share_all = ?,
           approval_status = ?, approved_by = ?, approved_at = ?, updated_by = ?
       WHERE id = ?`,
      [
        title,
        content,
        classified.category,
        classified.subcategory,
        normalizeTags(req.body.tags),
        shareAll ? 1 : 0,
        approvalStatus,
        keepsApproval ? current.approved_by : null,
        keepsApproval ? current.approved_at : null,
        req.user.id,
        req.params.id
      ]
    );
    await replaceGroups(req.params.id, groupIds);
    res.json({ message: keepsApproval ? 'Solución actualizada' : 'Solución actualizada. Quedó pendiente de aprobación.' });
  } catch (err) {
    console.error('Error actualizando solución:', err.code || err.message);
    res.status(500).json({ message: 'Error al actualizar la solución' });
  }
};

exports.setSolutionStatus = async (req, res) => {
  const status = req.body.status === 'inactive' ? 'inactive' : req.body.status === 'active' ? 'active' : null;
  if (!status) return res.status(400).json({ message: 'Estado inválido' });
  try {
    const result = await query('UPDATE solutions SET status = ?, updated_by = ? WHERE id = ?', [status, req.user.id, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Solución no encontrada' });
    res.json({ message: status === 'active' ? 'Solución activada' : 'Solución desactivada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cambiar el estado' });
  }
};

exports.setSolutionApproval = async (req, res) => {
  const approval = req.body.approval_status;
  if (approval !== 'approved' && approval !== 'rejected') {
    return res.status(400).json({ message: 'Estado de aprobación inválido' });
  }
  try {
    const result = await query(
      `UPDATE solutions
       SET approval_status = ?, approved_by = ?, approved_at = ?, updated_by = ?
       WHERE id = ?`,
      [approval, approval === 'approved' ? req.user.id : null, approval === 'approved' ? new Date() : null, req.user.id, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Solución no encontrada' });
    res.json({ message: approval === 'approved' ? 'Solución aprobada' : 'Solución rechazada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar la aprobación' });
  }
};

exports.deleteSolution = async (req, res) => {
  try {
    const result = await query('DELETE FROM solutions WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Solución no encontrada' });
    res.json({ message: 'Solución eliminada' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar la solución' });
  }
};

const loadVisibleSolution = async (req, id) => {
  const rows = await query(
    `SELECT s.id, s.title, s.content, s.category, s.subcategory, s.tags, s.share_all, s.use_count, s.status, s.approval_status
     FROM solutions s
     WHERE s.id = ?`,
    [id]
  );
  if (!rows.length) return null;
  const [solution] = await attachGroups(rows);
  const groupIds = await new Promise((resolve, reject) => {
    getUserGroupIds(req.user.id, (err, ids) => (err ? reject(err) : resolve(ids)));
  });
  const seesAll = req.user.role === 'admin';
  if (!canSeeSolution(solution, groupIds, seesAll)) return { forbidden: true };
  return solution;
};

exports.searchSolutions = async (req, res) => {
  const allowed = await assertPermission(req, res, 'tickets.resolve');
  if (!allowed) return;
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const like = `%${q.replace(/[%_]/g, '')}%`;
    const groupIds = await new Promise((resolve, reject) => {
      getUserGroupIds(req.user.id, (err, ids) => (err ? reject(err) : resolve(ids)));
    });
    const seesAll = req.user.role === 'admin';
    const params = [];
    let visibility = '';
    if (!seesAll) {
      if (!groupIds.length) visibility = ' AND s.share_all = 1';
      else {
        visibility = ' AND (s.share_all = 1 OR s.id IN (SELECT solution_id FROM solution_groups WHERE group_id IN (?)))';
        params.push(groupIds);
      }
    }
    let search = '';
    if (q) {
      search = ` AND (s.title LIKE ? OR s.content LIKE ? OR IFNULL(s.tags, '') LIKE ?
        OR IFNULL(s.category, '') LIKE ? OR IFNULL(s.subcategory, '') LIKE ?)`;
      params.push(like, like, like, like, like);
    }
    const rows = await query(
      `SELECT s.id, s.title, s.content, s.category, s.subcategory, s.tags, s.share_all, s.use_count
       FROM solutions s
       WHERE s.status = 'active' AND s.approval_status = 'approved'
       ${visibility}
       ${search}
       ORDER BY s.use_count DESC, s.title ASC
       LIMIT 50`,
      params
    );
    const withGroups = await attachGroups(rows);
    res.json(withGroups.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      subcategory: row.subcategory,
      tags: row.tags,
      share_all: row.share_all,
      use_count: row.use_count,
      groups: row.groups
    })));
  } catch (err) {
    console.error('Error buscando soluciones:', err.code || err.message);
    res.status(500).json({ message: 'Error al buscar soluciones' });
  }
};

exports.applySolution = async (req, res) => {
  const allowed = await assertPermission(req, res, 'tickets.resolve');
  if (!allowed) return;
  try {
    const solution = await loadVisibleSolution(req, req.params.id);
    if (!solution) return res.status(404).json({ message: 'Solución no encontrada' });
    if (solution.forbidden) return res.status(403).json({ message: 'No tenés acceso a esta solución' });
    if (solution.status !== 'active' || solution.approval_status !== 'approved') {
      return res.status(400).json({ message: 'La solución no está disponible' });
    }
    const ticketId = Number(req.body.ticket_id);
    if (!Number.isInteger(ticketId) || ticketId <= 0) {
      return res.status(400).json({ message: 'Ticket inválido' });
    }
    const tickets = await query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
    if (!tickets.length) return res.status(404).json({ message: 'Ticket no encontrado' });
    await query(
      'INSERT INTO solution_uses (solution_id, ticket_id, user_id) VALUES (?, ?, ?)',
      [solution.id, ticketId, req.user.id]
    );
    await query('UPDATE solutions SET use_count = use_count + 1 WHERE id = ?', [solution.id]);
    res.json({ content: solution.content, use_count: solution.use_count + 1 });
  } catch (err) {
    console.error('Error aplicando solución:', err.code || err.message);
    res.status(500).json({ message: 'Error al aplicar la solución' });
  }
};
