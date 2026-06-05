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
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'sonner';
import SupportShell from './SupportShell';

const API_URL = 'http://localhost:3000';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  user_id: number;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  user_id: number;
  email: string;
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium'
  });

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return null;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      navigate('/');
      return null;
    }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const loadTicket = async () => {
    const result = await apiCall(`/tickets/${id}`);
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'Ticket no encontrado');
      navigate('/tickets');
      return;
    }
    setTicket(result.data);
    setFormData({
      title: result.data.title,
      description: result.data.description,
      status: result.data.status,
      priority: result.data.priority
    });
  };

  const loadComments = async () => {
    const result = await apiCall(`/tickets/${id}/comments`);
    if (!result) return;
    if (result.response.ok) {
      setComments(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/');
      return;
    }

    Promise.all([loadTicket(), loadComments()]).finally(() => setLoading(false));
  }, [id, navigate]);

  const getStatusLabel = (status: string) => {
    if (status === 'open') return 'Abierto';
    if (status === 'in-progress') return 'En proceso';
    if (status === 'resolved') return 'Resuelto';
    return status;
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    if (status === 'open') return 'warning';
    if (status === 'in-progress') return 'info';
    if (status === 'resolved') return 'success';
    return 'default';
  };

  const getPriorityLabel = (priority: string) => {
    if (priority === 'high') return 'Alta';
    if (priority === 'medium') return 'Media';
    if (priority === 'low') return 'Baja';
    return priority;
  };

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Título y descripción son requeridos');
      return;
    }

    setSaving(true);
    try {
      const result = await apiCall(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar');
        return;
      }
      toast.success('Ticket actualizado');
      setEditing(false);
      await loadTicket();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
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
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo agregar el comentario');
        return;
      }
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
      <SupportShell title="Detalle del ticket" breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Solicitudes', to: '/tickets' }, { label: 'Cargando...' }]}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </SupportShell>
    );
  }

  if (!ticket) return null;

  return (
    <SupportShell
      title={`Ticket #${ticket.id}`}
      subtitle={ticket.title}
      breadcrumbs={[
        { label: 'Inicio', to: '/dashboard' },
        { label: 'Solicitudes', to: '/tickets' },
        { label: `#${ticket.id}` }
      ]}
    >
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tickets')} sx={{ mb: 2 }}>
        Volver al listado
      </Button>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 360px' }, gap: 2.5, alignItems: 'start' }}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={getStatusLabel(ticket.status)} color={getStatusColor(ticket.status)} size="small" />
              <Chip label={getPriorityLabel(ticket.priority)} variant="outlined" size="small" />
            </Stack>
            {!editing ? (
              <Tooltip title="Editar ticket">
                <IconButton size="small" onClick={() => setEditing(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Guardar">
                  <span>
                    <IconButton size="small" color="primary" disabled={saving} onClick={handleSave}>
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Cancelar">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        title: ticket.title,
                        description: ticket.description,
                        status: ticket.status,
                        priority: ticket.priority
                      });
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Box>

          {editing ? (
            <Stack spacing={2}>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <MenuItem value="open">Abierto</MenuItem>
                  <MenuItem value="in-progress">En proceso</MenuItem>
                  <MenuItem value="resolved">Resuelto</MenuItem>
                </TextField>
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
              </Stack>
            </Stack>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                {ticket.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                {ticket.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Creado: {formatDateTime(ticket.created_at)}
                {ticket.updated_at && ticket.updated_at !== ticket.created_at && (
                  <> · Actualizado: {formatDateTime(ticket.updated_at)}</>
                )}
              </Typography>
            </>
          )}
        </Paper>

        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
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
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {comment.email} · {formatDateTime(comment.created_at)}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                </Box>
              ))
            )}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box component="form" onSubmit={handleAddComment}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Escribí un comentario o actualización..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              size="small"
              sx={{ mb: 1.5 }}
            />
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={<SendIcon />}
              disabled={postingComment || !commentText.trim()}
            >
              {postingComment ? 'Enviando...' : 'Agregar comentario'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </SupportShell>
  );
}
