import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { toast } from 'sonner';
import SupportShell from './SupportShell';

const API_URL = import.meta.env.VITE_API_URL as string;

const priorityOptions = [
  { value: 'low', label: 'Baja', hint: 'Consulta general' },
  { value: 'medium', label: 'Media', hint: 'Afecta tu trabajo' },
  { value: 'high', label: 'Alta', hint: 'Bloqueo crítico' }
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open'
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Completá el asunto y la descripción');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      if (!response.ok) {
        toast.error(data.message || 'No se pudo crear el ticket');
        return;
      }

      toast.success('Solicitud enviada correctamente');
      navigate('/tickets');
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupportShell
      maxWidth="lg"
      title="Nueva solicitud"
      subtitle="Describí el problema con el mayor detalle posible, como en un portal de soporte."
      breadcrumbs={[
        { label: 'Inicio', to: '/dashboard' },
        { label: 'Nueva solicitud' }
      ]}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 320px' },
          gap: 2.5,
          alignItems: 'start'
        }}
      >
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 600 }}>
            Paso 1 — Detalle
          </Typography>
          <TextField
            fullWidth
            label="Asunto"
            value={formData.title}
            onChange={handleChange('title')}
            required
            placeholder="Ej: No puedo acceder al campus virtual"
            sx={{ mt: 2, mb: 2.5 }}
          />
          <TextField
            fullWidth
            label="Descripción"
            value={formData.description}
            onChange={handleChange('description')}
            required
            multiline
            minRows={8}
            placeholder="¿Qué pasó? ¿Cuándo empezó? ¿Qué intentaste hacer?"
            helperText="Incluí mensajes de error, navegador o dispositivo si aplica."
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="overline" color="primary" sx={{ fontWeight: 600 }}>
            Paso 2 — Prioridad
          </Typography>
          <ToggleButtonGroup
            exclusive
            fullWidth
            value={formData.priority}
            onChange={(_, val) => val && setFormData({ ...formData, priority: val })}
            sx={{ mt: 2 }}
          >
            {priorityOptions.map((p) => (
              <ToggleButton key={p.value} value={p.value} sx={{ flex: 1, py: 1.25, flexDirection: 'column' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {p.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.hint}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#fafbfc' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Antes de enviar
            </Typography>
            <List dense disablePadding>
              {[
                'Un asunto claro ayuda a priorizar tu caso.',
                'Los tickets urgentes deben describir el impacto.',
                'Podés adjuntar capturas en la descripción (texto).'
              ].map((text) => (
                <ListItem key={text} disableGutters sx={{ alignItems: 'flex-start' }}>
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.25 }}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              position: { md: 'sticky' },
              top: 16
            }}
          >
            <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
              {loading ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
            <Button fullWidth variant="text" sx={{ mt: 1 }} onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
          </Paper>
        </Box>
      </Box>
    </SupportShell>
  );
}
