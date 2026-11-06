import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
} from '../../constants/statuses.js';
import { formatDate } from '../../utils/dateFormat.js';

const capacityFormat = new Intl.NumberFormat('id-ID');

function Section({ title, children }) {
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

function Field({ label, children }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" component="div">
        {children || '—'}
      </Typography>
    </Box>
  );
}

const fieldGrid = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
};

export default function AssignmentInfo({ assignment, tank, technician }) {
  if (!assignment) return null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2.5} divider={<Divider flexItem />}>
        <Section title="Penugasan">
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 1 }}
          >
            <Typography variant="h6" component="p">
              {assignment.number}
            </Typography>
            <Chip
              size="small"
              label={ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}
              color={ASSIGNMENT_STATUS_COLORS[assignment.status] || 'default'}
            />
          </Stack>
        </Section>

        <Section title="Tangki">
          {tank ? (
            <Box sx={fieldGrid}>
              <Field label="Kode">{tank.code}</Field>
              <Field label="Nama">{tank.name}</Field>
              <Field label="Lokasi">{tank.location}</Field>
              <Field label="Kapasitas">
                {Number.isFinite(Number(tank.capacityLiters))
                  ? `${capacityFormat.format(tank.capacityLiters)} liter`
                  : null}
              </Field>
              <Field label="Jenis filter">{tank.filterType}</Field>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Data tangki tidak ditemukan.
            </Typography>
          )}
        </Section>

        <Section title="Pelaksanaan yang dijadwalkan">
          <Box sx={fieldGrid}>
            <Field label="Tanggal jadwal">{formatDate(assignment.scheduledDate)}</Field>
            <Field label="Teknisi">{technician?.name}</Field>
          </Box>
        </Section>

        <Section title="Pekerjaan">
          <Field label="Jenis kegiatan">
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1, mt: 0.5 }}>
              {(assignment.activityTypes ?? []).map((type) => (
                <Chip key={type} size="small" variant="outlined" label={ACTIVITY_TYPE_LABELS[type] || type} />
              ))}
            </Stack>
          </Field>
          <Field label="Instruksi admin">
            <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
              {assignment.instructions}
            </Box>
          </Field>
        </Section>
      </Stack>
    </Paper>
  );
}
