import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Box,
  Container,
  Paper,
  TextField,
  MenuItem
} from '@mui/material';
import { toast } from 'sonner';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function CreateTicket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open'
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Mock ticket creation
    toast.success('Solicitud enviada correctamente');

    // Redirect to tickets list after a short delay
    setTimeout(() => {
      navigate('/tickets');
    }, 1000);
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      <AppBar position="static" color="primary" elevation={0} sx={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexGrow: 1, minWidth: 0 }}>
            <Box
              component="img"
              alt="Logo"
              src="/logo-itb.png"
              sx={{
                height: 28,
                width: 28,
                borderRadius: 1,
                bgcolor: 'rgba(255,255,255,0.92)',
                p: 0.5
              }}
            />
            <Typography variant="h6" component="div" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Soporte Técnico
            </Typography>
          </Box>

          <Tooltip title="Créditos">
            <IconButton
              color="inherit"
              onClick={() => navigate('/credits')}
              size="small"
              sx={{
                mr: 0.75,
                bgcolor: 'rgba(255,255,255,0.12)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar Sesión
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ mb: 2.5, fontWeight: 500 }}>
          Crear Nueva Solicitud de Soporte
        </Typography>

        <Paper sx={{ p: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Asunto"
                value={formData.title}
                onChange={handleChange('title')}
                required
                placeholder="Ej: Problema con acceso a plataforma"
              />

              <TextField
                fullWidth
                label="Descripción del problema"
                value={formData.description}
                onChange={handleChange('description')}
                required
                multiline
                rows={5}
                placeholder="Describe tu problema con el mayor detalle posible"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  select
                  label="Prioridad"
                  value={formData.priority}
                  onChange={handleChange('priority')}
                  required
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </TextField>

                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={formData.status}
                  onChange={handleChange('status')}
                  required
                >
                  <MenuItem value="open">Abierto</MenuItem>
                  <MenuItem value="in-progress">En Proceso</MenuItem>
                  <MenuItem value="resolved">Resuelto</MenuItem>
                </TextField>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ flex: 1 }}
                >
                  Enviar Solicitud
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  sx={{ px: 3 }}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
