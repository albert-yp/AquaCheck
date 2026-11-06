import { useCallback, useEffect, useRef, useState } from 'react';
import { PHOTO_CATEGORY } from '../constants/statuses.js';
import { getPhoto, savePhoto } from '../storage/imageStore.js';

const EMPTY_PHOTOS = Object.freeze([]);

// photoRefs berasal dari state formulir. Hook mengembalikan referensi baru, tidak mengubah form sendiri.
export function useImageUpload(photoRefs = EMPTY_PHOTOS) {
  const [previews, setPreviews] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const urls = [];
    Promise.all(photoRefs.map(async (reference) => {
      try {
        const photo = await getPhoto(reference.photoId);
        if (!photo) throw new Error('Bukti gambar tidak tersedia.');
        if (cancelled) return null;
        const url = URL.createObjectURL(photo.blob);
        urls.push(url);
        return { ...reference, url, fileName: photo.fileName, error: null };
      } catch (cause) {
        return { ...reference, url: null, error: cause.message };
      }
    })).then((items) => {
      if (!cancelled) setPreviews(items.filter(Boolean));
    });
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoRefs]);

  const uploadPhoto = useCallback(async (file, { assignmentId, ownerId, category, caption = '' } = {}) => {
    if (!Object.values(PHOTO_CATEGORY).includes(category)) throw new Error('Pilih kategori foto.');
    setPendingCount((count) => count + 1);
    setError(null);
    try {
      const photo = await savePhoto(file, { assignmentId, ownerId });
      return { photoId: photo.id, category, caption };
    } catch (cause) {
      if (mounted.current) setError(cause.message);
      throw cause;
    } finally {
      if (mounted.current) setPendingCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  return { previews, uploadPhoto, isUploading: pendingCount > 0, error, clearError };
}
