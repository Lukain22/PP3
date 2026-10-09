import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { toast } from 'sonner';
import SupportShell from './SupportShell';
import RichTextEditor from './richtext/RichTextEditor';
import { clearAuth, getToken } from '../../lib/auth';
import { CATEGORIES, SUBCATEGORIES, type Category } from '../../lib/categories';
import { isDescriptionEmpty } from '../../lib/richText';
import type { SolutionGroup } from '../../lib/solutions';

const API_URL = import.meta.env.VITE_API_URL as string;

export default function AdminSolutionForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<SolutionGroup[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tags, setTags] = useState('');
  const [shareAll, setShareAll] = useState(false);
  const [groupIds, setGroupIds] = useState<number[]>([]);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const groupResult = await apiCall('/admin/solutions/groups');
      if (!cancelled && groupResult?.response.ok && Array.isArray(groupResult.data)) {
        setGroups(groupResult.data);
      }
      if (isNew) return;
      const result = await apiCall(`/admin/solutions/${id}`);
      if (cancelled || !result) return;
      if (!result.response.ok) {
        toast.error(result.data.message || 'No se encontró la solución');
        navigate('/admin/solutions');
        return;
      }
      setTitle(result.data.title || '');
      setContent(result.data.content || '');
      setCategory(result.data.category || '');
      setSubcategory(result.data.subcategory || '');
      setTags(result.data.tags || '');
      setShareAll(Boolean(result.data.share_all));
      setGroupIds((result.data.groups || []).map((group: SolutionGroup) => group.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const toggleGroup = (groupId: number) => {
    setGroupIds((current) => current.includes(groupId) ? current.filter((item) => item !== groupId) : [...current, groupId]);
  };

  const save = async () => {
    if (!title.trim() || isDescriptionEmpty(content)) {
      toast.error('Completá el título y el contenido');
      return;
    }
    setSaving(true);
    const result = await apiCall(isNew ? '/admin/solutions' : `/admin/solutions/${id}`, {
      method: isNew ? 'POST' : 'PATCH',
      body: JSON.stringify({
        title: title.trim(),
        content,
        category: category || null,
        subcategory: subcategory || null,
        tags,
        share_all: shareAll,
        group_ids: shareAll ? [] : groupIds
      })
    });
    setSaving(false);
    if (!result) return;
    if (!result.response.ok) {
      toast.error(result.data.message || 'No se pudo guardar');
      return;
    }
    toast.success(result.data.message || 'Solución guardada');
    navigate('/admin/solutions');
  };

  const subs = category ? SUBCATEGORIES[category as Category] || [] : [];

  return (
    <SupportShell compact={false} title={isNew ? 'Nueva solución' : 'Editar solución'} backTo="/admin/solutions">
      {loading ? null : (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 980 }}>
          <TextField fullWidth size="small" label="Título" value={title} onChange={(event) => setTitle(event.target.value)} sx={{ mb: 2 }} />
          <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>Contenido</Typography>
          <RichTextEditor value={content} onChange={setContent} placeholder="Describí el procedimiento o la solución." />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mt: 2 }}>
            <TextField select size="small" label="Categoría" value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory(''); }}>
              <MenuItem value="">Sin categoría</MenuItem>
              {CATEGORIES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField select size="small" label="Subcategoría" value={subcategory} disabled={!category} onChange={(event) => setSubcategory(event.target.value)}>
              <MenuItem value="">Sin subcategoría</MenuItem>
              {subs.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Etiquetas" placeholder="iis, reinicio" value={tags} onChange={(event) => setTags(event.target.value)} />
          </Box>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Checkbox checked={shareAll} onChange={(event) => setShareAll(event.target.checked)} />}
              label="Compartir con todos los grupos"
            />
            {!shareAll && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, pl: 1 }}>
                {groups.map((group) => (
                  <FormControlLabel
                    key={group.id}
                    control={<Checkbox size="small" checked={groupIds.includes(group.id)} onChange={() => toggleGroup(group.id)} />}
                    label={group.name}
                  />
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button variant="contained" disabled={saving} onClick={save}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            <Button onClick={() => navigate('/admin/solutions')}>Cancelar</Button>
          </Box>
        </Paper>
      )}
    </SupportShell>
  );
}
