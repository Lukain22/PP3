import { useEffect, useRef } from 'react';
import { Typography } from '@mui/material';
import { fetchAttachmentObjectUrl, isRichHtml, sanitizeRichHtml } from '../../../lib/richText';
import './richText.css';

interface RichTextViewProps {
  value: string;
  ticketId?: number | string;
}

export default function RichTextView({ value, ticketId }: RichTextViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const urls = useRef<string[]>([]);

  useEffect(() => {
    const root = ref.current;
    if (!root || !ticketId) return;
    let cancelled = false;
    root.querySelectorAll('img[data-attachment-id]').forEach((node) => {
      const img = node as HTMLImageElement;
      const attachmentId = img.getAttribute('data-attachment-id');
      if (!attachmentId) return;
      fetchAttachmentObjectUrl(ticketId, attachmentId).then((url) => {
        if (cancelled || !url) return;
        urls.current.push(url);
        img.src = url;
      });
    });
    return () => {
      cancelled = true;
      urls.current.forEach((url) => URL.revokeObjectURL(url));
      urls.current = [];
    };
  }, [value, ticketId]);

  if (!value) {
    return <Typography variant="body2" color="text.secondary">Sin descripción</Typography>;
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
      ref={ref}
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(value) }}
    />
  );
}
