import { useEffect, useState } from 'react';
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
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

export default function AdminRoles() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<RoleRow[]>([]);
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

  return (
    <SupportShell
      title="Roles y permisos"
      subtitle={loading ? 'Cargando...' : `${roles.length} rol${roles.length === 1 ? '' : 'es'}`}
      backTo="/admin"
      headerAction={
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/roles/new')}>
          Nuevo rol
        </Button>
      }
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
                <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Usuarios</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 140 }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 180 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{role.name}</Typography>
                      {role.is_system && <Chip label="Sistema" size="small" variant="outlined" />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
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
      )}
    </SupportShell>
  );
}
