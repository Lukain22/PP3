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
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Technician {
  id: number;
  email: string;
}

interface GroupDetail {
  id: number;
  name: string;
  description: string | null;
  is_default: number;
  created_at: string;
  technicians: Technician[];
}

export default function AdminGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [allTechnicians, setAllTechnicians] = useState<Technician[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [technicianIds, setTechnicianIds] = useState<number[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  const [createdAt, setCreatedAt] = useState('');

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

  const loadGroup = async () => {
    setLoading(true);
    const [groupResult, techResult] = await Promise.all([
      apiCall(`/admin/groups/${id}`),
      apiCall('/admin/groups/technicians')
    ]);

    if (!groupResult) return;

    if (!groupResult.response.ok) {
      toast.error(groupResult.data.message || 'Grupo no encontrado');
      navigate('/admin/groups');
      return;
    }

    const group = groupResult.data as GroupDetail;
    setName(group.name);
    setDescription(group.description || '');
    setTechnicianIds(group.technicians?.map((t) => t.id) || []);
    setIsDefault(Boolean(group.is_default));
    setCreatedAt(group.created_at);

    if (techResult?.response.ok) {
      setAllTechnicians(Array.isArray(techResult.data) ? techResult.data : []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!getToken()) { navigate('/'); return; }
    loadGroup();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const result = await apiCall(`/admin/groups/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          technician_ids: technicianIds
        })
      });

      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo guardar');
        return;
      }

      toast.success('Grupo actualizado');
      await loadGroup();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDefault) return;
    if (!window.confirm(`¿Eliminar el grupo "${name}"?`)) return;

    setDeleting(true);
    try {
      const result = await apiCall(`/admin/groups/${id}`, { method: 'DELETE' });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo eliminar');
        return;
      }
      toast.success('Grupo eliminado');
      navigate('/admin/groups');
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  if (loading) {
    return (
      <SupportShell
        title="Cargando grupo..."
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Grupos', to: '/admin/groups' },
          { label: '...' }
        ]}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </SupportShell>
    );
  }

  return (
    <SupportShell
      title={name}
      subtitle={`Grupo #${id}${createdAt ? ` · Creado ${formatDate(createdAt)}` : ''}`}
      breadcrumbs={[
        { label: 'Admin', to: '/admin' },
        { label: 'Grupos', to: '/admin/groups' },
        { label: name }
      ]}
    >
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isDefault ? (
              <Chip label="Grupo principal" color="primary" size="small" />
            ) : (
              <Chip label="Grupo de resolución" size="small" variant="outlined" />
            )}
          </Box>

          <TextField
            fullWidth
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <TextField
            fullWidth
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={3}
          />

          <Divider />

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
              Técnicos del grupo
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Los técnicos seleccionados podrán ver y gestionar los tickets asignados a este grupo.
            </Typography>

            {allTechnicians.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay técnicos registrados. Asigná el rol Técnico a usuarios desde Usuarios.
              </Typography>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="technicians-label">Técnicos</InputLabel>
                <Select
                  labelId="technicians-label"
                  multiple
                  value={technicianIds}
                  onChange={(e) => setTechnicianIds(e.target.value as number[])}
                  input={<OutlinedInput label="Técnicos" />}
                  renderValue={(selected) =>
                    allTechnicians
                      .filter((t) => selected.includes(t.id))
                      .map((t) => t.email)
                      .join(', ')
                  }
                >
                  {allTechnicians.map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      <Checkbox checked={technicianIds.includes(tech.id)} />
                      <ListItemText primary={tech.email} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between">
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saving || deleting}
                onClick={handleSave}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
              <Button variant="text" disabled={saving || deleting} onClick={() => navigate('/admin/groups')}>
                Volver
              </Button>
            </Stack>

            {!isDefault && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                disabled={saving || deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Eliminando...' : 'Eliminar grupo'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>
    </SupportShell>
  );
}
