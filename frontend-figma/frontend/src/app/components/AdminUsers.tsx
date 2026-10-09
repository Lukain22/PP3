import { useEffect, useMemo, useState } from 'react';
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
  Link,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
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

const denseTableSx = {
  '& .MuiTableCell-root': {
    py: 0.5,
    px: 1,
    fontSize: '0.8125rem',
    lineHeight: 1.3
  },
  '& .MuiTableCell-head': {
    py: 0.625,
    fontSize: '0.75rem',
    fontWeight: 600,
    bgcolor: '#fafbfc'
  },
  '& .MuiChip-root': {
    height: 22,
    fontSize: '0.75rem'
  }
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const groups = user.groups?.map((group) => group.name).join(' ') || '';
      const profile = ROLE_LABELS[user.role] || user.role;
      return [String(user.id), user.email, profile, groups].join(' ').toLowerCase().includes(query);
    });
  }, [users, search]);

  return (
    <SupportShell
      compact
      title="Usuarios"
      backTo="/admin"
      headerActionInline
      headerAction={
        <TextField
          size="small"
          placeholder="Buscar por correo, perfil o grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 320 }, '& .MuiInputBase-root': { height: 30 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            )
          }}
        />
      }
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table stickyHeader size="small" sx={denseTableSx}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 64 }}>#</TableCell>
                  <TableCell>Correo</TableCell>
                  <TableCell sx={{ width: 160 }}>Perfil</TableCell>
                  <TableCell>Grupos</TableCell>
                  <TableCell sx={{ width: 140 }}>Registrado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {search.trim() ? 'Sin resultados para esa búsqueda.' : 'No hay usuarios.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : visibleUsers.map((user) => {
                  const groupNames = user.groups?.map((group) => group.name).join(', ') || '';
                  return (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                    >
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{user.id}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Link
                          component="button"
                          underline="hover"
                          variant="body2"
                          noWrap
                          title={user.email}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${user.id}`);
                          }}
                          sx={{ display: 'block', maxWidth: '100%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}
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
                      <TableCell sx={{ maxWidth: 360 }}>
                        {user.role === 'technician' && groupNames ? (
                          <Typography variant="caption" noWrap title={groupNames}>
                            {groupNames}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(user.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{
              flexShrink: 0,
              px: 1.5,
              py: 0.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: '#fafbfc'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {search.trim() && visibleUsers.length !== users.length
                ? `${visibleUsers.length} de ${users.length} usuarios`
                : `${users.length} usuario${users.length === 1 ? '' : 's'}`}
            </Typography>
          </Box>
        </Paper>
      )}
      </Box>
    </SupportShell>
  );
}
