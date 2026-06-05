import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'sonner';
import UiModeToggle from '../UiModeToggle';

const API_URL = 'http://localhost:3000';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: number;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  email: string;
}

export default function TicketDetailClassic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/tickets/${id}`, { headers }),
      fetch(`${API_URL}/tickets/${id}/comments`, { headers })
    ])
      .then(async ([ticketRes, commentsRes]) => {
        if (ticketRes.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        if (!ticketRes.ok) {
          toast.error('Ticket no encontrado');
          navigate('/tickets');
          return;
        }
        setTicket(await ticketRes.json());
        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => toast.error('Error al cargar el ticket'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/tickets/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: commentText.trim() })
      });

      if (!response.ok) {
        toast.error('No se pudo agregar el comentario');
        return;
      }

      setCommentText('');
      toast.success('Comentario agregado');

      const commentsRes = await fetch(`${API_URL}/tickets/${id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (commentsRes.ok) {
        setComments(await commentsRes.json());
      }
    } catch {
      toast.error('Error conectando con el backend');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!ticket) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static" sx={{ bgcolor: '#1976d2' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Ticket #{ticket.id}
          </Typography>
          <UiModeToggle />
          <Button color="inherit" onClick={() => navigate('/tickets')}>
            Volver
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/tickets')} sx={{ mb: 2 }}>
          Listado
        </Button>

        <Paper sx={{ p: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={ticket.status} size="small" />
            <Chip label={ticket.priority} size="small" variant="outlined" />
          </Box>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {ticket.title}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
            {ticket.description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(ticket.created_at).toLocaleString('es-ES')}
          </Typography>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Comentarios
          </Typography>
          {comments.map((c) => (
            <Box key={c.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
              <Typography variant="caption" color="text.secondary">
                {c.email} — {new Date(c.created_at).toLocaleString('es-ES')}
              </Typography>
              <Typography variant="body2">{c.content}</Typography>
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box component="form" onSubmit={handleAddComment}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Nuevo comentario"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" disabled={!commentText.trim()}>
              Agregar
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
