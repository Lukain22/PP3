export const CATEGORIES = [
  'Hardware',
  'Software',
  'Red / Conectividad',
  'Acceso / Cuentas',
  'Otro'
] as const;

export type Category = typeof CATEGORIES[number];

export const SUBCATEGORIES: Record<Category, string[]> = {
  'Hardware':           ['Computadora / Notebook', 'Impresora', 'Proyector', 'Periféricos', 'Otro'],
  'Software':           ['Sistema operativo', 'Aplicaciones', 'Correo electrónico', 'Antivirus', 'Otro'],
  'Red / Conectividad': ['Internet', 'Wi-Fi', 'Red local', 'VPN', 'Otro'],
  'Acceso / Cuentas':   ['Contraseña olvidada', 'Permisos', 'Usuario nuevo', 'Campus virtual', 'Otro'],
  'Otro':               ['Consulta general', 'Otro']
};
