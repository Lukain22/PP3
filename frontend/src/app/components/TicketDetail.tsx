import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  TextField,
  MenuItem,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { toast } from 'sonner';
import StatusBadge from './StatusBadge';
import SupportShell from './SupportShell';
import {
  getToken,
  isAdmin,
  isTechnician,
  getEmail,
  getHomePath,
  getUserId,
  can,
  canActOnOthers
} from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import { CATEGORIES, SUBCATEGORIES, type Category } from '../../lib/categories';
import { TICKET_TYPE_OPTIONS, HISTORY_FIELD_LABELS, formatHistoryValue } from '../../lib/ticketTypes';
import { formatSlaDeadline, isIncident } from '../../lib/sla';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';
import TicketAttachments from './TicketAttachments';
import InlineEditSelect from './InlineEditSelect';
import SearchableSelect from './SearchableSelect';
import RichTextEditor, { type RichTextEditorHandle } from './richtext/RichTextEditor';
import RichTextView from './richtext/RichTextView';
import TicketSolutions from './TicketSolutions';
import ResolveTicketDialog from './ResolveTicketDialog';
import { appendPlainTextToHtml, appendRichHtml, isDescriptionEmpty, isRichHtml } from '../../lib/richText';
import { uploadTicketAttachments } from '../../lib/attachments';
import type { Comment, Group, Ticket, TicketHistoryEntry } from '../../types/domain';

type TicketEditField =
  | 'title'
  | 'description'
  | 'type'
  | 'status'
  | 'priority'
  | 'category'
  | 'subcategory'
  | 'group'
  | 'technician';

interface TechnicianOption {
  id: number;
  email: string;
}

interface TicketFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  category: string;
  subcategory: string;
  group_id: number | '';
  technician_id: number | '';
}

interface Resolution {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  resolved_by: number;
  resolved_by_email: string;
}

function ticketToFormData(ticket: Ticket): TicketFormData {
  return {
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority || 'medium',
    type: ticket.type || 'incident',
    category: ticket.category || '',
    subcategory: ticket.subcategory || '',
    group_id: ticket.group_id ?? '',
    technician_id: ticket.technician_id ?? ''
  };
}

interface HistoryGroup {
  key: string;
  email: string;
  created_at: string;
  entries: TicketHistoryEntry[];
}

function groupHistoryByMoment(entries: TicketHistoryEntry[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];

  const momentKey = (entry: TicketHistoryEntry) => {
    const ts = Math.floor(new Date(entry.created_at).getTime() / 1000);
    return `${entry.email}|${ts}`;
  };

  for (const entry of entries) {
    const key = momentKey(entry);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.entries.push(entry);
    } else {
      groups.push({ key, email: entry.email, created_at: entry.created_at, entries: [entry] });
    }
  }

  return groups;
}

