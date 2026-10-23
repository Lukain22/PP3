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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { toast } from 'sonner';
import StatusBadge from './StatusBadge';
import SupportShell from './SupportShell';
import { getToken, clearAuth, isAdmin, isTechnician, getEmail, getHomePath, can } from '../../lib/auth';
import { CATEGORIES, SUBCATEGORIES, type Category } from '../../lib/categories';
import {
  TICKET_TYPE_OPTIONS,
  HISTORY_FIELD_LABELS,
  formatHistoryValue
} from '../../lib/ticketTypes';
import {
  formatSlaDeadline,
  isIncident
} from '../../lib/sla';
import { TICKET_STATUS_OPTIONS } from '../../lib/ticketStatus';
import TicketAttachments from './TicketAttachments';
import InlineEditSelect from './InlineEditSelect';
import SearchableSelect from './SearchableSelect';
import RichTextEditor, { type RichTextEditorHandle } from './richtext/RichTextEditor';
import RichTextView from './richtext/RichTextView';
import TicketSolutions from './TicketSolutions';
import { appendPlainTextToHtml, appendRichHtml, isDescriptionEmpty, isRichHtml } from '../../lib/richText';
import { uploadTicketAttachments } from '../../lib/attachments';

const API_URL = import.meta.env.VITE_API_URL as string;

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

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  type: string;
  category?: string | null;
  subcategory?: string | null;
  sla_response_due?: string | null;
  sla_resolution_due?: string | null;
  sla_status?: string | null;
  created_at: string;
  updated_at?: string;
  user_id: number;
  user_email?: string;
  group_id?: number | null;
  group_name?: string | null;
  technician_id?: number | null;
  technician_email?: string | null;
}

interface GroupOption {
  id: number;
  name: string;
}

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

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  email: string;
}

interface HistoryEntry {
  id: number;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  email: string;
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
  entries: HistoryEntry[];
}

