import { CHECKLIST_FIELDS, REVIEW_CHECKS } from '../constants/statuses.js';
import { createReportDraft } from './formDefaults.js';
import { initializeStorage, saveSnapshot } from '../storage/appStorage.js';
import { savePhoto } from '../storage/imageStore.js';
import { addDays, getTodayDate } from '../utils/dateFormat.js';
import { nextRecordNumber } from '../utils/ids.js';
import { buildInspectionLetter } from '../utils/letterBuilder.js';
import { assertValid, validateReport, validateReview } from '../utils/reportValidation.js';


let preparation;

const DEMO_PHOTO_SOURCE = {
  author: 'Adhitya Sibikumar',
  url: 'https://unsplash.com/photos/water-tank-with-green-leaves-and-overcast-sky-5ARmmprbT78',
};
const DEMO_PHOTO_CAPTION = '[DEMO] Foto contoh tangki air dari Unsplash; bukan dokumentasi pemeriksaan tangki ini.';

async function createDemoImage() {
  const response = await fetch(`${import.meta.env.BASE_URL}images/demo/unsplash-water-tank.jpg`);
  if (!response.ok) throw new Error('Foto contoh Unsplash tidak dapat dimuat.');
  return response.blob();
}

// Data tambahan bersifat aditif, idempotent, dan tidak mengganti laporan pengguna.
async function seedPresentationDemo({ storage, photoStore = { savePhoto }, imageFactory = createDemoImage, now = new Date() } = {}) {
  const snapshot = initializeStorage({ storage });
  const data = structuredClone(snapshot.data);
  const today = getTodayDate(now);
  const admin = data.users.find((user) => user.username === 'admin');
  const technicians = ['teknisi1', 'teknisi2'].map((username) => data.users.find((user) => user.username === username));
  if (!admin || technicians.some((user) => !user)) return data;
  let image;
  let changed = false;
  for (let index = 0; index < 4; index += 1) {
    const id = `demo-presentation-task-${index + 1}`;
    const existingAssignment = data.assignments.find((task) => task.id === id);
    if (existingAssignment) {
      const report = data.reports.find((item) => item.id === `report-${id}` && item.assignmentId === id);
      const oldPhoto = report?.photoRefs.find((photo) => photo.caption === '[DEMO] Ilustrasi kondisi awal; bukan foto pemeriksaan lapangan.');
      if (oldPhoto) {
        image ??= await imageFactory();
        const replacement = await photoStore.savePhoto(image, { assignmentId: id, ownerId: existingAssignment.technicianId, fileName: 'unsplash-water-tank.jpg' });
        Object.assign(oldPhoto, { photoId: replacement.id, caption: DEMO_PHOTO_CAPTION, source: { ...DEMO_PHOTO_SOURCE } });
        changed = true;
      }
      continue;
    }
    image ??= await imageFactory();
    const closed = index >= 2;
    const technician = technicians[index % 2];
    const executionDate = addDays(today, -(index + 1));
    const submittedAt = new Date(`${executionDate}T10:00:00+07:00`).toISOString();
    const reviewedAt = new Date(`${executionDate}T14:00:00+07:00`).toISOString();
    const tank = {
      id: `demo-presentation-tank-${index + 1}`, code: `DEMO-${String(index + 1).padStart(3, '0')}`,
      name: ['Tangki Laboratorium', 'Tangki Perpustakaan', 'Tangki Administrasi', 'Tangki Aula'][index],
      location: ['Laboratorium, ruang utilitas', 'Perpustakaan, lantai dasar', 'Gedung administrasi, sisi timur', 'Aula, area servis'][index],
      capacityLiters: [2000, 1500, 3000, 2500][index], filterType: 'Sedimen dan karbon aktif',
      condition: closed ? 'GOOD' : 'UNASSESSED', isActive: true, createdAt: submittedAt, updatedAt: closed ? reviewedAt : submittedAt,
    };
    // Bila persiapan sebelumnya terhenti, gunakan identitas tangki yang sudah ada.
    const existingTank = data.tanks.find((item) => item.id === tank.id);
    if (!existingTank) data.tanks.push(tank);
    const assignment = {
      id, tankId: tank.id, technicianId: technician.id,
      number: nextRecordNumber(data.assignments, 'TGS', now.getFullYear()),
      scheduledDate: executionDate, activityTypes: ['INSPECTION'],
      instructions: '[DEMO PRESENTASI] Periksa kondisi fisik, kebersihan, filter, dan kualitas visual air.',
      status: closed ? 'CLOSED_PASSED' : 'AWAITING_REVIEW', currentReportId: `report-${id}`,
      createdBy: admin.id, createdAt: submittedAt, closedAt: closed ? reviewedAt : null,
    };
    const photo = await photoStore.savePhoto(image, { assignmentId: id, ownerId: technician.id, fileName: 'unsplash-water-tank.jpg' });
    const report = {
      ...createReportDraft(id), id: assignment.currentReportId, version: 1,
      executionDate, startTime: '08:00', endTime: '09:15',
      checklist: Object.fromEntries(CHECKLIST_FIELDS.map(({ key }) => [key, { result: 'GOOD', notes: '' }])),
      waterObservations: { color: 'COLORLESS', clarity: 'CLEAR', odor: 'NONE', notes: 'Air jernih; tidak ditemukan endapan atau bau tidak biasa.' },
      workDetails: 'Pemeriksaan badan dan penutup tangki, sambungan pipa, kebersihan, serta perangkat filtrasi. Tidak ditemukan kebocoran; aliran air lancar.',
      finalCondition: 'GOOD', recommendation: 'NO_ADDITIONAL_ACTION',
      photoRefs: [{ photoId: photo.id, category: 'BEFORE', caption: DEMO_PHOTO_CAPTION, source: { ...DEMO_PHOTO_SOURCE } }],
      submittedBy: technician.id, submittedAt, updatedAt: submittedAt,
      tankSnapshot: structuredClone(existingTank ?? tank),
      technicianSnapshot: { id: technician.id, name: technician.name, username: technician.username },
    };
    assertValid(validateReport(report));
    data.assignments.push(assignment);
    data.reports.push(report);
    if (closed) {
      const review = {
        id: `review-${id}`, assignmentId: id, reportId: report.id,
        reviewedBy: admin.id, reviewDate: executionDate,
        checks: Object.fromEntries(REVIEW_CHECKS.map(({ key }) => [key, true])),
        finalCondition: 'GOOD', remainingIssues: '', decision: 'PASSED',
        notes: '[DEMO] Kelengkapan laporan, foto contoh, kesesuaian pemeriksaan, dan kondisi akhir sudah diperiksa ulang. Tidak ada tindak lanjut.',
        reviewedAt,
      };
      assertValid(validateReview(review, report));
      data.reviews.push(review);
      data.letters.push(buildInspectionLetter({ assignment, report, review, tank, technician, admin, letters: data.letters, issuedAt: reviewedAt }));
    }
    changed = true;
  }
  return changed ? saveSnapshot(data, { storage, expectedRevision: snapshot.revision }).data : data;
}

export function preparePresentationDemo() {
  preparation ??= seedPresentationDemo().catch((error) => { preparation = undefined; throw error; });
  return preparation;
}
