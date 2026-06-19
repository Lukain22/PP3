export type UserRole = 'user' | 'admin';

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function getRole(): UserRole {
  return (localStorage.getItem('role') as UserRole) || 'user';
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
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
