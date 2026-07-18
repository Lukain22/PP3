import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { toast } from 'sonner';
import {
  ACCEPTED_FILE_LABEL,
  ACCEPTED_FILE_TYPES,
  type TicketAttachment,
  deleteTicketAttachment,
  downloadTicketAttachment,
  fetchTicketAttachments,
  formatFileSize,
  uploadTicketAttachments
} from '../../lib/attachments';

interface TicketAttachmentsProps {
  ticketId?: number | string;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  showUpload?: boolean;
  compact?: boolean;
  showTitleWhenHasFiles?: boolean;
  uploadBelowFiles?: boolean;
}

function truncateName(name: string, max = 14): string {
  if (name.length <= max) return name;
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '';
  const base = name.slice(0, max - ext.length - 1);
  return `${base}…${ext}`;
}

function getFileTypeLabel(name: string): string {
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '';
  const labels: Record<string, string> = {
    jpg: 'Imagen JPEG',
    jpeg: 'Imagen JPEG',
    png: 'Imagen PNG',
    gif: 'Imagen GIF',
    webp: 'Imagen WebP',
    bmp: 'Imagen BMP',
    txt: 'Texto',
    csv: 'CSV',
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xls: 'Excel',
    xlsx: 'Excel',
    ppt: 'PowerPoint',
    pptx: 'PowerPoint',
    zip: 'ZIP',
    rar: 'RAR',
    '7z': '7-Zip'
  };
  return labels[ext] || (ext ? ext.toUpperCase() : 'Archivo');
}

