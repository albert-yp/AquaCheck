import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ConditionChecklist from '../inspection/ConditionChecklist.jsx';
import PhotoGallery from '../inspection/PhotoGallery.jsx';
import WorkActionForm from '../inspection/WorkActionForm.jsx';
import { formatDate, formatDateTime } from '../../utils/dateFormat.js';

const capacityFormat = new Intl.NumberFormat('id-ID');
const noop = () => {};

const fieldGrid = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
};

function Section({ title, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h3">
          {title}
        </Typography>
        {children}
      </Stack>
    </Paper>
  );
}

function Field({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{children || '—'}</Typography>
    </Box>
  );
}

export default function ReportDetail({ report }) {
  if (!report) return null;

  const tank = report.tankSnapshot;
  const technician = report.technicianSnapshot;

  return (
    <Stack spacing={3}>
      <Section title={`Laporan versi ${report.version}`}>
        <Box sx={fieldGrid}>
          <Field label="Dikirim">{formatDateTime(report.submittedAt)}</Field>
          <Field label="Tanggal pelaksanaan">{formatDate(report.executionDate)}</Field>
          <Field label="Jam pelaksanaan">
            {report.startTime || '—'} – {report.endTime || '—'}
          </Field>
        </Box>
      </Section>

      <Section title="Identitas pada laporan">
        <Box sx={fieldGrid}>
          <Field label="Kode tangki">{tank?.code}</Field>
          <Field label="Nama tangki">{tank?.name}</Field>
          <Field label="Lokasi">{tank?.location}</Field>
          <Field label="Kapasitas">
            {tank?.capacityLiters ? `${capacityFormat.format(tank.capacityLiters)} liter` : null}
          </Field>
          <Field label="Jenis filter">{tank?.filterType}</Field>
          <Field label="Teknisi">{technician?.name}</Field>
        </Box>
      </Section>

      <Section title="Kondisi dan pengamatan air">
        <ConditionChecklist
          value={{ checklist: report.checklist, waterObservations: report.waterObservations }}
          onChange={noop}
          readOnly
        />
      </Section>

      <Section title="Temuan, tindakan, dan hasil akhir">
        <WorkActionForm value={report} onChange={noop} readOnly />
      </Section>

      <Section title="Bukti gambar">
        <PhotoGallery photoRefs={report.photoRefs} />
      </Section>
    </Stack>
  );
}
