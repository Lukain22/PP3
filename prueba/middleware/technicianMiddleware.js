module.exports = (req, res, next) => {
  const role = req.user?.role;
  if (role !== 'admin' && role !== 'technician') {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol técnico o admin' });
  }
  next();
};
