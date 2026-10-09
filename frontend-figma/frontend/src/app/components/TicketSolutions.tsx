import { useEffect, useState } from 'react';
import { Box, CircularProgress, Link, TextField, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import { toast } from 'sonner';
import { getToken } from '../../lib/auth';
import { solutionSummary, solutionToPlainText, type SolutionSearchHit } from '../../lib/solutions';

const API_URL = import.meta.env.VITE_API_URL as string;

interface TicketSolutionsProps {
  ticketId: string;
  canApply: boolean;
  onApply: (text: string) => void;
}

export default function TicketSolutions({ ticketId, canApply, onApply }: TicketSolutionsProps) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SolutionSearchHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<number | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/solutions?q=${encodeURIComponent(query.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json().catch(() => []);
        setItems(response.ok && Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const apply = async (item: SolutionSearchHit) => {
    const token = getToken();
    if (!token || !canApply) return;
    setApplyingId(item.id);
    try {
      const response = await fetch(`${API_URL}/solutions/${item.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ticket_id: Number(ticketId) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.message || 'No se pudo usar la solución');
        return;
      }
      onApply(solutionToPlainText(data.content || item.content));
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <Box>
      <TextField
        size="small"
        placeholder="Buscar por título, contenido, etiqueta o categoría..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ width: { xs: '100%', sm: 360 }, maxWidth: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          )
        }}
      />
      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={22} />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hay soluciones disponibles para tus grupos.
          </Typography>
        ) : items.map((item) => (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.25,
              px: 1.25,
              py: 1,
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              transition: 'background-color 160ms ease, border-color 160ms ease',
              '&:hover': { bgcolor: '#e8f1fb', borderColor: '#90caf9' },
              '& .use-solution': {
                opacity: 0,
                maxHeight: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                transition: 'opacity 160ms ease'
              },
              '&:hover .use-solution, &:focus-within .use-solution': {
                opacity: 1,
                maxHeight: 28,
                mt: 0.25,
                pointerEvents: 'auto'
              }
            }}
          >
            <Box sx={{ color: 'text.secondary', mt: 0.25 }} title={item.share_all ? 'Visible para todos los grupos' : 'Restringida por grupos'}>
              {item.share_all ? <PublicIcon sx={{ fontSize: 18 }} /> : <LockOutlinedIcon sx={{ fontSize: 18 }} />}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {solutionSummary(item.content)}
              </Typography>
              {canApply && (
                <Link
                  component="button"
                  type="button"
                  className="use-solution"
                  underline="hover"
                  disabled={applyingId === item.id}
                  onClick={() => apply(item)}
                  sx={{ fontSize: '0.8125rem', border: 0, bgcolor: 'transparent', cursor: 'pointer', p: 0, display: 'inline-block' }}
                >
                  {applyingId === item.id ? 'Aplicando...' : 'Usar como resolución'}
                </Link>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