function groupHistoryByMoment(entries: HistoryEntry[]): HistoryGroup[] {
  const groups: HistoryGroup[] = [];

  const momentKey = (entry: HistoryEntry) => {
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
  formatHistoryEntry: (entry: HistoryEntry) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ p: 1.5, bgcolor: '#fafbfc', borderRadius: 1.5 }}>
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
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: expanded ? 0.75 : 0 }}>
          <Box component="span" sx={{ fontWeight: 700 }}>Por:</Box> {group.email}
          {' · '}
          <Box component="span" sx={{ fontWeight: 700 }}>{formatDateTime(group.created_at)}</Box>
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
  onCancelEdit
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
}) {
  const [expanded, setExpanded] = useState(false);
  const showContent = expanded || isEditing;

  return (
    <Box sx={{ p: 1.5, bgcolor: '#fafbfc', borderRadius: 1.5 }}>
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
            <Box component="span" sx={{ fontWeight: 700 }}>Por:</Box> {comment.email}
            {' · '}
            <Box component="span" sx={{ fontWeight: 700 }}>{formatDateTime(comment.created_at)}</Box>
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
      {showContent && (
        isEditing ? (
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
              <Button size="small" variant="contained" disabled={busy || isDescriptionEmpty(editingText)} onClick={onSaveEdit}>
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
              hideWhenEmpty={!can('tickets.attach')}
            />
          </Stack>
        )
      )}
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionFileCount, setResolutionFileCount] = useState(0);
  const [resolutionSection, setResolutionSection] = useState<'resolution' | 'solutions'>('resolution');
  const [savingResolution, setSavingResolution] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editFocus, setEditFocus] = useState<TicketEditField | null>(null);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const commentEditorRef = useRef<RichTextEditorHandle>(null);
  const [commentText, setCommentText] = useState('');
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
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
  const [groups, setGroups] = useState<GroupOption[]>([]);
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
    if (!token) { navigate('/'); return null; }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 401) { clearAuth(); navigate('/'); return null; }

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
    if (!getToken()) { navigate('/'); return; }
    Promise.all([loadTicket(), loadComments(), loadHistory(), loadResolution()]).finally(() => setLoading(false));
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
    return () => { cancelled = true; };
  }, [canAssign, editing, formData.group_id, ticket?.group_id]);

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const formatHistoryEntry = (entry: HistoryEntry) => {
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
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo editar'); return; }
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
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo eliminar'); return; }
      toast.success('Comentario eliminado');
      await loadComments();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyCommentId(null);
    }
  };

  const handleSaveResolution = async () => {
    const content = isDescriptionEmpty(resolutionText)
      ? (resolutionFileCount > 0 ? '<p>Archivo adjunto</p>' : '')
      : resolutionText;
    if (!content) {
      toast.error('La resolución no puede estar vacía');
      return;
    }

    setSavingResolution(true);
    try {
      const result = await apiCall(`/tickets/${id}/resolution`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar la resolución');
        return;
      }
      toast.success(result.data.message || 'Resolución guardada');
      await Promise.all([loadTicket(), loadHistory(), loadResolution()]);
      setActiveTab(2);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSavingResolution(false);
    }
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
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo agregar el comentario'); return; }

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
    ? SUBCATEGORIES[formData.category as Category] ?? []
    : [];

  const ticketSubcategories = ticket.category
    ? SUBCATEGORIES[ticket.category as Category] ?? []
    : [];

  const statusOptions = TICKET_STATUS_OPTIONS.filter((option) => {
    if (!ticket || option.value === ticket.status) return true;
    if (option.value === 'resolved') return canResolve;
    if (ticket.status === 'resolved') return canReopen;
    return canEditTickets;
  });
  const canChangeStatus = statusOptions.some((option) => ticket && option.value !== ticket.status);

  const inlineDisabled = Boolean(fieldBusy || saving);

  const authorEmail = staff ? (ticket.user_email || '—') : getEmail();

  const metaIconSx = { fontSize: 15, opacity: 0.85 };

  const metaSubtitle = (
    <Box
      component="span"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        columnGap: 2.5,
        rowGap: 0.75,
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
      {isIncident(ticket.type) && ticket.sla_resolution_due && (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <AccessTimeOutlinedIcon sx={metaIconSx} />
          Vencimiento: {formatDateTime(ticket.sla_resolution_due)}
        </Box>
      )}
    </Box>
  );

  const attachmentsSection = (
    <TicketAttachments
      ticketId={id}
      compact
      showTitleWhenHasFiles
      uploadBelowFiles
    />
  );

  const sectionPaperSx = {
    p: { xs: 2, md: 2.5 },
    mb: 2,
    border: '1px solid',
    borderColor: '#E2E8F0',
    borderRadius: 2,
    bgcolor: '#fff',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
  };

  const detailPanel = (
    <>
      <Paper elevation={0} sx={sectionPaperSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Descripción
        </Typography>

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
          <Stack spacing={2}>
            <Box
              onClick={(event) => {
                if (staff && !admin) return;
                if (inlineDisabled) return;
                const target = event.target as HTMLElement;
                if (target.closest('a, button')) return;
                beginEdit('description');
              }}
              sx={(staff && !admin) ? undefined : {
                cursor: inlineDisabled ? 'default' : 'pointer',
                borderRadius: 1,
                mx: -1,
                px: 1,
                py: 0.5,
                ...(!inlineDisabled && { '&:hover': { bgcolor: 'action.hover' } })
              }}
            >
              <RichTextView value={ticket.description} ticketId={ticket.id} />
            </Box>

            {attachmentsSection}
          </Stack>
        )}
      </Paper>

      <Paper elevation={0} sx={sectionPaperSx}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Información
        </Typography>

        {editing && staff ? (
            <Stack spacing={2.5}>
              {admin && (
                <>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <SearchableSelect
                      label="Tipo"
                      autoFocus={editFocus === 'type'}
                      value={formData.type}
                      options={TICKET_TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                      onChange={(nextType) => {
                        setFormData({
                          ...formData,
                          type: nextType,
                          priority: isIncident(nextType) ? (formData.priority || 'medium') : 'medium'
                        });
                      }}
                    />
                    <SearchableSelect
                      label="Estado"
                      autoFocus={editFocus === 'status'}
                      value={formData.status}
                      options={TICKET_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
                      onChange={(status) => setFormData({ ...formData, status })}
                    />
                  </Stack>
                  {isIncident(formData.type) && (
                    <SearchableSelect
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
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <SearchableSelect
                      label="Categoría"
                      autoFocus={editFocus === 'category'}
                      value={formData.category}
                      options={[
                        { value: '', label: 'Sin categoría' },
                        ...CATEGORIES.map((c) => ({ value: c, label: c }))
                      ]}
                      onChange={(category) => setFormData({ ...formData, category, subcategory: '' })}
                    />
                    <SearchableSelect
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
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <SearchableSelect
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
                    <SearchableSelect
                      label="Técnico"
                      autoFocus={editFocus === 'technician'}
                      value={formData.technician_id}
                      disabled={!formData.group_id}
                      options={[
                        { value: '', label: 'Sin asignar' },
                        ...groupTechnicians.map((tech) => ({ value: tech.id, label: tech.email }))
                      ]}
                      onChange={(nextTechnician) => setFormData({
                        ...formData,
                        technician_id: nextTechnician ? Number(nextTechnician) : ''
                      })}
                    />
                  </Stack>
                </>
              )}

              {technician && !admin && (
                <>
                  <SearchableSelect
                    label="Estado"
                    autoFocus={editFocus === 'status'}
                    value={formData.status}
                    options={statusOptions.map((s) => ({ value: s.value, label: s.label }))}
                    onChange={(status) => setFormData({ ...formData, status })}
                  />
                  {isIncident(formData.type) && (
                    <SearchableSelect
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
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <SearchableSelect
                      label="Categoría"
                      autoFocus={editFocus === 'category'}
                      value={formData.category}
                      options={[
                        { value: '', label: 'Sin categoría' },
                        ...CATEGORIES.map((c) => ({ value: c, label: c }))
                      ]}
                      onChange={(category) => setFormData({ ...formData, category, subcategory: '' })}
                    />
                    <SearchableSelect
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
                  </Stack>
                  {(canTransfer || canAssign) && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      {canTransfer && (
                        <SearchableSelect
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
                      )}
                      {canAssign && (
                        <SearchableSelect
                          label="Técnico"
                          autoFocus={editFocus === 'technician'}
                          value={formData.technician_id}
                          disabled={!formData.group_id}
                          options={[
                            { value: '', label: 'Sin asignar' },
                            ...groupTechnicians.map((tech) => ({ value: tech.id, label: tech.email }))
                          ]}
                          onChange={(nextTechnician) => setFormData({
                            ...formData,
                            technician_id: nextTechnician ? Number(nextTechnician) : ''
                          })}
                        />
                      )}
                    </Stack>
                  )}
                </>
              )}
            </Stack>
          ) : (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Tipo
                  </Typography>
                  {admin ? (
                    <InlineEditSelect
                      value={ticket.type || 'incident'}
                      disabled={inlineDisabled}
                      requestEdit={() => beginEdit('type')}
                      display={
                        <StatusBadge kind="type" value={ticket.type} />
                      }
                      onChange={(val) => {
                        const payload: Record<string, unknown> = { type: val };
                        if (!isIncident(val)) payload.priority = null;
                        else if (!ticket.priority) payload.priority = 'medium';
                        handleInlineFieldUpdate(payload, 'type');
                      }}
                    >
                      {TICKET_TYPE_OPTIONS.map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
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
                  {canChangeStatus ? (
                    <InlineEditSelect
                      value={ticket.status}
                      disabled={inlineDisabled}
                      requestEdit={() => beginEdit('status')}
                      display={
                        <StatusBadge kind="status" value={ticket.status} />
                      }
                      onChange={(val) => handleInlineFieldUpdate({ status: val }, 'status')}
                    >
                      {statusOptions.map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </InlineEditSelect>
                  ) : (
                    <StatusBadge kind="status" value={ticket.status} />
                  )}
                </Box>
              </Stack>
              {isIncident(ticket.type) && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Prioridad
                    </Typography>
                    {canEditTickets ? (
                      <InlineEditSelect
                        value={ticket.priority || 'medium'}
                        disabled={inlineDisabled}
                        requestEdit={() => beginEdit('priority')}
                        display={<StatusBadge kind="priority" value={ticket.priority} />}
                        onChange={(val) => handleInlineFieldUpdate({ priority: val }, 'priority')}
                      >
                        <MenuItem value="low">Baja</MenuItem>
                        <MenuItem value="medium">Media</MenuItem>
                        <MenuItem value="high">Alta</MenuItem>
                      </InlineEditSelect>
                    ) : (
                      <StatusBadge kind="priority" value={ticket.priority} />
                    )}
                  </Box>
                  {ticket.sla_status && (
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Vencimiento
                      </Typography>
                      <StatusBadge kind="sla" value={ticket.sla_status} />
                    </Box>
                  )}
                </Stack>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Categoría
                  </Typography>
                  {canEditTickets ? (
                    <InlineEditSelect
                      value={ticket.category || ''}
                      disabled={inlineDisabled}
                      requestEdit={() => beginEdit('category')}
                      display={
                        <Typography variant="body2">{ticket.category || '—'}</Typography>
                      }
                      onChange={(val) =>
                        handleInlineFieldUpdate(
                          { category: val || null, subcategory: null },
                          'category'
                        )
                      }
                    >
                      <MenuItem value=""><em>Sin categoría</em></MenuItem>
                      {CATEGORIES.map((c) => (
                        <MenuItem key={c} value={c}>{c}</MenuItem>
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
                  {canEditTickets ? (
                    <InlineEditSelect
                      value={ticket.subcategory || ''}
                      disabled={inlineDisabled || !ticket.category}
                      requestEdit={() => beginEdit('subcategory')}
                      display={
                        <Typography variant="body2">{ticket.subcategory || '—'}</Typography>
                      }
                      onChange={(val) =>
                        handleInlineFieldUpdate({ subcategory: val || null }, 'subcategory')
                      }
                    >
                      <MenuItem value=""><em>Sin subcategoría</em></MenuItem>
                      {ticketSubcategories.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
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
                  {canTransfer ? (
                    <InlineEditSelect
                      value={ticket.group_id ?? ''}
                      disabled={inlineDisabled}
                      requestEdit={() => beginEdit('group')}
                      display={
                        <Typography variant="body2">{ticket.group_name || '—'}</Typography>
                      }
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
                      <MenuItem value=""><em>Sin grupo</em></MenuItem>
                      {groups.map((g) => (
                        <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
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
                  {canAssign ? (
                    <InlineEditSelect
                      value={ticket.technician_id ?? ''}
                      disabled={inlineDisabled || !ticket.group_id}
                      requestEdit={() => beginEdit('technician')}
                      display={
                        <Typography variant="body2">{ticket.technician_email || '—'}</Typography>
                      }
                      onChange={(val) =>
                        handleInlineFieldUpdate(
                          { technician_id: val ? Number(val) : null },
                          'technician'
                        )
                      }
                    >
                      <MenuItem value=""><em>Sin asignar</em></MenuItem>
                      {groupTechnicians.map((tech) => (
                        <MenuItem key={tech.id} value={tech.id}>{tech.email}</MenuItem>
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
          )}
      </Paper>

      <Paper elevation={0} sx={{ ...sectionPaperSx, mb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Comentarios
          </Typography>
          {canComment && (
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
              <TicketAttachments
                pendingFiles={commentFiles}
                onPendingFilesChange={setCommentFiles}
              />
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
          <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              <Box component="span" sx={{ fontWeight: 700 }}>Resuelto por</Box>{' '}
              {resolution.resolved_by_email} · {formatDateTime(resolution.updated_at || resolution.created_at)}
            </Typography>
            <Box sx={{ maxHeight: 'clamp(160px, calc(100vh - 460px), 320px)', overflowY: 'auto', overflowX: 'hidden' }}>
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
          <Box sx={{ height: 'clamp(220px, calc(100vh - 460px), 340px)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <RichTextEditor
              bounded
              value={resolutionText}
              onChange={setResolutionText}
              ticketId={id}
              attachmentContext="resolution"
              placeholder="Describí cómo se resolvió. Podés pegar capturas con Ctrl + V."
            />
          </Box>
          <Box sx={{ flexShrink: 0, pt: 1.5 }}>
            <TicketAttachments ticketId={id} scope="resolution" onCountChange={setResolutionFileCount} />
          </Box>
          <Box sx={{ flexShrink: 0, pt: 1.5 }}>
            <Button
              variant="contained"
              disabled={savingResolution || (isDescriptionEmpty(resolutionText) && resolutionFileCount === 0)}
              onClick={handleSaveResolution}
            >
              {savingResolution ? 'Guardando...' : 'Registrar resolución'}
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
    <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        <Box component="span" sx={{ fontWeight: 700 }}>Resuelto por</Box>{' '}
        {resolution.resolved_by_email} · {formatDateTime(resolution.updated_at || resolution.created_at)}
      </Typography>
      <Box sx={{ maxHeight: 'clamp(160px, calc(100vh - 460px), 320px)', overflowY: 'auto', overflowX: 'hidden' }}>
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
    >
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: '#fff',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            pr: 1
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            sx={{ px: 2, flex: 1, minWidth: 0 }}
          >
            <Tab label="Detalle" />
            <Tab label={`Historial (${history.length})`} />
            <Tab label="Resolución" />
          </Tabs>
          {(admin || technician || !staff) && !editing && (
            <Tooltip title={staff ? 'Editar ticket' : 'Editar asunto y descripción'}>
              <IconButton
                size="small"
                aria-label="Editar"
                onClick={() => beginEdit()}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 }, ...(editing ? { pb: 8 } : {}) }}>
          {activeTab === 0 && detailPanel}
          {activeTab === 1 && historyPanel}
          {activeTab === 2 && (staff ? (
            <Stack spacing={2}>
              <Tabs
                value={resolutionSection}
                onChange={(_, value) => setResolutionSection(value)}
                sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}
              >
                <Tab value="resolution" label="Resolución" />
                <Tab value="solutions" label="Soluciones" />
              </Tabs>
              {resolutionSection === 'resolution' ? resolutionPanel : canResolve ? (
                <TicketSolutions
                  ticketId={String(id)}
                  canApply={!isResolved}
                  onApply={(value) => {
                    setResolutionText((prev) => (
                      isRichHtml(value) ? appendRichHtml(prev, value) : appendPlainTextToHtml(prev, value)
                    ));
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
          ) : resolutionPanel)}
        </Box>
      </Paper>
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
            bgcolor: '#fff',
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Button
            size="small"
            variant="outlined"
            onClick={handleCancelEdit}
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
    </SupportShell>
  );
}
