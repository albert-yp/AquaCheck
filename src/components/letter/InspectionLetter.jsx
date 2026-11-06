import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { TANK_CONDITION_LABELS } from '../../constants/statuses.js';
import { formatDate, getTodayDate } from '../../utils/dateFormat.js';

const capacityFormat = new Intl.NumberFormat('id-ID');

// issuedAt berupa timestamp ISO; formatDate memerlukan tanggal YYYY-MM-DD lokal.
function formatIssuedDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : formatDate(getTodayDate(date));
}

function Row({ label, children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '200px minmax(0, 1fr)' },
        columnGap: 2,
        py: 0.5,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {children || '—'}
      </Typography>
    </Box>
  );
}

function SectionTitle({ children }) {
  return (
    <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
      {children}
    </Typography>
  );
}

function Signature({ role, name }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="body2">{role}</Typography>
      <Box sx={{ height: 64 }} />
      <Typography variant="body2" sx={{ fontWeight: 700, textDecoration: 'underline' }}>
        {name || '—'}
      </Typography>
    </Box>
  );
}

export default function InspectionLetter({ letter }) {
  if (!letter) return null;

  const snapshot = letter.snapshot ?? {};
  const tank = snapshot.tank ?? {};
  const activityLabels = (snapshot.actions ?? []).map((action) => action.label).filter(Boolean);

  return (
    <Paper variant="outlined" className="letter-sheet" sx={{ p: { xs: 3, sm: 6 } }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
            Surat Edaran Hasil Inspeksi Tangki Air
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Nomor: {letter.number}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Diterbitkan {formatIssuedDate(letter.issuedAt)}
          </Typography>
        </Box>

        <Divider />

        <Box className="letter-avoid-break">
          <SectionTitle>Identitas tangki</SectionTitle>
          <Row label="Kode tangki">{tank.code}</Row>
          <Row label="Nama tangki">{tank.name}</Row>
          <Row label="Lokasi">{tank.location}</Row>
          <Row label="Kapasitas">
            {Number.isFinite(Number(tank.capacityLiters)) && tank.capacityLiters
              ? `${capacityFormat.format(tank.capacityLiters)} liter`
              : null}
          </Row>
          <Row label="Jenis filter">{tank.filterType}</Row>
        </Box>

        <Box className="letter-avoid-break">
          <SectionTitle>Pelaksanaan pemeriksaan</SectionTitle>
          <Row label="Tanggal pelaksanaan">{formatDate(snapshot.executionDate)}</Row>
          <Row label="Kegiatan">{activityLabels.join(', ')}</Row>
          <Row label="Ringkasan pekerjaan">
            <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
              {snapshot.workSummary}
            </Box>
          </Row>
          <Row label="Tanggal pengecekan ulang">{formatDate(snapshot.reviewDate)}</Row>
          <Row label="Kondisi akhir">
            {TANK_CONDITION_LABELS[snapshot.finalCondition] || snapshot.finalCondition}
          </Row>
        </Box>

        <Box
          className="letter-avoid-break letter-statement"
          sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: 'action.hover' }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>
            {snapshot.statement}
          </Typography>
        </Box>

        <Box className="letter-avoid-break">
          <SectionTitle>Jadwal inspeksi berikutnya</SectionTitle>
          <Typography variant="body2">
            {snapshot.nextInspectionDate
              ? formatDate(snapshot.nextInspectionDate)
              : snapshot.nextInspectionNote || 'Menunggu penjadwalan berikutnya.'}
          </Typography>
        </Box>

        <Box
          className="letter-avoid-break"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 4,
            pt: 2,
          }}
        >
          <Signature role="Teknisi pemeriksa" name={snapshot.technicianName} />
          <Signature role="Admin pemverifikasi" name={snapshot.adminName} />
        </Box>
      </Stack>
    </Paper>
  );
}
