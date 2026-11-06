import {
  ACTIVITY_TYPE, ASSIGNMENT_STATUS, ROLES, TANK_CONDITION,
} from '../constants/statuses.js';
import { addDays, getTodayDate } from '../utils/dateFormat.js';

// Kredensial demo lokal; jangan disalin ke profil atau snapshot data bisnis.
export const DEMO_CREDENTIALS = Object.freeze({
  admin: 'admin123',
  teknisi1: 'teknisi123',
  teknisi2: 'teknisi123',
});

export const DEMO_ACCOUNTS = [
  { username: 'admin', name: 'Raka', role: ROLES.ADMIN },
  { username: 'teknisi1', name: 'Okabe', role: ROLES.TECHNICIAN },
  { username: 'teknisi2', name: 'Erick', role: ROLES.TECHNICIAN },
];

export function createMockData(now = new Date()) {
  const today = getTodayDate(now);
  const timestamp = now.toISOString();
  const users = DEMO_ACCOUNTS.map((account, index) => ({
    id: index === 0 ? 'usr-admin' : `usr-tech-${index}`,
    ...account,
    isActive: true,
  }));
  const tanks = [
    { id: 'tank-001', code: 'TNG-001', name: 'Tangki Gedung A', location: 'Gedung A, lantai dasar', capacityLiters: 2000, filterType: 'Sedimen dan karbon aktif' },
    { id: 'tank-002', code: 'TNG-002', name: 'Tangki Gedung B', location: 'Gedung B, area belakang', capacityLiters: 1500, filterType: 'Sedimen' },
    { id: 'tank-003', code: 'TNG-003', name: 'Tangki Kantin', location: 'Kantin, ruang utilitas', capacityLiters: 1000, filterType: 'Sedimen dan karbon aktif' },
    { id: 'tank-004', code: 'TNG-004', name: 'Tangki Cadangan', location: 'Gudang, sisi timur', capacityLiters: 3000, filterType: 'Sedimen' },
  ].map((tank) => ({
    ...tank, condition: TANK_CONDITION.UNASSESSED, isActive: true,
    createdAt: timestamp, updatedAt: timestamp,
  }));
  const assignments = [
    { id: 'task-001', tankId: 'tank-001', technicianId: 'usr-tech-1', scheduledDate: today, instructions: 'Periksa seluruh kondisi tangki dan filtrasi. Lampirkan foto kondisi awal.' },
    { id: 'task-002', tankId: 'tank-002', technicianId: 'usr-tech-2', scheduledDate: addDays(today, 2), instructions: 'Periksa kebersihan dan aliran filter. Lakukan pembersihan bila diperlukan.' },
    { id: 'task-003', tankId: 'tank-003', technicianId: 'usr-tech-1', scheduledDate: addDays(today, -1), instructions: 'Penugasan contoh yang terlambat; periksa dan catat temuan.' },
  ].map((assignment, index) => ({
    ...assignment,
    number: `TGS/${now.getFullYear()}/${String(index + 1).padStart(4, '0')}`,
    activityTypes: [ACTIVITY_TYPE.INSPECTION],
    status: ASSIGNMENT_STATUS.ASSIGNED,
    currentReportId: null,
    createdBy: 'usr-admin',
    createdAt: timestamp,
    closedAt: null,
  }));
  return { users, tanks, assignments, reportDrafts: [], reports: [], reviews: [], letters: [] };
}
