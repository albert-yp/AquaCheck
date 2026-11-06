import { PHOTO_UPLOAD_RULES } from '../constants/statuses.js';
import { createId } from '../utils/ids.js';

const IMAGE_DATABASE = 'water-tank-app-images';
const IMAGE_DATABASE_VERSION = 1;
const PHOTO_STORE = 'photos';
let databasePromise = null;

class ImageStorageError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'ImageStorageError';
  }
}

export function openImageDatabase() {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new ImageStorageError('IndexedDB tidak tersedia pada browser ini.'));
      return;
    }
    let settled = false;
    const request = globalThis.indexedDB.open(IMAGE_DATABASE, IMAGE_DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PHOTO_STORE)) {
        const store = request.result.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
        store.createIndex('assignmentId', 'assignmentId');
      }
    };
    request.onerror = () => {
      settled = true;
      reject(new ImageStorageError('Database gambar gagal dibuka.', request.error));
    };
    request.onblocked = () => {
      settled = true;
      reject(new ImageStorageError('Database gambar sedang digunakan versi lain. Tutup tab lain lalu coba kembali.'));
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) { database.close(); return; }
      database.onversionchange = () => { database.close(); databasePromise = null; };
      database.onclose = () => { databasePromise = null; };
      resolve(database);
    };
  }).catch((error) => { databasePromise = null; throw error; });
  return databasePromise;
}

async function runTransaction(mode, operation) {
  const database = await openImageDatabase();
  return new Promise((resolve, reject) => {
    let transaction;
    let result;
    try {
      transaction = database.transaction(PHOTO_STORE, mode);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(new ImageStorageError('Operasi gambar gagal.', transaction.error));
      transaction.onabort = () => reject(new ImageStorageError('Penyimpanan gambar dibatalkan.', transaction.error));
      const request = operation(transaction.objectStore(PHOTO_STORE));
      request.onsuccess = () => { result = request.result; };
    } catch (error) {
      transaction?.abort();
      reject(new ImageStorageError('Operasi gambar tidak dapat dijalankan.', error));
    }
  });
}

export function validatePhotoFile(file) {
  if (!(file instanceof Blob) || file.size === 0) return 'Pilih file gambar yang tidak kosong.';
  if (!PHOTO_UPLOAD_RULES.mimeTypes.includes(file.type)) return 'Gunakan gambar JPEG, PNG, atau WebP.';
  if (file.size > PHOTO_UPLOAD_RULES.maxSizeBytes) return 'Ukuran foto maksimal 5 MB.';
  return null;
}

async function assertReadableImage(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71
    && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
    && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (!({ 'image/png': png, 'image/jpeg': jpeg, 'image/webp': webp })[file.type]) {
    throw new ImageStorageError('Isi file tidak sesuai format gambar yang dipilih.');
  }
  if (typeof globalThis.createImageBitmap === 'function') {
    try {
      const bitmap = await globalThis.createImageBitmap(file);
      bitmap.close();
    } catch (error) { throw new ImageStorageError('File gambar rusak atau tidak dapat dibaca.', error); }
  }
}

export async function savePhoto(file, { assignmentId, ownerId, fileName } = {}) {
  const error = validatePhotoFile(file);
  if (error) throw new ImageStorageError(error);
  if (typeof assignmentId !== 'string' || !assignmentId || typeof ownerId !== 'string' || !ownerId) {
    throw new ImageStorageError('Pemilik dan penugasan foto wajib ditentukan.');
  }
  await assertReadableImage(file);
  const record = {
    id: createId('photo'), blob: file,
    fileName: file.name || fileName || 'foto',
    mimeType: file.type, size: file.size,
    assignmentId, ownerId, createdAt: new Date().toISOString(),
  };
  await runTransaction('readwrite', (store) => store.add(record));
  return record;
}

export async function getPhoto(id) {
  if (typeof id !== 'string' || !id) throw new ImageStorageError('ID foto tidak valid.');
  return (await runTransaction('readonly', (store) => store.get(id))) ?? null;
}

export async function getAllPhotos() {
  return runTransaction('readonly', (store) => store.getAll());
}
