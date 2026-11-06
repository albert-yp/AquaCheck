import { ASSIGNMENT_STATUS, ROLES, REVIEW_DECISION, TANK_CONDITION } from '../constants/statuses.js';
import { createMockData, DEMO_ACCOUNTS } from '../data/mockData.js';

export const DATA_KEY = 'water-tank-app:data:v1';
export const SESSION_KEY = 'water-tank-app:session:v1';
const SCHEMA_VERSION = 1;
const COLLECTIONS = ['users', 'tanks', 'assignments', 'reportDrafts', 'reports', 'reviews', 'letters'];

class StorageError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = 'StorageError';
  }
}

function resolveStorage(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target || typeof target.getItem !== 'function' || typeof target.setItem !== 'function') {
      throw new Error('localStorage tidak tersedia.');
    }
    return target;
  } catch (error) {
    throw new StorageError('Penyimpanan browser tidak dapat diakses.', error);
  }
}

function assertJsonSafe(value, stack = new WeakSet()) {
  if (value === null || value === undefined || typeof value === 'boolean') return;
  if (typeof value === 'string') {
    if (value.startsWith('blob:')) throw new StorageError('Simpan ID foto, bukan URL preview.');
    return;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return;
  if (typeof value !== 'object' || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype)) {
    throw new StorageError('Data harus berupa JSON; file gambar disimpan di IndexedDB.');
  }
  if (stack.has(value)) throw new StorageError('Referensi melingkar tidak dapat disimpan.');
  stack.add(value);
  Object.values(value).forEach((item) => assertJsonSafe(item, stack));
  stack.delete(value);
}

function validateData(data) {
  assertJsonSafe(data);
  if (!data || typeof data !== 'object') throw new StorageError('Struktur data aplikasi tidak valid.');
  const maps = {};
  for (const key of COLLECTIONS) {
    if (!Array.isArray(data[key])) throw new StorageError(`Koleksi ${key} tidak tersedia.`);
    const map = new Map();
    for (const record of data[key]) {
      if (!record || typeof record.id !== 'string' || !record.id || map.has(record.id)) {
        throw new StorageError(`ID dalam koleksi ${key} kosong atau duplikat.`);
      }
      map.set(record.id, record);
    }
    maps[key] = map;
  }
  for (const user of data.users) {
    if (!Object.values(ROLES).includes(user.role) || typeof user.username !== 'string') {
      throw new StorageError('Data akun tidak valid.');
    }
  }
  for (const tank of data.tanks) {
    if (!Object.values(TANK_CONDITION).includes(tank.condition)) throw new StorageError('Kondisi tangki tidak valid.');
  }
  const draftedAssignments = new Set();
  for (const draft of data.reportDrafts) {
    if (!maps.assignments.has(draft.assignmentId) || draftedAssignments.has(draft.assignmentId)) {
      throw new StorageError('Draft harus mengacu pada satu penugasan yang valid.');
    }
    draftedAssignments.add(draft.assignmentId);
  }
  for (const report of data.reports) {
    if (!maps.assignments.has(report.assignmentId) || !Number.isInteger(report.version) || report.version < 1) {
      throw new StorageError('Referensi atau versi laporan tidak valid.');
    }
  }
  for (const review of data.reviews) {
    if (maps.reports.get(review.reportId)?.assignmentId !== review.assignmentId
      || !Object.values(REVIEW_DECISION).includes(review.decision)) {
      throw new StorageError('Referensi verifikasi tidak valid.');
    }
  }
  const letterAssignments = new Set();
  const letterNumbers = new Set();
  for (const letter of data.letters) {
    const review = maps.reviews.get(letter.reviewId);
    if (letterAssignments.has(letter.assignmentId) || letterNumbers.has(letter.number)
      || review?.decision !== REVIEW_DECISION.PASSED || review.assignmentId !== letter.assignmentId
      || review.reportId !== letter.reportId
      || maps.assignments.get(letter.assignmentId)?.status !== ASSIGNMENT_STATUS.CLOSED_PASSED) {
      throw new StorageError('Surat harus unik dan berasal dari inspeksi yang sudah ditutup.');
    }
    letterAssignments.add(letter.assignmentId);
    letterNumbers.add(letter.number);
  }
  for (const assignment of data.assignments) {
    if (!maps.tanks.has(assignment.tankId)
      || maps.users.get(assignment.technicianId)?.role !== ROLES.TECHNICIAN
      || !Object.values(ASSIGNMENT_STATUS).includes(assignment.status)) {
      throw new StorageError('Referensi tangki, teknisi, atau status penugasan tidak valid.');
    }
    if (assignment.currentReportId && maps.reports.get(assignment.currentReportId)?.assignmentId !== assignment.id) {
      throw new StorageError('Laporan aktif tidak sesuai penugasan.');
    }
    if ([ASSIGNMENT_STATUS.AWAITING_REVIEW, ASSIGNMENT_STATUS.REVISION_REQUIRED,
      ASSIGNMENT_STATUS.CLOSED_PASSED].includes(assignment.status) && !assignment.currentReportId) {
      throw new StorageError('Status penugasan membutuhkan laporan yang telah dikirim.');
    }
    if (assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED && !letterAssignments.has(assignment.id)) {
      throw new StorageError('Penutupan tugas dan penerbitan surat harus disimpan bersama.');
    }
  }
  return data;
}

