import { getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL as string;

export interface SolutionGroup {
  id: number;
  name: string;
}

export interface SolutionRecord {
  id: number;
  title: string;
  content: string;
  category: string | null;
  subcategory: string | null;
  tags: string | null;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  share_all: boolean | number;
  use_count: number;
  created_by_email?: string;
  updated_by_email?: string | null;
  approved_by_email?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  groups: SolutionGroup[];
}

export interface SolutionSearchHit {
  id: number;
  title: string;
  content: string;
  category: string | null;
  subcategory: string | null;
  tags: string | null;
  share_all: boolean;
  use_count: number;
  groups: SolutionGroup[];
}

export function solutionSummary(value: string, max = 180) {
  const text = (value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Sin contenido';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function solutionToPlainText(value: string) {
  if (!value) return '';
  if (!/<[a-z][\s\S]*>/i.test(value)) return value.trim();
  const withBreaks = value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-3]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/tr>/gi, '\n');
  const doc = new DOMParser().parseFromString(withBreaks, 'text/html');
  return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}

export async function uploadSolutionImage(solutionId: number | string, file: File) {
  const token = getToken();
  if (!token) return { ok: false as const, message: 'Sesión expirada' };
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/admin/solutions/${solutionId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const data = await response.json().catch(() => ({}));
  const id = data.data?.[0]?.id;
  if (!response.ok || !id) {
    return { ok: false as const, message: data.message || 'No se pudo guardar la imagen' };
  }
  return { ok: true as const, id: String(id) };
}

export async function fetchSolutionImageUrl(solutionId: number | string, attachmentId: string) {
  const token = getToken();
  if (!token) return null;
  const response = await fetch(
    `${API_URL}/admin/solutions/${solutionId}/attachments/${attachmentId}/download`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!response.ok) return null;
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
