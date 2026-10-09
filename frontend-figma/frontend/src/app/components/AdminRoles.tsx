import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface RoleRow {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_system: boolean;
  user_count: number;
  created_at: string;
}

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

export default function AdminRoles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
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
    if (response.status === 403) {
      toast.error('No tenés permiso para esta acción');
      return { response, data: {} };
    }

    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const loadRoles = async () => {
    setLoading(true);
    const result = await apiCall('/admin/roles');
    if (result?.response.ok) setRoles(Array.isArray(result.data) ? result.data : []);
    setLoading(false);
  };

  useEffect(() => { loadRoles(); }, []);

  const toggleActive = async (role: RoleRow) => {
    setBusyId(role.id);
    const result = await apiCall(`/admin/roles/${role.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !role.is_active })
    });
    setBusyId(null);
    if (!result?.response.ok) {
      toast.error(result?.data?.message || 'No se pudo cambiar el estado');
      return;
    }
    toast.success(role.is_active ? 'Rol desactivado' : 'Rol activado');
    loadRoles();
  };

  const duplicate = async (role: RoleRow) => {
    setBusyId(role.id);
    const result = await apiCall(`/admin/roles/${role.id}/duplicate`, { method: 'POST' });
    setBusyId(null);
    if (!result?.response.ok) {
      toast.error(result?.data?.message || 'No se pudo duplicar');
      return;
    }
    toast.success('Rol duplicado');
    navigate(`/admin/roles/${result.data.id}`);
  };

  const remove = async (role: RoleRow) => {
    if (role.is_system) return;
    if (!window.confirm(`¿Eliminar el rol "${role.name}"?`)) return;
    setBusyId(role.id);
    const result = await apiCall(`/admin/roles/${role.id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!result?.response.ok) {
      toast.error(result?.data?.message || 'No se pudo eliminar');
      return;
    }
    toast.success('Rol eliminado');
    loadRoles();
  };

  const visibleRoles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => {
      const status = role.is_active ? 'activo' : 'inactivo';
      const system = role.is_system ? 'sistema' : '';
      return [role.name, role.description || '', status, system, String(role.user_count)].join(' ').toLowerCase().includes(query);
    });
  }, [roles, search]);

  return (
    <SupportShell
      compact
      title="Roles"
      backTo="/admin"
      headerActionInline
      headerActionGrow
      headerAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', width: '100%' }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre o descripción..."
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
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/admin/roles/new')} sx={{ height: 30, ml: 'auto' }}>
            Nuevo rol
          </Button>
        </Box>
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell sx={{ width: 120 }}>Usuarios</TableCell>
                  <TableCell sx={{ width: 140 }}>Estado</TableCell>
                  <TableCell sx={{ width: 160 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {search.trim() ? 'Sin resultados para esa búsqueda.' : 'No hay roles.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : visibleRoles.map((role) => (
                  <TableRow key={role.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap title={role.name} sx={{ fontWeight: 600 }}>{role.name}</Typography>
                        {role.is_system && <Chip label="Sistema" size="small" variant="outlined" />}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="body2" color="text.secondary" noWrap title={role.description || ''}>
                        {role.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{role.user_count}</TableCell>
                    <TableCell>
                      <Chip
                        label={role.is_active ? 'Activo' : 'Inactivo'}
                        color={role.is_active ? 'success' : 'default'}
                        size="small"
                        variant={role.is_active ? 'filled' : 'outlined'}
                        onClick={() => toggleActive(role)}
                        disabled={busyId === role.id}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => navigate(`/admin/roles/${role.id}`)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicar">
                        <IconButton size="small" disabled={busyId === role.id} onClick={() => duplicate(role)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={role.is_system ? 'Los roles del sistema no se eliminan' : 'Eliminar'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={role.is_system || busyId === role.id}
                            onClick={() => remove(role)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
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
              {search.trim() && visibleRoles.length !== roles.length
                ? `${visibleRoles.length} de ${roles.length} roles`
                : `${roles.length} rol${roles.length === 1 ? '' : 'es'}`}
            </Typography>
          </Box>
        </Paper>
      )}
      </Box>
    </SupportShell>
  );
}
