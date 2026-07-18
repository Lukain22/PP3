import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';

const API_URL = import.meta.env.VITE_API_URL as string;

interface Group {
  id: number;
  name: string;
  description: string | null;
  is_default: number;
  created_at: string;
}

export default function AdminGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

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

  const loadGroups = async () => {
    setLoading(true);
    const result = await apiCall('/admin/groups');
    if (result?.response.ok) {
      setGroups(Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
  };

  useEffect(() => { loadGroups(); }, []);

  const openCreate = () => {
    setName('');
    setDescription('');
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setSaving(true);
    try {
      const result = await apiCall('/admin/groups', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null })
      });

      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo crear');
        return;
      }

      toast.success('Grupo creado');
      setDialogOpen(false);
      if (result.data.id) {
        navigate(`/admin/groups/${result.data.id}`);
      } else {
        await loadGroups();
      }
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    if (group.is_default) return;
    if (!window.confirm(`¿Eliminar el grupo "${group.name}"?`)) return;

    setBusyId(group.id);
    try {
      const result = await apiCall(`/admin/groups/${group.id}`, { method: 'DELETE' });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudo eliminar');
        return;
      }
      toast.success('Grupo eliminado');
      await loadGroups();
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
      title="Grupos de soporte"
      subtitle={loading ? 'Cargando...' : `${groups.length} grupo${groups.length === 1 ? '' : 's'}`}
      backTo="/admin"
      headerAction={
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nuevo grupo
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
                <TableCell sx={{ fontWeight: 600, width: 64 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 120 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 130 }}>Creado</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 80 }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow
                  key={group.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => navigate(`/admin/groups/${group.id}`)}
                >
                  <TableCell sx={{ color: 'text.secondary' }}>{group.id}</TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      underline="hover"
                      variant="body2"
                      sx={{ fontWeight: 600, textAlign: 'left' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/groups/${group.id}`);
                      }}
                    >
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {group.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {group.is_default ? (
                      <Chip label="Principal" color="primary" size="small" />
                    ) : (
                      <Chip label="Resolución" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(group.created_at)}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    {!group.is_default && (
                      <Tooltip title="Eliminar">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={busyId === group.id}
                            onClick={(e) => handleDelete(group, e)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo grupo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <TextField
              fullWidth
              label="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving}>
            {saving ? 'Creando...' : 'Crear y editar'}
          </Button>
        </DialogActions>
      </Dialog>
    </SupportShell>
  );
}
