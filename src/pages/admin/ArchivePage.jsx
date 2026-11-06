import { useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, History, RotateCcw } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  ASSIGNMENT_STATUS,
  ASSIGNMENT_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
  REVIEW_DECISION,
  REVIEW_DECISION_LABELS,
} from '../../constants/statuses.js';
import { useAppData } from '../../hooks/useAppData.js';
import { formatDate } from '../../utils/dateFormat.js';

const ALL = 'ALL';

const STATUS_FILTERS = [
  { value: ALL, label: 'Semua status' },
  { value: ASSIGNMENT_STATUS.AWAITING_REVIEW, label: ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.AWAITING_REVIEW] },
  { value: ASSIGNMENT_STATUS.REVISION_REQUIRED, label: ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.REVISION_REQUIRED] },
  { value: ASSIGNMENT_STATUS.CLOSED_PASSED, label: ASSIGNMENT_STATUS_LABELS[ASSIGNMENT_STATUS.CLOSED_PASSED] },
];

// Satu baris per tugas yang sudah memiliki laporan terkirim.
function buildArchiveRows(data) {
  const tanksById = new Map(data.tanks.map((tank) => [tank.id, tank]));
  const usersById = new Map(data.users.map((user) => [user.id, user]));
  const reportsById = new Map(data.reports.map((report) => [report.id, report]));

  return data.assignments
    .map((assignment) => {
      const report = reportsById.get(assignment.currentReportId);
      if (!report) return null;

      const versionCount = data.reports.filter((item) => item.assignmentId === assignment.id).length;
      const review = data.reviews
        .filter((item) => item.reportId === report.id)
        .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0];
      const letter = data.letters.find((item) => item.assignmentId === assignment.id);

      return {
        assignment,
        report,
        versionCount,
        review,
        letter,
        tank: report.tankSnapshot ?? tanksById.get(assignment.tankId),
        technicianName:
          report.technicianSnapshot?.name ?? usersById.get(assignment.technicianId)?.name,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.report.executionDate.localeCompare(a.report.executionDate) ||
        b.assignment.number.localeCompare(a.assignment.number),
    );
}

export default function ArchivePage() {
  const { data, isLoading, error } = useAppData();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [tankId, setTankId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const rows = data ? buildArchiveRows(data) : [];
  const tankOptions = [...(data?.tanks ?? [])].sort((a, b) => a.code.localeCompare(b.code));
  const dateRangeError = fromDate && toDate && fromDate > toDate
    ? 'Tanggal awal tidak boleh melewati tanggal akhir.'
    : '';
  const hasFilters = Boolean(search || fromDate || toDate) || tankId !== ALL || status !== ALL;

  const keyword = search.trim().toLowerCase();
  const filteredRows = dateRangeError
    ? []
    : rows.filter(({ assignment, tank, letter, report }) => {
        if (tankId !== ALL && assignment.tankId !== tankId) return false;
        if (status !== ALL && assignment.status !== status) return false;
        // Batas awal dan akhir ikut dihitung; format YYYY-MM-DD aman dibandingkan sebagai teks.
        if (fromDate && report.executionDate < fromDate) return false;
        if (toDate && report.executionDate > toDate) return false;
        if (!keyword) return true;
        return [assignment.number, tank?.code, tank?.name, tank?.location, letter?.number]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      });

  function resetFilters() {
    setSearch('');
    setTankId(ALL);
    setStatus(ALL);
    setFromDate('');
    setToDate('');
  }

  let content;
  if (isLoading && !data) {
    content = (
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
        <CircularProgress size={24} />
        <Typography>Memuat arsip...</Typography>
      </Stack>
    );
  } else if (!data) {
    content = (
      <Alert severity="error" role="alert">
        {error || 'Data arsip tidak dapat dimuat.'}
      </Alert>
    );
  } else if (rows.length === 0) {
    content = (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Belum ada riwayat pemeriksaan.</Typography>
      </Paper>
    );
  } else if (dateRangeError) {
    content = null;
  } else if (filteredRows.length === 0) {
    content = (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Tidak ada riwayat yang sesuai dengan filter.</Typography>
      </Paper>
    );
  } else {
    content = (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" sx={{ minWidth: 1100 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nomor Tugas</TableCell>
              <TableCell>Tangki</TableCell>
              <TableCell>Teknisi</TableCell>
              <TableCell>Tanggal Pelaksanaan</TableCell>
              <TableCell align="center">Versi</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Keputusan Terbaru</TableCell>
              <TableCell>Nomor Surat</TableCell>
              <TableCell align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map(({ assignment, report, versionCount, review, letter, tank, technicianName }) => (
              <TableRow key={assignment.id} hover>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{assignment.number}</TableCell>
                <TableCell>
                  <Typography variant="body2">{tank ? `${tank.code} · ${tank.name}` : '—'}</Typography>
                  {tank?.location && (
                    <Typography variant="caption" color="text.secondary">
                      {tank.location}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{technicianName ?? '—'}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(report.executionDate)}</TableCell>
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  v{report.version}
                  <Typography variant="caption" color="text.secondary" component="div">
                    {versionCount} versi
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}
                    color={ASSIGNMENT_STATUS_COLORS[assignment.status] || 'default'}
                  />
                </TableCell>
                <TableCell>
                  {review ? (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={REVIEW_DECISION_LABELS[review.decision] || review.decision}
                      color={review.decision === REVIEW_DECISION.PASSED ? 'success' : 'error'}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Belum diverifikasi
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{letter?.number ?? '—'}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<History size={16} />}
                      onClick={() => navigate(`/admin/verifikasi/${assignment.id}`)}
                    >
                      Lihat Riwayat
                    </Button>
                    {letter && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FileText size={16} />}
                        onClick={() => navigate(`/admin/surat/${letter.id}`)}
                      >
                        Lihat Surat
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            Arsip
          </Typography>
          <Typography color="text.secondary">
            Riwayat laporan pemeriksaan yang sudah dikirim, beserta keputusan dan surat edarannya.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'minmax(0, 2fr) repeat(2, minmax(0, 1fr))',
              },
              alignItems: 'start',
            }}
          >
            <TextField
              size="small"
              name="search"
              label="Cari"
              placeholder="Nomor tugas, tangki, lokasi, atau nomor surat"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              disabled={!data}
            />
            <TextField
              select
              size="small"
              name="tankId"
              label="Tangki"
              value={tankId}
              onChange={(event) => setTankId(event.target.value)}
              disabled={!data}
            >
              <MenuItem value={ALL}>Semua tangki</MenuItem>
              {tankOptions.map((tank) => (
                <MenuItem key={tank.id} value={tank.id}>
                  {tank.code} · {tank.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              name="status"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              disabled={!data}
            >
              {STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="date"
              name="fromDate"
              label="Dari tanggal pelaksanaan"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              error={Boolean(dateRangeError)}
              disabled={!data}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              type="date"
              name="toDate"
              label="Sampai tanggal pelaksanaan"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              error={Boolean(dateRangeError)}
              disabled={!data}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<RotateCcw size={16} />}
                onClick={resetFilters}
                disabled={!hasFilters}
              >
                Reset Filter
              </Button>
              {data && rows.length > 0 && !dateRangeError && (
                <Typography variant="body2" color="text.secondary">
                  {filteredRows.length} dari {rows.length} riwayat
                </Typography>
              )}
            </Box>
          </Box>
        </Paper>

        {dateRangeError && (
          <Alert severity="error" role="alert">
            {dateRangeError}
          </Alert>
        )}

        {content}
      </Stack>
    </Container>
  );
}
