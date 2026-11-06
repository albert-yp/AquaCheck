import { TANK_CONDITION_LABELS } from '../constants/statuses.js';
import { formatDate, getTodayDate } from './dateFormat.js';
import { colors } from '../theme/colors.js';

async function loadFont(name) {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}fonts/Inter-${name}.ttf`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  } catch (cause) {
    throw new Error('Font surat gagal dimuat. Coba unduh PDF lagi.', { cause });
  }
}

function createLetterPdf(letter, jsPDF, fontData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  for (const [index, style] of ['normal', 'bold'].entries()) {
    const filename = `Inter-${style}.ttf`;
    doc.addFileToVFS(filename, fontData[index]);
    doc.addFont(filename, 'Inter', style);
  }
  doc.setProperties({ title: `Surat Edaran ${letter.number}`, author: 'AquaCheck', subject: 'Hasil inspeksi tangki air' });
  const snapshot = letter.snapshot;
  const tank = snapshot.tank ?? {};
  const width = 170;
  let y = 24;
  function text(value, { size = 10, bold = false, color = colors.ink, gap = 6 } = {}) {
    doc.setFont('Inter', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(String(value ?? '-'), width);
    const lineHeight = size * 0.45;
    for (const line of lines) {
      if (y + lineHeight > 264) { doc.addPage(); y = 24; }
      doc.text(line, 20, y);
      y += lineHeight;
    }
    y += gap;
  }
  function section(title) {
    y += 2;
    text(title, { bold: true, size: 11, color: colors.primary, gap: 3 });
  }
  function row(label, value) { text(`${label}: ${value || '-'}`, { gap: 2 }); }
  text('AquaCheck', { size: 17, bold: true, color: colors.primary, gap: 4 });
  text('SURAT EDARAN HASIL INSPEKSI TANGKI AIR', { size: 13, bold: true, gap: 3 });
  row('Nomor', letter.number);
  row('Diterbitkan', formatDate(getTodayDate(new Date(letter.issuedAt))));
  doc.setDrawColor(colors.primary);
  doc.line(20, y, 190, y);
  y += 7;
  section('Identitas tangki');
  row('Kode', tank.code);
  row('Nama', tank.name);
  row('Lokasi', tank.location);
  row('Kapasitas', `${new Intl.NumberFormat('id-ID').format(tank.capacityLiters)} liter`);
  row('Jenis filter', tank.filterType);
  section('Pelaksanaan dan hasil pemeriksaan');
  row('Tanggal pelaksanaan', formatDate(snapshot.executionDate));
  row('Kegiatan', snapshot.actions.map((action) => action.label).join(', '));
  row('Ringkasan pekerjaan', snapshot.workSummary);
  row('Tanggal pengecekan ulang', formatDate(snapshot.reviewDate));
  row('Kondisi akhir', TANK_CONDITION_LABELS[snapshot.finalCondition] || snapshot.finalCondition);
  y += 3;
  text(snapshot.statement, { bold: true, gap: 5 });
  section('Jadwal inspeksi berikutnya');
  text(snapshot.nextInspectionDate ? formatDate(snapshot.nextInspectionDate) : snapshot.nextInspectionNote, { gap: 7 });
  if (y > 223) { doc.addPage(); y = 24; }
  doc.setFont('Inter', 'normal');
  doc.setFontSize(10);
  doc.text('Teknisi pemeriksa', 20, y);
  doc.text('Admin pemverifikasi', 120, y);
  doc.setFont('Inter', 'bold');
  doc.text(doc.splitTextToSize(snapshot.technicianName || '-', 65), 20, y + 23);
  doc.text(doc.splitTextToSize(snapshot.adminName || '-', 65), 120, y + 23);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont('Inter', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colors.muted);
    doc.text(`AquaCheck | ${letter.number}`, 20, 282);
    doc.text(`${page} / ${pages}`, 190, 282, { align: 'right' });
  }
  return doc;
}

export async function downloadLetterPdf(letter) {
  if (!letter?.snapshot) throw new Error('Data surat tidak tersedia.');
  const [{ jsPDF }, fontData] = await Promise.all([
    import('jspdf').catch((cause) => {
      throw new Error('Komponen PDF gagal dimuat. Coba unduh PDF lagi.', { cause });
    }),
    Promise.all([loadFont('Regular'), loadFont('Bold')]),
  ]);
  try {
    const doc = createLetterPdf(letter, jsPDF, fontData);
    doc.save(`Surat-Edaran-${letter.number.replaceAll('/', '-')}.pdf`);
  } catch (cause) {
    throw new Error('PDF surat gagal dibuat. Coba unduh PDF lagi.', { cause });
  }
}
