import { getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL as string;

export const ACCEPTED_FILE_TYPES =
  '.jpg,.jpeg,.png,.gif,.webp,.bmp,.txt,.csv,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z';

export const ACCEPTED_FILE_LABEL =
  'JPEG, PNG, TXT, Word, Excel, PDF, ZIP y otros (máx. 10 MB, hasta 5 archivos)';

export interface TicketAttachment {
  id: number;
  ticket_id: number;
  user_id: number;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by_email?: string | null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fetchTicketAttachments(ticketId: number | string): Promise<TicketAttachment[]> {
  const token = getToken();
  if (!token) return [];

  const response = await fetch(`${API_URL}/tickets/${ticketId}/attachments`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return [];
  const data = await response.json().catch(() => []);
  return Array.isArray(data) ? data : [];
}

export async function uploadTicketAttachments(
  ticketId: number | string,
  files: File[]
): Promise<{ ok: boolean; message?: string; data?: TicketAttachment[] }> {
  const token = getToken();
  if (!token) return { ok: false, message: 'Sesión expirada' };
  if (files.length === 0) return { ok: true, data: [] };

  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(`${API_URL}/tickets/${ticketId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, message: data.message || 'No se pudieron subir los archivos' };
  }

  return { ok: true, message: data.message, data: Array.isArray(data.data) ? data.data : [] };
}

export async function downloadTicketAttachment(ticketId: number | string, attachment: TicketAttachment) {
  const token = getToken();
  if (!token) throw new Error('Sesión expirada');

  const response = await fetch(
    `${API_URL}/tickets/${ticketId}/attachments/${attachment.id}/download`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'No se pudo descargar el archivo');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = attachment.original_name;
  link.click();
  URL.revokeObjectURL(url);
}

export async function deleteTicketAttachment(
  ticketId: number | string,
  attachmentId: number
): Promise<{ ok: boolean; message?: string }> {
  const token = getToken();
  if (!token) return { ok: false, message: 'Sesión expirada' };

  const response = await fetch(`${API_URL}/tickets/${ticketId}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, message: data.message || 'No se pudo eliminar el adjunto' };
  }

  return { ok: true, message: data.message };
}
