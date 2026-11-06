// Peran pengguna
export const ROLES = {
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.TECHNICIAN]: 'Teknisi',
};

// Status penugasan
export const ASSIGNMENT_STATUS = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_REVIEW: 'AWAITING_REVIEW',
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  CLOSED_PASSED: 'CLOSED_PASSED',
};

export const ASSIGNMENT_STATUS_LABELS = {
  [ASSIGNMENT_STATUS.ASSIGNED]: 'Ditugaskan',
  [ASSIGNMENT_STATUS.IN_PROGRESS]: 'Dikerjakan',
  [ASSIGNMENT_STATUS.AWAITING_REVIEW]: 'Menunggu Verifikasi',
  [ASSIGNMENT_STATUS.REVISION_REQUIRED]: 'Perlu Perbaikan/Revisi',
  [ASSIGNMENT_STATUS.CLOSED_PASSED]: 'Ditutup — Lolos Inspeksi',
};

export const ASSIGNMENT_STATUS_COLORS = {
  [ASSIGNMENT_STATUS.ASSIGNED]: 'default',
  [ASSIGNMENT_STATUS.IN_PROGRESS]: 'info',
  [ASSIGNMENT_STATUS.AWAITING_REVIEW]: 'warning',
  [ASSIGNMENT_STATUS.REVISION_REQUIRED]: 'error',
  [ASSIGNMENT_STATUS.CLOSED_PASSED]: 'success',
};

// Kondisi tangki
export const TANK_CONDITION = {
  UNASSESSED: 'UNASSESSED',
  GOOD: 'GOOD',
  NEEDS_MAINTENANCE: 'NEEDS_MAINTENANCE',
  NEEDS_REPAIR: 'NEEDS_REPAIR',
};

export const TANK_CONDITION_LABELS = {
  [TANK_CONDITION.UNASSESSED]: 'Belum diperiksa',
  [TANK_CONDITION.GOOD]: 'Baik',
  [TANK_CONDITION.NEEDS_MAINTENANCE]: 'Perlu perawatan',
  [TANK_CONDITION.NEEDS_REPAIR]: 'Perlu perbaikan',
};

// Kategori bukti foto
export const PHOTO_CATEGORY = {
  BEFORE: 'BEFORE',
  FINDING: 'FINDING',
  AFTER: 'AFTER',
};

export const PHOTO_CATEGORY_LABELS = {
  [PHOTO_CATEGORY.BEFORE]: 'Kondisi awal',
  [PHOTO_CATEGORY.FINDING]: 'Detail temuan',
  [PHOTO_CATEGORY.AFTER]: 'Setelah pekerjaan',
};

// Jenis kegiatan
export const ACTIVITY_TYPE = {
  INSPECTION: 'INSPECTION',
  CLEAN_TANK: 'CLEAN_TANK',
  CLEAN_FILTER: 'CLEAN_FILTER',
  REPLACE_FILTER: 'REPLACE_FILTER',
  REPAIR_COMPONENT: 'REPAIR_COMPONENT',
};

export const ACTIVITY_TYPE_LABELS = {
  [ACTIVITY_TYPE.INSPECTION]: 'Pemeriksaan',
  [ACTIVITY_TYPE.CLEAN_TANK]: 'Pembersihan tangki',
  [ACTIVITY_TYPE.CLEAN_FILTER]: 'Pembersihan filter',
  [ACTIVITY_TYPE.REPLACE_FILTER]: 'Penggantian filter',
  [ACTIVITY_TYPE.REPAIR_COMPONENT]: 'Perbaikan komponen',
};

// Keputusan verifikasi admin
export const REVIEW_DECISION = {
  REVISION_REQUIRED: 'REVISION_REQUIRED',
  PASSED: 'PASSED',
};

export const REVIEW_DECISION_LABELS = {
  [REVIEW_DECISION.REVISION_REQUIRED]: 'Perlu Perbaikan/Revisi',
  [REVIEW_DECISION.PASSED]: 'Lolos Inspeksi',
};

export const CHECK_RESULT = {
  GOOD: 'GOOD',
  ISSUE: 'ISSUE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
};

export const CHECK_RESULT_LABELS = {
  GOOD: 'Baik / tidak ada masalah',
  ISSUE: 'Ada masalah',
  NOT_APPLICABLE: 'Tidak berlaku',
};

export const CHECKLIST_FIELDS = [
  { key: 'tankBody', label: 'Badan tangki', group: 'Kondisi fisik' },
  { key: 'tankCover', label: 'Penutup tangki', group: 'Kondisi fisik' },
  { key: 'connections', label: 'Sambungan pipa', group: 'Kondisi fisik' },
  { key: 'leakage', label: 'Kondisi kebocoran', group: 'Kondisi fisik' },
  { key: 'sediment', label: 'Endapan', group: 'Kebersihan' },
  { key: 'algae', label: 'Lumut', group: 'Kebersihan' },
  { key: 'interior', label: 'Kebersihan dinding dan dasar', group: 'Kebersihan' },
  { key: 'filterCleanliness', label: 'Kebersihan filter', group: 'Filtrasi' },
  { key: 'filterBlockage', label: 'Kondisi sumbatan filter', group: 'Filtrasi' },
  { key: 'filterDamage', label: 'Kondisi kerusakan filter', group: 'Filtrasi' },
  { key: 'waterFlow', label: 'Kondisi aliran air', group: 'Filtrasi' },
];

export const WATER_OPTIONS = {
  color: [
    { value: 'COLORLESS', label: 'Tidak berwarna' },
    { value: 'YELLOWISH', label: 'Kekuningan' },
    { value: 'BROWNISH', label: 'Kecokelatan' },
    { value: 'OTHER', label: 'Lainnya' },
  ],
  clarity: [
    { value: 'CLEAR', label: 'Jernih' },
    { value: 'CLOUDY', label: 'Keruh' },
    { value: 'DIRTY', label: 'Kotor / terdapat partikel' },
  ],
  odor: [
    { value: 'NONE', label: 'Tidak berbau' },
    { value: 'UNUSUAL', label: 'Berbau tidak biasa' },
  ],
};

export const RECOMMENDATION = {
  NO_ADDITIONAL_ACTION: 'NO_ADDITIONAL_ACTION',
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP_REQUIRED',
};

export const RECOMMENDATION_LABELS = {
  NO_ADDITIONAL_ACTION: 'Tidak memerlukan tindakan tambahan',
  FOLLOW_UP_REQUIRED: 'Masih membutuhkan penanganan',
};

export const REVIEW_CHECKS = [
  { key: 'reportCompleteness', label: 'Kelengkapan laporan diperiksa' },
  { key: 'photoEvidence', label: 'Bukti foto diperiksa' },
  { key: 'actionSuitability', label: 'Kesesuaian tindakan diperiksa' },
  { key: 'finalCondition', label: 'Kondisi akhir diperiksa ulang' },
];

export const EDITABLE_ASSIGNMENT_STATUSES = [
  ASSIGNMENT_STATUS.ASSIGNED,
  ASSIGNMENT_STATUS.IN_PROGRESS,
  ASSIGNMENT_STATUS.REVISION_REQUIRED,
];

export const PHOTO_UPLOAD_RULES = {
  maxSizeBytes: 5 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};
