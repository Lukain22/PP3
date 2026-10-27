import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TextField, Button, Card, CardContent, Typography, Box, Container, Tabs, Tab } from '@mui/material';
import { toast } from 'sonner';
import { setAuth, getHomePath, refreshAccess, type UserRole } from '../../lib/auth';
import { apiFetch } from '../../lib/api';
import { usePreferences } from '../PreferencesProvider';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || t('login.bad'));
        return;
      }

      setAuth(data.token, (data.role as UserRole) || 'user');
      await refreshAccess();
      navigate(getHomePath());
    } catch (error) {
      console.error(error);
      toast.error(t('login.offline'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t('login.mismatch'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('login.short'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.message || (data.code === 'ER_DUP_ENTRY' ? t('login.duplicate') : t('login.registerFail'));
        toast.error(message);
        return;
      }

      toast.success(data.message || t('login.registered'));
      setPassword('');
      setConfirmPassword('');
      setTab(0);
    } catch (error) {
      console.error(error);
      toast.error(t('login.offline'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}
    >
      <Card sx={{ width: '100%', maxWidth: 420, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            component="img"
            alt="Logo"
            src="/logo-itb.png"
            sx={{ height: 64, width: 64, display: 'block', mx: 'auto', mb: 1.25 }}
          />
          <Typography variant="h5" component="h1" align="center" sx={{ mb: 0.5, fontWeight: 500 }}>
            {t('login.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
            {t('login.subtitle')}
          </Typography>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="fullWidth"
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={t('login.signIn')} />
            <Tab label={t('login.register')} />
          </Tabs>

          {tab === 0 ? (
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                label={t('login.email')}
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
                label={t('login.password')}
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
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
              <Button fullWidth variant="text" onClick={() => navigate('/forgot-password')} sx={{ mt: 1 }}>
                {t('login.forgot')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <TextField
                fullWidth
                label={t('login.email')}
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
                label={t('login.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                size="medium"
              />
              <TextField
                fullWidth
                label={t('login.confirm')}
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
                {loading ? t('login.registering') : t('login.registerSubmit')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
