import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

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
    if (response.status === 403) { navigate('/dashboard'); return null; }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  useEffect(() => {
    apiCall('/admin/users').then((result) => {
      if (result?.response.ok) {
        setUsers(Array.isArray(result.data) ? result.data : []);
      }
      setLoading(false);
    });
  }, []);

  const handleRoleToggle = async (userId: number, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const label = newRole === 'admin' ? 'administrador' : 'usuario';

    if (!window.confirm(`¿Cambiar el rol de este usuario a "${label}"?`)) return;

    setBusyId(userId);
    try {
      const result = await apiCall(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo cambiar el rol');
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success(`Rol actualizado a ${label}`);
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <SupportShell
      title="Gestión de usuarios"
      subtitle={loading ? 'Cargando...' : `${users.length} usuario${users.length === 1 ? '' : 's'} registrados`}
      breadcrumbs={[
        { label: 'Admin', to: '/admin' },
        { label: 'Usuarios' }
      ]}
    >
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin')} sx={{ mb: 2 }}>
        Volver al panel
      </Button>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafbfc' }}>
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Correo</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>Registrado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 160 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{user.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role === 'admin' ? 'Admin' : 'Usuario'}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                      variant={user.role === 'admin' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(user.created_at)}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button
                        size="small"
                        variant="outlined"
                        color={user.role === 'admin' ? 'warning' : 'primary'}
                        disabled={busyId === user.id}
                        onClick={() => handleRoleToggle(user.id, user.role)}
                      >
                        {user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SupportShell>
  );
}
