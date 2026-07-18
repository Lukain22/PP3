import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { toast } from 'sonner';
import { setAuth, getHomePath, type UserRole } from '../../lib/auth';

const API_URL = `${import.meta.env.VITE_API_URL as string}/auth`;

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Login incorrecto');
        return;
      }

      setAuth(data.token, (data.role as UserRole) || 'user');
      navigate(getHomePath());
    } catch (error) {
      console.error(error);
      toast.error('Error conectando con el backend');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.message ||
          (data.code === 'ER_DUP_ENTRY'
            ? 'Este correo ya está registrado'
            : 'No se pudo registrar el usuario');
        toast.error(message);
        return;
      }

      toast.success(data.message || 'Usuario registrado');
      setPassword('');
      setConfirmPassword('');
      setTab(0);
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
            Sistema de Soporte Técnico
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Portal de Tickets
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Iniciar sesión" />
            <Tab label="Registro" />
          </Tabs>

          {tab === 0 ? (
            <form onSubmit={handleLogin}>
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
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                size="medium"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 2.5, py: 1.2 }}
              >
                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
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
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                size="medium"
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
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{ mt: 2.5, py: 1.2 }}
              >
                {loading ? 'Registrando...' : 'Registrar usuario'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
