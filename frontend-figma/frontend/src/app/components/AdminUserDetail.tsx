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
import { getToken, clearAuth, type UserRole, refreshAccess, type AccessPermission } from '../../lib/auth';

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
  const [roleOptions, setRoleOptions] = useState<{ id: number; name: string; is_active: boolean }[]>([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState<number[]>([]);
  const [effectivePermissions, setEffectivePermissions] = useState<AccessPermission[]>([]);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);

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

    const [accessResult, optionsResult] = await Promise.all([
      apiCall(`/admin/users/${id}/access`),
      apiCall('/admin/users/role-options')
    ]);
    if (accessResult?.response.ok) {
      setAssignedRoleIds((accessResult.data.assignments || []).map((item: { id: number }) => item.id));
      setEffectivePermissions(accessResult.data.permissions || []);
      setIsSuperuser(Boolean(accessResult.data.is_superuser));
    }
    if (optionsResult?.response.ok) {
      setRoleOptions(Array.isArray(optionsResult.data) ? optionsResult.data : []);
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

  const handleSaveRoles = async () => {
    setSavingRoles(true);
    try {
      const result = await apiCall(`/admin/users/${id}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ role_ids: assignedRoleIds })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudieron guardar los roles');
        return;
      }
      setAssignedRoleIds((result.data.assignments || []).map((item: { id: number }) => item.id));
      setEffectivePermissions(result.data.permissions || []);
      setIsSuperuser(Boolean(result.data.is_superuser));
      await refreshAccess();
      toast.success('Roles actualizados');
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSavingRoles(false);
    }
  };

  const permissionsByModule = effectivePermissions.reduce<Record<string, AccessPermission[]>>((acc, item) => {
    const key = item.module_label || item.module;
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

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

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mt: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
              Roles y permisos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Si el usuario tiene varios roles, los permisos se combinan.
            </Typography>
          </Box>

          {isSuperuser && (
            <Typography variant="body2">
              El perfil de cuenta Administrador tiene acceso total, además de los roles que tenga asignados.
            </Typography>
          )}

          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {assignedRoleIds.length === 0 && (
              <Typography variant="body2" color="text.secondary">Sin roles asignados</Typography>
            )}
            {roleOptions.filter((item) => assignedRoleIds.includes(item.id)).map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                onDelete={() => setAssignedRoleIds((current) => current.filter((roleId) => roleId !== item.id))}
              />
            ))}
          </Stack>

          <FormControl fullWidth>
            <InputLabel id="assign-roles-label">Agregar roles</InputLabel>
            <Select
              labelId="assign-roles-label"
              multiple
              value={assignedRoleIds}
              onChange={(e) => setAssignedRoleIds(e.target.value as number[])}
              input={<OutlinedInput label="Agregar roles" />}
              renderValue={(selected) => roleOptions.filter((item) => selected.includes(item.id)).map((item) => item.name).join(', ')}
            >
              {roleOptions.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  <Checkbox checked={assignedRoleIds.includes(item.id)} />
                  <ListItemText primary={item.is_active ? item.name : `${item.name} (inactivo)`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Permisos heredados</Typography>
            {Object.keys(permissionsByModule).length === 0 ? (
              <Typography variant="body2" color="text.secondary">Este usuario no tiene permisos por roles.</Typography>
            ) : (
              <Stack spacing={1.25}>
                {Object.entries(permissionsByModule).map(([moduleName, items]) => (
                  <Box key={moduleName}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{moduleName}</Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      {items.map((item) => (
                        <Chip key={item.code} label={item.name} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Button variant="contained" disabled={savingRoles} onClick={handleSaveRoles}>
            {savingRoles ? 'Guardando...' : 'Guardar roles'}
          </Button>
        </Stack>
      </Paper>
    </SupportShell>
  );
}
