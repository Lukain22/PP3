export type UserRole = 'user' | 'admin' | 'technician';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getRole(): UserRole {
  return (localStorage.getItem('role') as UserRole) || 'user';
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}

export function isTechnician(): boolean {
  return getRole() === 'technician';
}

export function isStaff(): boolean {
  const role = getRole();
  return role === 'admin' || role === 'technician';
}

export function setAuth(token: string, role: UserRole): void {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
}

export function clearAuth(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('rbac');
}

export function getEmail(): string {
  const token = getToken();
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || '';
  } catch {
    return '';
  }
}

export function getHomePath(): string {
  const role = getRole();
  if (role === 'admin' || role === 'technician') {
    return '/tickets';
  }
  return '/dashboard';
}

export function getRoleLabel(role?: UserRole): string {
  const current = role ?? getRole();
  switch (current) {
    case 'admin':
      return 'Admin';
    case 'technician':
      return 'Técnico';
    default:
      return 'Usuario';
  }
}

export function getUserInitials(email?: string): string {
  const value = (email ?? getEmail()).trim();
  if (!value) return '?';

  const localPart = value.split('@')[0] || value;
  const parts = localPart.split(/[._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return localPart.slice(0, 2).toUpperCase();
}

export interface AccessPermission {
  code: string;
  name: string;
  module: string;
  module_label: string;
  description?: string | null;
}

export interface AccessSnapshot {
  is_superuser: boolean;
  account_role: string;
  roles: { id: number; name: string; code: string; is_active?: boolean }[];
  permissions: AccessPermission[];
  scopes: Record<string, { all: boolean; allow: number[]; deny: number[] }>;
}

const ACCESS_KEY = 'rbac';

export function getAccess(): AccessSnapshot | null {
  const raw = localStorage.getItem(ACCESS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AccessSnapshot;
  } catch {
    return null;
  }
}

export function setAccess(access: AccessSnapshot): void {
  localStorage.setItem(ACCESS_KEY, JSON.stringify(access));
}

export function can(code: string): boolean {
  const access = getAccess();
  if (!access) return getRole() === 'admin';
  if (access.is_superuser) return true;
  return access.permissions.some((item) => item.code === code);
}

export function canTransferToGroup(groupId: number): boolean {
  if (!can('assignments.transfer')) return false;
  const scope = getAccess()?.scopes?.['assignments.transfer'];
  if (!scope || scope.all) return true;
  if (scope.deny.includes(groupId)) return false;
  if (scope.allow.length === 0 && scope.deny.length === 0) return true;
  return scope.allow.includes(groupId);
}

export function getUserId(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id ?? null;
  } catch {
    return null;
  }
}

export async function refreshAccess(): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL as string}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.status === 401) {
      clearAuth();
      return;
    }
    if (!response.ok) return;
    const data = await response.json();
    setAccess({
      is_superuser: Boolean(data.is_superuser),
      account_role: data.account_role || getRole(),
      roles: Array.isArray(data.roles) ? data.roles : [],
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      scopes: data.scopes || {}
    });
    if (data.account_role) localStorage.setItem('role', data.account_role);
  } catch {
    // La sesión anterior sigue usable hasta el próximo intento.
  }
}
