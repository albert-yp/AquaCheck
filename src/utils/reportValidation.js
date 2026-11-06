import {
  ACTIVITY_TYPE, CHECKLIST_FIELDS, CHECK_RESULT, PHOTO_CATEGORY, RECOMMENDATION,
  REVIEW_CHECKS, REVIEW_DECISION, TANK_CONDITION, WATER_OPTIONS,
} from '../constants/statuses.js';
import { getTodayDate, parseDateOnly } from './dateFormat.js';

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const includesValue = (enumeration, value) => Object.values(enumeration).includes(value);
const finish = (errors) => ({ isValid: Object.keys(errors).length === 0, errors });

export class ValidationError extends Error {
  constructor(errors, message = 'Periksa kembali isian formulir.') {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export function assertValid(result) {
  if (!result.isValid) throw new ValidationError(result.errors);
}

export function validatePhotoReferences(photoRefs, { requireCaption = false } = {}) {
  const errors = {};
  if (!Array.isArray(photoRefs)) return finish({ photoRefs: 'Daftar foto tidak valid.' });
  const ids = new Set();
  photoRefs.forEach((photo, index) => {
    if (!hasText(photo?.photoId) || ids.has(photo.photoId)) {
      errors[`photoRefs.${index}.photoId`] = 'ID foto kosong atau digunakan lebih dari sekali.';
    }
    ids.add(photo?.photoId);
    if (!includesValue(PHOTO_CATEGORY, photo?.category)) {
      errors[`photoRefs.${index}.category`] = 'Pilih kategori foto yang valid.';
    }
    if (requireCaption && !hasText(photo?.caption)) {
      errors[`photoRefs.${index}.caption`] = 'Keterangan foto wajib diisi.';
    }
  });
  return finish(errors);
}

export function validateReport(report = {}) {
  const errors = {};
  if (!parseDateOnly(report.executionDate) || report.executionDate > getTodayDate()) {
    errors.executionDate = 'Tanggal pelaksanaan wajib valid dan tidak melewati hari ini.';
  }
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(report.startTime ?? '')) errors.startTime = 'Jam mulai wajib diisi.';
  if (!timePattern.test(report.endTime ?? '')) errors.endTime = 'Jam selesai wajib diisi.';
  if (!errors.startTime && !errors.endTime && report.endTime < report.startTime) {
    errors.endTime = 'Jam selesai tidak boleh sebelum jam mulai pada tanggal yang sama.';
  }
  let checklistHasIssue = false;
  for (const { key, label } of CHECKLIST_FIELDS) {
    const item = report.checklist?.[key];
    if (!includesValue(CHECK_RESULT, item?.result)) errors[`checklist.${key}.result`] = `${label} wajib diperiksa.`;
    if (item?.result === CHECK_RESULT.NOT_APPLICABLE && !hasText(item.notes)) {
      errors[`checklist.${key}.notes`] = 'Jelaskan alasan bagian ini tidak berlaku.';
    }
    if (item?.result === CHECK_RESULT.ISSUE) checklistHasIssue = true;
  }
  for (const [key, options] of Object.entries(WATER_OPTIONS)) {
    if (!options.some(({ value }) => value === report.waterObservations?.[key])) {
      errors[`waterObservations.${key}`] = 'Pengamatan air wajib diisi.';
    }
  }
  const findings = Array.isArray(report.findings) ? report.findings : [];
  if (!Array.isArray(report.findings)) errors.findings = 'Daftar temuan tidak valid.';
  findings.forEach((finding, index) => {
    if (!hasText(finding?.component)) errors[`findings.${index}.component`] = 'Bagian yang bermasalah wajib diisi.';
    if (!hasText(finding?.description)) errors[`findings.${index}.description`] = 'Deskripsi temuan wajib diisi.';
  });
  const actions = Array.isArray(report.actions) ? report.actions : [];
  if (!actions.length || actions.some((action) => !includesValue(ACTIVITY_TYPE, action))
      || new Set(actions).size !== actions.length) {
    errors.actions = 'Pilih setidaknya satu tindakan yang valid tanpa duplikasi.';
  }
  const maintenancePerformed = actions.some((action) => action !== ACTIVITY_TYPE.INSPECTION);
  if (maintenancePerformed && !hasText(report.workDetails)) errors.workDetails = 'Detail pekerjaan wajib diisi.';
  if (!includesValue(TANK_CONDITION, report.finalCondition) || report.finalCondition === TANK_CONDITION.UNASSESSED) {
    errors.finalCondition = 'Pilih kondisi akhir berdasarkan pemeriksaan.';
  }
  if (typeof report.remainingIssues !== 'string') errors.remainingIssues = 'Masalah tersisa harus berupa catatan teks.';
  if (!includesValue(RECOMMENDATION, report.recommendation)) errors.recommendation = 'Pilih rekomendasi tindakan.';
  const needsFollowUp = hasText(report.remainingIssues)
    || [TANK_CONDITION.NEEDS_MAINTENANCE, TANK_CONDITION.NEEDS_REPAIR].includes(report.finalCondition);
  if (needsFollowUp && report.recommendation !== RECOMMENDATION.FOLLOW_UP_REQUIRED) {
    errors.recommendation = 'Pilih tindak lanjut karena kondisi belum baik atau masih ada masalah.';
  }
  if (hasText(report.remainingIssues) && report.finalCondition === TANK_CONDITION.GOOD) {
    errors.finalCondition = 'Kondisi belum dapat dinyatakan baik jika ada masalah tersisa.';
  }
  const observationHasIssue = (report.waterObservations?.color && report.waterObservations.color !== 'COLORLESS')
    || (report.waterObservations?.clarity && report.waterObservations.clarity !== 'CLEAR')
    || report.waterObservations?.odor === 'UNUSUAL';
  const hasFindings = checklistHasIssue || observationHasIssue || needsFollowUp || findings.length > 0;
  if (hasFindings && findings.length === 0) errors.findings = 'Catat temuan masalah yang ditemukan.';
  Object.assign(errors, validatePhotoReferences(report.photoRefs, { requireCaption: true }).errors);
  const photos = Array.isArray(report.photoRefs) ? report.photoRefs : [];
  if (!photos.some((photo) => photo?.category === PHOTO_CATEGORY.BEFORE)) {
    errors.beforePhoto = 'Minimal satu foto kondisi awal wajib dilampirkan.';
  }
  if (hasFindings && !photos.some((photo) => photo?.category === PHOTO_CATEGORY.FINDING)) {
    errors.findingPhoto = 'Lampirkan foto detail temuan.';
  }
  if (maintenancePerformed && !photos.some((photo) => photo?.category === PHOTO_CATEGORY.AFTER)) {
    errors.afterPhoto = 'Lampirkan foto setelah pekerjaan.';
  }
  return finish(errors);
}

export function validateReview(review = {}, report = null) {
  const errors = {};
  if (!hasText(review.reportId)) errors.reportId = 'Versi laporan yang diperiksa wajib dipilih.';
  if (!parseDateOnly(review.reviewDate) || review.reviewDate > getTodayDate()
    || (report && review.reviewDate < report.executionDate)) {
    errors.reviewDate = 'Tanggal pengecekan ulang tidak valid.';
  }
  if (!hasText(review.notes)) errors.notes = 'Catatan pengecekan ulang/alasan revisi wajib diisi.';
  if (!includesValue(REVIEW_DECISION, review.decision)) errors.decision = 'Pilih keputusan verifikasi.';
  for (const { key } of REVIEW_CHECKS) {
    if (typeof review.checks?.[key] !== 'boolean') errors[`checks.${key}`] = 'Hasil pengecekan wajib dicatat.';
    if (review.decision === REVIEW_DECISION.PASSED && review.checks?.[key] !== true) {
      errors[`checks.${key}`] = 'Pengecekan ini harus selesai sebelum menyatakan lolos.';
    }
  }
  if (!includesValue(TANK_CONDITION, review.finalCondition)) errors.finalCondition = 'Kondisi akhir tidak valid.';
  if (typeof review.remainingIssues !== 'string') errors.remainingIssues = 'Masalah tersisa harus berupa catatan teks.';
  if (review.decision === REVIEW_DECISION.PASSED) {
    if (review.finalCondition !== TANK_CONDITION.GOOD) errors.finalCondition = 'Kondisi akhir harus baik untuk lolos inspeksi.';
    if (hasText(review.remainingIssues)) errors.remainingIssues = 'Selesaikan seluruh masalah sebelum menyatakan lolos.';
    if (!report || report.finalCondition !== TANK_CONDITION.GOOD || hasText(report.remainingIssues)
      || report.recommendation !== RECOMMENDATION.NO_ADDITIONAL_ACTION) {
      errors.report = 'Laporan masih membutuhkan tindak lanjut; kembalikan untuk perbaikan.';
    }
  }
  return finish(errors);
}

export function validateTank(tank = {}) {
  const errors = {};
  for (const key of ['code', 'name', 'location', 'filterType']) {
    if (!hasText(tank[key])) errors[key] = 'Field ini wajib diisi.';
  }
  if (!Number.isFinite(Number(tank.capacityLiters)) || Number(tank.capacityLiters) <= 0) {
    errors.capacityLiters = 'Kapasitas harus lebih dari nol.';
  }
  return finish(errors);
}

export function validateAssignment(assignment = {}) {
  const errors = {};
  for (const key of ['tankId', 'technicianId', 'instructions']) {
    if (!hasText(assignment[key])) errors[key] = 'Field ini wajib diisi.';
  }
  if (!parseDateOnly(assignment.scheduledDate)) errors.scheduledDate = 'Tanggal jadwal tidak valid.';
  if (!Array.isArray(assignment.activityTypes) || !assignment.activityTypes.length
    || assignment.activityTypes.some((type) => !includesValue(ACTIVITY_TYPE, type))) {
    errors.activityTypes = 'Pilih kegiatan yang valid.';
  }
  return finish(errors);
}
