import { useNavigate } from 'react-router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { ASSIGNMENT_STATUS } from '../../constants/statuses.js';
import { useAppData } from '../../hooks/useAppData.js';
import { formatDateTime } from '../../utils/dateFormat.js';

export default function ReviewQueuePage() {
  const { data, isLoading, error } = useAppData();
  const navigate = useNavigate();

  const tanksById = new Map((data?.tanks ?? []).map((tank) => [tank.id, tank]));
  const usersById = new Map((data?.users ?? []).map((user) => [user.id, user]));
  const reportsById = new Map((data?.reports ?? []).map((report) => [report.id, report]));

  // Laporan yang paling lama menunggu ditampilkan lebih dulu.
  const queue = (data?.assignments ?? [])
    .filter((assignment) => assignment.status === ASSIGNMENT_STATUS.AWAITING_REVIEW)
    .map((assignment) => ({ assignment, report: reportsById.get(assignment.currentReportId) }))
    .sort((a, b) => (a.report?.submittedAt ?? '').localeCompare(b.report?.submittedAt ?? ''));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            Verifikasi Laporan
          </Typography>
          <Typography color="text.secondary">
            Laporan pemeriksaan dari teknisi yang menunggu pengecekan ulang admin.
          </Typography>
        </Box>

        {isLoading && !data ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
            <CircularProgress size={24} />
            <Typography>Memuat antrean verifikasi...</Typography>
          </Stack>
        ) : !data ? (
          <Alert severity="error" role="alert">
            {error || 'Data laporan tidak dapat dimuat.'}
          </Alert>
        ) : queue.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Belum ada laporan menunggu verifikasi.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nomor Tugas</TableCell>
                  <TableCell>Tangki</TableCell>
                  <TableCell>Teknisi</TableCell>
                  <TableCell align="center">Versi</TableCell>
                  <TableCell>Tanggal Pengiriman</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queue.map(({ assignment, report }) => {
                  const tank = report?.tankSnapshot ?? tanksById.get(assignment.tankId);
                  const technicianName =
                    report?.technicianSnapshot?.name ?? usersById.get(assignment.technicianId)?.name;
                  return (
                    <TableRow key={assignment.id} hover>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {assignment.number}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {tank ? `${tank.code} · ${tank.name}` : '—'}
                        </Typography>
                        {tank?.location && (
                          <Typography variant="caption" color="text.secondary">
                            {tank.location}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{technicianName ?? '—'}</TableCell>
                      <TableCell align="center">{report ? report.version : '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(report?.submittedAt)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/admin/verifikasi/${assignment.id}`)}
                        >
                          Periksa Laporan
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </Container>
  );
}
