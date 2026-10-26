import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import { toast } from 'sonner';
import { can, getToken, isAdmin, isTechnician } from '../../lib/auth';
import { CATEGORIES, SUBCATEGORIES, type Category } from '../../lib/categories';
import { appendPlainTextToHtml, appendRichHtml, isDescriptionEmpty, isRichHtml } from '../../lib/richText';
import { isIncident } from '../../lib/sla';
import { TICKET_TYPE_OPTIONS } from '../../lib/ticketTypes';
import SearchableSelect from './SearchableSelect';
import StatusBadge from './StatusBadge';
import TicketAttachments from './TicketAttachments';
import TicketSolutions from './TicketSolutions';
import RichTextEditor, { type RichTextEditorHandle } from './richtext/RichTextEditor';

const API_URL = import.meta.env.VITE_API_URL as string;

export interface ResolveTicketSeed {
  id: number;
  title?: string;
  type?: string | null;
  priority?: string | null;
  category?: string | null;
  subcategory?: string | null;
  group_id?: number | null;
  group_name?: string | null;
  technician_id?: number | null;
  technician_email?: string | null;
  sla_status?: string | null;
}

interface GroupOption {
  id: number;
  name: string;
}

interface TechnicianOption {
  id: number;
  email: string;
}

interface Baseline {
  type: string;
  priority: string | null;
  category: string;
  subcategory: string;
  group_id: number | null;
  technician_id: number | null;
}

interface ResolveTicketDialogProps {
  open: boolean;
  ticket: ResolveTicketSeed | null;
  saved?: ResolveTicketSeed | null;
  initialContent?: string;
  onClose: () => void;
  onResolved: () => void;
  onBeforeResolve?: () => Promise<Record<string, unknown> | null>;
}

const cardSx = {
  p: 2,
  bgcolor: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 2,
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
};

