import {
  ASSIGNMENT_STATUS, EDITABLE_ASSIGNMENT_STATUSES, REVIEW_DECISION, ROLES, TANK_CONDITION,
} from '../constants/statuses.js';
import { createReportDraft, REPORT_FIELDS } from '../data/formDefaults.js';
import { initializeStorage, loadSession, saveSnapshot } from '../storage/appStorage.js';
import * as imageStore from '../storage/imageStore.js';
import { getTodayDate } from '../utils/dateFormat.js';
import { createId, nextRecordNumber } from '../utils/ids.js';
import { buildInspectionLetter } from '../utils/letterBuilder.js';
import {
  assertValid, validateAssignment, validatePhotoReferences, validateReport, validateReview,
  validateTank, ValidationError,
} from '../utils/reportValidation.js';

// Satu service dipakai bersama oleh AppDataProvider. Semua mutasi disimpan sebelum state UI diganti.
export function createAppService({ storage, photoStore = imageStore } = {}) {
  let queue = Promise.resolve();
  const read = () => initializeStorage({ storage });

  function currentActor(data) {
    const session = loadSession({ storage });
    const actor = data.users.find((user) => user.id === session?.userId && user.isActive);
    if (!actor) throw new Error('Masuk terlebih dahulu dengan akun yang aktif.');
    return actor;
  }

  function requireAdmin(actor) {
    if (actor.role !== ROLES.ADMIN) throw new Error('Tindakan ini hanya dapat dilakukan admin.');
  }

  function findAssignment(data, assignmentId, actor, editable = false) {
    const assignment = data.assignments.find((item) => item.id === assignmentId);
    if (!assignment) throw new Error('Penugasan tidak ditemukan.');
    if (actor.role !== ROLES.ADMIN && assignment.technicianId !== actor.id) {
      throw new Error('Anda tidak memiliki akses ke penugasan ini.');
    }
    if (editable && (actor.role !== ROLES.TECHNICIAN
      || !EDITABLE_ASSIGNMENT_STATUSES.includes(assignment.status))) {
      throw new Error('Formulir hanya dapat diubah teknisi pemilik saat tugas dapat dikerjakan/revisi.');
    }
    return assignment;
  }

  function commit(operation) {
    const result = queue.then(async () => {
      const snapshot = read();
      const data = structuredClone(snapshot.data);
      const actor = currentActor(data);
      const value = await operation(data, actor);
      if (loadSession({ storage })?.userId !== actor.id) {
        throw new Error('Sesi berubah selama penyimpanan. Masuk kembali lalu coba ulang.');
      }
      const saved = saveSnapshot(data, { storage, expectedRevision: snapshot.revision });
      return { data: saved.data, result: structuredClone(value) };
    });
    queue = result.catch(() => {});
    return result;
  }

  async function verifyPhotos(draft, assignment) {
    assertValid(validatePhotoReferences(draft.photoRefs));
    const records = await Promise.all(draft.photoRefs.map(({ photoId }) => photoStore.getPhoto(photoId)));
    if (records.some((photo) => !photo || !(photo.blob instanceof Blob) || !photo.blob.size
      || photo.assignmentId !== assignment.id || photo.ownerId !== assignment.technicianId)) {
      throw new ValidationError({ photoRefs: 'Foto hilang, belum tersimpan, atau tidak sesuai pemilik/penugasan.' });
    }
  }

  function materializeDraft(data, assignment, input = {}) {
    const latest = data.reports.find((item) => item.id === assignment.currentReportId);
    const saved = data.reportDrafts.find((item) => item.assignmentId === assignment.id);
    const draft = structuredClone(saved ?? createReportDraft(assignment.id, latest));
    if (input.basedOnReportId !== undefined && input.basedOnReportId !== draft.basedOnReportId) {
      throw new Error('Draft mengacu pada versi laporan lama. Muat ulang formulir.');
    }
    for (const field of REPORT_FIELDS) {
      if (input[field] !== undefined) draft[field] = structuredClone(input[field]);
    }
    draft.updatedAt = new Date().toISOString();
    return draft;
  }

  function pendingReport(data, assignment, input) {
    if (assignment.status !== ASSIGNMENT_STATUS.AWAITING_REVIEW) {
      throw new Error('Tugas tidak sedang menunggu verifikasi.');
    }
    if (!input?.reportId || input.reportId !== assignment.currentReportId) {
      throw new Error('Pilih versi laporan terbaru. Muat ulang halaman verifikasi.');
    }
    return data.reports.find((report) => report.id === assignment.currentReportId);
  }

  function makeReview(assignment, report, actor, input, decision) {
    const review = {
      id: createId('review'), assignmentId: assignment.id, reportId: report.id,
      reviewedBy: actor.id, reviewDate: input.reviewDate,
      checks: structuredClone(input.checks), finalCondition: input.finalCondition,
      remainingIssues: input.remainingIssues, decision, notes: input.notes?.trim(),
      reviewedAt: new Date().toISOString(),
    };
    assertValid(validateReview(review, report));
    return review;
  }

  const service = {
    getData() { return structuredClone(read().data); },

    getVisibleAssignments() {
      const { data } = read();
      const actor = currentActor(data);
      return structuredClone(data.assignments.filter((assignment) => actor.role === ROLES.ADMIN
        || (assignment.technicianId === actor.id && assignment.status !== ASSIGNMENT_STATUS.CLOSED_PASSED)));
    },

    getAssignment(assignmentId) {
      const { data } = read();
      return structuredClone(findAssignment(data, assignmentId, currentActor(data)));
    },

    saveTank(input) {
      return commit((data, actor) => {
        requireAdmin(actor);
        assertValid(validateTank(input));
        const previous = input.id ? data.tanks.find((tank) => tank.id === input.id) : null;
        if (input.id && !previous) throw new Error('Tangki tidak ditemukan.');
        const code = input.code.trim().toUpperCase();
        if (data.tanks.some((tank) => tank.code.toUpperCase() === code && tank.id !== previous?.id)) {
          throw new ValidationError({ code: 'Kode tangki sudah digunakan.' });
        }
        const timestamp = new Date().toISOString();
        const tank = {
          id: previous?.id ?? createId('tank'), code,
          name: input.name.trim(), location: input.location.trim(),
          capacityLiters: Number(input.capacityLiters), filterType: input.filterType.trim(),
          condition: previous?.condition ?? TANK_CONDITION.UNASSESSED,
          isActive: previous?.isActive ?? true,
          createdAt: previous?.createdAt ?? timestamp, updatedAt: timestamp,
        };
        data.tanks = previous ? data.tanks.map((item) => item.id === tank.id ? tank : item) : [...data.tanks, tank];
        return tank;
      });
    },

    setTankActive(tankId, isActive) {
      return commit((data, actor) => {
        requireAdmin(actor);
        if (typeof isActive !== 'boolean') throw new Error('Status aktif tidak valid.');
        const tank = data.tanks.find((item) => item.id === tankId);
        if (!tank) throw new Error('Tangki tidak ditemukan.');
        if (!isActive && data.assignments.some((item) => item.tankId === tankId
          && item.status !== ASSIGNMENT_STATUS.CLOSED_PASSED)) {
          throw new Error('Selesaikan tugas aktif sebelum mengarsipkan tangki.');
        }
        tank.isActive = isActive;
        tank.updatedAt = new Date().toISOString();
        return tank;
      });
    },

    deleteTank(tankId) {
      return commit((data, actor) => {
        requireAdmin(actor);
        const tank = data.tanks.find((item) => item.id === tankId);
        if (!tank) throw new Error('Tangki tidak ditemukan.');
        const assignments = data.assignments.filter((item) => item.tankId === tankId);
        if (assignments.some((item) => item.status !== ASSIGNMENT_STATUS.CLOSED_PASSED)) {
          throw new Error('Tangki memiliki tugas aktif dan belum dapat dihapus/diarsipkan.');
        }
        if (assignments.length) {
          tank.isActive = false;
          tank.updatedAt = new Date().toISOString();
          return { tankId, archived: true };
        }
        data.tanks = data.tanks.filter((item) => item.id !== tankId);
        return { tankId, archived: false };
      });
    },

    createAssignment(input) {
      return commit((data, actor) => {
        requireAdmin(actor);
        assertValid(validateAssignment(input));
        if (!data.tanks.some((tank) => tank.id === input.tankId && tank.isActive)) {
          throw new ValidationError({ tankId: 'Pilih tangki yang aktif.' });
        }
        if (!data.users.some((user) => user.id === input.technicianId && user.isActive && user.role === ROLES.TECHNICIAN)) {
          throw new ValidationError({ technicianId: 'Pilih teknisi yang aktif.' });
        }
        const assignment = {
          id: createId('task'), number: nextRecordNumber(data.assignments, 'TGS'),
          tankId: input.tankId, technicianId: input.technicianId,
          scheduledDate: input.scheduledDate, activityTypes: [...new Set(input.activityTypes)],
          instructions: input.instructions.trim(), status: ASSIGNMENT_STATUS.ASSIGNED,
          currentReportId: null, createdBy: actor.id,
          createdAt: new Date().toISOString(), closedAt: null,
        };
        data.assignments.push(assignment);
        return assignment;
      });
    },

    saveReportDraft(assignmentId, input = {}) {
      return commit(async (data, actor) => {
        const assignment = findAssignment(data, assignmentId, actor, true);
        const draft = materializeDraft(data, assignment, input);
        await verifyPhotos(draft, assignment);
        data.reportDrafts = [...data.reportDrafts.filter((item) => item.assignmentId !== assignmentId), draft];
        if (assignment.status === ASSIGNMENT_STATUS.ASSIGNED) assignment.status = ASSIGNMENT_STATUS.IN_PROGRESS;
        return draft;
      });
    },

    clearReportDraft(assignmentId) {
      return commit((data, actor) => {
        const assignment = findAssignment(data, assignmentId, actor, true);
        const latest = data.reports.find((report) => report.id === assignment.currentReportId);
        data.reportDrafts = data.reportDrafts.filter((draft) => draft.assignmentId !== assignmentId);
        if (!latest) assignment.status = ASSIGNMENT_STATUS.ASSIGNED;
        return createReportDraft(assignmentId, latest);
      });
    },

    submitReport(assignmentId, input = {}) {
      return commit(async (data, actor) => {
        const assignment = findAssignment(data, assignmentId, actor, true);
        const draft = materializeDraft(data, assignment, input);
        assertValid(validateReport(draft));
        await verifyPhotos(draft, assignment);
        const previous = data.reports.find((item) => item.id === assignment.currentReportId);
        const version = Math.max(0, ...data.reports.filter((item) => item.assignmentId === assignmentId)
          .map((item) => item.version)) + 1;
        const report = {
          ...draft, id: createId('report'), version,
          submittedBy: actor.id, submittedAt: new Date().toISOString(),
          tankSnapshot: structuredClone(previous?.tankSnapshot ?? data.tanks.find((tank) => tank.id === assignment.tankId)),
          technicianSnapshot: structuredClone(previous?.technicianSnapshot ?? { id: actor.id, name: actor.name, username: actor.username }),
        };
        data.reports.push(report);
        data.reportDrafts = data.reportDrafts.filter((item) => item.assignmentId !== assignmentId);
        assignment.currentReportId = report.id;
        assignment.status = ASSIGNMENT_STATUS.AWAITING_REVIEW;
        return report;
      });
    },

    returnForRevision(assignmentId, input) {
      return commit((data, actor) => {
        requireAdmin(actor);
        const assignment = findAssignment(data, assignmentId, actor);
        const report = pendingReport(data, assignment, input);
        const review = makeReview(assignment, report, actor, input, REVIEW_DECISION.REVISION_REQUIRED);
        data.reviews.push(review);
        assignment.status = ASSIGNMENT_STATUS.REVISION_REQUIRED;
        const tank = data.tanks.find((item) => item.id === assignment.tankId);
        if (review.finalCondition !== TANK_CONDITION.UNASSESSED) tank.condition = review.finalCondition;
        tank.updatedAt = review.reviewedAt;
        return review;
      });
    },

    approveInspection(assignmentId, input) {
      return commit(async (data, actor) => {
        requireAdmin(actor);
        const assignment = findAssignment(data, assignmentId, actor);
        if (assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED) {
          const existing = data.letters.find((letter) => letter.assignmentId === assignmentId);
          if (existing && input?.reportId === existing.reportId) return existing;
          throw new Error('Tugas sudah ditutup dan tidak dapat diubah.');
        }
        const report = pendingReport(data, assignment, input);
        assertValid(validateReport(report));
        const review = makeReview(assignment, report, actor, input, REVIEW_DECISION.PASSED);
        await verifyPhotos(report, assignment);
        const tank = data.tanks.find((item) => item.id === assignment.tankId);
        const today = getTodayDate();
        const nextAssignment = data.assignments.filter((item) => item.id !== assignmentId
          && item.tankId === tank.id && item.status !== ASSIGNMENT_STATUS.CLOSED_PASSED
          && item.scheduledDate >= today).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];
        const letter = buildInspectionLetter({
          assignment, report, review, tank, admin: actor,
          technician: data.users.find((user) => user.id === assignment.technicianId),
          letters: data.letters, nextAssignment, issuedAt: review.reviewedAt,
        });
        data.reviews.push(review);
        data.letters.push(letter);
        assignment.status = ASSIGNMENT_STATUS.CLOSED_PASSED;
        assignment.closedAt = review.reviewedAt;
        tank.condition = review.finalCondition;
        tank.updatedAt = review.reviewedAt;
        return letter;
      });
    },
  };
  return service;
}
