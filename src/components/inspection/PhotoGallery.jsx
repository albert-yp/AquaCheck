import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PHOTO_CATEGORY_LABELS } from '../../constants/statuses.js';
import { useImageUpload } from '../../hooks/useImageUpload.js';

const EMPTY_PHOTOS = Object.freeze([]);

const frame = {
  width: '100%',
  aspectRatio: '4 / 3',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'action.hover',
  overflow: 'hidden',
};

export default function PhotoGallery({ photoRefs = EMPTY_PHOTOS }) {
  const { previews } = useImageUpload(photoRefs);
  const [selected, setSelected] = useState(null);

  if (photoRefs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Belum ada foto.
      </Typography>
    );
  }

  const previewsById = new Map(previews.map((preview) => [preview.photoId, preview]));

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
        }}
      >
        {photoRefs.map((photo, index) => {
          // Hook belum menyediakan isLoading; foto tanpa preview dianggap masih dimuat.
          const preview = previewsById.get(photo.photoId);
          const label = PHOTO_CATEGORY_LABELS[photo.category] || photo.category;
          return (
            <Paper key={photo.photoId ?? index} variant="outlined" sx={{ overflow: 'hidden' }}>
              {!preview ? (
                <Box sx={frame} role="status" aria-label="Memuat foto">
                  <CircularProgress size={24} />
                </Box>
              ) : preview.error || !preview.url ? (
                <Stack sx={{ ...frame, gap: 1, p: 2, textAlign: 'center' }}>
                  <ImageOff size={28} />
                  <Typography variant="caption" color="error">
                    {preview.error || 'Foto tidak tersedia.'}
                  </Typography>
                </Stack>
              ) : (
                <ButtonBase
                  sx={{ ...frame, display: 'block' }}
                  onClick={() => setSelected({ ...photo, url: preview.url, label })}
                  aria-label={`Perbesar foto: ${photo.caption || label}`}
                >
                  <Box
                    component="img"
                    src={preview.url}
                    alt={photo.caption || label}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </ButtonBase>
              )}
              <Stack spacing={1} sx={{ p: 1.5 }}>
                <Box>
                  <Chip size="small" label={label} />
                </Box>
                <Typography variant="body2">{photo.caption || '—'}</Typography>
                {photo.source?.url?.startsWith('https://unsplash.com/photos/') && (
                  <Link href={photo.source.url} target="_blank" rel="noopener noreferrer" variant="caption">
                    Foto: {photo.source.author} / Unsplash
                  </Link>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle>
              {selected.label}
              <Typography variant="body2" color="text.secondary">
                {selected.caption}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box
                component="img"
                src={selected.url}
                alt={selected.caption || selected.label}
                sx={{ width: '100%', height: 'auto', display: 'block', borderRadius: 1 }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}
