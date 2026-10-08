import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { clearAuth, getToken } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface PermissionItem {
  code: string;
  name: string;
  description: string | null;
  supports_scope: boolean;
}

interface PermissionModule {
  key: string;
  label: string;
  permissions: PermissionItem[];
}

interface GroupOption {
  id: number;
  name: string;
}

interface RoleOption {
  id: number;
  name: string;
  code: string;
}

export default function AdminRoleDetail() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');
  const [isSystem, setIsSystem] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [systemCode, setSystemCode] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [inherited, setInherited] = useState<string[]>([]);
  const [inheritedTransferAll, setInheritedTransferAll] = useState(false);
  const [modules, setModules] = useState<PermissionModule[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [transferMode, setTransferMode] = useState<'all' | 'allow' | 'deny'>('all');
  const [groupIds, setGroupIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const options = await apiCall('/admin/roles/options');
      if (!options?.response.ok) {
        toast.error(options?.data?.message || 'No se pudo cargar el formulario');
        setLoading(false);
        return;
      }
      setModules(options.data.modules || []);
      setGroups(options.data.groups || []);
      setRoles(options.data.roles || []);

      if (!isNew) {
        const role = await apiCall(`/admin/roles/${id}`);
        if (!role?.response.ok) {
          toast.error(role?.data?.message || 'Rol no encontrado');
          navigate('/admin/roles');
          return;
        }
        setName(role.data.name || '');
        setDescription(role.data.description || '');
        setParentId(role.data.parent_role_id || '');
        setIsSystem(Boolean(role.data.is_system));
        setIsActive(role.data.is_active !== false);
        setSystemCode(role.data.code || '');
        setSelected(role.data.permission_codes || []);
        setInherited(role.data.inherited_permission_codes || []);
        setInheritedTransferAll(Boolean(role.data.inherited_transfer_all));
        setTransferMode(role.data.transfer_scope?.mode || 'all');
        setGroupIds(role.data.transfer_scope?.group_ids || []);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const allCodes = useMemo(
    () => modules.flatMap((mod) => mod.permissions.map((item) => item.code)),
    [modules]
  );

  const lockedAdmin = systemCode === 'administrador';
  const transferChecked = selected.includes('assignments.transfer') || inherited.includes('assignments.transfer');

  const visibleModules = modules.map((mod) => ({
    ...mod,
    permissions: mod.permissions.filter((item) => {
      const text = `${item.name} ${item.description || ''} ${mod.label}`.toLowerCase();
      return text.includes(query.trim().toLowerCase());
    })
  })).filter((mod) => mod.permissions.length > 0);

  const toggle = (code: string) => {
    if (lockedAdmin || inherited.includes(code)) return;
    setSelected((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  };

  const selectAll = () => {
    if (lockedAdmin) return;
    setSelected(allCodes);
  };

  const clearAll = () => {
    if (lockedAdmin) return;
    setSelected([]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      parent_role_id: parentId || null,
      is_active: isActive,
      permission_codes: lockedAdmin ? allCodes : selected,
      transfer_scope: {
        mode: transferMode,
        group_ids: transferMode === 'all' ? [] : groupIds
      }
    };
    const result = await apiCall(isNew ? '/admin/roles' : `/admin/roles/${id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: JSON.stringify(payload)
    });
    setSaving(false);
    if (!result?.response.ok) {
      toast.error(result?.data?.message || 'No se pudo guardar');
      return;
    }
    toast.success(isNew ? 'Rol creado' : 'Rol actualizado');
    navigate(`/admin/roles/${result.data.id}`);
  };

  if (loading) {
    return (
      <SupportShell title="Rol" backTo="/admin/roles">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </SupportShell>
    );
  }

  return (
    <SupportShell
      title={isNew ? 'Nuevo rol' : name || 'Rol'}
      subtitle="Los permisos de varios roles se suman. Una exclusión de grupo gana sobre el permiso de derivar a todos."
      backTo="/admin/roles"
    >
      <Stack spacing={2.5}>
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>General</Typography>
          <Stack spacing={2} sx={{ mt: 1.5 }}>
            <TextField
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSystem}
              fullWidth
            />
            <TextField
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              select
              label="Hereda de"
              value={parentId}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
              disabled={lockedAdmin}
              fullWidth
              helperText="El rol hijo suma los permisos del padre. No los restringe, salvo las exclusiones de grupo."
            >
              <MenuItem value="">Sin herencia</MenuItem>
              {roles.filter((role) => String(role.id) !== String(id)).map((role) => (
                <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
              ))}
            </TextField>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>Permisos</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={selectAll} disabled={lockedAdmin}>Seleccionar todos</Button>
              <Button size="small" onClick={clearAll} disabled={lockedAdmin}>Deseleccionar todos</Button>
            </Stack>
          </Stack>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar permisos"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ mb: 2 }}
          />
          {visibleModules.map((mod) => (
            <Accordion key={mod.key} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{mod.label}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={0.5}>
                  {mod.permissions.map((item) => {
                    const fromParent = inherited.includes(item.code);
                    const checked = lockedAdmin || selected.includes(item.code) || fromParent;
                    return (
                      <FormControlLabel
                        key={item.code}
                        control={
                          <Checkbox
                            checked={checked}
                            disabled={lockedAdmin || fromParent}
                            onChange={() => toggle(item.code)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">
                              {item.name}
                              {fromParent && <Chip label="Heredado" size="small" sx={{ ml: 1 }} />}
                            </Typography>
                            {item.description && (
                              <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                            )}
                          </Box>
                        }
                      />
                    );
                  })}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}

          {transferChecked && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: '#fafbfc', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Alcance de derivación</Typography>
              {inheritedTransferAll && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Un rol padre permite derivar a todos los grupos. Las exclusiones de este rol igual se aplican.
                </Typography>
              )}
              <RadioGroup
                value={transferMode}
                onChange={(e) => setTransferMode(e.target.value as 'all' | 'allow' | 'deny')}
              >
                <FormControlLabel value="all" control={<Radio />} label="Derivar a todos los grupos" disabled={lockedAdmin} />
                <FormControlLabel value="allow" control={<Radio />} label="Derivar solo a los grupos elegidos" disabled={lockedAdmin} />
                <FormControlLabel value="deny" control={<Radio />} label="Derivar a todos excepto los grupos elegidos" disabled={lockedAdmin} />
              </RadioGroup>
              {transferMode !== 'all' && (
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel id="scope-groups">Grupos</InputLabel>
                  <Select
                    labelId="scope-groups"
                    multiple
                    value={groupIds}
                    onChange={(e) => setGroupIds(e.target.value as number[])}
                    input={<OutlinedInput label="Grupos" />}
                    renderValue={(selectedIds) => groups.filter((group) => selectedIds.includes(group.id)).map((group) => group.name).join(', ')}
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        <Checkbox checked={groupIds.includes(group.id)} />
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}
        </Paper>

        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button onClick={() => navigate('/admin/roles')}>Volver</Button>
        </Stack>
      </Stack>
    </SupportShell>
  );
}
