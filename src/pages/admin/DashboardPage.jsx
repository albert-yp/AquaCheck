import { useNavigate } from 'react-router';
import {
  CircleCheckBig,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FileText,
  RotateCcw,
} from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
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
import {
  formatDate,
  formatDateTime,
  getTodayDate,
  isAssignmentOverdue,
} from '../../utils/dateFormat.js';

const ACTIVE_STATUSES = [
  ASSIGNMENT_STATUS.ASSIGNED,
  ASSIGNMENT_STATUS.IN_PROGRESS,
  ASSIGNMENT_STATUS.AWAITING_REVIEW,
  ASSIGNMENT_STATUS.REVISION_REQUIRED,
];

const LIST_LIMIT = 5;

// closedAt berupa timestamp ISO; formatDate memerlukan tanggal YYYY-MM-DD lokal.
function formatTimestampDate(value) {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? formatDate(getTodayDate(date)) : '—';
}

function SummaryCard({ icon: Icon, label, value, caption, color, onClick }) {
  return (
    <Card variant="outlined">
      <CardActionArea onClick={onClick} sx={{ p: 2.5, height: '100%' }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              bgcolor: 'action.hover',
              color: `${color}.main`,
            }}
          >
            <Icon size={18} />
          </Box>
          </Stack>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" component="p" sx={{ lineHeight: 1.2, fontSize: '2rem', fontVariantNumeric: 'tabular-nums' }}>
              {value}
            </Typography>
            {caption && (
              <Typography variant="caption" color="text.secondary">
                {caption}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function SectionPanel({ title, actionLabel, onAction, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {actionLabel && (
            <Button size="small" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

function EmptyText({ children }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
      {children}
    </Typography>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useAppData();
  const navigate = useNavigate();

  if (isLoading && !data) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
          <CircularProgress size={24} />
          <Typography>Memuat dashboard...</Typography>
        </Stack>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Alert severity="error" role="alert">
          {error || 'Data dashboard tidak dapat dimuat.'}
        </Alert>
      </Container>
    );
  }

  const tanksById = new Map(data.tanks.map((tank) => [tank.id, tank]));
  const usersById = new Map(data.users.map((user) => [user.id, user]));
  const reportsById = new Map(data.reports.map((report) => [report.id, report]));
  const lettersByAssignment = new Map(data.letters.map((letter) => [letter.assignmentId, letter]));

  const activeTankCount = data.tanks.filter((tank) => tank.isActive).length;
  const countByStatus = (statuses) =>
    data.assignments.filter((assignment) => statuses.includes(assignment.status)).length;

  const summary = [
    {
      icon: Droplets,
      label: 'Total Tangki',
      value: data.tanks.length,
      caption: `${activeTankCount} aktif · ${data.tanks.length - activeTankCount} arsip`,
      color: 'primary',
      to: '/admin/tangki',
    },
    {
      icon: ClipboardList,
      label: 'Tugas Aktif',
      value: countByStatus(ACTIVE_STATUSES),
      color: 'info',
      to: '/admin/penugasan',
    },
    {
      icon: ClipboardCheck,
      label: 'Menunggu Verifikasi',
      value: countByStatus([ASSIGNMENT_STATUS.AWAITING_REVIEW]),
      color: 'warning',
      to: '/admin/verifikasi',
    },
    {
      icon: RotateCcw,
      label: 'Perlu Revisi',
      value: countByStatus([ASSIGNMENT_STATUS.REVISION_REQUIRED]),
      color: 'error',
      to: '/admin/arsip',
    },
    {
      icon: CircleCheckBig,
      label: 'Ditutup — Lolos Inspeksi',
      value: countByStatus([ASSIGNMENT_STATUS.CLOSED_PASSED]),
      color: 'success',
      to: '/admin/arsip',
    },
    {
      icon: FileText,
      label: 'Surat Terbit',
      value: data.letters.length,
      color: 'secondary',
      to: '/admin/arsip',
    },
  ];

  const overdueCount = data.assignments.filter((assignment) => isAssignmentOverdue(assignment)).length;

  const awaitingReview = data.assignments
    .filter((assignment) => assignment.status === ASSIGNMENT_STATUS.AWAITING_REVIEW)
    .map((assignment) => ({ assignment, report: reportsById.get(assignment.currentReportId) }))
    .sort((a, b) => (a.report?.submittedAt ?? '').localeCompare(b.report?.submittedAt ?? ''))
    .slice(0, LIST_LIMIT);

  const recentlyClosed = data.assignments
    .filter((assignment) => assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED)
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
    .slice(0, LIST_LIMIT)
    .map((assignment) => ({
      assignment,
      report: reportsById.get(assignment.currentReportId),
      letter: lettersByAssignment.get(assignment.id),
    }));

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography component="h1" variant="h4">
            Dashboard Admin
          </Typography>
          <Typography color="text.secondary">
            Ringkasan tangki, penugasan, dan hasil verifikasi pemeriksaan.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<ClipboardList size={16} />} onClick={() => navigate('/admin/penugasan')}>Buat Penugasan</Button>
        </Stack>

        {overdueCount > 0 && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/admin/penugasan')}>
                Lihat Penugasan
              </Button>
            }
          >
            Ada {overdueCount} tugas terlambat yang jadwalnya sudah lewat dan belum dikirim untuk verifikasi.
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {summary.map(({ to, ...card }) => (
            <SummaryCard key={card.label} {...card} onClick={() => navigate(to)} />
          ))}
        </Box>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', xl: 'repeat(2, minmax(0, 1fr))' } }}>
        <SectionPanel
          title="Laporan menunggu verifikasi"
          actionLabel="Lihat Semua"
          onAction={() => navigate('/admin/verifikasi')}
        >
          {awaitingReview.length === 0 ? (
            <EmptyText>Tidak ada laporan menunggu verifikasi.</EmptyText>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nomor Tugas</TableCell>
                    <TableCell>Tangki</TableCell>
                    <TableCell>Teknisi</TableCell>
                    <TableCell align="center">Versi</TableCell>
                    <TableCell>Dikirim</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {awaitingReview.map(({ assignment, report }) => {
                    const tank = report?.tankSnapshot ?? tanksById.get(assignment.tankId);
                    const technicianName =
                      report?.technicianSnapshot?.name ?? usersById.get(assignment.technicianId)?.name;
                    return (
                      <TableRow key={assignment.id} hover>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{assignment.number}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{tank?.name ?? '—'}</Typography>
                          {tank?.location && (
                            <Typography variant="caption" color="text.secondary">
                              {tank.location}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{technicianName ?? '—'}</TableCell>
                        <TableCell align="center">{report?.version ?? '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(report?.submittedAt)}</TableCell>
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
        </SectionPanel>

        <SectionPanel title="Inspeksi selesai terbaru">
          {recentlyClosed.length === 0 ? (
            <EmptyText>Belum ada inspeksi yang selesai.</EmptyText>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Nomor Tugas</TableCell>
                    <TableCell>Tangki</TableCell>
                    <TableCell>Tanggal Penutupan</TableCell>
                    <TableCell>Nomor Surat</TableCell>
                    <TableCell align="right">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentlyClosed.map(({ assignment, report, letter }) => {
                    const tank = report?.tankSnapshot ?? tanksById.get(assignment.tankId);
                    return (
                      <TableRow key={assignment.id} hover>
                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{assignment.number}</TableCell>
                        <TableCell>{tank?.name ?? '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatTimestampDate(assignment.closedAt)}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{letter?.number ?? '—'}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={() => navigate(`/admin/verifikasi/${assignment.id}`)}>
                              Lihat Riwayat
                            </Button>
                            {letter && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/admin/surat/${letter.id}`)}
                              >
                                Lihat Surat
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionPanel>
        </Box>
      </Stack>
    </Container>
  );
}
