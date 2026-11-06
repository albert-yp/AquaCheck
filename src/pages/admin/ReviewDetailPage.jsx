import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AdminReviewForm from '../../components/review/AdminReviewForm.jsx';
import ReportDetail from '../../components/review/ReportDetail.jsx';
import {
  ASSIGNMENT_STATUS,
  ASSIGNMENT_STATUS_LABELS,
  REVIEW_DECISION,
  REVIEW_DECISION_LABELS,
} from '../../constants/statuses.js';
import { createReviewForm } from '../../data/formDefaults.js';
import { useAppData } from '../../hooks/useAppData.js';
import { formatDate, formatDateTime } from '../../utils/dateFormat.js';
import { validateReview } from '../../utils/reportValidation.js';

function PageShell({ children }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Button component={RouterLink} to="/admin/verifikasi" startIcon={<ArrowLeft size={18} />}>
            Kembali ke Verifikasi Laporan
          </Button>
        </Box>
        {children}
      </Stack>
    </Container>
  );
}

function ReviewPanel({ assignment, report, onDone }) {
  const { actions } = useAppData();

  const [form, setForm] = useState(() => createReviewForm(report.id));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(patch, errorKey) {
    setForm((previous) => ({ ...previous, ...patch }));
    if (errorKey && fieldErrors[errorKey]) {
      setFieldErrors((previous) => ({ ...previous, [errorKey]: undefined }));
    }
  }

  async function handleSubmit() {
    const validation = validateReview(form, report);

    setFieldErrors(validation.errors);
    setFormError('');

    if (!validation.isValid) {
      setFormError('Periksa kembali isian keputusan.');
      return;
    }

    setIsSaving(true);

    try {
      if (form.decision === REVIEW_DECISION.PASSED) {
        const letter = await actions.approveInspection(assignment.id, form);
        onDone({ decision: REVIEW_DECISION.PASSED, letter });
      } else {
        await actions.returnForRevision(assignment.id, form);
        onDone({ decision: REVIEW_DECISION.REVISION_REQUIRED });
      }
    } catch (cause) {
      setFieldErrors(cause.errors ?? {});
      setFormError(cause.message || 'Gagal menyimpan keputusan.');
      setIsSaving(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" component="h2">
            Keputusan verifikasi
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lolos inspeksi memerlukan seluruh pengecekan selesai, kondisi akhir baik, tanpa masalah tersisa,
            dan laporan teknisi yang memenuhi syarat.
          </Typography>
        </Box>

        {formError && (
          <Alert severity="error" role="alert">
            {formError}
          </Alert>
        )}
        {fieldErrors.report && (
          <Alert severity="warning" role="alert">
            {fieldErrors.report}
          </Alert>
        )}
        {fieldErrors.photoRefs && (
          <Alert severity="error" role="alert">
            <AlertTitle>Bukti foto tidak dapat diverifikasi</AlertTitle>
            {fieldErrors.photoRefs}
          </Alert>
        )}

        <AdminReviewForm
          value={form}
          onChange={handleChange}
          errors={fieldErrors}
          onSubmit={handleSubmit}
          loading={isSaving}
        />
      </Stack>
    </Paper>
  );
}

function ReviewHistory({ reports, reviews, usersById, currentReportId }) {
  if (reports.length <= 1 && reviews.length === 0) return null;

  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" component="h2">
        Riwayat versi dan keputusan
      </Typography>
      {reports.map((report) => {
        const reportReviews = reviews.filter((review) => review.reportId === report.id);
        const isCurrent = report.id === currentReportId;
        return (
          <Accordion key={report.id} variant="outlined" disableGutters slotProps={{ transition: { unmountOnExit: true } }}>
            <AccordionSummary expandIcon={<ChevronDown size={18} />}>
              <Stack spacing={0.5} sx={{ width: '100%' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>Versi {report.version}</Typography>
                  {isCurrent && <Chip size="small" color="primary" label="Terbaru" />}
                  {reportReviews.map((review) => (
                    <Chip
                      key={review.id}
                      size="small"
                      variant="outlined"
                      color={review.decision === REVIEW_DECISION.PASSED ? 'success' : 'error'}
                      label={REVIEW_DECISION_LABELS[review.decision] || review.decision}
                    />
                  ))}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Dikirim {formatDateTime(report.submittedAt)}
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                {reportReviews.map((review) => (
                  <Alert
                    key={review.id}
                    severity={review.decision === REVIEW_DECISION.PASSED ? 'success' : 'warning'}
                  >
                    <AlertTitle>
                      {REVIEW_DECISION_LABELS[review.decision]} · {formatDate(review.reviewDate)}
                    </AlertTitle>
                    {review.notes}
                    <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                      Oleh {usersById.get(review.reviewedBy)?.name ?? 'admin'} pada{' '}
                      {formatDateTime(review.reviewedAt)}
                    </Typography>
                  </Alert>
                ))}
                {isCurrent ? (
                  <Typography variant="body2" color="text.secondary">
                    Isi versi ini ditampilkan di atas.
                  </Typography>
                ) : (
                  <ReportDetail report={report} />
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}

export default function ReviewDetailPage() {
  const { assignmentId } = useParams();
  const { data, isLoading, error } = useAppData();
  const [outcome, setOutcome] = useState(null);

  if (isLoading && !data) {
    return (
      <PageShell>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
          <CircularProgress size={24} />
          <Typography>Memuat laporan...</Typography>
        </Stack>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <Alert severity="error" role="alert">
          {error || 'Data laporan tidak dapat dimuat.'}
        </Alert>
      </PageShell>
    );
  }

  const assignment = data.assignments.find((item) => item.id === assignmentId);

  if (!assignment) {
    return (
      <PageShell>
        <Alert severity="error" role="alert">
          Penugasan tidak ditemukan.
        </Alert>
      </PageShell>
    );
  }

  const report = data.reports.find((item) => item.id === assignment.currentReportId) ?? null;
  const reports = data.reports
    .filter((item) => item.assignmentId === assignment.id)
    .sort((a, b) => b.version - a.version);
  const reviews = data.reviews
    .filter((item) => item.assignmentId === assignment.id)
    .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt));
  const usersById = new Map(data.users.map((user) => [user.id, user]));
  const letter = data.letters.find((item) => item.assignmentId === assignment.id);
  const canReview = assignment.status === ASSIGNMENT_STATUS.AWAITING_REVIEW && report;

  return (
    <PageShell>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography component="h1" variant="h4">
            Detail Verifikasi
          </Typography>
          <Typography color="text.secondary">Penugasan {assignment.number}</Typography>
        </Box>
        <Chip
          label={ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}
          color={canReview ? 'warning' : assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED ? 'success' : 'default'}
        />
      </Stack>

      {outcome?.decision === REVIEW_DECISION.REVISION_REQUIRED && (
        <Alert severity="success" onClose={() => setOutcome(null)}>
          Laporan dikembalikan ke teknisi untuk diperbaiki.
        </Alert>
      )}

      {assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED && (
        <Alert
          severity="success"
          action={
            letter && (
              <Button color="inherit" size="small" component={RouterLink} to={`/admin/surat/${letter.id}`}>
                Lihat Surat
              </Button>
            )
          }
        >
          {outcome?.decision === REVIEW_DECISION.PASSED
            ? `Pemeriksaan dinyatakan lolos. Surat ${outcome.letter?.number ?? ''} telah dibuat.`
            : 'Penugasan telah ditutup dan dinyatakan lolos inspeksi.'}
        </Alert>
      )}

      {assignment.status === ASSIGNMENT_STATUS.REVISION_REQUIRED && !outcome && (
        <Alert severity="info">Laporan sedang menunggu perbaikan dari teknisi.</Alert>
      )}

      {!report ? (
        <Alert severity="info">Teknisi belum mengirim laporan untuk penugasan ini.</Alert>
      ) : (
        <ReportDetail report={report} />
      )}

      <ReviewHistory
        reports={reports}
        reviews={reviews}
        usersById={usersById}
        currentReportId={assignment.currentReportId}
      />

      {canReview && <ReviewPanel key={report.id} assignment={assignment} report={report} onDone={setOutcome} />}
    </PageShell>
  );
}
