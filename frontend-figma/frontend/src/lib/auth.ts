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