function AttachmentTile({
  name,
  sizeLabel,
  onDownload,
  onDelete,
  deleteDisabled,
  deleteLabel = 'Eliminar'
}: {
  name: string;
  sizeLabel: string;
  onDownload?: () => void;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteLabel?: string;
}) {
  const showActions = onDownload || onDelete;
  const fileTypeLabel = getFileTypeLabel(name);

  return (
    <Tooltip
      arrow
      describeChild
      slotProps={{ tooltip: { sx: { maxWidth: 280, p: 1.25 } } }}
      title={
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
            {name}
          </Typography>
          <Typography variant="caption" color="inherit" sx={{ display: 'block', mt: 0.5, opacity: 0.9 }}>
            {fileTypeLabel}
          </Typography>
          <Typography variant="caption" color="inherit" sx={{ display: 'block', opacity: 0.9 }}>
            {sizeLabel}
          </Typography>
        </Box>
      }
    >
      <Box
        sx={{
          position: 'relative',
          width: 76,
          flexShrink: 0,
          p: 0.75,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: '#fafbfc',
          textAlign: 'center',
          cursor: 'default',
          '&:hover .attachment-actions': showActions ? { opacity: 1 } : undefined
        }}
      >
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 22, color: 'action.active' }} />
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.25,
            fontSize: '0.65rem',
            lineHeight: 1.2,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {truncateName(name)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', lineHeight: 1.2 }}>
          {sizeLabel}
        </Typography>

        {showActions && (
          <Box
            className="attachment-actions"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.25,
              bgcolor: 'rgba(255,255,255,0.94)',
              borderRadius: 1,
              opacity: 0,
              transition: 'opacity 0.15s ease'
            }}
          >
            {onDownload && (
              <Tooltip title="Descargar">
                <IconButton size="small" onClick={onDownload}>
                  <DownloadOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title={deleteLabel}>
                <span>
                  <IconButton size="small" color="error" disabled={deleteDisabled} onClick={onDelete}>
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

export default function TicketAttachments({
  ticketId,
  pendingFiles = [],
  onPendingFilesChange,
  showUpload = true,
  compact = false,
  showTitleWhenHasFiles = false,
  uploadBelowFiles = false
}: TicketAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(Boolean(ticketId));
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const isPendingMode = !ticketId && !!onPendingFilesChange;

  const loadAttachments = async () => {
    if (!ticketId) return;
    setLoading(true);
    const data = await fetchTicketAttachments(ticketId);
    setAttachments(data);
    setLoading(false);
  };

  useEffect(() => {
    if (ticketId) {
      loadAttachments();
    }
  }, [ticketId]);

  const handleFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files || []);
    event.target.value = '';

    if (picked.length === 0) return;

    if (isPendingMode) {
      const merged = [...pendingFiles, ...picked].slice(0, 5);
      if (merged.length < pendingFiles.length + picked.length) {
        toast.error('Máximo 5 archivos por solicitud');
      }
      onPendingFilesChange?.(merged);
      return;
    }

    if (!ticketId) return;

    setUploading(true);
    try {
      const result = await uploadTicketAttachments(ticketId, picked);
      if (!result.ok) {
        toast.error(result.message || 'No se pudieron subir los archivos');
        return;
      }
      toast.success(result.message || 'Archivos adjuntos');
      await loadAttachments();
    } catch {
      toast.error('Error al subir archivos');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePending = (index: number) => {
    onPendingFilesChange?.(pendingFiles.filter((_, i) => i !== index));
  };

  const handleDownload = async (attachment: TicketAttachment) => {
    if (!ticketId) return;
    try {
      await downloadTicketAttachment(ticketId, attachment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo descargar');
    }
  };

  const handleDelete = async (attachment: TicketAttachment) => {
    if (!ticketId) return;
    if (!window.confirm(`¿Eliminar "${attachment.original_name}"?`)) return;

    setBusyId(attachment.id);
    try {
      const result = await deleteTicketAttachment(ticketId, attachment.id);
      if (!result.ok) {
        toast.error(result.message || 'No se pudo eliminar');
        return;
      }
      toast.success('Adjunto eliminado');
      await loadAttachments();
    } catch {
      toast.error('Error al eliminar adjunto');
    } finally {
      setBusyId(null);
    }
  };

  const filesToShow = isPendingMode ? pendingFiles : attachments;
  const hasFiles = filesToShow.length > 0;

  const uploadButton = showUpload ? (
    <>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleFilePick}
      />
      <Button
        variant="outlined"
        size={compact ? 'small' : 'medium'}
        startIcon={uploading ? <CircularProgress size={16} /> : <AttachFileIcon />}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || (isPendingMode && pendingFiles.length >= 5)}
      >
        {uploading ? 'Subiendo...' : 'Adjuntar archivos'}
      </Button>
    </>
  ) : null;

  const fileList = hasFiles ? (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
      {isPendingMode
        ? pendingFiles.map((file, index) => (
            <AttachmentTile
              key={`${file.name}-${index}`}
              name={file.name}
              sizeLabel={formatFileSize(file.size)}
              onDelete={() => handleRemovePending(index)}
              deleteLabel="Quitar"
            />
          ))
        : attachments.map((attachment) => (
            <AttachmentTile
              key={attachment.id}
              name={attachment.original_name}
              sizeLabel={formatFileSize(attachment.size_bytes)}
              onDownload={() => handleDownload(attachment)}
              onDelete={() => handleDelete(attachment)}
              deleteDisabled={busyId === attachment.id}
            />
          ))}
    </Box>
  ) : null;

  if (uploadBelowFiles) {
    return (
      <Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <>
            {showTitleWhenHasFiles && hasFiles && (
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Archivos adjuntos
              </Typography>
            )}
            {fileList}
            {uploadButton && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: hasFiles ? 2 : 0 }}>
                {uploadButton}
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {showUpload && !uploadBelowFiles && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: hasFiles ? 1.5 : 0 }}>
          {uploadButton}
          <Typography variant="caption" color="text.secondary">
            {ACCEPTED_FILE_LABEL}
          </Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : hasFiles ? (
        fileList
      ) : (
        !showUpload && (
          <Typography variant="body2" color="text.secondary">
            Sin archivos adjuntos.
          </Typography>
        )
      )}
    </Box>
  );
}
