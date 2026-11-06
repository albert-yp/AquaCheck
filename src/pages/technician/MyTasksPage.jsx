import { useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_STATUS,
  ASSIGNMENT_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
} from '../../constants/statuses.js';
import { useAppData } from '../../hooks/useAppData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { formatDate, isAssignmentOverdue } from '../../utils/dateFormat.js';

const ACTION_LABELS = {
  [ASSIGNMENT_STATUS.ASSIGNED]: 'Buka Formulir',
  [ASSIGNMENT_STATUS.IN_PROGRESS]: 'Lanjutkan Pengisian',
  [ASSIGNMENT_STATUS.REVISION_REQUIRED]: 'Perbaiki Laporan',
  [ASSIGNMENT_STATUS.AWAITING_REVIEW]: 'Lihat Laporan',
};

function InfoRow({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

export default function MyTasksPage() {
  const { currentUser } = useAuth();
  const { data, isLoading, error } = useAppData();
  const navigate = useNavigate();

  const myTasks = (data?.assignments ?? [])
    .filter(
      (task) =>
        currentUser &&
        task.technicianId === currentUser.id &&
        task.status !== ASSIGNMENT_STATUS.CLOSED_PASSED,
    )
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const tanksById = new Map((data?.tanks ?? []).map((tank) => [tank.id, tank]));

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            Tugas Saya
          </Typography>
          <Typography color="text.secondary">
            Daftar pemeriksaan tangki yang ditugaskan kepada Anda.
          </Typography>
        </Box>

        {isLoading && !data ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
            <CircularProgress size={24} />
            <Typography>Memuat tugas...</Typography>
          </Stack>
        ) : !data ? (
          <Alert severity="error" role="alert">
            {error || 'Data tugas tidak dapat dimuat.'}
          </Alert>
        ) : myTasks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Belum ada tugas pemeriksaan.</Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {myTasks.map((task) => {
              const tank = tanksById.get(task.tankId);
              const overdue = isAssignmentOverdue(task);
              return (
                <Card key={task.id} variant="outlined">
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
                    >
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          {task.number}
                        </Typography>
                        <Typography variant="h6" component="h2">
                          {tank?.name ?? 'Tangki tidak ditemukan'}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {overdue && <Chip size="small" color="error" variant="outlined" label="Terlambat" />}
                        <Chip
                          size="small"
                          label={ASSIGNMENT_STATUS_LABELS[task.status] || task.status}
                          color={ASSIGNMENT_STATUS_COLORS[task.status] || 'default'}
                        />
                      </Stack>
                    </Stack>

                    <Stack spacing={1.5}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 4 }}>
                        <InfoRow label="Lokasi">{tank?.location ?? '—'}</InfoRow>
                        <InfoRow label="Jadwal">{formatDate(task.scheduledDate)}</InfoRow>
                      </Stack>
                      <InfoRow label="Kegiatan">
                        {task.activityTypes.map((type) => ACTIVITY_TYPE_LABELS[type] || type).join(', ')}
                      </InfoRow>
                      <InfoRow label="Instruksi admin">
                        <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
                          {task.instructions}
                        </Box>
                      </InfoRow>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      variant={task.status === ASSIGNMENT_STATUS.AWAITING_REVIEW ? 'outlined' : 'contained'}
                      onClick={() => navigate(`/petugas/tugas/${task.id}`)}
                    >
                      {ACTION_LABELS[task.status] || 'Buka'}
                    </Button>
                  </CardActions>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
