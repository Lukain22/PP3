import { useEffect, useMemo, useState } from 'react';
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
  Link,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
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

export default function AdminGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
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

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) => {
      const kind = group.is_default ? 'principal' : 'resolución';
      return [String(group.id), group.name, group.description || '', kind].join(' ').toLowerCase().includes(query);
    });
  }, [groups, search]);

  return (
    <SupportShell
      compact
      title="Grupos"
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
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate} sx={{ height: 30, ml: 'auto' }}>
            Nuevo grupo
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
                  <TableCell sx={{ width: 64 }}>#</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell sx={{ width: 120 }}>Tipo</TableCell>
                  <TableCell sx={{ width: 130 }}>Creado</TableCell>
                  <TableCell sx={{ width: 80 }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {search.trim() ? 'Sin resultados para esa búsqueda.' : 'No hay grupos.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : visibleGroups.map((group) => (
                  <TableRow
                    key={group.id}
                    hover
                    sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                    onClick={() => navigate(`/admin/groups/${group.id}`)}
                  >
                    <TableCell sx={{ color: 'text.secondary' }}>{group.id}</TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Link
                        component="button"
                        underline="hover"
                        variant="body2"
                        noWrap
                        title={group.name}
                        sx={{ fontWeight: 600, display: 'block', maxWidth: '100%', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/groups/${group.id}`);
                        }}
                      >
                        {group.name}
                      </Link>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="body2" color="text.secondary" noWrap title={group.description || ''}>
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
              {search.trim() && visibleGroups.length !== groups.length
                ? `${visibleGroups.length} de ${groups.length} grupos`
                : `${groups.length} grupo${groups.length === 1 ? '' : 's'}`}
            </Typography>
          </Box>
        </Paper>
      )}
      </Box>

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
