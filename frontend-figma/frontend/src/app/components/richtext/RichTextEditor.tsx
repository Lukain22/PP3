import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Box, IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ChecklistIcon from '@mui/icons-material/Checklist';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import TableChartIcon from '@mui/icons-material/TableChart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Extension } from '@tiptap/core';
import { toast } from 'sonner';
import { MAX_ATTACHMENT_BYTES, uploadTicketAttachments } from '../../../lib/attachments';
import { fetchAttachmentObjectUrl, htmlForStorage } from '../../../lib/richText';
import './richText.css';

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px'];

const FontSize = Extension.create({
  name: 'fontSize',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize || null,
          renderHTML: (attributes) => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          }
        }
      }
    }];
  }
});

const InlineImage = Image.extend({
  addAttributes() {
    return {
      ...(this.parent?.() || {}),
      attachmentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-attachment-id'),
        renderHTML: (attributes) => (
          attributes.attachmentId ? { 'data-attachment-id': attributes.attachmentId } : {}
        )
      },
      pendingId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-pending'),
        renderHTML: (attributes) => (
          attributes.pendingId ? { 'data-pending': attributes.pendingId } : {}
        )
      }
    };
  }
});

export interface RichTextEditorHandle {
  hasPendingImages: () => boolean;
  flushPendingImages: (ticketId: number | string) => Promise<{ ok: boolean; html: string }>;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  ticketId?: number | string;
  placeholder?: string;
  bounded?: boolean;
}

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);

function imageFileFromClipboard(file: File) {
  const type = file.type || 'image/png';
  const ext = (type.split('/')[1] || 'png').replace('jpeg', 'jpg');
  if (!IMAGE_EXTENSIONS.has(ext) || file.size > MAX_ATTACHMENT_BYTES) return null;
  const name = file.name && file.name.includes('.') ? file.name : `captura-${Date.now()}.${ext}`;
  return new File([file], name, { type });
}

