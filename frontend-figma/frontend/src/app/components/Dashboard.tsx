import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack
} from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import SupportShell from './SupportShell';
import { getTicketTypeLabel } from '../../lib/ticketTypes';
import { getPriorityLabel, getSlaStatusLabel, isIncident } from '../../lib/sla';
import { getRole, isAdmin, isStaff, isTechnician } from '../../lib/auth';
import { getTicketsPath } from '../../lib/ticketViews';

const API_URL = import.meta.env.VITE_API_URL as string;

type DashboardScope = 'all' | 'groups' | 'mine';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  type: string;
  group_id?: number | null;
  group_name?: string | null;
  sla_status?: string | null;
  created_at: string;
  user_id: number;
}

interface GroupOption {
  id: number;
  name: string;
}

type ChartSlice = { name: string; value: number; color: string };

const SCOPE_LABELS: Record<DashboardScope, string> = {
  all: 'Todas las solicitudes',
  groups: 'Por grupo',
  mine: 'Mis solicitudes'
};

function countSlices(
  tickets: Ticket[],
  getKey: (ticket: Ticket) => string | null | undefined,
  labels: Record<string, string>,
  colors: Record<string, string>
): ChartSlice[] {
  const counts: Record<string, number> = {};

  for (const ticket of tickets) {
    const key = getKey(ticket);
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([key, value]) => ({
      name: labels[key] || key,
      value,
      color: colors[key] || '#64748b'
    }))
    .filter((slice) => slice.value > 0);
}

const GROUP_CHART_COLORS = ['#1e3a5f', '#1d4ed8', '#047857', '#b45309', '#7c3aed', '#db2777', '#0891b2', '#0d9488'];

