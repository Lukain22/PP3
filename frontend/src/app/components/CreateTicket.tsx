import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import AssignmentLateOutlinedIcon from '@mui/icons-material/AssignmentLateOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import TicketAttachments from './TicketAttachments';
import { isAdmin, getRole } from '../../lib/auth';
import { getTicketsPath } from '../../lib/ticketViews';
import { TICKET_TYPE_OPTIONS } from '../../lib/ticketTypes';
import { uploadTicketAttachments } from '../../lib/attachments';
import { descriptionWithoutPending, isDescriptionEmpty } from '../../lib/richText';
import RichTextEditor, { type RichTextEditorHandle } from './richtext/RichTextEditor';

const API_URL = import.meta.env.VITE_API_URL as string;

interface ChoiceTone {
  color: string;
  background: string;
  border: string;
}

interface ChoiceOption {
  value: string;
  label: string;
  hint: string;
  icon: ReactNode;
  tone: ChoiceTone;
}

const priorityOptions: ChoiceOption[] = [
  {
    value: 'low',
    label: 'Baja',
    hint: 'Consulta general',
    icon: <ArrowDownwardIcon />,
    tone: { color: '#0369A1', background: '#F0F9FF', border: '#BAE6FD' }
  },
  {
    value: 'medium',
    label: 'Media',
    hint: 'Afecta tu trabajo',
    icon: <ArrowUpwardIcon />,
    tone: { color: '#A16207', background: '#FFFBEB', border: '#FDE68A' }
  },
  {
    value: 'high',
    label: 'Alta',
    hint: 'Bloqueo crítico',
    icon: <KeyboardDoubleArrowUpIcon />,
    tone: { color: '#B91C1C', background: '#FEF2F2', border: '#FECACA' }
  }
];

const typeOptions: ChoiceOption[] = TICKET_TYPE_OPTIONS.map((option) =>
  option.value === 'incident'
    ? {
        ...option,
        icon: <AssignmentLateOutlinedIcon />,
        tone: { color: '#B91C1C', background: '#FEF2F2', border: '#FECACA' }
      }
    : {
        ...option,
        icon: <DescriptionOutlinedIcon />,
        tone: { color: '#1E3A8A', background: '#F8FAFC', border: '#DBEAFE' }
      }
);

function choiceButtonSx(tone: ChoiceTone) {
  return {
    height: 24,
    minWidth: 0,
    px: 1,
    py: 0,
    gap: 0.5,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: 12,
    lineHeight: 1,
    color: tone.color,
    bgcolor: tone.background,
    border: '1px solid',
    borderColor: tone.border,
    '& .MuiSvgIcon-root': { fontSize: 15, color: 'inherit' },
    '&:hover': { bgcolor: tone.background, opacity: 0.85 },
    '&.Mui-selected': {
      color: tone.color,
      bgcolor: tone.background,
      borderColor: tone.color,
      '&:hover': { bgcolor: tone.background }
    }
  };
}

function ChoiceGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: ChoiceOption[];
  onChange: (next: string) => void;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, next: string | null) => next && onChange(next)}
        sx={{
          gap: 0.75,
          '& .MuiToggleButtonGroup-grouped': {
            borderRadius: '999px !important',
            '&:not(:first-of-type)': { marginLeft: 0, borderLeft: '1px solid' }
          }
        }}
      >
        {options.map((option) => (
          <ToggleButton key={option.value} value={option.value} sx={choiceButtonSx(option.tone)}>
            <Tooltip title={option.hint}>
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                {option.icon}
                {option.label}
              </Box>
            </Tooltip>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const admin = isAdmin();
  const [loading, setLoading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'incident',
    priority: 'medium',
    status: 'open'
  });

  useEffect(() => {
    if (!localStorage.getItem('token')) navigate('/');
  }, [navigate]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || isDescriptionEmpty(formData.description)) {
      toast.error('Completá el asunto y la descripción');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const hasPendingImages = editorRef.current?.hasPendingImages() ?? false;
    const description = hasPendingImages
      ? (() => {
          const withoutImages = descriptionWithoutPending(formData.description);
          return isDescriptionEmpty(withoutImages) ? '<p>Imagen adjunta</p>' : withoutImages;
        })()
      : formData.description;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(
          admin
            ? formData.type === 'incident'
              ? { ...formData, description }
              : {
                  title: formData.title,
                  description,
                  type: formData.type,
                  status: formData.status
                }
            : {
                title: formData.title,
                description,
                type: formData.type,
                status: 'open'
              }
        )
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }

      if (!response.ok) {
        toast.error(data.message || 'No se pudo crear el ticket');
        return;
      }

      if (pendingFiles.length > 0 && data.id) {
        const uploadResult = await uploadTicketAttachments(data.id, pendingFiles);
        if (!uploadResult.ok) {
          toast.error(uploadResult.message || 'La solicitud se creó pero falló la subida de archivos');
          navigate(getTicketsPath(getRole()));
          return;
        }
      }

      if (hasPendingImages && data.id && editorRef.current) {
        const flushed = await editorRef.current.flushPendingImages(data.id);
        if (!flushed.ok) {
          toast.error('La solicitud se creó, pero no se pudieron guardar las imágenes pegadas');
          navigate(`/tickets/${data.id}`);
          return;
        }
        const patch = await fetch(`${API_URL}/tickets/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ description: flushed.html })
        });
        if (!patch.ok) {
          toast.error('La solicitud se creó, pero no se pudo guardar la descripción con imágenes');
          navigate(`/tickets/${data.id}`);
          return;
        }
      }

      toast.success('Solicitud enviada correctamente');
      navigate(getTicketsPath(getRole()));
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupportShell compact title="Nueva solicitud">
      <Box
        component="form"
        id="create-ticket-form"
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 1.5, md: 2 },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.25,
              mb: 1.5,
              flexShrink: 0
            }}
          >
            <ChoiceGroup
              label="Tipo"
              value={formData.type}
              options={typeOptions}
              onChange={(type) =>
                setFormData({
                  ...formData,
                  type,
                  priority: type === 'incident' ? formData.priority : 'medium'
                })
              }
            />
            {admin && formData.type === 'incident' && (
              <ChoiceGroup
                label="Prioridad"
                value={formData.priority}
                options={priorityOptions}
                onChange={(priority) => setFormData({ ...formData, priority })}
              />
            )}
          </Box>

          <TextField
            fullWidth
            size="small"
            label="Asunto"
            value={formData.title}
            onChange={handleChange('title')}
            required
            placeholder="Ej: No puedo acceder al campus virtual"
            sx={{ mb: 1.5, flexShrink: 0 }}
          />

          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600, flexShrink: 0 }}>
            Descripción
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <RichTextEditor
              ref={editorRef}
              bounded
              value={formData.description}
              onChange={(html) => setFormData((prev) => ({ ...prev, description: html }))}
              placeholder="¿Qué pasó? ¿Cuándo empezó? ¿Qué intentaste hacer? Podés pegar capturas con Ctrl + V."
            />
          </Box>

          <Box sx={{ mt: 1.25, flexShrink: 0 }}>
            <TicketAttachments pendingFiles={pendingFiles} onPendingFilesChange={setPendingFiles} />
          </Box>
        </Paper>
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.5,
            pt: 1.5
          }}
        >
          <Button size="small" onClick={() => navigate('/dashboard')} sx={{ height: 32 }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" size="small" disabled={loading} sx={{ height: 32 }}>
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </Box>
      </Box>
    </SupportShell>
  );
}
