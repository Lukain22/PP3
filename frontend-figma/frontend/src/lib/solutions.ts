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
