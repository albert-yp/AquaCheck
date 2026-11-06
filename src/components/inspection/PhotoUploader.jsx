import { useRef, useState } from 'react';
import { ImageOff, RefreshCw, Trash2, Upload } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  PHOTO_CATEGORY,
  PHOTO_CATEGORY_LABELS,
  PHOTO_UPLOAD_RULES,
} from '../../constants/statuses.js';
import { validatePhotoFile } from '../../storage/imageStore.js';

const ACCEPT = PHOTO_UPLOAD_RULES.mimeTypes.join(',');
const REQUIREMENT_ERROR_KEYS = ['beforePhoto', 'findingPhoto', 'afterPhoto', 'photoRefs'];

function PhotoPreview({ preview, alt }) {
  const box = {
    width: { xs: '100%', sm: 160 },
    aspectRatio: '4 / 3',
    flexShrink: 0,
    borderRadius: 1,
    overflow: 'hidden',
    bgcolor: 'action.hover',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (!preview) {
    return (
      <Box sx={box} role="status" aria-label="Memuat foto">
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (preview.error || !preview.url) {
    return (
      <Box sx={{ ...box, flexDirection: 'column', gap: 1, p: 1, textAlign: 'center' }}>
        <ImageOff size={24} />
        <Typography variant="caption" color="error">
          {preview.error || 'Foto tidak tersedia.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={box}>
      <Box component="img" src={preview.url} alt={alt} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </Box>
  );
}

export default function PhotoUploader({
  photos = [],
  previews = [],
  onUpload,
  onChange,
  isUploading = false,
  uploadError = null,
  errors = {},
  disabled = false,
}) {
  const [category, setCategory] = useState('');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [localError, setLocalError] = useState('');
  const [newFieldErrors, setNewFieldErrors] = useState({});
  const [replacingId, setReplacingId] = useState(null);
  const fileInputRef = useRef(null);

  const isLocked = disabled || isUploading;
  const previewsById = new Map(previews.map((preview) => [preview.photoId, preview]));
  const requirementErrors = REQUIREMENT_ERROR_KEYS.map((key) => errors[key]).filter(Boolean);

  function handleFileSelect(event) {
    const selected = event.target.files?.[0] ?? null;
    setLocalError('');
    setNewFieldErrors((previous) => ({ ...previous, file: undefined }));
    if (selected) {
      const fileError = validatePhotoFile(selected);
      if (fileError) {
        setFile(null);
        setLocalError(fileError);
        event.target.value = '';
        return;
      }
    }
    setFile(selected);
  }

  async function handleUpload() {
    const nextErrors = {};
    if (!Object.values(PHOTO_CATEGORY).includes(category)) nextErrors.category = 'Pilih kategori foto.';
    if (!caption.trim()) nextErrors.caption = 'Keterangan foto wajib diisi.';
    if (!file) nextErrors.file = 'Pilih file foto.';
    setNewFieldErrors(nextErrors);
    setLocalError('');
    if (Object.keys(nextErrors).length) return;

    try {
      await onUpload(file, { category, caption: caption.trim() });
      setCaption('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // Pesan kesalahan ditampilkan melalui uploadError; isian dipertahankan.
    }
  }

  async function handleReplace(photo, event) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;

    const fileError = validatePhotoFile(selected);
    if (fileError) {
      setLocalError(fileError);
      return;
    }

    setLocalError('');
    setReplacingId(photo.photoId);
    try {
      // Referensi lama baru diganti oleh induk setelah upload berhasil.
      await onUpload(selected, {
        category: photo.category,
        caption: photo.caption,
        replacePhotoId: photo.photoId,
      });
    } catch {
      // Foto lama tetap dipakai; pesan ditampilkan melalui uploadError.
    } finally {
      setReplacingId(null);
    }
  }

  function updatePhoto(index, changes) {
    onChange(photos.map((photo, itemIndex) => (itemIndex === index ? { ...photo, ...changes } : photo)));
  }

  function removePhoto(index) {
    // Hanya referensi yang dihapus; Blob mungkin masih dipakai laporan versi sebelumnya.
    onChange(photos.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <Stack spacing={3}>
      {requirementErrors.length > 0 && (
        <Alert severity="error">
          {requirementErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Tambah foto
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '200px minmax(0, 1fr)' },
            }}
          >
            <TextField
              select
              required
              size="small"
              name="newPhotoCategory"
              label="Kategori"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setNewFieldErrors((previous) => ({ ...previous, category: undefined }));
              }}
              error={Boolean(newFieldErrors.category)}
              helperText={newFieldErrors.category}
              disabled={isLocked}
            >
              {Object.values(PHOTO_CATEGORY).map((value) => (
                <MenuItem key={value} value={value}>
                  {PHOTO_CATEGORY_LABELS[value]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              required
              size="small"
              name="newPhotoCaption"
              label="Keterangan foto"
              value={caption}
              onChange={(event) => {
                setCaption(event.target.value);
                setNewFieldErrors((previous) => ({ ...previous, caption: undefined }));
              }}
              error={Boolean(newFieldErrors.caption)}
              helperText={newFieldErrors.caption}
              disabled={isLocked}
            />
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <Button component="label" variant="outlined" disabled={isLocked}>
              Pilih File
              <input
                ref={fileInputRef}
                hidden
                type="file"
                name="newPhotoFile"
                accept={ACCEPT}
                onChange={handleFileSelect}
              />
            </Button>
            <Typography
              variant="body2"
              color={newFieldErrors.file ? 'error' : 'text.secondary'}
              sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}
            >
              {file?.name || newFieldErrors.file || 'JPEG, PNG, atau WebP; maksimal 5 MB.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={
                isUploading && !replacingId ? <CircularProgress size={16} color="inherit" /> : <Upload size={18} />
              }
              onClick={handleUpload}
              disabled={isLocked}
            >
              {isUploading && !replacingId ? 'Mengunggah...' : 'Unggah Foto'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {(localError || uploadError) && (
        <Alert severity="error" role="alert">
          {localError || uploadError}
        </Alert>
      )}

      {photos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Belum ada foto.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {photos.map((photo, index) => {
            const preview = previewsById.get(photo.photoId);
            const captionKey = `photoRefs.${index}.caption`;
            const categoryKey = `photoRefs.${index}.category`;
            const isReplacing = replacingId === photo.photoId;
            return (
              <Paper key={photo.photoId} variant="outlined" sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <PhotoPreview preview={preview} alt={photo.caption || `Foto ${index + 1}`} />
                  <Stack spacing={1.5} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      {preview?.fileName || 'Memuat nama file...'}
                    </Typography>
                    <TextField
                      select
                      size="small"
                      name={categoryKey}
                      label="Kategori"
                      value={photo.category}
                      onChange={(event) => updatePhoto(index, { category: event.target.value })}
                      error={Boolean(errors[categoryKey])}
                      helperText={errors[categoryKey]}
                      disabled={disabled || isReplacing}
                    >
                      {Object.values(PHOTO_CATEGORY).map((value) => (
                        <MenuItem key={value} value={value}>
                          {PHOTO_CATEGORY_LABELS[value]}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      required
                      name={captionKey}
                      label="Keterangan"
                      value={photo.caption ?? ''}
                      onChange={(event) => updatePhoto(index, { caption: event.target.value })}
                      error={Boolean(errors[captionKey])}
                      helperText={errors[captionKey]}
                      disabled={disabled || isReplacing}
                    />
                    {errors[`photoRefs.${index}.photoId`] && (
                      <FormHelperText error>{errors[`photoRefs.${index}.photoId`]}</FormHelperText>
                    )}
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                      <Button
                        component="label"
                        size="small"
                        variant="outlined"
                        startIcon={isReplacing ? <CircularProgress size={14} /> : <RefreshCw size={16} />}
                        disabled={isLocked}
                      >
                        {isReplacing ? 'Mengganti...' : 'Ganti Foto'}
                        <input
                          hidden
                          type="file"
                          accept={ACCEPT}
                          onChange={(event) => handleReplace(photo, event)}
                        />
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Trash2 size={16} />}
                        onClick={() => removePhoto(index)}
                        disabled={isLocked}
                      >
                        Hapus dari Draft
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
