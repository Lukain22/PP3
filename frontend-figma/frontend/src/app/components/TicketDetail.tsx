import React, { useEffect, useState } from 'react';
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
import LabelIcon from '@mui/icons-material/Label';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth, isAdmin } from '../../lib/auth';
import { CATEGORIES, SUBCATEGORIES, type Category } from '../../lib/categories';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: string | null;
  subcategory?: string | null;
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
  const admin = isAdmin();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [savingClassif, setSavingClassif] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium'
  });

  const [classif, setClassif] = useState<{ category: string; subcategory: string }>({
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
    const result = await apiCall(`/tickets/${id}`);
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'Ticket no encontrado');
      navigate(admin ? '/admin' : '/tickets');
      return;
    }
    setTicket(result.data);
    setFormData({
      title: result.data.title,
      description: result.data.description,
      status: result.data.status,
      priority: result.data.priority
    });
    if (admin) {
      setClassif({
        category: result.data.category || '',
        subcategory: result.data.subcategory || ''
      });
    }
  };

  const loadComments = async () => {
    const result = await apiCall(`/tickets/${id}/comments`);
    if (!result) return;
    if (result.response.ok) {
      setComments(Array.isArray(result.data) ? result.data : []);
    }
  };

  useEffect(() => {
    if (!getToken()) { navigate('/'); return; }
    Promise.all([loadTicket(), loadComments()]).finally(() => setLoading(false));
  }, [id]);

  const getStatusLabel = (s: string) =>
    s === 'open' ? 'Abierto' : s === 'in-progress' ? 'En proceso' : s === 'resolved' ? 'Resuelto' : s;

  const getStatusColor = (s: string): 'warning' | 'info' | 'success' | 'default' =>
    s === 'open' ? 'warning' : s === 'in-progress' ? 'info' : s === 'resolved' ? 'success' : 'default';

  const getPriorityLabel = (p: string) =>
    p === 'high' ? 'Alta' : p === 'medium' ? 'Media' : p === 'low' ? 'Baja' : p;

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo guardar'); return; }
      toast.success('Ticket actualizado');
      setEditing(false);
      await loadTicket();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClassif = async () => {
    setSavingClassif(true);
    try {
      const result = await apiCall(`/admin/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          category: classif.category || null,
          subcategory: classif.subcategory || null
        })
      });
      if (!result) return;
      if (!result.response.ok) { toast.error(result.data.message || 'No se pudo guardar la clasificación'); return; }
      toast.success('Clasificación guardada');
      await loadTicket();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSavingClassif(false);
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

  const backPath = admin ? '/admin' : '/tickets';
  const backLabel = admin ? 'Volver al panel' : 'Volver al listado';

  if (loading) {
    return (
      <SupportShell title="Detalle del ticket" breadcrumbs={[
        { label: admin ? 'Admin' : 'Inicio', to: admin ? '/admin' : '/dashboard' },
        { label: 'Cargando...' }
      ]}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </SupportShell>
    );
  }

  if (!ticket) return null;

  const availableSubcategories = classif.category
    ? SUBCATEGORIES[classif.category as Category] ?? []
    : [];

  return (
    <SupportShell
      title={`Ticket #${ticket.id}`}
      subtitle={ticket.title}
      breadcrumbs={[
        { label: admin ? 'Admin' : 'Inicio', to: admin ? '/admin' : '/dashboard' },
        ...(admin ? [] : [{ label: 'Solicitudes', to: '/tickets' }]),
        { label: `#${ticket.id}` }
      ]}
    >
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(backPath)} sx={{ mb: 2 }}>
        {backLabel}
      </Button>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 360px' }, gap: 2.5, alignItems: 'start' }}>

        {/* Panel principal del ticket */}
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
                  <IconButton size="small" onClick={() => {
                    setEditing(false);
                    setFormData({ title: ticket.title, description: ticket.description, status: ticket.status, priority: ticket.priority });
                  }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Box>

          {editing ? (
            <Stack spacing={2}>
              <TextField fullWidth label="Asunto" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              <TextField fullWidth label="Descripción" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline minRows={6} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField select fullWidth label="Estado" value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <MenuItem value="open">Abierto</MenuItem>
                  <MenuItem value="in-progress">En proceso</MenuItem>
                  <MenuItem value="resolved">Resuelto</MenuItem>
                </TextField>
                <TextField select fullWidth label="Prioridad" value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          ) : (
            <>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>{ticket.title}</Typography>
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

        {/* Columna derecha */}
        <Stack spacing={2.5}>
          {/* Comentarios */}
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
              <TextField fullWidth multiline minRows={3}
                placeholder="Escribí un comentario o actualización..."
                value={commentText} onChange={(e) => setCommentText(e.target.value)}
                size="small" sx={{ mb: 1.5 }} />
              <Button type="submit" variant="contained" size="small" startIcon={<SendIcon />}
                disabled={postingComment || !commentText.trim()}>
                {postingComment ? 'Enviando...' : 'Agregar comentario'}
              </Button>
            </Box>
          </Paper>

          {/* Clasificación interna — solo admin */}
          {admin && (
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 2,
                bgcolor: '#f5f8ff'
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <LabelIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Clasificación interna
                </Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Categoría"
                  value={classif.category}
                  onChange={(e) => setClassif({ category: e.target.value, subcategory: '' })}
                >
                  <MenuItem value=""><em>Sin categoría</em></MenuItem>
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Subcategoría"
                  value={classif.subcategory}
                  disabled={!classif.category}
                  onChange={(e) => setClassif({ ...classif, subcategory: e.target.value })}
                >
                  <MenuItem value=""><em>Sin subcategoría</em></MenuItem>
                  {availableSubcategories.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="contained"
                  size="small"
                  disabled={savingClassif}
                  onClick={handleSaveClassif}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  {savingClassif ? 'Guardando...' : 'Guardar clasificación'}
                </Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </SupportShell>
  );
}
