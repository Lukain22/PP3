import Chip from '@mui/material/Chip';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { getTicketStatusLabel } from '../../lib/ticketStatus';
import { getTicketTypeLabel } from '../../lib/ticketTypes';
import { getPriorityLabel, getSlaStatusLabel } from '../../lib/sla';

type BadgeKind = 'status' | 'type' | 'priority' | 'sla';

interface Tone {
  color: string;
  background: string;
  border: string;
}

const fallback: Tone = { color: '#475569', background: '#F8FAFC', border: '#E2E8F0' };

const tones: Record<BadgeKind, Record<string, Tone>> = {
  status: {
    open: { color: '#1E40AF', background: '#EFF6FF', border: '#BFDBFE' },
    'in-progress': { color: '#3730A3', background: '#EEF2FF', border: '#C7D2FE' },
    'on-hold': { color: '#475569', background: '#F8FAFC', border: '#E2E8F0' },
    resolved: { color: '#047857', background: '#ECFDF5', border: '#A7F3D0' },
    closed: { color: '#047857', background: '#ECFDF5', border: '#A7F3D0' }
  },
  type: {
    incident: { color: '#B91C1C', background: '#FEF2F2', border: '#FECACA' },
    requirement: { color: '#1E3A8A', background: '#F8FAFC', border: '#DBEAFE' }
  },
  priority: {
    low: { color: '#0369A1', background: '#F0F9FF', border: '#BAE6FD' },
    medium: { color: '#A16207', background: '#FFFBEB', border: '#FDE68A' },
    high: { color: '#B91C1C', background: '#FEF2F2', border: '#FECACA' }
  },
  sla: {
    on_track: { color: '#047857', background: '#ECFDF5', border: '#A7F3D0' },
    at_risk: { color: '#C2410C', background: '#FFF7ED', border: '#FDBA74' },
    breached: { color: '#B91C1C', background: '#FEF2F2', border: '#FECACA' },
    met: { color: '#047857', background: '#ECFDF5', border: '#A7F3D0' },
    paused: { color: '#475569', background: '#F8FAFC', border: '#E2E8F0' }
  }
};

function labelFor(kind: BadgeKind, value: string) {
  if (kind === 'status' && value === 'closed') return 'Cerrado';
  if (kind === 'status') return getTicketStatusLabel(value);
  if (kind === 'type') return getTicketTypeLabel(value || 'incident');
  if (kind === 'priority') return getPriorityLabel(value);
  return getSlaStatusLabel(value);
}

export default function StatusBadge({ kind, value }: { kind: BadgeKind; value?: string | null }) {
  const key = value || (kind === 'type' ? 'incident' : '');
  const tone = tones[kind][key] || fallback;
  const showCheck = kind === 'status' && (key === 'resolved' || key === 'closed');
  const showClock = kind === 'sla' && key === 'at_risk';

  return (
    <Chip
      size="small"
      label={labelFor(kind, key)}
      {...(showCheck || showClock
        ? { icon: showCheck ? <CheckRoundedIcon /> : <AccessTimeOutlinedIcon /> }
        : {})}
      sx={{
        height: 22,
        borderRadius: '999px',
        bgcolor: tone.background,
        color: tone.color,
        border: '1px solid',
        borderColor: tone.border,
        fontWeight: 600,
        fontSize: 12,
        '& .MuiChip-label': { px: 1, py: 0 },
        '& .MuiChip-icon': { color: 'inherit', fontSize: 14, ml: '6px', mr: '-2px' }
      }}
    />
  );
}