function collectImageFiles(data: DataTransfer | null) {
  if (!data) return [];
  const files: File[] = [];
  Array.from(data.items || []).forEach((item) => {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      const image = file ? imageFileFromClipboard(file) : null;
      if (image) files.push(image);
    }
  });
  if (files.length === 0) {
    Array.from(data.files || []).forEach((file) => {
      const image = imageFileFromClipboard(file);
      if (image) files.push(image);
    });
  }
  return files;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({
  value,
  onChange,
  ticketId,
  placeholder = 'Describí el problema. Podés pegar capturas con Ctrl + V.',
  bounded = false
}, ref) {
  const filesRef = useRef(new Map<string, File>());
  const lastHtml = useRef(value);
  const urls = useRef<string[]>([]);
  const insertImageRef = useRef<(file: File) => void>(() => {});
  const hydrateRef = useRef<(current: Editor) => void>(() => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      InlineImage.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: value || '',
    editorProps: {
      handlePaste: (_view, event) => {
        const hasImage = Array.from(event.clipboardData?.items || []).some((item) => item.type.startsWith('image/'));
        const files = collectImageFiles(event.clipboardData);
        if (hasImage && files.length === 0) {
          event.preventDefault();
          toast.error('La imagen debe ser PNG, JPG, GIF, WEBP o BMP y pesar menos de 4 MB');
          return true;
        }
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((file) => insertImageRef.current(file));
        return true;
      },
      handleClick: (_view, _pos, event) => {
        if (!event.ctrlKey && !event.metaKey) return false;
        const target = event.target;
        const anchor = target instanceof Element ? target.closest('a') : null;
        const href = anchor?.getAttribute('href');
        if (!href) return false;
        window.open(href, '_blank', 'noopener,noreferrer');
        return true;
      },
      handleDrop: (_view, event) => {
        const files = collectImageFiles(event.dataTransfer);
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach((file) => insertImageRef.current(file));
        return true;
      }
    },
    onCreate: ({ editor: current }) => {
      hydrateRef.current(current);
    },
    onUpdate: ({ editor: current }) => {
      const stored = htmlForStorage(current.getHTML());
      lastHtml.current = stored;
      onChange(stored);
      hydrateRef.current(current);
    }
  });

  insertImageRef.current = async (file: File) => {
    if (!editor) return;
    if (ticketId) {
      const uploaded = await uploadTicketAttachments(ticketId, [file], { inline: true });
      const attachment = uploaded.data?.[0];
      if (!uploaded.ok || !attachment) {
        toast.error(uploaded.message || 'No se pudo guardar la imagen');
        return;
      }
      const url = await fetchAttachmentObjectUrl(ticketId, String(attachment.id));
      if (url) urls.current.push(url);
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: { src: url || '', attachmentId: String(attachment.id) }
      }).run();
      return;
    }
    const pendingId = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    filesRef.current.set(pendingId, file);
    editor.chain().focus().insertContent({
      type: 'image',
      attrs: { src: url, pendingId }
    }).run();
  };

  hydrateRef.current = (current: Editor) => {
    if (!ticketId) return;
    current.view.dom.querySelectorAll('img[data-attachment-id]').forEach((node) => {
      const img = node as HTMLImageElement;
      const attachmentId = img.getAttribute('data-attachment-id');
      if (!attachmentId || img.getAttribute('data-hydrated') === attachmentId) return;
      img.setAttribute('data-hydrated', attachmentId);
      fetchAttachmentObjectUrl(ticketId, attachmentId).then((url) => {
        if (!url) return;
        urls.current.push(url);
        img.src = url;
      });
    });
  };

  useEffect(() => {
    if (editor) hydrateRef.current(editor);
  }, [editor, ticketId]);

  useEffect(() => {
    if (!editor) return;
    if (value !== lastHtml.current) {
      editor.commands.setContent(value || '', false);
      lastHtml.current = value;
      hydrateRef.current(editor);
    }
  }, [value, editor]);

  useEffect(() => () => {
    urls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useImperativeHandle(ref, () => ({
    hasPendingImages: () => filesRef.current.size > 0,
    flushPendingImages: async (nextTicketId) => {
      if (!editor) return { ok: false, html: value };
      const pending: { pos: number; pendingId: string; file: File }[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'image' || !node.attrs.pendingId) return;
        const file = filesRef.current.get(node.attrs.pendingId);
        if (file) pending.push({ pos, pendingId: node.attrs.pendingId, file });
      });

      for (const item of [...pending].reverse()) {
        const uploaded = await uploadTicketAttachments(nextTicketId, [item.file], { inline: true });
        const attachment = uploaded.data?.[0];
        if (!uploaded.ok || !attachment) return { ok: false, html: htmlForStorage(editor.getHTML()) };
        const node = editor.state.doc.nodeAt(item.pos);
        if (!node) continue;
        const tr = editor.state.tr.setNodeMarkup(item.pos, undefined, {
          ...node.attrs,
          src: '',
          pendingId: null,
          attachmentId: String(attachment.id)
        });
        editor.view.dispatch(tr);
        filesRef.current.delete(item.pendingId);
      }

      const html = htmlForStorage(editor.getHTML());
      lastHtml.current = html;
      onChange(html);
      return { ok: true, html };
    }
  }), [editor, value]);

  if (!editor) return null;

  const mark = (active: boolean) => active ? 'primary.main' : 'text.secondary';
  const run = (action: () => void) => () => action();

  return (
    <Box
      className={bounded ? 'rich-text-shell is-bounded' : 'rich-text-shell'}
      sx={bounded ? { flex: 1, minHeight: 0 } : undefined}
    >
      <Box className="rich-text-toolbar">
        <Tooltip title="Negrita"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleBold().run())} sx={{ color: mark(editor.isActive('bold')) }}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Cursiva"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleItalic().run())} sx={{ color: mark(editor.isActive('italic')) }}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Subrayado"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleUnderline().run())} sx={{ color: mark(editor.isActive('underline')) }}><FormatUnderlinedIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Tachado"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleStrike().run())} sx={{ color: mark(editor.isActive('strike')) }}><StrikethroughSIcon fontSize="small" /></IconButton></Tooltip>
        <Select
          size="small"
          value={editor.getAttributes('textStyle').fontSize || ''}
          displayEmpty
          onChange={(e) => {
            const size = e.target.value;
            if (!size) editor.chain().focus().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
            else editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
          }}
          sx={{ minWidth: 88, mx: 0.5, '& .MuiSelect-select': { py: 0.4, fontSize: '0.8rem' } }}
        >
          <MenuItem value="">Tamaño</MenuItem>
          {FONT_SIZES.map((size) => <MenuItem key={size} value={size}>{size.replace('px', '')}</MenuItem>)}
        </Select>
        <Tooltip title="Color de texto">
          <Box component="label" sx={{ display: 'inline-flex', alignItems: 'center', px: 0.5, cursor: 'pointer' }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: editor.getAttributes('textStyle').color || '#212121', border: '1px solid', borderColor: 'divider' }} />
            <input
              type="color"
              aria-label="Color de texto"
              value={/^#[0-9a-f]{6}$/i.test(editor.getAttributes('textStyle').color || '') ? editor.getAttributes('textStyle').color : '#212121'}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            />
          </Box>
        </Tooltip>
        <Tooltip title="Resaltado">
          <Box component="label" sx={{ display: 'inline-flex', alignItems: 'center', px: 0.5, cursor: 'pointer' }}>
            <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: '#fff59d', border: '1px solid', borderColor: 'divider' }} />
            <input
              type="color"
              aria-label="Color de resaltado"
              defaultValue="#fff59d"
              onChange={(e) => editor.chain().focus().setHighlight({ color: e.target.value }).run()}
              style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }}
            />
          </Box>
        </Tooltip>
        <Tooltip title="Título 1"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())} sx={{ color: mark(editor.isActive('heading', { level: 1 })), fontSize: 13, fontWeight: 700 }}>H1</IconButton></Tooltip>
        <Tooltip title="Título 2"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} sx={{ color: mark(editor.isActive('heading', { level: 2 })), fontSize: 13, fontWeight: 700 }}>H2</IconButton></Tooltip>
        <Tooltip title="Título 3"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} sx={{ color: mark(editor.isActive('heading', { level: 3 })), fontSize: 13, fontWeight: 700 }}>H3</IconButton></Tooltip>
        <Tooltip title="Viñetas"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleBulletList().run())} sx={{ color: mark(editor.isActive('bulletList')) }}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Numerada"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleOrderedList().run())} sx={{ color: mark(editor.isActive('orderedList')) }}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Checklist"><IconButton size="small" onClick={run(() => editor.chain().focus().toggleTaskList().run())} sx={{ color: mark(editor.isActive('taskList')) }}><ChecklistIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Izquierda"><IconButton size="small" onClick={run(() => editor.chain().focus().setTextAlign('left').run())}><FormatAlignLeftIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Centro"><IconButton size="small" onClick={run(() => editor.chain().focus().setTextAlign('center').run())}><FormatAlignCenterIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Derecha"><IconButton size="small" onClick={run(() => editor.chain().focus().setTextAlign('right').run())}><FormatAlignRightIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Justificado"><IconButton size="small" onClick={run(() => editor.chain().focus().setTextAlign('justify').run())}><FormatAlignJustifyIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Enlace"><IconButton size="small" onClick={run(() => {
          const previous = editor.getAttributes('link').href || '';
          const href = window.prompt('Dirección del enlace', previous);
          if (href === null) return;
          if (!href.trim()) {
            editor.chain().focus().unsetLink().run();
            return;
          }
          const safe = /^(https?:|mailto:)/i.test(href.trim()) ? href.trim() : `https://${href.trim()}`;
          editor.chain().focus().extendMarkRange('link').setLink({ href: safe }).run();
        })} sx={{ color: mark(editor.isActive('link')) }}><LinkIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Quitar enlace"><IconButton size="small" onClick={run(() => editor.chain().focus().unsetLink().run())}><LinkOffIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Insertar tabla"><IconButton size="small" onClick={run(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}><TableChartIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Eliminar tabla"><IconButton size="small" onClick={run(() => editor.chain().focus().deleteTable().run())}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
      <Box className="rich-text-scroll">
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
});

export default RichTextEditor;