function HistoryGroupCard({
  group,
  formatDateTime,
  formatHistoryEntry
}: {
  group: HistoryGroup;
  formatDateTime: (date: string) => string;
  formatHistoryEntry: (entry: TicketHistoryEntry) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
      <Box
        onClick={() => setExpanded((prev) => !prev)}
        sx={{
          cursor: 'pointer',
          borderRadius: 1,
          mx: -0.5,
          px: 0.5,
          '&:hover': { bgcolor: 'action.hover' }
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mb: expanded ? 0.75 : 0 }}
        >
          <Box component="span" sx={{ fontWeight: 700 }}>
            Por:
          </Box>{' '}
          {group.email}
          {' · '}
          <Box component="span" sx={{ fontWeight: 700 }}>
            {formatDateTime(group.created_at)}
          </Box>
        </Typography>
      </Box>
      {expanded && (
        <Stack spacing={0.5}>
          {group.entries.map((entry) => (
            <Typography key={entry.id} variant="body2">
              {formatHistoryEntry(entry)}
            </Typography>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function CommentCard({
  comment,
  ticketId,
  formatDateTime,
  admin,
  isEditing,
  editingText,
  busy,
  onStartEdit,
  onDelete,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  canAttach
}: {
  comment: Comment;
  ticketId: string;
  formatDateTime: (date: string) => string;
  admin: boolean;
  isEditing: boolean;
  editingText: string;
  busy: boolean;
  onStartEdit: () => void;
  onDelete: () => void;
  onEditTextChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  canAttach: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const showContent = expanded || isEditing;

  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box
          onClick={() => {
            if (!isEditing) setExpanded((prev) => !prev);
          }}
          sx={{
            flex: 1,
            cursor: isEditing ? 'default' : 'pointer',
            borderRadius: 1,
            mx: -0.5,
            px: 0.5,
            ...(!isEditing && { '&:hover': { bgcolor: 'action.hover' } })
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mb: showContent ? 0.75 : 0 }}
          >
            <Box component="span" sx={{ fontWeight: 700 }}>
              Por:
            </Box>{' '}
            {comment.email}
            {' · '}
            <Box component="span" sx={{ fontWeight: 700 }}>
              {formatDateTime(comment.created_at)}
            </Box>
          </Typography>
        </Box>
        {admin && !isEditing && showContent && (
          <Stack direction="row" spacing={0.25} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Editar">
              <IconButton size="small" disabled={busy} onClick={onStartEdit}>
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton size="small" color="error" disabled={busy} onClick={onDelete}>
                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>
      {showContent &&
        (isEditing ? (
          <Stack spacing={1}>
            <RichTextEditor
              value={editingText}
              onChange={onEditTextChange}
              ticketId={ticketId}
              attachmentContext="comment"
              commentId={comment.id}
              placeholder="Editá la nota. Podés pegar capturas con Ctrl + V."
            />
            <TicketAttachments ticketId={ticketId} scope="comment" commentId={comment.id} />
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                disabled={busy || isDescriptionEmpty(editingText)}
                onClick={onSaveEdit}
              >
                Guardar
              </Button>
              <Button size="small" variant="text" onClick={onCancelEdit}>
                Cancelar
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <RichTextView value={comment.content} ticketId={ticketId} emptyLabel="Sin nota" />
            <TicketAttachments
              ticketId={ticketId}
              scope="comment"
              commentId={comment.id}
              hideWhenEmpty={!canAttach}
            />
          </Stack>
        ))}
    </Box>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const admin = isAdmin();
  const technician = isTechnician();
  const staff = admin || technician;
  const canEditTickets = can('tickets.edit');
  const canTransfer = can('assignments.transfer');
  const canAssign = can('assignments.self') || can('assignments.others');
  const canComment = can('tickets.comment');
  const canResolve = can('tickets.resolve');
  const canReopen = can('tickets.reopen');
  const canModerateComments = can('tickets.edit') && can('admin.access');
  const homePath = getHomePath();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const isOwner = !ticket || Number(ticket.user_id) === getUserId();
  const canCommentHere = staff || isOwner ? canComment : canActOnOthers('tickets.comment');
  const canAttachHere = staff || isOwner ? can('tickets.attach') : canActOnOthers('tickets.attach');
  const canEditThis = staff || isOwner || canActOnOthers('tickets.edit');
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<TicketHistoryEntry[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionSection, setResolutionSection] = useState<'resolution' | 'solutions'>('resolution');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveInitial, setResolveInitial] = useState('');
  const [reopening, setReopening] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [cancelEditPrompt, setCancelEditPrompt] = useState(false);
  const [editFocus, setEditFocus] = useState<TicketEditField | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const resolutionEditorRef = useRef<RichTextEditorHandle>(null);
  const commentEditorRef = useRef<RichTextEditorHandle>(null);
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);
  const [fieldBusy, setFieldBusy] = useState<string | null>(null);
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    type: 'incident',
    category: '',
    subcategory: '',
    group_id: '',
    technician_id: ''
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupTechnicians, setGroupTechnicians] = useState<TechnicianOption[]>([]);

  useEffect(() => {
    if (!editing || editFocus !== 'description') return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (editorRef.current?.focus() || tries > 12) window.clearInterval(timer);
    }, 50);
    return () => window.clearInterval(timer);
  }, [editing, editFocus]);

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) {
      navigate('/');
      return null;
    }

    const response = await apiFetch(path, options);

    if (response.status === 401) {
      return null;
    }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const loadTicket = async () => {
    const result = await apiCall(admin ? `/admin/tickets/${id}` : `/tickets/${id}`);
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'Ticket no encontrado');
      navigate(homePath);
      return;
    }
    setTicket(result.data);
    setFormData(ticketToFormData(result.data));
  };

  const loadComments = async () => {
    const result = await apiCall(`/tickets/${id}/comments`);
    if (!result) return;
    if (result.response.ok) {
      setComments(Array.isArray(result.data) ? result.data : []);
    }
  };

  const loadHistory = async () => {
    const result = await apiCall(admin ? `/admin/tickets/${id}/history` : `/tickets/${id}/history`);
    if (!result) return;
    if (result.response.ok) {
      setHistory(Array.isArray(result.data) ? result.data : []);
    }
  };

  const loadResolution = async () => {
    const result = await apiCall(`/tickets/${id}/resolution`);
    if (!result) return;
    if (result.response.ok) {
      const data = result.data as Resolution | null;
      setResolution(data);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      navigate('/');
      return;
    }
    Promise.all([loadTicket(), loadComments(), loadHistory(), loadResolution()]).finally(() =>
      setLoading(false)
    );
  }, [id]);

  useEffect(() => {
    if (!canTransfer) return;
    apiCall('/tickets/transfer-groups').then((result) => {
      if (result?.response.ok) {
        setGroups(Array.isArray(result.data) ? result.data : []);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!canAssign) return;
    const groupId = editing ? formData.group_id : ticket?.group_id;
    if (!groupId) {
      setGroupTechnicians([]);
      return;
    }
    let cancelled = false;
    setGroupTechnicians([]);
    apiCall(`/tickets/assignees?group_id=${groupId}`).then((result) => {
      if (cancelled || !result?.response.ok) return;
      setGroupTechnicians(Array.isArray(result.data) ? result.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [canAssign, editing, formData.group_id, ticket?.group_id]);

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const formatHistoryEntry = (entry: TicketHistoryEntry) => {
    if (entry.action === 'created') {
      const field = entry.field_name ? HISTORY_FIELD_LABELS[entry.field_name] || entry.field_name : null;
      if (field) {
        return `Creación · ${field}: ${formatHistoryValue(entry.field_name, entry.new_value)}`;
      }
      return 'Ticket creado';
    }
    const field = entry.field_name ? HISTORY_FIELD_LABELS[entry.field_name] || entry.field_name : 'Campo';
    const oldVal = formatHistoryValue(entry.field_name, entry.old_value);
    const newVal = formatHistoryValue(entry.field_name, entry.new_value);
    if (entry.field_name === 'resolution' && !entry.old_value) {
      return `${field}: ${newVal}`;
    }
    return `${field}: ${oldVal} → ${newVal}`;
  };

  const handleCancelEdit = () => {
    if (ticket) setFormData(ticketToFormData(ticket));
    setEditFocus(null);
    setEditing(false);
    setCancelEditPrompt(false);
  };

  const beginEdit = (field?: TicketEditField) => {
    if (ticket) setFormData(ticketToFormData(ticket));
    setEditFocus(field ?? (admin || !staff ? 'title' : 'status'));
    setActiveTab(0);
    setEditing(true);
  };

  const handleSave = async () => {
    const sendsDescription = admin || !staff;
    if (!formData.title.trim() || (sendsDescription && isDescriptionEmpty(formData.description))) {
      toast.error('Título y descripción son requeridos');
      return;
    }

    let description = formData.description;
    if (sendsDescription && id && editorRef.current?.hasPendingImages()) {
      const flushed = await editorRef.current.flushPendingImages(id);
      if (!flushed.ok) {
        toast.error('No se pudieron guardar las imágenes pegadas');
        return;
      }
      description = flushed.html;
    }

    setSaving(true);
    try {
      const basePayload = {
        title: formData.title,
        description,
        status: formData.status,
        type: formData.type,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        group_id: formData.group_id || null,
        technician_id: formData.technician_id || null
      };

      const classification = {
        status: formData.status,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        ...(isIncident(formData.type) ? { priority: formData.priority } : { priority: null }),
        ...(canTransfer ? { group_id: formData.group_id || null } : {}),
        ...(canAssign ? { technician_id: formData.technician_id || null } : {})
      };

      const payload = admin
        ? isIncident(formData.type)
          ? { ...basePayload, priority: formData.priority }
          : basePayload
        : staff
          ? classification
          : {
              title: formData.title,
              description
            };

      const result = await apiCall(admin ? `/admin/tickets/${id}` : `/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar');
        return;
      }

      toast.success('Ticket actualizado');
      setEditFocus(null);
      setEditing(false);
      await Promise.all([loadTicket(), loadHistory()]);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineFieldUpdate = async (payload: Record<string, unknown>, fieldKey: string) => {
    setFieldBusy(fieldKey);
    try {
      const result = await apiCall(admin ? `/admin/tickets/${id}` : `/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo actualizar');
        return;
      }
      toast.success('Actualizado');
      await Promise.all([loadTicket(), loadHistory()]);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setFieldBusy(null);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (isDescriptionEmpty(editingCommentText)) return;
    setBusyCommentId(commentId);
    try {
      const result = await apiCall(`/admin/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editingCommentText })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo editar');
        return;
      }
      toast.success('Comentario actualizado');
      setEditingCommentId(null);
      await loadComments();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyCommentId(null);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('¿Eliminar este comentario?')) return;
    setBusyCommentId(commentId);
    try {
      const result = await apiCall(`/admin/comments/${commentId}`, { method: 'DELETE' });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo eliminar');
        return;
      }
      toast.success('Comentario eliminado');
      await loadComments();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyCommentId(null);
    }
  };

  const openResolveDialog = async () => {
    let content = resolutionText;
    if (id && resolutionEditorRef.current?.hasPendingImages()) {
      const flushed = await resolutionEditorRef.current.flushPendingImages(id, { context: 'resolution' });
      if (!flushed.ok) {
        toast.error('No se pudieron guardar las imágenes pegadas');
        return;
      }
      content = flushed.html;
      setResolutionText(content);
    }
    setResolveInitial(content);
    setResolveOpen(true);
  };

  const prepareResolveExtra = async () => {
    if (!editing || !(admin || !staff)) return {};
    if (!formData.title.trim() || isDescriptionEmpty(formData.description)) {
      toast.error('Título y descripción son requeridos');
      return null;
    }
    let description = formData.description;
    if (id && editorRef.current?.hasPendingImages()) {
      const flushed = await editorRef.current.flushPendingImages(id);
      if (!flushed.ok) {
        toast.error('No se pudieron guardar las imágenes pegadas');
        return null;
      }
      description = flushed.html;
    }
    return { title: formData.title.trim(), description };
  };

  const handleReopen = async () => {
    setReopening(true);
    try {
      const result = await apiCall(admin ? `/admin/tickets/${id}` : `/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'open' })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo reabrir la solicitud');
        return;
      }
      toast.success('Solicitud reabierta');
      setResolution(null);
      setResolutionText('');
      await Promise.all([loadTicket(), loadHistory(), loadResolution()]);
      setFormData((prev) => ({ ...prev, status: 'open' }));
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setReopening(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (isDescriptionEmpty(commentText) && commentFiles.length === 0) return;
    setPostingComment(true);
    try {
      let content = commentText;
      if (commentEditorRef.current?.hasPendingImages()) {
        const flushed = await commentEditorRef.current.flushPendingImages(id, { context: 'comment' });
        if (!flushed.ok) {
          toast.error('No se pudieron guardar las imágenes pegadas');
          return;
        }
        content = flushed.html;
      } else if (isDescriptionEmpty(content)) {
        content = '<p>Archivo adjunto</p>';
      }

      const result = await apiCall(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo agregar el comentario');
        return;
      }

      const commentId = Number(result.data.id);
      if (commentFiles.length > 0 && commentId) {
        const uploaded = await uploadTicketAttachments(id, commentFiles, { context: 'comment', commentId });
        if (!uploaded.ok) {
          toast.error(uploaded.message || 'La nota se guardó, pero falló la subida de archivos');
        }
      }

      setCommentText('');
      setCommentFiles([]);
      setCommentDialogOpen(false);
      toast.success('Comentario agregado');
      await loadComments();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setPostingComment(false);
    }
  };

  const closeCommentDialog = () => {
    if (postingComment) return;
    setCommentDialogOpen(false);
    setCommentText('');
    setCommentFiles([]);
  };

  if (loading) {
    return (
      <SupportShell title="Cargando ticket...">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </SupportShell>
    );
  }

  if (!ticket) return null;

  const availableSubcategories = formData.category
    ? (SUBCATEGORIES[formData.category as Category] ?? [])
    : [];

  const ticketSubcategories = ticket.category ? (SUBCATEGORIES[ticket.category as Category] ?? []) : [];

  const statusOptions = TICKET_STATUS_OPTIONS.filter((option) => {
    if (!ticket || option.value === ticket.status) return true;
    if (option.value === 'resolved') return canResolve;
    if (ticket.status === 'resolved') return canReopen;
    return canEditTickets;
  });
  const canChangeStatus = statusOptions.some((option) => ticket && option.value !== ticket.status);

  const inlineDisabled = Boolean(fieldBusy || saving);

  const authorEmail = staff ? ticket.user_email || '—' : getEmail();

  const metaIconSx = { fontSize: 15, opacity: 0.85 };

  const metaSubtitle = (
    <Box
      component="span"
      sx={{
        display: 'flex',
        alignItems: 'center',
        columnGap: 2,
        rowGap: 0.5,
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        color: 'text.secondary',
        fontSize: 13,
        fontWeight: 400,
        lineHeight: 1.4
      }}
    >
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <PersonOutlineIcon sx={metaIconSx} />
        {authorEmail}
      </Box>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <CalendarTodayOutlinedIcon sx={metaIconSx} />
        Creado: {formatDateTime(ticket.created_at)}
      </Box>
      {isIncident(editing ? formData.type : ticket.type) && ticket.sla_resolution_due && (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <AccessTimeOutlinedIcon sx={metaIconSx} />
          Vencimiento: {formatDateTime(ticket.sla_resolution_due)}
        </Box>
      )}
    </Box>
  );

  const headerType = editing ? formData.type : ticket.type || 'incident';
  const headerStatus = editing ? formData.status : ticket.status;
  const headerPriority = editing ? formData.priority : ticket.priority;
  const headerIsIncident = isIncident(headerType);
  const headerSla = headerIsIncident ? ticket.sla_status : null;
  const badgeButtonSx = {
    display: 'inline-flex',
    p: 0,
    m: 0,
    border: 0,
    bgcolor: 'transparent',
    lineHeight: 0,
    borderRadius: '999px',
    cursor: 'pointer',
    '&:hover': { opacity: 0.8 }
  };

  const headerBadges = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
      <Box
        component={!editing && admin ? 'button' : 'span'}
        type={!editing && admin ? 'button' : undefined}
        onClick={!editing && admin ? () => beginEdit('type') : undefined}
        sx={!editing && admin ? badgeButtonSx : { display: 'inline-flex', lineHeight: 0 }}
      >
        <StatusBadge kind="type" value={headerType} />
      </Box>
      {headerIsIncident && headerPriority && (
        <Box
          component={!editing && canEditTickets ? 'button' : 'span'}
          type={!editing && canEditTickets ? 'button' : undefined}
          onClick={!editing && canEditTickets ? () => beginEdit('priority') : undefined}
          sx={!editing && canEditTickets ? badgeButtonSx : { display: 'inline-flex', lineHeight: 0 }}
        >
          <StatusBadge kind="priority" value={headerPriority} />
        </Box>
      )}
      <Box
        component={!editing && canChangeStatus ? 'button' : 'span'}
        type={!editing && canChangeStatus ? 'button' : undefined}
        onClick={!editing && canChangeStatus ? () => beginEdit('status') : undefined}
        sx={!editing && canChangeStatus ? badgeButtonSx : { display: 'inline-flex', lineHeight: 0 }}
      >
        <StatusBadge kind="status" value={headerStatus} />
      </Box>
      {headerSla && <StatusBadge kind="sla" value={headerSla} />}
    </Box>
  );

  const attachmentsSection = (
    <TicketAttachments
      ticketId={id}
      compact
      showTitleWhenHasFiles
      uploadBelowFiles
      contentAlign="left"
      showUpload={canAttachHere}
      hideWhenEmpty={!canAttachHere}
    />
  );

  const sectionPaperSx = {
    p: { xs: 2, md: 2.5 },
    mb: 2,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 2,
    bgcolor: 'background.paper',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
  };

  const detailPanel = (
    <>
      <Paper
        elevation={0}
        sx={{
          ...sectionPaperSx,
          borderLeft: '3px solid #2563EB'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <DescriptionOutlinedIcon sx={{ fontSize: 20, color: '#2563EB' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Descripción
          </Typography>
        </Box>

        {editing ? (
          <Stack spacing={2.5}>
            {admin && (
              <>
                <TextField
                  fullWidth
                  label="Asunto"
                  autoFocus={editFocus === 'title'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <RichTextEditor
                  ref={editorRef}
                  value={formData.description}
                  ticketId={id}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                />
                {attachmentsSection}
              </>
            )}

            {technician && !admin && (
              <>
                <RichTextView value={ticket.description} ticketId={ticket.id} />
                {attachmentsSection}
              </>
            )}

            {!staff && (
              <>
                <TextField
                  fullWidth
                  label="Asunto"
                  autoFocus={editFocus === 'title'}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <RichTextEditor
                  ref={editorRef}
                  value={formData.description}
                  ticketId={id}
                  onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
                />
                {attachmentsSection}
              </>
            )}
          </Stack>
        ) : (
          <Stack spacing={1.5} sx={{ alignItems: 'stretch', textAlign: 'left' }}>
            <Box
              sx={{
                textAlign: 'left',
                '& .rich-text-content': { padding: 0, minHeight: 0 },
                '& .rich-text-content p:first-of-type': { marginTop: 0 },
                '& .rich-text-content p:last-of-type': { marginBottom: 0 },
                '& .rich-text-content, & .rich-text-content p, & .rich-text-content h1, & .rich-text-content h2, & .rich-text-content h3, & .rich-text-content li':
                  {
                    textAlign: 'left !important'
                  }
              }}
            >
              <RichTextView value={ticket.description} ticketId={ticket.id} />
            </Box>

            <TicketAttachments
              ticketId={id}
              compact
              showTitleWhenHasFiles
              uploadBelowFiles
              contentAlign="left"
            />
          </Stack>
        )}
      </Paper>

      <Paper elevation={0} sx={sectionPaperSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Información
        </Typography>

        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Tipo
              </Typography>
              {editing && admin ? (
                <SearchableSelect
                  compact
                  label="Tipo"
                  autoFocus={editFocus === 'type'}
                  value={formData.type}
                  options={TICKET_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                  onChange={(nextType) => {
                    setFormData({
                      ...formData,
                      type: nextType,
                      priority: isIncident(nextType) ? formData.priority || 'medium' : 'medium'
                    });
                  }}
                />
              ) : admin ? (
                <InlineEditSelect
                  value={ticket.type || 'incident'}
                  disabled={inlineDisabled}
                  requestEdit={() => beginEdit('type')}
                  display={<StatusBadge kind="type" value={ticket.type} />}
                  onChange={() => undefined}
                >
                  {TICKET_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </InlineEditSelect>
              ) : (
                <StatusBadge kind="type" value={ticket.type} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Estado
              </Typography>
              {editing && canChangeStatus ? (
                <SearchableSelect
                  compact
                  label="Estado"
                  autoFocus={editFocus === 'status'}
                  value={formData.status}
                  options={statusOptions.map((s) => ({ value: s.value, label: s.label }))}
                  onChange={(status) => {
                    if (status === 'resolved' && ticket.status !== 'resolved') {
                      void openResolveDialog();
                      return;
                    }
                    setFormData({ ...formData, status });
                  }}
                />
              ) : canChangeStatus ? (
                <InlineEditSelect
                  value={ticket.status}
                  disabled={inlineDisabled}
                  requestEdit={() => beginEdit('status')}
                  display={<StatusBadge kind="status" value={ticket.status} />}
                  onChange={() => undefined}
                >
                  {statusOptions.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      {s.label}
                    </MenuItem>
                  ))}
                </InlineEditSelect>
              ) : (
                <StatusBadge kind="status" value={ticket.status} />
              )}
            </Box>
          </Stack>
          {isIncident(editing ? formData.type : ticket.type) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Prioridad
                </Typography>
                {editing && staff ? (
                  <SearchableSelect
                    compact
                    label="Prioridad"
                    autoFocus={editFocus === 'priority'}
                    value={formData.priority}
                    options={[
                      { value: 'low', label: 'Baja' },
                      { value: 'medium', label: 'Media' },
                      { value: 'high', label: 'Alta' }
                    ]}
                    onChange={(priority) => setFormData({ ...formData, priority })}
                  />
                ) : canEditTickets ? (
                  <InlineEditSelect
                    value={ticket.priority || 'medium'}
                    disabled={inlineDisabled}
                    requestEdit={() => beginEdit('priority')}
                    display={<StatusBadge kind="priority" value={ticket.priority} />}
                    onChange={() => undefined}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </InlineEditSelect>
                ) : (
                  <StatusBadge kind="priority" value={ticket.priority} />
                )}
              </Box>
              {ticket.sla_status ? (
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Vencimiento
                  </Typography>
                  <StatusBadge kind="sla" value={ticket.sla_status} />
                </Box>
              ) : (
                <Box sx={{ flex: 1 }} />
              )}
            </Stack>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Categoría
              </Typography>
              {editing && staff ? (
                <SearchableSelect
                  compact
                  label="Categoría"
                  autoFocus={editFocus === 'category'}
                  value={formData.category}
                  options={[
                    { value: '', label: 'Sin categoría' },
                    ...CATEGORIES.map((c) => ({ value: c, label: c }))
                  ]}
                  onChange={(category) => setFormData({ ...formData, category, subcategory: '' })}
                />
              ) : canEditTickets ? (
                <InlineEditSelect
                  value={ticket.category || ''}
                  disabled={inlineDisabled}
                  requestEdit={() => beginEdit('category')}
                  display={<Typography variant="body2">{ticket.category || '—'}</Typography>}
                  onChange={(val) =>
                    handleInlineFieldUpdate({ category: val || null, subcategory: null }, 'category')
                  }
                >
                  <MenuItem value="">
                    <em>Sin categoría</em>
                  </MenuItem>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </InlineEditSelect>
              ) : (
                <Typography variant="body2">{ticket.category || '—'}</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Subcategoría
              </Typography>
              {editing && staff ? (
                <SearchableSelect
                  compact
                  label="Subcategoría"
                  autoFocus={editFocus === 'subcategory'}
                  value={formData.subcategory}
                  disabled={!formData.category}
                  options={[
                    { value: '', label: 'Sin subcategoría' },
                    ...availableSubcategories.map((s) => ({ value: s, label: s }))
                  ]}
                  onChange={(subcategory) => setFormData({ ...formData, subcategory })}
                />
              ) : canEditTickets ? (
                <InlineEditSelect
                  value={ticket.subcategory || ''}
                  disabled={inlineDisabled || !ticket.category}
                  requestEdit={() => beginEdit('subcategory')}
                  display={<Typography variant="body2">{ticket.subcategory || '—'}</Typography>}
                  onChange={(val) => handleInlineFieldUpdate({ subcategory: val || null }, 'subcategory')}
                >
                  <MenuItem value="">
                    <em>Sin subcategoría</em>
                  </MenuItem>
                  {ticketSubcategories.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </InlineEditSelect>
              ) : (
                <Typography variant="body2">{ticket.subcategory || '—'}</Typography>
              )}
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Grupo
              </Typography>
              {editing && (admin || canTransfer) ? (
                <SearchableSelect
                  compact
                  label="Grupo"
                  autoFocus={editFocus === 'group'}
                  value={formData.group_id}
                  options={[
                    { value: '', label: 'Sin grupo' },
                    ...groups.map((g) => ({ value: g.id, label: g.name }))
                  ]}
                  onChange={(nextGroup) => {
                    setFormData({
                      ...formData,
                      group_id: nextGroup ? Number(nextGroup) : '',
                      technician_id: ''
                    });
                  }}
                />
              ) : canTransfer ? (
                <InlineEditSelect
                  value={ticket.group_id ?? ''}
                  disabled={inlineDisabled}
                  requestEdit={() => beginEdit('group')}
                  display={<Typography variant="body2">{ticket.group_name || '—'}</Typography>}
                  onChange={(val) =>
                    handleInlineFieldUpdate(
                      {
                        group_id: val ? Number(val) : null,
                        technician_id: null
                      },
                      'group'
                    )
                  }
                >
                  <MenuItem value="">
                    <em>Sin grupo</em>
                  </MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </InlineEditSelect>
              ) : (
                <Typography variant="body2">{ticket.group_name || '—'}</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Técnico
              </Typography>
              {editing && (admin || canAssign) ? (
                <SearchableSelect
                  compact
                  label="Técnico"
                  autoFocus={editFocus === 'technician'}
                  value={formData.technician_id}
                  disabled={!formData.group_id}
                  options={[
                    { value: '', label: 'Sin asignar' },
                    ...groupTechnicians.map((tech) => ({ value: tech.id, label: tech.email }))
                  ]}
                  onChange={(nextTechnician) =>
                    setFormData({
                      ...formData,
                      technician_id: nextTechnician ? Number(nextTechnician) : ''
                    })
                  }
                />
              ) : canAssign ? (
                <InlineEditSelect
                  value={ticket.technician_id ?? ''}
                  disabled={inlineDisabled || !ticket.group_id}
                  requestEdit={() => beginEdit('technician')}
                  display={<Typography variant="body2">{ticket.technician_email || '—'}</Typography>}
                  onChange={(val) =>
                    handleInlineFieldUpdate({ technician_id: val ? Number(val) : null }, 'technician')
                  }
                >
                  <MenuItem value="">
                    <em>Sin asignar</em>
                  </MenuItem>
                  {groupTechnicians.map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      {tech.email}
                    </MenuItem>
                  ))}
                </InlineEditSelect>
              ) : (
                <Typography variant="body2">{ticket.technician_email || '—'}</Typography>
              )}
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
            {isIncident(ticket.type) && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  SLA
                </Typography>
                {ticket.status === 'on-hold' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Temporizador pausado mientras el ticket está en espera.
                  </Typography>
                )}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Typography variant="body2">
                    <strong>Respuesta:</strong> {formatSlaDeadline(ticket.sla_response_due)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Resolución:</strong> {formatSlaDeadline(ticket.sla_resolution_due)}
                  </Typography>
                </Stack>
              </Box>
            )}
            {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Actualizado
                </Typography>
                <Typography variant="body2">{formatDateTime(ticket.updated_at)}</Typography>
              </Box>
            )}
          </Stack>
        </>
      </Paper>

      <Paper elevation={0} sx={{ ...sectionPaperSx, mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Comentarios
          </Typography>
          {canCommentHere && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<SendIcon />}
              onClick={() => setCommentDialogOpen(true)}
            >
              Agregar comentario
            </Button>
          )}
        </Box>

        <Stack spacing={1} sx={{ maxHeight: 320, overflowY: 'auto' }}>
          {comments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Sin comentarios todavía. Agregá una nota de seguimiento.
            </Typography>
          ) : (
            comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                ticketId={String(id)}
                formatDateTime={formatDateTime}
                admin={canModerateComments}
                isEditing={editingCommentId === comment.id}
                editingText={editingCommentText}
                busy={busyCommentId === comment.id}
                onStartEdit={() => {
                  setEditingCommentId(comment.id);
                  setEditingCommentText(comment.content);
                }}
                onDelete={() => handleDeleteComment(comment.id)}
                onEditTextChange={setEditingCommentText}
                onSaveEdit={() => handleEditComment(comment.id)}
                onCancelEdit={() => setEditingCommentId(null)}
                canAttach={canAttachHere}
              />
            ))
          )}
        </Stack>
      </Paper>

      <Dialog open={commentDialogOpen} onClose={closeCommentDialog} maxWidth="md" fullWidth>
        <Box component="form" onSubmit={handleAddComment}>
          <DialogTitle>Nuevo comentario</DialogTitle>
          <DialogContent>
            <RichTextEditor
              ref={commentEditorRef}
              value={commentText}
              onChange={setCommentText}
              placeholder="Escribí una nota. Podés pegar capturas con Ctrl + V."
            />
            <Box sx={{ mt: 1.5 }}>
              <TicketAttachments pendingFiles={commentFiles} onPendingFilesChange={setCommentFiles} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCommentDialog} disabled={postingComment}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SendIcon />}
              disabled={postingComment || (isDescriptionEmpty(commentText) && commentFiles.length === 0)}
            >
              {postingComment ? 'Enviando...' : 'Agregar comentario'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );

  const historyGroups = groupHistoryByMoment(history);

  const historyPanel = (
    <Stack spacing={1.5} sx={{ maxHeight: 520, overflowY: 'auto' }}>
      {history.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin registros todavía. Los cambios futuros quedarán acá.
        </Typography>
      ) : (
        historyGroups.map((group) => (
          <HistoryGroupCard
            key={group.key}
            group={group}
            formatDateTime={formatDateTime}
            formatHistoryEntry={formatHistoryEntry}
          />
        ))
      )}
    </Stack>
  );

  const isResolved = ticket.status === 'resolved';

  const resolutionPanel = staff ? (
    <Stack spacing={2}>
      {isResolved && resolution ? (
        <>
          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>
                Resuelto por
              </Box>{' '}
              {resolution.resolved_by_email} ·{' '}
              {formatDateTime(resolution.updated_at || resolution.created_at)}
            </Typography>
            <Box
              sx={{
                maxHeight: 'clamp(160px, calc(100vh - 460px), 320px)',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              <RichTextView value={resolution.content} ticketId={ticket.id} emptyLabel="Sin resolución" />
            </Box>
            <Box sx={{ mt: 1.5 }}>
              <TicketAttachments
                ticketId={ticket.id}
                scope="resolution"
                showUpload={can('tickets.attach')}
                hideWhenEmpty={!can('tickets.attach')}
              />
            </Box>
          </Box>
          <Box>
            {canReopen && (
              <Button variant="contained" disabled={reopening} onClick={handleReopen}>
                {reopening ? 'Reabriendo...' : 'Reabrir solicitud'}
              </Button>
            )}
          </Box>
        </>
      ) : canResolve ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Box
            sx={{
              height: 'clamp(220px, calc(100vh - 460px), 340px)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            <RichTextEditor
              ref={resolutionEditorRef}
              bounded
              value={resolutionText}
              onChange={setResolutionText}
              ticketId={id}
              attachmentContext="resolution"
              placeholder="Describí cómo se resolvió. Podés pegar capturas con Ctrl + V."
            />
          </Box>
          <Box sx={{ flexShrink: 0, pt: 1.5 }}>
            <TicketAttachments ticketId={id} scope="resolution" />
          </Box>
          <Box sx={{ flexShrink: 0, pt: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => {
                void openResolveDialog();
              }}
            >
              Registrar resolución
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Al guardar, el ticket pasará a estado resuelto con tu nombre y la fecha actual.
            </Typography>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No tenés permiso para resolver este ticket.
        </Typography>
      )}
    </Stack>
  ) : isResolved && resolution ? (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        <Box component="span" sx={{ fontWeight: 700 }}>
          Resuelto por
        </Box>{' '}
        {resolution.resolved_by_email} · {formatDateTime(resolution.updated_at || resolution.created_at)}
      </Typography>
      <Box
        sx={{ maxHeight: 'clamp(160px, calc(100vh - 460px), 320px)', overflowY: 'auto', overflowX: 'hidden' }}
      >
        <RichTextView value={resolution.content} ticketId={ticket.id} emptyLabel="Sin resolución" />
      </Box>
      <Box sx={{ mt: 1.5 }}>
        <TicketAttachments ticketId={ticket.id} scope="resolution" showUpload={false} hideWhenEmpty />
      </Box>
    </Box>
  ) : (
    <Typography variant="body2" color="text.secondary">
      Este ticket aún no fue resuelto.
    </Typography>
  );

  return (
    <SupportShell
      title={`#${ticket.id} — ${editing ? formData.title : ticket.title}`}
      subtitle={metaSubtitle}
      headerAction={headerBadges}
      headerActionInline
      headerSingleRow
    >
      <Box>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            pr: 1,
            bgcolor: 'transparent',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: { xs: -16, sm: -24, md: -32, xl: -40 },
              right: { xs: -16, sm: -24, md: -32, xl: -40 },
              height: '1px',
              bgcolor: 'divider',
              zIndex: 0
            }
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              minWidth: 0,
              minHeight: 43,
              bgcolor: 'transparent',
              '& .MuiTab-root': { minHeight: 43, py: 0 },
              '& .MuiTabs-indicator': { height: 2, zIndex: 1 }
            }}
          >
            <Tab label="Detalle" />
            <Tab label={`Historial (${history.length})`} />
            <Tab label="Resolución" />
          </Tabs>
          {((canResolve && !isResolved) || canCommentHere) && (
            <>
              <Tooltip title="Acciones">
                <IconButton
                  size="small"
                  aria-label="Acciones"
                  onClick={(event) => setActionsAnchor(event.currentTarget)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={actionsAnchor}
                open={Boolean(actionsAnchor)}
                onClose={() => setActionsAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {canResolve && !isResolved && (
                  <MenuItem
                    onClick={() => {
                      setActionsAnchor(null);
                      void openResolveDialog();
                    }}
                  >
                    Resolver ticket
                  </MenuItem>
                )}
                {canCommentHere && (
                  <MenuItem
                    onClick={() => {
                      setActionsAnchor(null);
                      setCommentDialogOpen(true);
                    }}
                  >
                    Agregar nota
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
          {(admin || technician || canEditThis) && !editing && (
            <Tooltip title={staff ? 'Editar ticket' : 'Editar asunto y descripción'}>
              <IconButton size="small" aria-label="Editar" onClick={() => beginEdit()}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ pt: 1.5, bgcolor: 'transparent', ...(editing ? { pb: 8 } : {}) }}>
          {activeTab === 0 && detailPanel}
          {activeTab === 1 && historyPanel}
          {activeTab === 2 &&
            (staff ? (
              <Stack spacing={2}>
                <Tabs
                  value={resolutionSection}
                  onChange={(_, value) => setResolutionSection(value)}
                  sx={{
                    minHeight: 36,
                    '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 }
                  }}
                >
                  <Tab value="resolution" label="Resolución" />
                  <Tab value="solutions" label="Soluciones" />
                </Tabs>
                {resolutionSection === 'resolution' ? (
                  resolutionPanel
                ) : canResolve ? (
                  <TicketSolutions
                    ticketId={String(id)}
                    canApply={!isResolved}
                    onApply={(value) => {
                      setResolutionText((prev) =>
                        isRichHtml(value) ? appendRichHtml(prev, value) : appendPlainTextToHtml(prev, value)
                      );
                      setResolutionSection('resolution');
                      toast.success('Solución aplicada correctamente.');
                    }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tenés permiso para consultar soluciones.
                  </Typography>
                )}
              </Stack>
            ) : (
              resolutionPanel
            ))}
        </Box>
      </Box>
      <ResolveTicketDialog
        open={resolveOpen}
        ticket={
          ticket
            ? {
                id: ticket.id,
                title: editing ? formData.title : ticket.title,
                type: editing ? formData.type : ticket.type,
                priority: editing ? formData.priority : ticket.priority,
                category: (editing ? formData.category : ticket.category) || null,
                subcategory: (editing ? formData.subcategory : ticket.subcategory) || null,
                group_id: editing
                  ? formData.group_id === ''
                    ? null
                    : formData.group_id
                  : (ticket.group_id ?? null),
                group_name: ticket.group_name,
                technician_id: editing
                  ? formData.technician_id === ''
                    ? null
                    : formData.technician_id
                  : (ticket.technician_id ?? null),
                technician_email: ticket.technician_email,
                sla_status: ticket.sla_status
              }
            : null
        }
        saved={
          ticket
            ? {
                id: ticket.id,
                type: ticket.type,
                priority: ticket.priority,
                category: ticket.category || null,
                subcategory: ticket.subcategory || null,
                group_id: ticket.group_id ?? null,
                technician_id: ticket.technician_id ?? null
              }
            : null
        }
        initialContent={resolveInitial}
        onClose={() => setResolveOpen(false)}
        onBeforeResolve={prepareResolveExtra}
        onResolved={() => {
          setResolveOpen(false);
          setEditing(false);
          setEditFocus(null);
          setResolutionText('');
          void Promise.all([loadTicket(), loadHistory(), loadResolution()]);
          setActiveTab(2);
        }}
      />
      {editing && (
        <Box
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 0.75,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={() => setCancelEditPrompt(true)}
            disabled={saving}
            sx={{ minWidth: 108, textTransform: 'none', fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ minWidth: 148, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Box>
      )}
      <Dialog open={cancelEditPrompt} onClose={() => setCancelEditPrompt(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cerrar sin guardar</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Si cerrás ahora, se pierden los cambios de este ticket.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCancelEditPrompt(false)}>Volver</Button>
          <Button variant="contained" onClick={handleCancelEdit}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </SupportShell>
  );
}
