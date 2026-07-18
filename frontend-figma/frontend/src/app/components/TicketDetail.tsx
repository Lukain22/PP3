import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth, isAdmin, isTechnician, getEmail, getHomePath } from '../../lib/auth';
import { CATEGORIES, SUBCATEGORIES, type Category } from '../../lib/categories';
import {
  getTicketTypeLabel,
  getTicketTypeColor,
  TICKET_TYPE_OPTIONS,
  HISTORY_FIELD_LABELS,
  formatHistoryValue
} from '../../lib/ticketTypes';
import {
  getPriorityLabel,
  getSlaStatusLabel,
  getSlaStatusColor,
  formatSlaDeadline,
  isIncident
} from '../../lib/sla';
import { TICKET_STATUS_OPTIONS, getTicketStatusLabel, getTicketStatusColor } from '../../lib/ticketStatus';

const API_URL = import.meta.env.VITE_API_URL as string;

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
}

interface TicketFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  category: string;
  subcategory: string;
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
    subcategory: ticket.subcategory || ''
  };
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const admin = isAdmin();
  const technician = isTechnician();
  const staff = admin || technician;
  const homePath = getHomePath();
  const homeLabel = admin ? 'Admin' : technician ? 'Técnico' : 'Inicio';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [savingResolution, setSavingResolution] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TicketFormData>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    type: 'incident',
    category: '',
    subcategory: ''
  });

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
      if (data?.content) setResolutionText(data.content);
    }
  };

  useEffect(() => {
    if (!getToken()) { navigate('/'); return; }
    Promise.all([loadTicket(), loadComments(), loadHistory(), loadResolution()]).finally(() => setLoading(false));
  }, [id]);

  const getStatusLabel = getTicketStatusLabel;
  const getStatusColor = getTicketStatusColor;

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
    return `${field}: ${oldVal} → ${newVal}`;
  };

  const handleCancelEdit = () => {
    if (ticket) setFormData(ticketToFormData(ticket));
    setEditing(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Título y descripción son requeridos');
      return;
    }

    setSaving(true);
    try {
      const basePayload = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        type: formData.type,
        category: formData.category || null,
        subcategory: formData.subcategory || null
      };

      const payload = admin
        ? isIncident(formData.type)
          ? { ...basePayload, priority: formData.priority }
          : basePayload
        : staff
          ? { status: formData.status }
          : {
              title: formData.title,
              description: formData.description
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
      setEditing(false);
      await Promise.all([loadTicket(), loadHistory()]);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editingCommentText.trim()) return;
    setBusyCommentId(commentId);
    try {
      const result = await apiCall(`/admin/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editingCommentText.trim() })
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
    if (!resolutionText.trim()) {
      toast.error('La resolución no puede estar vacía');
      return;
    }

    setSavingResolution(true);
    try {
      const result = await apiCall(`/tickets/${id}/resolution`, {
        method: 'POST',
        body: JSON.stringify({ content: resolutionText.trim() })
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const result = await apiCall(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo agregar el comentario'); return; }
      setCommentText('');
      toast.success('Comentario agregado');
      await loadComments();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return (
      <SupportShell title="Cargando ticket..." breadcrumbs={[
        { label: homeLabel, to: homePath },
        { label: 'Cargando...' }
      ]}>
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

  const authorEmail = staff ? (ticket.user_email || '—') : getEmail();

  const metaSubtitle = [
    `Por: ${authorEmail}`,
    ticket.group_name ? `Grupo: ${ticket.group_name}` : null,
    `Creado: ${formatDateTime(ticket.created_at)}`,
    ticket.updated_at && ticket.updated_at !== ticket.created_at
      ? `Actualizado: ${formatDateTime(ticket.updated_at)}`
      : null
  ].filter(Boolean).join('  ·  ');

  const detailPanel = (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        {!editing ? (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={getTicketTypeLabel(ticket.type || 'incident')}
              color={getTicketTypeColor(ticket.type || 'incident')}
              size="small"
            />
            <Chip label={getStatusLabel(ticket.status)} color={getStatusColor(ticket.status)} size="small" />
            {isIncident(ticket.type) && (
              <>
                <Chip label={getPriorityLabel(ticket.priority)} variant="outlined" size="small" />
                {ticket.sla_status && (
                  <Chip
                    label={getSlaStatusLabel(ticket.sla_status)}
                    color={getSlaStatusColor(ticket.sla_status)}
                    size="small"
                  />
                )}
              </>
            )}
          </Stack>
        ) : (
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Editando ticket
          </Typography>
        )}
        {(admin || technician) && (
          !editing ? (
            <Tooltip title="Editar ticket">
              <IconButton size="small" onClick={() => setEditing(true)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Guardar cambios">
                <span>
                  <IconButton size="small" color="primary" disabled={saving} onClick={handleSave}>
                    <SaveIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Cancelar">
                <IconButton size="small" disabled={saving} onClick={handleCancelEdit}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )
        )}
      </Box>

      {editing ? (
        <Stack spacing={2.5}>
          {admin && (
            <>
              <TextField
                fullWidth
                label="Asunto"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                minRows={6}
              />
            </>
          )}

          {(admin || technician) && (
            <TextField
              select
              fullWidth
              label="Estado"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              {TICKET_STATUS_OPTIONS.filter((s) => admin || s.value !== 'on-hold').map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          )}

          {!staff && (
            <>
              <TextField
                fullWidth
                label="Asunto"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                minRows={6}
              />
            </>
          )}

          {admin && (
            <>
              <Divider />
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                Clasificación
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Tipo"
                  value={formData.type}
                  onChange={(e) => {
                    const nextType = e.target.value;
                    setFormData({
                      ...formData,
                      type: nextType,
                      priority: isIncident(nextType) ? (formData.priority || 'medium') : 'medium'
                    });
                  }}
                >
                  {TICKET_TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </TextField>
                {isIncident(formData.type) && (
                  <TextField
                    select
                    fullWidth
                    label="Prioridad"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <MenuItem value="low">Baja</MenuItem>
                    <MenuItem value="medium">Media</MenuItem>
                    <MenuItem value="high">Alta</MenuItem>
                  </TextField>
                )}
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Categoría"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                >
                  <MenuItem value=""><em>Sin categoría</em></MenuItem>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Subcategoría"
                  value={formData.subcategory}
                  disabled={!formData.category}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                >
                  <MenuItem value=""><em>Sin subcategoría</em></MenuItem>
                  {availableSubcategories.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            </>
          )}

          <Box sx={{ display: 'flex', gap: 1, pt: 0.5 }}>
            <Button variant="contained" disabled={saving} onClick={handleSave}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button variant="text" disabled={saving} onClick={handleCancelEdit}>
              Cancelar
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            {ticket.description}
          </Typography>

          {isIncident(ticket.type) && (
            <>
              <Divider />
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  SLA
                </Typography>
                {ticket.status === 'on-hold' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Temporizador pausado mientras el ticket está en espera.
                  </Typography>
                )}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                  <Typography variant="body2">
                    <strong>Respuesta:</strong> {formatSlaDeadline(ticket.sla_response_due)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Resolución:</strong> {formatSlaDeadline(ticket.sla_resolution_due)}
                  </Typography>
                </Stack>
              </Box>
            </>
          )}

          {staff && (ticket.category || ticket.subcategory) && (
            <>
              <Divider />
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Clasificación
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {ticket.category || '—'}
                  {ticket.subcategory ? ` · ${ticket.subcategory}` : ''}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      )}

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Comentarios ({comments.length})
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 2, maxHeight: 320, overflowY: 'auto' }}>
        {comments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin comentarios todavía. Agregá una nota de seguimiento.
          </Typography>
        ) : (
          comments.map((comment) => (
            <Box key={comment.id} sx={{ p: 1.5, bgcolor: '#fafbfc', borderRadius: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {comment.email} · {formatDateTime(comment.created_at)}
                </Typography>
                {admin && editingCommentId !== comment.id && (
                  <Stack direction="row" spacing={0.25}>
                    <Tooltip title="Editar">
                      <IconButton size="small" disabled={busyCommentId === comment.id}
                        onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}>
                        <EditIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" disabled={busyCommentId === comment.id}
                        onClick={() => handleDeleteComment(comment.id)}>
                        <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Box>
              {admin && editingCommentId === comment.id ? (
                <Stack spacing={1}>
                  <TextField
                    fullWidth multiline size="small"
                    value={editingCommentText}
                    onChange={(e) => setEditingCommentText(e.target.value)}
                    autoFocus
                  />
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" disabled={busyCommentId === comment.id}
                      onClick={() => handleEditComment(comment.id)}>
                      Guardar
                    </Button>
                    <Button size="small" variant="text" onClick={() => setEditingCommentId(null)}>
                      Cancelar
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </Typography>
              )}
            </Box>
          ))
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box component="form" onSubmit={handleAddComment}>
        <TextField fullWidth multiline minRows={3}
          placeholder="Escribí un comentario o actualización..."
          value={commentText} onChange={(e) => setCommentText(e.target.value)}
          size="small" sx={{ mb: 1.5 }} />
        <Button type="submit" variant="contained" size="small" startIcon={<SendIcon />}
          disabled={postingComment || !commentText.trim()}>
          {postingComment ? 'Enviando...' : 'Agregar comentario'}
        </Button>
      </Box>
    </>
  );

  const historyPanel = (
    <Stack spacing={1.5} sx={{ maxHeight: 520, overflowY: 'auto' }}>
      {history.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Sin registros todavía. Los cambios futuros quedarán acá.
        </Typography>
      ) : (
        history.map((entry) => (
          <Box key={entry.id} sx={{ p: 1.5, bgcolor: '#fafbfc', borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              {entry.email} · {formatDateTime(entry.created_at)}
            </Typography>
            <Typography variant="body2">{formatHistoryEntry(entry)}</Typography>
          </Box>
        ))
      )}
    </Stack>
  );

  const resolutionPanel = staff ? (
    <Stack spacing={2}>
      {resolution && (
        <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Resuelto por {resolution.resolved_by_email} · {formatDateTime(resolution.updated_at || resolution.created_at)}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {resolution.content}
          </Typography>
        </Box>
      )}
      <TextField
        fullWidth
        multiline
        minRows={6}
        label={resolution ? 'Actualizar resolución' : 'Registrar resolución'}
        value={resolutionText}
        onChange={(e) => setResolutionText(e.target.value)}
        placeholder="Describí cómo se resolvió el ticket..."
      />
      <Box>
        <Button
          variant="contained"
          disabled={savingResolution || !resolutionText.trim()}
          onClick={handleSaveResolution}
        >
          {savingResolution ? 'Guardando...' : resolution ? 'Actualizar resolución' : 'Registrar resolución'}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Al guardar, el ticket pasará a estado resuelto con tu nombre y la fecha actual.
        </Typography>
      </Box>
    </Stack>
  ) : resolution ? (
    <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Resuelto por {resolution.resolved_by_email} · {formatDateTime(resolution.updated_at || resolution.created_at)}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {resolution.content}
      </Typography>
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
      breadcrumbs={[
        { label: homeLabel, to: homePath },
        ...(staff && !admin ? [] : admin ? [] : [{ label: 'Solicitudes', to: '/tickets' }]),
        ...(technician ? [{ label: 'Cola', to: '/technician' }] : []),
        { label: `#${ticket.id}` }
      ]}
    >
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Detalle" />
          <Tab label={`Historial (${history.length})`} />
          <Tab label="Resolución" />
        </Tabs>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {activeTab === 0 && detailPanel}
          {activeTab === 1 && historyPanel}
          {activeTab === 2 && resolutionPanel}
        </Box>
      </Paper>
    </SupportShell>
  );
}