export function loadSnapshot({ storage } = {}) {
  try {
    const raw = resolveStorage(storage).getItem(DATA_KEY);
    if (raw === null) return null;
    const snapshot = JSON.parse(raw);
    if (snapshot?.schemaVersion !== SCHEMA_VERSION || typeof snapshot.updatedAt !== 'string'
      || !Number.isFinite(Date.parse(snapshot.updatedAt))) {
      throw new StorageError('Versi atau metadata penyimpanan tidak didukung. Data tidak direset.');
    }
    validateData(snapshot.data);
    if (snapshot.revision !== undefined && (!Number.isInteger(snapshot.revision) || snapshot.revision < 0)) {
      throw new StorageError('Nomor revisi penyimpanan tidak valid.');
    }
    return { ...snapshot, revision: snapshot.revision ?? 0 };
  } catch (error) {
    if (error instanceof StorageError) throw error;
    throw new StorageError('Data tidak dapat dibaca. Periksa penyimpanan; data lama tetap dipertahankan.', error);
  }
}

export function saveSnapshot(data, { storage, expectedRevision } = {}) {
  validateData(data);
  const target = resolveStorage(storage);
  const current = loadSnapshot({ storage: target });
  const revision = current?.revision ?? 0;
  if (expectedRevision !== undefined && expectedRevision !== revision) {
    throw new StorageError('Data telah berubah. Muat ulang data sebelum menyimpan kembali.');
  }
  const snapshot = {
    schemaVersion: SCHEMA_VERSION, revision: revision + 1,
    updatedAt: new Date().toISOString(), data: structuredClone(data),
  };
  try {
    target.setItem(DATA_KEY, JSON.stringify(snapshot));
  } catch (error) {
    throw new StorageError('Data gagal disimpan. Penyimpanan mungkin penuh atau tidak tersedia.', error);
  }
  return snapshot;
}

export function initializeStorage({ storage, seed = createMockData } = {}) {
  const snapshot = loadSnapshot({ storage }) ?? saveSnapshot(seed(), { storage, expectedRevision: 0 });
  const oldNames = ['Admin Pengelola', 'Teknisi Satu', 'Teknisi Dua'];
  let changed = false;
  for (const account of DEMO_ACCOUNTS) {
    const user = snapshot.data.users.find((item) => item.username === account.username);
    if (user && oldNames.includes(user.name)) {
      user.name = account.name;
      changed = true;
    }
  }
  // Snapshot laporan/surat lama tetap menyimpan identitas ketika diterbitkan.
  return changed ? saveSnapshot(snapshot.data, { storage, expectedRevision: snapshot.revision }) : snapshot;
}

export function loadSession({ storage } = {}) {
  try {
    const raw = resolveStorage(storage).getItem(SESSION_KEY);
    if (raw === null) return null;
    const session = JSON.parse(raw);
    if (session?.schemaVersion !== SCHEMA_VERSION || typeof session.userId !== 'string' || !session.userId) {
      throw new Error('Sesi tidak valid.');
    }
    return session;
  } catch (error) {
    throw new StorageError('Sesi tidak dapat dibaca. Keluar lalu masuk kembali.', error);
  }
}

export function saveSession(userId, { storage } = {}) {
  if (typeof userId !== 'string' || !userId) throw new StorageError('Pengguna sesi tidak valid.');
  const session = { schemaVersion: SCHEMA_VERSION, userId };
  try { resolveStorage(storage).setItem(SESSION_KEY, JSON.stringify(session)); }
  catch (error) { throw new StorageError('Sesi gagal disimpan.', error); }
  return session;
}

export function clearSession({ storage } = {}) {
  try { resolveStorage(storage).removeItem(SESSION_KEY); }
  catch (error) { throw new StorageError('Sesi gagal dihapus.', error); }
}
