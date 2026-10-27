import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Container
} from '@mui/material';
import { toast } from 'sonner';

const API_URL = `${import.meta.env.VITE_API_URL as string}/auth`;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('El enlace no es válido. Pedí uno nuevo.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'No se pudo actualizar la contraseña');
        return;
      }

      toast.success(data.message || 'Contraseña actualizada');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Error conectando con el backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            component="img"
            alt="Logo"
            src="/logo-itb.png"
            sx={{ height: 64, width: 64, display: 'block', mx: 'auto', mb: 1.25 }}
          />
          <Typography variant="h5" component="h1" align="center" sx={{ mb: 0.5, fontWeight: 500 }}>
            Nueva contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            {token
              ? 'Elegí una contraseña nueva para tu cuenta.'
              : 'Este enlace no incluye un token válido. Volvé a pedir el restablecimiento.'}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoFocus
              size="medium"
              disabled={!token}
            />
            <TextField
              fullWidth
              label="Confirmar contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              size="medium"
              disabled={!token}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !token}
              sx={{ mt: 2.5, py: 1.2 }}
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </Button>
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/forgot-password')}
              sx={{ mt: 1 }}
            >
              Pedir un enlace nuevo
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
