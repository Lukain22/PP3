import { clearAuth, getToken } from './auth';

export const API_URL = import.meta.env.VITE_API_URL as string;

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

function redirectToLogin(): void {
  clearAuth();
  const current = window.history.state as { idx?: number } | null;
  const idx = typeof current?.idx === 'number' ? current.idx + 1 : 0;
  const key = Math.random().toString(36).substring(2, 10);
  window.history.pushState({ usr: null, key, idx }, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

export type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  redirectOn401?: boolean;
};

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { auth = true, redirectOn401 = true, ...request } = options;
  const headers = new Headers(request.headers);
  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  if (!(request.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), { ...request, headers });

  if (auth && redirectOn401 && response.status === 401) {
    redirectToLogin();
  }

  return response;
}

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : '';
    throw new Error(message);
  }
  return body as T;
}

function withJsonBody(body: unknown, options?: RequestInit): RequestInit {
  if (body === undefined) return options ?? {};
  if (
    typeof body === 'string' ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer
  ) {
    return { ...options, body };
  }
  return { ...options, body: JSON.stringify(body) };
}

export function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch(path, { ...options, method: 'GET' }).then(readJson<T>);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return apiFetch(path, { ...withJsonBody(body, options), method: 'POST' }).then(readJson<T>);
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return apiFetch(path, { ...withJsonBody(body, options), method: 'PUT' }).then(readJson<T>);
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
  return apiFetch(path, { ...withJsonBody(body, options), method: 'PATCH' }).then(readJson<T>);
}

export function apiDelete<T>(path: string, options?: RequestInit): Promise<T> {
  return apiFetch(path, { ...options, method: 'DELETE' }).then(readJson<T>);
}
