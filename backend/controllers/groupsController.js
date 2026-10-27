const db = require('../db/db');

exports.getGroups = (req, res) => {
  db.query(
    'SELECT id, name, description, is_default, created_at FROM `groups` ORDER BY is_default DESC, name ASC',
    (err, rows) => {
      if (err) {
        console.error('Error en getGroups:', err.code);
        return res.status(500).json({ message: 'Error al obtener grupos' });
      }
      res.json(rows);
    }
  );
};

exports.getGroupById = (req, res) => {
  const { id } = req.params;

  db.query(
    'SELECT id, name, description, is_default, created_at FROM `groups` WHERE id = ?',
    [id],
    (err, rows) => {
      if (err) {
        console.error('Error en getGroupById:', err.code);
        return res.status(500).json({ message: 'Error al obtener grupo' });
      }
      if (rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado' });

      const group = rows[0];

      db.query(
        `SELECT u.id, u.email
         FROM user_groups ug
         JOIN users u ON u.id = ug.user_id
         WHERE ug.group_id = ? AND u.role = 'technician'
         ORDER BY u.email ASC`,
        [id],
        (err2, technicians) => {
          if (err2) {
            console.error('Error en getGroupById technicians:', err2.code);
            return res.status(500).json({ message: 'Error al obtener técnicos del grupo' });
          }
          res.json({ ...group, technicians });
        }
      );
    }
  );
};

exports.getTechnicians = (req, res) => {
  db.query(
    "SELECT id, email FROM users WHERE role = 'technician' ORDER BY email ASC",
    (err, rows) => {
      if (err) {
        console.error('Error en getTechnicians:', err.code);
        return res.status(500).json({ message: 'Error al obtener técnicos' });
      }
      res.json(rows);
    }
  );
};

const syncGroupTechnicians = (groupId, technicianIds, callback) => {
  if (!Array.isArray(technicianIds)) {
    return callback(new Error('technician_ids debe ser un array'));
  }

  const ids = [...new Set(technicianIds.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))];

  if (ids.length === 0) {
    return db.query('DELETE FROM user_groups WHERE group_id = ?', [groupId], (delErr) => callback(delErr));
  }

  const placeholders = ids.map(() => '?').join(', ');
  db.query(
    `SELECT id FROM users WHERE id IN (${placeholders}) AND role = 'technician'`,
    ids,
    (selErr, validRows) => {
      if (selErr) return callback(selErr);
      if (validRows.length !== ids.length) {
        return callback(Object.assign(new Error('Técnicos inválidos'), { code: 'INVALID_TECHNICIANS' }));
      }

      db.query('DELETE FROM user_groups WHERE group_id = ?', [groupId], (delErr) => {
        if (delErr) return callback(delErr);

        let pending = ids.length;
        ids.forEach((userId) => {
          db.query(
            'INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)',
            [userId, groupId],
            (insErr) => {
              if (insErr) return callback(insErr);
              pending -= 1;
              if (pending === 0) callback(null);
            }
          );
        });
      });
    }
  );
};

exports.createGroup = (req, res) => {
  const { name, description } = req.body;

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'El nombre del grupo es requerido' });
  }

  db.query(
    'INSERT INTO `groups` (name, description, is_default) VALUES (?, ?, 0)',
    [String(name).trim(), description ? String(description).trim() : null],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Ya existe un grupo con ese nombre' });
        }
        console.error('Error en createGroup:', err.code);
        return res.status(500).json({ message: 'Error al crear grupo' });
      }
      res.status(201).json({ message: 'Grupo creado', id: result.insertId });
    }
  );
};

exports.updateGroup = (req, res) => {
  const { id } = req.params;
  const { name, description, technician_ids } = req.body;

  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ message: 'El nombre no puede estar vacío' });
  }

  db.query('SELECT id FROM `groups` WHERE id = ?', [id], (selErr, rows) => {
    if (selErr) return res.status(500).json({ message: 'Error al obtener grupo' });
    if (rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado' });

    const updateFields = () => {
      const fields = [];
      const values = [];

      if (name !== undefined) {
        fields.push('name = ?');
        values.push(String(name).trim());
      }
      if (description !== undefined) {
        fields.push('description = ?');
        values.push(description ? String(description).trim() : null);
      }

      if (fields.length === 0) return Promise.resolve();

      values.push(id);
      return new Promise((resolve, reject) => {
        db.query(`UPDATE \`groups\` SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return reject(Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' }));
            }
            return reject(err);
          }
          resolve();
        });
      });
    };

    const finish = (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ message: 'Ya existe un grupo con ese nombre' });
        }
        if (err.code === 'INVALID_TECHNICIANS') {
          return res.status(400).json({ message: 'Uno o más técnicos seleccionados no son válidos' });
        }
        console.error('Error en updateGroup:', err.code || err);
        return res.status(500).json({ message: 'Error al actualizar grupo' });
      }
      res.json({ message: 'Grupo actualizado' });
    };

    if (name === undefined && description === undefined && technician_ids === undefined) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    updateFields()
      .then(() => {
        if (technician_ids === undefined) return finish();
        syncGroupTechnicians(id, technician_ids, finish);
      })
      .catch(finish);
  });
};

exports.deleteGroup = (req, res) => {
  const { id } = req.params;

  db.query('SELECT is_default FROM `groups` WHERE id = ?', [id], (selErr, rows) => {
    if (selErr) return res.status(500).json({ message: 'Error al obtener grupo' });
    if (rows.length === 0) return res.status(404).json({ message: 'Grupo no encontrado' });
    if (rows[0].is_default) {
      return res.status(400).json({ message: 'No se puede eliminar el grupo principal' });
    }

    db.query('SELECT COUNT(*) AS count FROM tickets WHERE group_id = ?', [id], (cntErr, cntRows) => {
      if (cntErr) return res.status(500).json({ message: 'Error al verificar tickets' });
      if (cntRows[0].count > 0) {
        return res.status(400).json({ message: 'No se puede eliminar un grupo con tickets asignados' });
      }

      db.query('DELETE FROM `groups` WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Error al eliminar grupo' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Grupo no encontrado' });
        res.json({ message: 'Grupo eliminado' });
      });
    });
  });
};
