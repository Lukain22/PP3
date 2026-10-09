import DOMPurify from 'dompurify';
import { getToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL as string;

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3',
  'ul', 'ol', 'li', 'a', 'img', 'span', 'mark', 'blockquote',
  'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'label', 'input', 'div'
];

let hooksReady = false;

function ensureHooks() {
  if (hooksReady) return;
  hooksReady = true;
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'href') {
      const href = data.attrValue.trim();
      if (!/^(https?:|mailto:)/i.test(href)) data.keepAttr = false;
    }
    if (data.attrName === 'src') data.keepAttr = false;
    if (data.attrName === 'style') {
      const kept: string[] = [];
      const style = data.attrValue;
      const color = style.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/i);
      const background = style.match(/(?:^|;)\s*background-color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]+\))/i);
      const align = style.match(/(?:^|;)\s*text-align\s*:\s*(left|center|right|justify)/i);
      const size = style.match(/(?:^|;)\s*font-size\s*:\s*(12|14|16|18|20|24|28)px/i);
      if (color) kept.push(`color: ${color[1]}`);
      if (background) kept.push(`background-color: ${background[1]}`);
      if (align) kept.push(`text-align: ${align[1]}`);
      if (size) kept.push(`font-size: ${size[1]}px`);
      data.attrValue = kept.join('; ');
      if (!data.attrValue) data.keepAttr = false;
    }
    if (node.tagName === 'A' && data.attrName === 'target') data.attrValue = '_blank';
  });
}

export function isRichHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function sanitizeRichHtml(value: string) {
  ensureHooks();
  return DOMPurify.sanitize(value || '', {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'alt', 'style', 'data-attachment-id', 'data-pending',
      'data-type', 'data-checked', 'data-color', 'colspan', 'rowspan', 'start',
      'type', 'checked', 'disabled'
    ],
    ALLOW_DATA_ATTR: true
  });
}

export function htmlForStorage(html: string) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  doc.querySelectorAll('img').forEach((img) => {
    img.removeAttribute('src');
    if (!img.getAttribute('data-attachment-id') && !img.getAttribute('data-pending')) img.remove();
  });
  return doc.body.innerHTML;
}

export function descriptionWithoutPending(html: string) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  doc.querySelectorAll('img[data-pending]').forEach((img) => img.remove());
  return doc.body.innerHTML;
}

export function isDescriptionEmpty(html: string) {
  const text = (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text) return false;
  return !/data-attachment-id="\d+"/.test(html || '') && !/data-pending="[^"]+"/.test(html || '');
}

export function plainTextFromDescription(value: string) {
  if (!value) return '';
  if (!isRichHtml(value)) return value;
  const doc = new DOMParser().parseFromString(value, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}

export async function fetchAttachmentObjectUrl(ticketId: number | string, attachmentId: string) {
  const token = getToken();
  if (!token) return null;
  const response = await fetch(`${API_URL}/tickets/${ticketId}/attachments/${attachmentId}/download`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
