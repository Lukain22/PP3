import { useEffect, useRef, useState } from 'react';
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

const priorityOptions = [
  { value: 'low', label: 'Baja', hint: 'Consulta general' },
  { value: 'medium', label: 'Media', hint: 'Afecta tu trabajo' },
  { value: 'high', label: 'Alta', hint: 'Bloqueo crítico' }
];

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

  const choiceSx = {
    px: 1.5,
    py: 0.25,
    textTransform: 'none',
    fontSize: '0.8125rem',
    fontWeight: 600,
    lineHeight: 1.4
  };

  return (
    <SupportShell
      compact
      title="Nueva solicitud"
      headerAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button size="small" onClick={() => navigate('/dashboard')} sx={{ height: 32 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-ticket-form"
            variant="contained"
            size="small"
            disabled={loading}
            sx={{ height: 32 }}
          >
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </Box>
      }
    >
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25, mb: 1.5, flexShrink: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Tipo
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={formData.type}
              onChange={(_, val) => val && setFormData({ ...formData, type: val, priority: val === 'incident' ? formData.priority : 'medium' })}
            >
              {TICKET_TYPE_OPTIONS.map((t) => (
                <ToggleButton key={t.value} value={t.value} sx={choiceSx}>
                  <Tooltip title={t.hint}>
                    <span>{t.label}</span>
                  </Tooltip>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {admin && formData.type === 'incident' && (
              <>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', ml: { sm: 1 } }}>
                  Prioridad
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={formData.priority}
                  onChange={(_, val) => val && setFormData({ ...formData, priority: val })}
                >
                  {priorityOptions.map((p) => (
                    <ToggleButton key={p.value} value={p.value} sx={choiceSx}>
                      <Tooltip title={p.hint}>
                        <span>{p.label}</span>
                      </Tooltip>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </>
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
            <TicketAttachments
              pendingFiles={pendingFiles}
              onPendingFilesChange={setPendingFiles}
            />
          </Box>
        </Paper>
      </Box>
    </SupportShell>
  );
}
