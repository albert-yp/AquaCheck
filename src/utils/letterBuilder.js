import { ACTIVITY_TYPE_LABELS, REVIEW_DECISION, TANK_CONDITION } from '../constants/statuses.js';
import { nextRecordNumber } from './ids.js';

export function buildInspectionLetter({ assignment, report, review, tank, technician, admin,
  letters = [], nextAssignment = null, issuedAt = new Date().toISOString() }) {
  if (review.decision !== REVIEW_DECISION.PASSED || review.finalCondition !== TANK_CONDITION.GOOD
    || review.reportId !== report.id || report.assignmentId !== assignment.id
    || review.assignmentId !== assignment.id) {
    throw new Error('Surat hanya dapat dibuat dari laporan yang telah lolos verifikasi.');
  }
  const existing = letters.find((letter) => letter.assignmentId === assignment.id);
  if (existing) return structuredClone(existing);
  return {
    id: `letter-${assignment.id}`,
    assignmentId: assignment.id,
    reportId: report.id,
    reviewId: review.id,
    number: nextRecordNumber(letters, 'SE/TANGKI', new Date(issuedAt).getFullYear()),
    issuedAt,
    snapshot: {
      tank: structuredClone(report.tankSnapshot ?? tank),
      executionDate: report.executionDate,
      actions: report.actions.map((action) => ({ code: action, label: ACTIVITY_TYPE_LABELS[action] })),
      workSummary: report.workDetails?.trim() || 'Pemeriksaan kondisi tangki dan perangkat filtrasi.',
      finalCondition: review.finalCondition,
      technicianName: report.technicianSnapshot?.name ?? technician.name,
      adminName: admin.name,
      reviewDate: review.reviewDate,
      statement: 'Tangki dinyatakan lolos inspeksi berdasarkan pemeriksaan dan verifikasi yang dicatat.',
      nextInspectionDate: nextAssignment?.scheduledDate ?? null,
      nextInspectionNote: nextAssignment ? '' : 'Menunggu penjadwalan berikutnya.',
    },
  };
}
