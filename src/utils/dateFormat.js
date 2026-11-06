import { EDITABLE_ASSIGNMENT_STATUSES } from '../constants/statuses.js';

export function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date : null;
}

export function getTodayDate(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Tanggal tidak valid.');
  }
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')].join('-');
}

export function addDays(value, days) {
  const date = typeof value === 'string' ? parseDateOnly(value) : new Date(value);
  if (!date || Number.isNaN(date.getTime()) || !Number.isInteger(days)) {
    throw new Error('Tanggal atau jumlah hari tidak valid.');
  }
  date.setDate(date.getDate() + days);
  return getTodayDate(date);
}

export function formatDate(value, options = {}) {
  const date = parseDateOnly(value);
  return date ? new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', ...options,
  }).format(date) : '—';
}

export function formatDateTime(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    ...options,
  }).format(date);
}

export function isAssignmentOverdue(assignment, today = getTodayDate()) {
  return Boolean(parseDateOnly(assignment.scheduledDate) && parseDateOnly(today)
    && EDITABLE_ASSIGNMENT_STATUSES.includes(assignment.status)
    && assignment.scheduledDate < today);
}
