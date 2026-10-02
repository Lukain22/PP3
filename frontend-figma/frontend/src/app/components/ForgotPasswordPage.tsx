import { useState } from 'react';
import { useNavigate } from 'react-router';
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'No se pudo enviar el correo');
        return;
      }

      setSent(true);
      toast.success(data.message || 'Revisá tu correo');
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
            Recuperar contraseña
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Ingresá el correo con el que te registraste. Si existe una cuenta, te enviamos un enlace.
          </Typography>

          {sent ? (
            <>
              <Typography variant="body2" align="center" sx={{ mb: 3 }}>
                Si el correo está registrado, vas a recibir un mail con el enlace. Revisá también la carpeta de spam.
                El remitente será Sistema de Soporte (Resend).
              </Typography>
              <Button fullWidth variant="contained" onClick={() => navigate('/')}>
                Volver al inicio de sesión
              </Button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Correo Institucional"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
                size="medium"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 2.5, py: 1.2 }}
              >
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/')}
                sx={{ mt: 1 }}
              >
                Volver al inicio de sesión
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
