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
  Stack,
  Link
} from '@mui/material';
import SupportShell from './SupportShell';
import { getToken, clearAuth, type UserRole } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface UserGroup {
  id: number;
  name: string;
}

interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
  groups?: UserGroup[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Usuario',
  admin: 'Administrador',
  technician: 'Técnico'
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    setLoading(true);
    const result = await apiCall('/admin/users');
    if (result?.response.ok) {
      setUsers(Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <SupportShell
      title="Gestión de usuarios y técnicos"
      subtitle={loading ? 'Cargando...' : `${users.length} usuario${users.length === 1 ? '' : 's'} registrados`}
      breadcrumbs={[
        { label: 'Admin', to: '/admin' },
        { label: 'Usuarios' }
      ]}
    >
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
                <TableCell sx={{ fontWeight: 600, width: 140 }}>Rol</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Grupos</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>Registrado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{user.id}</TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      underline="hover"
                      variant="body2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/users/${user.id}`);
                      }}
                    >
                      {user.email}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ROLE_LABELS[user.role] || user.role}
                      color={user.role === 'admin' ? 'primary' : user.role === 'technician' ? 'info' : 'default'}
                      size="small"
                      variant={user.role === 'user' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.role === 'technician' && user.groups?.length ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {user.groups.map((g) => (
                          <Chip key={g.id} label={g.name} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(user.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SupportShell>
  );
}
