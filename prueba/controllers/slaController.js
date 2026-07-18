const db = require('../db/db');
const { clearPolicyCache } = require('../utils/sla');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

exports.getSlaPolicies = (req, res) => {
  db.query(
    `SELECT priority, response_hours, resolution_hours
     FROM sla_policies
     ORDER BY FIELD(priority, 'high', 'medium', 'low')`,
    (err, rows) => {
      if (err) {
        console.error('Error en getSlaPolicies:', err.code);
        return res.status(500).json({ message: 'Error al obtener políticas SLA' });
      }
      res.json(rows);
    }
  );
};

exports.updateSlaPolicies = (req, res) => {
  const { policies } = req.body;

  if (!Array.isArray(policies) || policies.length === 0) {
    return res.status(400).json({ message: 'Se requiere un arreglo de políticas' });
  }

  for (const policy of policies) {
    if (!VALID_PRIORITIES.includes(policy.priority)) {
      return res.status(400).json({ message: `Prioridad inválida: ${policy.priority}` });
    }
    const responseHours = Number(policy.response_hours);
    const resolutionHours = Number(policy.resolution_hours);
    if (!Number.isFinite(responseHours) || responseHours < 1 || responseHours > 720) {
      return res.status(400).json({ message: 'Horas de respuesta inválidas (1–720)' });
    }
    if (!Number.isFinite(resolutionHours) || resolutionHours < 1 || resolutionHours > 720) {
      return res.status(400).json({ message: 'Horas de resolución inválidas (1–720)' });
    }
    if (resolutionHours < responseHours) {
      return res.status(400).json({ message: 'La resolución debe ser mayor o igual que la respuesta' });
    }
  }

  let index = 0;

  const updateNext = () => {
    if (index >= policies.length) {
      clearPolicyCache();
      return res.json({ message: 'Políticas SLA actualizadas' });
    }

    const policy = policies[index];
    db.query(
      'UPDATE sla_policies SET response_hours = ?, resolution_hours = ? WHERE priority = ?',
      [Number(policy.response_hours), Number(policy.resolution_hours), policy.priority],
      (err) => {
        if (err) {
          console.error('Error en updateSlaPolicies:', err.code);
          return res.status(500).json({ message: 'Error al actualizar políticas SLA' });
        }
        index += 1;
        updateNext();
      }
    );
  };

  updateNext();
};
