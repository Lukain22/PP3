import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth, type UserRole } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface GroupOption {
  id: number;
  name: string;
}

interface UserGroup {
  id: number;
  name: string;
}

interface UserDetail {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
  groups: UserGroup[];
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Usuario',
  admin: 'Administrador',
  technician: 'Técnico'
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [allGroups, setAllGroups] = useState<GroupOption[]>([]);

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

  const loadUser = async () => {
    setLoading(true);
    const [userResult, groupsResult] = await Promise.all([
      apiCall(`/admin/users/${id}`),
      apiCall('/admin/groups')
    ]);

    if (!userResult) return;

    if (!userResult.response.ok) {
      toast.error(userResult.data.message || 'Usuario no encontrado');
      navigate('/admin/users');
      return;
    }

    const user = userResult.data as UserDetail;
    setEmail(user.email);
    setCreatedAt(user.created_at);
    setRole(user.role);
    setGroupIds(user.groups?.map((g) => g.id) || []);

    if (groupsResult?.response.ok) {
      setAllGroups(Array.isArray(groupsResult.data) ? groupsResult.data : []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!getToken()) { navigate('/'); return; }
    loadUser();
  }, [id]);

  const handleSave = async () => {
    if (role === 'technician' && groupIds.length === 0) {
      toast.error('Un técnico debe pertenecer al menos a un grupo');
      return;
    }

    setSaving(true);
    try {
      const result = await apiCall(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({
          role,
          group_ids: role === 'technician' ? groupIds : []
        })
      });

      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo actualizar');
        return;
      }

      toast.success('Usuario actualizado');
      await loadUser();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  if (loading) {
    return (
      <SupportShell
        title="Cargando usuario..."
        backTo="/admin/users"
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </SupportShell>
    );
  }

  return (
    <SupportShell
      title={email}
      subtitle={`Usuario #${id} · Registrado ${formatDate(createdAt)}`}
      backTo="/admin/users"
    >
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
              Información
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
              <Chip
                label={ROLE_LABELS[role]}
                color={role === 'admin' ? 'primary' : role === 'technician' ? 'info' : 'default'}
                size="small"
                variant={role === 'user' ? 'outlined' : 'filled'}
              />
              <Typography variant="body2" color="text.secondary">
                ID {id}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          <TextField
            select
            fullWidth
            label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <MenuItem value="user">Usuario</MenuItem>
            <MenuItem value="technician">Técnico</MenuItem>
            <MenuItem value="admin">Administrador</MenuItem>
          </TextField>

          {role === 'technician' && (
            <FormControl fullWidth>
              <InputLabel id="user-groups-label">Grupos asignados</InputLabel>
              <Select
                labelId="user-groups-label"
                multiple
                value={groupIds}
                onChange={(e) => setGroupIds(e.target.value as number[])}
                input={<OutlinedInput label="Grupos asignados" />}
                renderValue={(selected) =>
                  allGroups
                    .filter((g) => selected.includes(g.id))
                    .map((g) => g.name)
                    .join(', ')
                }
              >
                {allGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    <Checkbox checked={groupIds.includes(group.id)} />
                    <ListItemText primary={group.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {role !== 'technician' && (
            <Typography variant="body2" color="text.secondary">
              Los grupos de soporte solo aplican al rol Técnico.
            </Typography>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button variant="text" disabled={saving} onClick={() => navigate('/admin/users')}>
              Volver
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </SupportShell>
  );
}