export default function ResolveTicketDialog({
  open,
  ticket,
  saved = null,
  initialContent = '',
  onClose,
  onResolved,
  onBeforeResolve
}: ResolveTicketDialogProps) {
  const admin = isAdmin();
  const staff = admin || isTechnician();
  const canClassify = staff || can('tickets.edit');
  const canChangeGroup = admin || can('assignments.transfer');
  const canAssign = admin || can('assignments.self') || can('assignments.others');

  const ticketRef = useRef(ticket);
  const savedRef = useRef(saved);
  const contentRef = useRef(initialContent);
  ticketRef.current = ticket;
  savedRef.current = saved;
  contentRef.current = initialContent;

  const editorRef = useRef<RichTextEditorHandle>(null);
  const [type, setType] = useState('incident');
  const [priority, setPriority] = useState('medium');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [groupId, setGroupId] = useState<number | ''>('');
  const [technicianId, setTechnicianId] = useState<number | ''>('');
  const [content, setContent] = useState('');
  const [fileCount, setFileCount] = useState(0);
  const [section, setSection] = useState<'resolution' | 'solutions'>('resolution');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianOption[]>([]);
  const [baseline, setBaseline] = useState<Baseline | null>(null);
  const [slaStatus, setSlaStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = ticketRef.current;
    const stored = savedRef.current || source;
    if (!source || !stored) return;
    const nextGroup = source.group_id ? Number(source.group_id) : '';
    const nextTechnician = source.technician_id ? Number(source.technician_id) : '';
    setType(source.type || 'incident');
    setPriority(source.priority || 'medium');
    setCategory(source.category || '');
    setSubcategory(source.subcategory || '');
    setGroupId(nextGroup);
    setTechnicianId(nextTechnician);
    setContent(contentRef.current || '');
    setSection('resolution');
    setFileCount(0);
    setSlaStatus(source.sla_status || null);
    setBaseline({
      type: stored.type || 'incident',
      priority: stored.priority || null,
      category: stored.category || '',
      subcategory: stored.subcategory || '',
      group_id: stored.group_id ? Number(stored.group_id) : null,
      technician_id: stored.technician_id ? Number(stored.technician_id) : null
    });
  }, [open, ticket?.id]);

  useEffect(() => {
    if (!open || !canChangeGroup) return;
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/tickets/transfer-groups`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => response.json().catch(() => []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setGroups(data);
      })
      .catch(() => {
        if (!cancelled) setGroups([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, canChangeGroup]);

  useEffect(() => {
    if (!open || !canAssign || !groupId) {
      setTechnicians([]);
      return;
    }
    const token = getToken();
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/tickets/assignees?group_id=${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((response) => response.json().catch(() => []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setTechnicians(data);
      })
      .catch(() => {
        if (!cancelled) setTechnicians([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, canAssign, groupId]);

  if (!ticket) return null;

  const groupOptions = [...groups];
  if (groupId && !groupOptions.some((group) => group.id === Number(groupId))) {
    groupOptions.unshift({
      id: Number(groupId),
      name: ticket.group_name || `Grupo ${groupId}`
    });
  }

  const technicianOptions = [...technicians];
  if (technicianId && !technicianOptions.some((tech) => tech.id === Number(technicianId))) {
    technicianOptions.unshift({
      id: Number(technicianId),
      email: ticket.technician_email || `Técnico ${technicianId}`
    });
  }

  const subcategoryOptions = category ? (SUBCATEGORIES[category as Category] || []) : [];
  const needsTechnician = !technicianId;
  const needsCategory = !category;
  const needsSubcategory = !subcategory;
  const needsResolution = isDescriptionEmpty(content) && fileCount === 0;
  const needsGroup = canChangeGroup && !groupId && needsTechnician;
  const missing: string[] = [];
  if (needsTechnician) missing.push('Asigná un técnico');
  if (needsCategory || needsSubcategory) missing.push('Completá la categoría y la subcategoría');
  if (needsResolution) missing.push('Ingresá la resolución');

  const fieldCaption = (label: string, required: boolean) => (
    <Typography variant="caption" color={required ? 'error' : 'text.secondary'} sx={{ display: 'block', mb: 0.5 }}>
      {label}
    </Typography>
  );

  const handleConfirm = async () => {
    if (!baseline || missing.length > 0) return;
    setSaving(true);
    try {
      let extra: Record<string, unknown> = {};
      if (onBeforeResolve) {
        const prepared = await onBeforeResolve();
        if (!prepared) return;
        extra = prepared;
      }

      let html = content;
      if (editorRef.current?.hasPendingImages()) {
        const flushed = await editorRef.current.flushPendingImages(ticket.id, { context: 'resolution' });
        if (!flushed.ok) {
          toast.error('No se pudieron guardar las imágenes pegadas');
          return;
        }
        html = flushed.html;
        setContent(html);
      }

      const resolution = isDescriptionEmpty(html)
        ? (fileCount > 0 ? '<p>Archivo adjunto</p>' : '')
        : html;
      if (!resolution) {
        toast.error('La resolución no puede estar vacía');
        return;
      }

      const nextGroup = groupId === '' ? null : Number(groupId);
      const nextTechnician = technicianId === '' ? null : Number(technicianId);
      const patch: Record<string, unknown> = { ...extra };

      if (admin && type !== baseline.type) patch.type = type;
      if (canClassify && (category || '') !== (baseline.category || '')) patch.category = category || null;
      if (canClassify && (subcategory || '') !== (baseline.subcategory || '')) {
        patch.subcategory = subcategory || null;
      }
      if (canChangeGroup && String(nextGroup || '') !== String(baseline.group_id || '')) {
        patch.group_id = nextGroup;
      }
      if (canAssign && String(nextTechnician || '') !== String(baseline.technician_id || '')) {
        patch.technician_id = nextTechnician;
      }
      if (canClassify) {
        if (!isIncident(type)) {
          if (baseline.priority) patch.priority = null;
        } else if (priority !== (baseline.priority || 'medium')) {
          patch.priority = priority;
        }
      }

      const token = getToken();
      if (!token) return;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };
      const ticketPath = admin ? `/admin/tickets/${ticket.id}` : `/tickets/${ticket.id}`;

      if (Object.keys(patch).length > 0) {
        const response = await fetch(`${API_URL}${ticketPath}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(patch)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(data.message || 'No se pudo actualizar el ticket');
          return;
        }
      }

      const response = await fetch(`${API_URL}/tickets/${ticket.id}/resolution`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: resolution })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.message || 'No se pudo guardar la resolución');
        return;
      }

      toast.success(data.message || 'Ticket resuelto');
      onResolved();
    } catch {
      toast.error('Error conectando con el backend');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle sx={{ pb: 0.5 }}>
        Resolver #{ticket.id}
        {ticket.title ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            {ticket.title}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        {missing.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {missing.join('. ')}.
          </Alert>
        )}
        <Box sx={cardSx}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Información
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Tipo
              </Typography>
              {admin ? (
                <SearchableSelect
                  compact
                  label="Tipo"
                  value={type}
                  options={TICKET_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                  onChange={(next) => setType(next)}
                />
              ) : (
                <StatusBadge kind="type" value={type} />
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Estado
              </Typography>
              <StatusBadge kind="status" value="resolved" />
            </Box>
          </Stack>
          {isIncident(type) && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Prioridad
                </Typography>
                {canClassify ? (
                  <SearchableSelect
                    compact
                    label="Prioridad"
                    value={priority}
                    options={[
                      { value: 'low', label: 'Baja' },
                      { value: 'medium', label: 'Media' },
                      { value: 'high', label: 'Alta' }
                    ]}
                    onChange={(next) => setPriority(next)}
                  />
                ) : (
                  <StatusBadge kind="priority" value={priority} />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                {slaStatus ? (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Vencimiento
                    </Typography>
                    <StatusBadge kind="sla" value={slaStatus} />
                  </>
                ) : null}
              </Box>
            </Stack>
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              {fieldCaption('Categoría', needsCategory)}
              {canClassify ? (
                <SearchableSelect
                  compact
                  error={needsCategory}
                  label="Categoría"
                  value={category}
                  options={CATEGORIES.map((item) => ({ value: item, label: item }))}
                  onChange={(next) => {
                    setCategory(next);
                    const allowed = SUBCATEGORIES[next as Category] || [];
                    setSubcategory((current) => (allowed.includes(current) ? current : ''));
                  }}
                />
              ) : (
                <Typography variant="body2">{category || '—'}</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              {fieldCaption('Subcategoría', needsSubcategory)}
              {canClassify ? (
                <SearchableSelect
                  compact
                  error={needsSubcategory}
                  label="Subcategoría"
                  value={subcategory}
                  disabled={!category}
                  options={subcategoryOptions.map((item) => ({ value: item, label: item }))}
                  onChange={(next) => setSubcategory(next)}
                />
              ) : (
                <Typography variant="body2">{subcategory || '—'}</Typography>
              )}
            </Box>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              {fieldCaption('Grupo', needsGroup)}
              {canChangeGroup ? (
                <SearchableSelect
                  compact
                  error={needsGroup}
                  label="Grupo"
                  value={groupId}
                  options={[
                    { value: '', label: 'Sin grupo' },
                    ...groupOptions.map((group) => ({ value: group.id, label: group.name }))
                  ]}
                  onChange={(next) => {
                    setGroupId(next ? Number(next) : '');
                    setTechnicianId('');
                  }}
                />
              ) : (
                <Typography variant="body2">{ticket.group_name || '—'}</Typography>
              )}
            </Box>
            <Box sx={{ flex: 1 }}>
              {fieldCaption('Técnico', needsTechnician)}
              {canAssign ? (
                <SearchableSelect
                  compact
                  error={needsTechnician}
                  label="Técnico"
                  value={technicianId}
                  disabled={!groupId}
                  options={technicianOptions.map((tech) => ({ value: tech.id, label: tech.email }))}
                  onChange={(next) => setTechnicianId(next ? Number(next) : '')}
                />
              ) : (
                <Typography variant="body2">{ticket.technician_email || '—'}</Typography>
              )}
              {canAssign && !groupId && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Asigná un grupo antes de seleccionar un técnico
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Box sx={{ ...cardSx, mt: 2 }}>
          <Typography variant="subtitle2" color={needsResolution ? 'error' : 'text.primary'} sx={{ fontWeight: 700, mb: 1 }}>
            Resolución
          </Typography>
          <Tabs
            value={section}
            onChange={(_, value) => setSection(value)}
            sx={{ minHeight: 36, mb: 1.5, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}
          >
            <Tab value="resolution" label="Resolución" />
            <Tab value="solutions" label="Soluciones" />
          </Tabs>
          <Box sx={{ display: section === 'resolution' ? 'flex' : 'none', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{
              height: 240,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              borderRadius: 1,
              border: '1px solid',
              borderColor: needsResolution ? 'error.main' : 'transparent'
            }}>
              <RichTextEditor
                ref={editorRef}
                bounded
                value={content}
                onChange={setContent}
                ticketId={ticket.id}
                attachmentContext="resolution"
                placeholder="Describí cómo se resolvió. Podés pegar capturas con Ctrl + V."
              />
            </Box>
            <Box sx={{ pt: 1.5 }}>
              <TicketAttachments
                ticketId={ticket.id}
                scope="resolution"
                onCountChange={setFileCount}
              />
            </Box>
          </Box>
          {section === 'solutions' && (
            <TicketSolutions
              ticketId={String(ticket.id)}
              canApply
              onApply={(value) => {
                setContent((prev) => (
                  isRichHtml(value) ? appendRichHtml(prev, value) : appendPlainTextToHtml(prev, value)
                ));
                setSection('resolution');
                toast.success('Solución aplicada correctamente.');
              }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={saving || missing.length > 0}
          sx={{ textTransform: 'none' }}
        >
          {saving ? 'Guardando...' : 'Resolver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