function countByGroup(tickets: Ticket[]): ChartSlice[] {
  const counts: Record<string, number> = {};

  for (const ticket of tickets) {
    const name = ticket.group_name?.trim() || 'Sin grupo';
    counts[name] = (counts[name] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([name, value], index) => ({
      name,
      value,
      color: name === 'Sin grupo' ? '#94a3b8' : GROUP_CHART_COLORS[index % GROUP_CHART_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);
}

function DistributionChart({ title, data }: { title: string; data: ChartSlice[] }) {
  if (data.length === 0) return null;

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5, height: '100%' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        {title}
      </Typography>
      <Box sx={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}

function getDefaultScope(): DashboardScope {
  if (isAdmin()) return 'all';
  if (isTechnician()) return 'groups';
  return 'mine';
}

function getScopeOptions(): DashboardScope[] {
  if (isAdmin()) return ['all', 'groups', 'mine'];
  if (isTechnician()) return ['groups', 'mine'];
  return [];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const role = getRole();
  const staff = isStaff();
  const scopeOptions = getScopeOptions();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [scope, setScope] = useState<DashboardScope>(getDefaultScope);
  const [groupId, setGroupId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staff || scope !== 'groups') {
      setGroups([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const groupsPath = isAdmin() ? '/admin/groups' : '/technician/groups';
    fetch(`${API_URL}${groupsPath}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => (res.ok ? res.json() : []))
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  }, [staff, scope]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(true);

    const params = new URLSearchParams({ limit: '500' });
    if (scope === 'groups' && groupId) {
      params.set('group_id', groupId);
    }

    let path = '/tickets';
    if (scope === 'all') {
      path = '/admin/tickets';
    } else if (scope === 'groups') {
      path = isAdmin() ? '/admin/tickets' : '/technician/tickets';
    }

    fetch(`${API_URL}${path}?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        let rows = Array.isArray(data?.data) ? data.data : [];
        if (scope === 'groups' && isAdmin() && !groupId) {
          rows = rows.filter((ticket: Ticket) => ticket.group_id);
        }
        setTickets(rows);
      })
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [navigate, scope, groupId]);

  const stats = useMemo(() => [
    { label: 'Total', value: tickets.length, color: '#1e3a5f' },
    { label: 'Abiertos', value: tickets.filter((t) => t.status === 'open').length, color: '#b45309' },
    { label: 'En proceso', value: tickets.filter((t) => t.status === 'in-progress').length, color: '#1d4ed8' },
    { label: 'Resueltos', value: tickets.filter((t) => t.status === 'resolved').length, color: '#047857' }
  ], [tickets]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });

  const getStatusLabel = (status: string) => {
    if (status === 'open') return 'Abierto';
    if (status === 'in-progress') return 'En proceso';
    if (status === 'resolved') return 'Resuelto';
    return status;
  };

  const getStatusColor = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    if (status === 'open') return 'warning';
    if (status === 'in-progress') return 'info';
    if (status === 'resolved') return 'success';
    return 'default';
  };

  const recentTickets = tickets.slice(0, 5);

  const statusChartData = countSlices(
    tickets,
    (t) => t.status,
    { open: 'Abiertos', 'in-progress': 'En proceso', 'on-hold': 'En espera', resolved: 'Resueltos' },
    { open: '#f59e0b', 'in-progress': '#3b82f6', 'on-hold': '#64748b', resolved: '#10b981' }
  );

  const typeChartData = countSlices(
    tickets,
    (t) => t.type || 'incident',
    { incident: getTicketTypeLabel('incident'), requirement: getTicketTypeLabel('requirement') },
    { incident: '#ef4444', requirement: '#3b82f6' }
  );

  const priorityChartData = countSlices(
    tickets.filter((t) => isIncident(t.type)),
    (t) => t.priority || 'medium',
    { high: getPriorityLabel('high'), medium: getPriorityLabel('medium'), low: getPriorityLabel('low') },
    { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }
  );

  const slaChartData = countSlices(
    tickets.filter((t) => isIncident(t.type) && t.sla_status),
    (t) => t.sla_status || undefined,
    {
      on_track: getSlaStatusLabel('on_track'),
      at_risk: getSlaStatusLabel('at_risk'),
      breached: getSlaStatusLabel('breached'),
      met: getSlaStatusLabel('met'),
      paused: getSlaStatusLabel('paused')
    },
    { on_track: '#10b981', at_risk: '#f59e0b', breached: '#ef4444', met: '#3b82f6', paused: '#64748b' }
  );

  const groupChartData = scope === 'all' ? countByGroup(tickets) : [];

  const charts = [
    ...(groupChartData.length > 0 ? [{ title: 'Distribución por grupo', data: groupChartData }] : []),
    { title: 'Distribución por estado', data: statusChartData },
    { title: 'Distribución por tipo', data: typeChartData },
    { title: 'Distribución por prioridad', data: priorityChartData },
    { title: 'Distribución por SLA', data: slaChartData }
  ].filter((chart) => chart.data.length > 0);

  return (
    <SupportShell
      title="TABLERO"
      headerAction={
        <Button variant="outlined" startIcon={<ListAltIcon />} onClick={() => navigate(getTicketsPath(role))}>
          Ver solicitudes
        </Button>
      }
    >
      {staff && (
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              select
              size="small"
              label="Ver"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as DashboardScope);
                setGroupId('');
              }}
              sx={{ minWidth: 220 }}
            >
              {scopeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {SCOPE_LABELS[option]}
                </MenuItem>
              ))}
            </TextField>
            {scope === 'groups' && (
              <TextField
                select
                size="small"
                label="Grupo"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">
                  {isTechnician() ? 'Todos mis grupos' : 'Todos los grupos'}
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={String(group.id)}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </Paper>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Card
              elevation={0}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: stat.color }}>
                  {loading ? '—' : stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {!loading && charts.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {charts.map((chart) => (
            <Grid size={{ xs: 12, md: 6 }} key={chart.title}>
              <DistributionChart title={chart.title} data={chart.data} />
            </Grid>
          ))}
        </Grid>
      )}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafbfc' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Actividad reciente
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : recentTickets.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay solicitudes recientes</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 240 }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600, minWidth: 120 }}>Fecha</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell>{ticket.id}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-word' }}>{ticket.title}</TableCell>
                    <TableCell>
                      <Chip label={getStatusLabel(ticket.status)} color={getStatusColor(ticket.status)} size="small" />
                    </TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </SupportShell>
  );
}
