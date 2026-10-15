import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { fetchAttachmentObjectUrl, isRichHtml, sanitizeRichHtml } from '../../../lib/richText';
import './richText.css';

interface RichTextViewProps {
  value: string;
  ticketId?: number | string;
  emptyLabel?: string;
  resolveImageUrl?: (attachmentId: string) => Promise<string | null>;
}

export default function RichTextView({ value, ticketId, emptyLabel = 'Sin descripción', resolveImageUrl }: RichTextViewProps) {
  const baseHtml = value && isRichHtml(value) ? sanitizeRichHtml(value) : '';
  const [html, setHtml] = useState(baseHtml);

  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    setHtml(baseHtml);
    const loadUrl = resolveImageUrl
      ? resolveImageUrl
      : ticketId
        ? (attachmentId: string) => fetchAttachmentObjectUrl(ticketId, attachmentId)
        : null;
    const ids = [...new Set([...baseHtml.matchAll(/data-attachment-id="(\d+)"/g)].map((match) => match[1]))];
    if (!loadUrl || ids.length === 0) return;
    Promise.all(ids.map(async (id) => [id, await loadUrl(id)] as const)).then((pairs) => {
      if (cancelled) {
        pairs.forEach(([, url]) => { if (url) URL.revokeObjectURL(url); });
        return;
      }
      let next = baseHtml;
      pairs.forEach(([id, url]) => {
        if (!url) return;
        created.push(url);
        next = next.split(`data-attachment-id="${id}"`).join(`data-attachment-id="${id}" src="${url}"`);
      });
      setHtml(next);
    });
    return () => {
      cancelled = true;
      created.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [baseHtml, ticketId, resolveImageUrl]);

  if (!value) {
    return <Typography variant="body2" color="text.secondary">{emptyLabel}</Typography>;
  }

  if (!isRichHtml(value)) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    );
  }

  return (
    <div
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
