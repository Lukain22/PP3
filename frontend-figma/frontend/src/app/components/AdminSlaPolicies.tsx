import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import { getToken, clearAuth } from '../../lib/auth';
import { PRIORITY_LABELS } from '../../lib/sla';

const API_URL = import.meta.env.VITE_API_URL as string;

interface SlaPolicy {
  priority: string;
  response_hours: number;
  resolution_hours: number;
}

const PRIORITY_ORDER = ['high', 'medium', 'low'];

export default function AdminSlaPolicies() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState<SlaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadPolicies = async () => {
    setLoading(true);
    const result = await apiCall('/admin/sla-policies');
    if (!result) return;
    if (result.response.ok) {
      const rows = Array.isArray(result.data) ? result.data : [];
      setPolicies(
        PRIORITY_ORDER.map((p) => rows.find((r: SlaPolicy) => r.priority === p)).filter(Boolean) as SlaPolicy[]
      );
    }
    setLoading(false);
  };

  useEffect(() => { loadPolicies(); }, []);

  const handleChange = (priority: string, field: 'response_hours' | 'resolution_hours', value: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.priority === priority ? { ...p, [field]: value === '' ? '' : Number(value) } : p
      )
    );
  };

  const handleSave = async () => {
    for (const p of policies) {
      const rh = Number(p.response_hours);
      const rs = Number(p.resolution_hours);
      if (!rh || !rs || rh < 1 || rs < 1) {
        toast.error('Completá horas válidas para todas las prioridades');
        return;
      }
      if (rs < rh) {
        toast.error(`En ${PRIORITY_LABELS[p.priority]}: resolución debe ser ≥ respuesta`);
        return;
      }
    }

    setSaving(true);
    try {
      const result = await apiCall('/admin/sla-policies', {
        method: 'PUT',
        body: JSON.stringify({
          policies: policies.map((p) => ({
            priority: p.priority,
            response_hours: Number(p.response_hours),
            resolution_hours: Number(p.resolution_hours)
          }))
        })
      });
      if (!result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se pudieron guardar las políticas');
        return;
      }
      toast.success('Políticas SLA actualizadas');
      await loadPolicies();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SupportShell
      title="Políticas SLA"
      subtitle="Tiempos de respuesta y resolución por prioridad (solo incidentes). Horas corridas 24/7."
      breadcrumbs={[
        { label: 'Admin', to: '/admin' },
        { label: 'Políticas SLA' }
      ]}
    >
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Los cambios aplican a <strong>incidentes nuevos</strong> y cuando se modifica la prioridad de uno existente.
          El estado <strong>En espera</strong> pausa el temporizador SLA hasta reanudar el ticket.
        </Typography>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafbfc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Prioridad</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Respuesta (horas)</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Resolución (horas)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.priority}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {PRIORITY_LABELS[policy.priority] || policy.priority}
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={policy.response_hours}
                        onChange={(e) => handleChange(policy.priority, 'response_hours', e.target.value)}
                        inputProps={{ min: 1, max: 720 }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={policy.resolution_hours}
                        onChange={(e) => handleChange(policy.priority, 'resolution_hours', e.target.value)}
                        inputProps={{ min: 1, max: 720 }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={1.5} sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button variant="contained" startIcon={<SaveIcon />} disabled={saving} onClick={handleSave}>
              {saving ? 'Guardando...' : 'Guardar políticas'}
            </Button>
            <Button variant="text" onClick={() => navigate('/admin')}>
              Volver al panel
            </Button>
          </Stack>
        </Paper>
      )}
    </SupportShell>
  );
}
