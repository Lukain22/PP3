import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import RichTextView from './richtext/RichTextView';
import { can, clearAuth, getToken } from '../../lib/auth';
import { type SolutionRecord } from '../../lib/solutions';

const API_URL = import.meta.env.VITE_API_URL as string;
const PAGE_SIZE = 15;

const denseTableSx = {
  '& .MuiTableCell-root': { py: 0.5, px: 1, fontSize: '0.8125rem', lineHeight: 1.3 },
  '& .MuiTableCell-head': { py: 0.625, fontSize: '0.75rem', fontWeight: 600, bgcolor: '#fafbfc', cursor: 'pointer', whiteSpace: 'nowrap' },
  '& .MuiChip-root': { height: 22, fontSize: '0.75rem' }
};

type SortKey = 'title' | 'status' | 'approval_status' | 'created_by_email' | 'created_at' | 'updated_at' | 'use_count';

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function AdminSolutions() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SolutionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [approval, setApproval] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [preview, setPreview] = useState<SolutionRecord | null>(null);

  const apiCall = async (path: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) { navigate('/'); return null; }
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers }
    });
    if (response.status === 401) { clearAuth(); navigate('/'); return null; }
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const load = async () => {
    setLoading(true);
    const result = await apiCall('/admin/solutions');
    if (result?.response.ok) setItems(Array.isArray(result.data) ? result.data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = items.filter((item) => {
      if (status && item.status !== status) return false;
      if (approval && item.approval_status !== approval) return false;
      if (!q) return true;
      const shared = item.share_all ? 'todos' : item.groups.map((group) => group.name).join(' ');
      return [item.title, item.content, item.tags, item.category, item.subcategory, item.created_by_email, shared]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'es', { numeric: true }) * dir);
    return filtered;
  }, [items, search, status, approval, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const pageItems = visible.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { setPage(0); }, [search, status, approval, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((dir) => dir === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortDir(key === 'title' || key === 'created_by_email' ? 'asc' : 'desc');
    }
  };

  const patch = async (path: string, body: object, okMessage: string) => {
    const result = await apiCall(path, { method: 'PATCH', body: JSON.stringify(body) });
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'No se pudo actualizar');
      return;
    }
    toast.success(result.data.message || okMessage);
    await load();
  };

  const remove = async (item: SolutionRecord) => {
    if (!window.confirm(`¿Eliminar la solución "${item.title}"?`)) return;
    setBusyId(item.id);
    const result = await apiCall(`/admin/solutions/${item.id}`, { method: 'DELETE' });
    setBusyId(null);
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'No se pudo eliminar');
      return;
    }
    toast.success('Solución eliminada');
    await load();
  };

  return (
    <SupportShell
      compact
      title="Soluciones"
      backTo="/admin"
      headerActionInline
      headerActionGrow
      headerAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', width: '100%' }}>
          <TextField
            size="small"
            placeholder="Buscar por título, contenido o etiqueta..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{ width: { xs: '100%', sm: 280 }, '& .MuiInputBase-root': { height: 30 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment> }}
          />
          <TextField select size="small" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ width: 130, '& .MuiInputBase-root': { height: 30 } }}>
            <MenuItem value="">Estado</MenuItem>
            <MenuItem value="active">Activa</MenuItem>
            <MenuItem value="inactive">Inactiva</MenuItem>
          </TextField>
          <TextField select size="small" value={approval} onChange={(event) => setApproval(event.target.value)} sx={{ width: 150, '& .MuiInputBase-root': { height: 30 } }}>
            <MenuItem value="">Aprobación</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="approved">Aprobada</MenuItem>
            <MenuItem value="rejected">Rechazada</MenuItem>
          </TextField>
          {can('kb.create') && (
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/admin/solutions/new')} sx={{ height: 30, ml: 'auto' }}>
              Nueva solución
            </Button>
          )}
        </Box>
      }
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <Paper elevation={0} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Table stickyHeader size="small" sx={denseTableSx}>
                <TableHead>
                  <TableRow>
                    {([
                      ['title', 'Título'],
                      ['status', 'Estado'],
                      ['approval_status', 'Aprobada'],
                      ['created_by_email', 'Creado por'],
                      ['created_at', 'Fecha creación'],
                      ['updated_at', 'Última actualización'],
                      ['use_count', 'Usos']
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <TableCell key={key} onClick={() => toggleSort(key)}>
                        {label}{sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                      </TableCell>
                    ))}
                    <TableCell>Compartida con</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No hay soluciones para esa búsqueda.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : pageItems.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" noWrap title={item.title} sx={{ fontWeight: item.approval_status === 'approved' ? 700 : 500 }}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={item.status === 'active' ? 'Activa' : 'Inactiva'} color={item.status === 'active' ? 'success' : 'default'} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={item.approval_status === 'approved' ? 'Aprobada' : item.approval_status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                          color={item.approval_status === 'approved' ? 'success' : item.approval_status === 'rejected' ? 'error' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{item.created_by_email}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.created_at)}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(item.updated_at)}</TableCell>
                      <TableCell>{item.use_count}</TableCell>
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Typography variant="caption" noWrap title={item.share_all ? 'Todos los grupos' : item.groups.map((group) => group.name).join(', ')}>
                          {item.share_all ? 'Todos los grupos' : item.groups.map((group) => group.name).join(', ') || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Ver"><IconButton size="small" onClick={() => setPreview(item)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                        {can('kb.edit') && <Tooltip title="Editar"><IconButton size="small" onClick={() => navigate(`/admin/solutions/${item.id}`)}><EditIcon fontSize="small" /></IconButton></Tooltip>}
                        {can('kb.approve') && item.approval_status !== 'approved' && (
                          <Tooltip title="Aprobar"><IconButton size="small" onClick={() => patch(`/admin/solutions/${item.id}/approval`, { approval_status: 'approved' }, 'Solución aprobada')}><CheckIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {can('kb.approve') && item.approval_status !== 'rejected' && (
                          <Tooltip title="Rechazar"><IconButton size="small" onClick={() => patch(`/admin/solutions/${item.id}/approval`, { approval_status: 'rejected' }, 'Solución rechazada')}><CloseIcon fontSize="small" /></IconButton></Tooltip>
                        )}
                        {can('kb.publish') && (
                          <Tooltip title={item.status === 'active' ? 'Desactivar' : 'Activar'}>
                            <IconButton size="small" onClick={() => patch(`/admin/solutions/${item.id}/status`, { status: item.status === 'active' ? 'inactive' : 'active' }, 'Estado actualizado')}>
                              <Chip size="small" label={item.status === 'active' ? 'Off' : 'On'} sx={{ height: 18, cursor: 'pointer' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {can('kb.delete') && (
                          <Tooltip title="Eliminar">
                            <IconButton size="small" disabled={busyId === item.id} onClick={() => remove(item)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">{visible.length} de {items.length}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton size="small" disabled={page === 0} onClick={() => setPage((value) => value - 1)}><ChevronLeftIcon fontSize="small" /></IconButton>
                <Typography variant="caption">Pág. {page + 1} / {pageCount}</Typography>
                <IconButton size="small" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRightIcon fontSize="small" /></IconButton>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
        <DialogTitle>{preview?.title}</DialogTitle>
        <DialogContent>
          {preview && <RichTextView value={preview.content} />}
        </DialogContent>
      </Dialog>
    </SupportShell>
  );
}
