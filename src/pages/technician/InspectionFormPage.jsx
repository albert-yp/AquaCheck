import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { ArrowLeft, RotateCcw, Save, Send } from 'lucide-react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import AssignmentInfo from '../../components/inspection/AssignmentInfo.jsx';
import ConditionChecklist from '../../components/inspection/ConditionChecklist.jsx';
import PhotoGallery from '../../components/inspection/PhotoGallery.jsx';
import PhotoUploader from '../../components/inspection/PhotoUploader.jsx';
import WorkActionForm from '../../components/inspection/WorkActionForm.jsx';
import {
  ASSIGNMENT_STATUS,
  EDITABLE_ASSIGNMENT_STATUSES,
  REVIEW_DECISION,
} from '../../constants/statuses.js';
import { createReportDraft } from '../../data/formDefaults.js';
import { useAppData } from '../../hooks/useAppData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useImageUpload } from '../../hooks/useImageUpload.js';
import { formatDate, formatDateTime, getTodayDate } from '../../utils/dateFormat.js';
import { validateReport } from '../../utils/reportValidation.js';

function PageShell({ children }) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Box sx={{ pb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button component={RouterLink} to="/petugas/tugas" startIcon={<ArrowLeft size={18} />}>
            Kembali ke Tugas Saya
          </Button>
        </Box>
        {children}
      </Stack>
    </Container>
  );
}

function SectionCard({ title, description, children }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" component="h2">
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}

function ExecutionTimeFields({ form, fieldErrors, disabled, onChange }) {
  const common = {
    fullWidth: true,
    disabled,
    slotProps: { inputLabel: { shrink: true } },
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      <TextField
        {...common}
        type="date"
        name="executionDate"
        label="Tanggal pelaksanaan"
        value={form.executionDate ?? ''}
        onChange={(event) => onChange('executionDate', event.target.value)}
        error={Boolean(fieldErrors.executionDate)}
        helperText={fieldErrors.executionDate}
        slotProps={{ ...common.slotProps, htmlInput: { max: getTodayDate() } }}
      />
      <TextField
        {...common}
        type="time"
        name="startTime"
        label="Jam mulai"
        value={form.startTime ?? ''}
        onChange={(event) => onChange('startTime', event.target.value)}
        error={Boolean(fieldErrors.startTime)}
        helperText={fieldErrors.startTime}
      />
      <TextField
        {...common}
        type="time"
        name="endTime"
        label="Jam selesai"
        value={form.endTime ?? ''}
        onChange={(event) => onChange('endTime', event.target.value)}
        error={Boolean(fieldErrors.endTime)}
        helperText={fieldErrors.endTime}
      />
    </Box>
  );
}

const PHOTO_REQUIREMENT_KEYS = ['beforePhoto', 'findingPhoto', 'afterPhoto', 'photoRefs'];

function InspectionEditor({ assignment, initialDraft, revisionReview }) {
  const { actions } = useAppData();
  const { currentUser } = useAuth();

  // Disalin sekali saat editor dibuat; perubahan context tidak mereset isian.
  const [form, setForm] = useState(() => structuredClone(initialDraft));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const {
    previews,
    uploadPhoto,
    isUploading,
    error: uploadError,
    clearError: clearUploadError,
  } = useImageUpload(form.photoRefs);

  const isBusy = isSaving || isSubmitting || isUploading || isClearing;

  async function handleClearDraft() {
    if (isBusy) return;
    setIsClearing(true);
    setFormError('');
    setSuccessMessage('');
    try {
      const emptyDraft = await actions.clearReportDraft(assignment.id);
      setForm(emptyDraft);
      setFieldErrors({});
      clearUploadError();
      setUploadKey((value) => value + 1);
      setClearOpen(false);
      setSuccessMessage(revisionReview ? 'Perubahan draft dibersihkan. Formulir kembali ke laporan terakhir.' : 'Draft dibersihkan. Formulir siap diisi ulang.');
    } catch (cause) {
      setClearOpen(false);
      setFormError(cause.message || 'Gagal membersihkan draft. Isian tetap dipertahankan.');
    } finally {
      setIsClearing(false);
    }
  }

  function handleFieldChange(key, value) {
    handleSectionChange({ [key]: value }, key);
  }

  // Bagian formulir mengirim patch; bagian lain tetap dipertahankan.
  function handleSectionChange(patch, errorKey) {
    setForm((previous) => ({ ...previous, ...patch }));
    setSuccessMessage('');
    if (errorKey && fieldErrors[errorKey]) {
      setFieldErrors((previous) => ({ ...previous, [errorKey]: undefined }));
    }
  }

  function clearPhotoRequirementErrors() {
    setFieldErrors((previous) => {
      const next = { ...previous };
      for (const key of Object.keys(next)) {
        if (PHOTO_REQUIREMENT_KEYS.includes(key) || key.startsWith('photoRefs.')) delete next[key];
      }
      return next;
    });
  }

  async function handlePhotoUpload(file, { category, caption, replacePhotoId }) {
    const reference = await uploadPhoto(file, {
      assignmentId: assignment.id,
      ownerId: currentUser.id,
      category,
      caption,
    });

    // Referensi lama hanya diganti setelah upload baru berhasil.
    setForm((previous) => ({
      ...previous,
      photoRefs: replacePhotoId
        ? previous.photoRefs.map((photo) => (photo.photoId === replacePhotoId ? reference : photo))
        : [...previous.photoRefs, reference],
    }));
    setSuccessMessage('');
    clearPhotoRequirementErrors();
  }

  function handlePhotosChange(nextPhotos) {
    setForm((previous) => ({ ...previous, photoRefs: nextPhotos }));
    setSuccessMessage('');
    clearPhotoRequirementErrors();
  }

  async function handleSaveDraft() {
    setIsSaving(true);
    setFieldErrors({});
    setFormError('');
    setSuccessMessage('');

    try {
      const savedDraft = await actions.saveReportDraft(assignment.id, form);

      setForm(savedDraft);
      setSuccessMessage(`Draft tersimpan pada ${formatDateTime(savedDraft.updatedAt)}.`);
    } catch (cause) {
      setFieldErrors(cause.errors ?? {});
      setFormError(cause.message || 'Gagal menyimpan draft.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitReport() {
    const validation = validateReport(form);

    setFieldErrors(validation.errors);
    setFormError('');
    setSuccessMessage('');

    if (!validation.isValid) {
      setFormError('Laporan belum lengkap. Periksa kembali isian yang ditandai.');
      return;
    }

    setIsSubmitting(true);

    try {
      await actions.submitReport(assignment.id, form);
      // Setelah berhasil, status menjadi AWAITING_REVIEW dan halaman induk beralih ke tampilan hanya-baca.
    } catch (cause) {
      setFieldErrors(cause.errors ?? {});
      setFormError(cause.message || 'Gagal mengirim laporan.');
      setIsSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      {revisionReview && (
        <Alert severity="warning">
          <AlertTitle>Laporan perlu diperbaiki</AlertTitle>
          {revisionReview.notes || 'Admin meminta perbaikan laporan.'}
          <Typography variant="caption" component="div" sx={{ mt: 1 }}>
            Dikembalikan pada {formatDateTime(revisionReview.reviewedAt)}
          </Typography>
        </Alert>
      )}

      {form.updatedAt && !successMessage && (
        <Alert severity="info">Melanjutkan draft terakhir ({formatDateTime(form.updatedAt)}).</Alert>
      )}

      <SectionCard title="Waktu pelaksanaan" description="Isi tanggal dan jam pekerjaan dilakukan di lokasi.">
        <ExecutionTimeFields
          form={form}
          fieldErrors={fieldErrors}
          disabled={isBusy}
          onChange={handleFieldChange}
        />
      </SectionCard>

      <SectionCard
        title="Kondisi dan pengamatan air"
        description="Periksa setiap bagian tangki, kebersihan, filtrasi, dan kondisi air."
      >
        <ConditionChecklist
          value={{ checklist: form.checklist, waterObservations: form.waterObservations }}
          onChange={handleSectionChange}
          errors={fieldErrors}
          disabled={isBusy}
        />
      </SectionCard>

      <SectionCard
        title="Temuan, tindakan, dan hasil akhir"
        description="Catat temuan, pekerjaan yang dilakukan, kondisi akhir, dan rekomendasi."
      >
        <WorkActionForm
          value={form}
          onChange={handleSectionChange}
          errors={fieldErrors}
          disabled={isBusy}
        />
      </SectionCard>

      <SectionCard
        title="Bukti gambar"
        description="Foto kondisi awal wajib. Foto temuan wajib jika ada masalah, dan foto setelah pekerjaan wajib jika ada tindakan selain pemeriksaan."
      >
        <PhotoUploader
          key={uploadKey}
          photos={form.photoRefs}
          previews={previews}
          onUpload={handlePhotoUpload}
          onChange={handlePhotosChange}
          isUploading={isUploading}
          uploadError={uploadError}
          errors={fieldErrors}
          disabled={isSaving || isSubmitting || isClearing}
        />
      </SectionCard>

      {formError && (
        <Alert severity="error" role="alert">
          {formError}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{ p: 2, position: 'sticky', bottom: 16, zIndex: 1 }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'flex-end', alignItems: { sm: 'center' } }}
        >
          {isUploading && (
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
              Menunggu upload foto selesai...
            </Typography>
          )}
          <Button variant="text" color="error" startIcon={<RotateCcw size={18} />} onClick={() => setClearOpen(true)} disabled={isBusy} sx={{ mr: { sm: 'auto' } }}>
            Bersihkan Draft
          </Button>
          <Button
            variant="outlined"
            startIcon={isSaving ? <CircularProgress size={16} /> : <Save size={18} />}
            onClick={handleSaveDraft}
            disabled={isBusy}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
          </Button>
          <Button
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Send size={18} />}
            onClick={handleSubmitReport}
            disabled={isBusy}
          >
            {isSubmitting ? 'Mengirim...' : 'Kirim untuk Verifikasi'}
          </Button>
        </Stack>
      </Paper>
      <Dialog open={clearOpen} onClose={() => !isClearing && setClearOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Bersihkan draft tugas ini?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {revisionReview
              ? 'Perubahan yang belum dikirim akan dibuang dan formulir kembali ke laporan terakhir. Laporan terkirim tetap tersimpan.'
              : 'Isian dan lampiran draft yang belum dikirim akan dikosongkan. Penugasan dan identitas tangki tetap tersimpan.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearOpen(false)} disabled={isClearing}>Batal</Button>
          <Button color="error" variant="contained" onClick={handleClearDraft} disabled={isClearing}>
            {isClearing ? 'Membersihkan...' : 'Ya, Bersihkan Draft'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function SubmittedReportView({ assignment, report }) {
  if (!report) {
    return <Alert severity="warning">Laporan untuk penugasan ini tidak ditemukan.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Alert severity={assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED ? 'success' : 'info'}>
        {assignment.status === ASSIGNMENT_STATUS.CLOSED_PASSED
          ? 'Pemeriksaan telah ditutup dan dinyatakan lolos inspeksi.'
          : 'Laporan sudah dikirim dan sedang menunggu verifikasi admin.'}{' '}
        Versi {report.version}, dikirim {formatDateTime(report.submittedAt)}.
      </Alert>

      <SectionCard title="Waktu pelaksanaan">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 4 }}>
          <Typography variant="body2">
            <strong>Tanggal:</strong> {formatDate(report.executionDate)}
          </Typography>
          <Typography variant="body2">
            <strong>Jam:</strong> {report.startTime || '—'} – {report.endTime || '—'}
          </Typography>
        </Stack>
      </SectionCard>

      <SectionCard title="Kondisi dan pengamatan air">
        <ConditionChecklist
          value={{ checklist: report.checklist, waterObservations: report.waterObservations }}
          onChange={() => {}}
          readOnly
        />
      </SectionCard>

      <SectionCard title="Temuan, tindakan, dan hasil akhir">
        <WorkActionForm value={report} onChange={() => {}} readOnly />
      </SectionCard>

      <SectionCard title="Bukti gambar">
        <PhotoGallery photoRefs={report.photoRefs} />
      </SectionCard>
    </Stack>
  );
}

export default function InspectionFormPage() {
  const { assignmentId } = useParams();
  const { currentUser } = useAuth();
  const { data, isLoading, error } = useAppData();

  if (isLoading && !data) {
    return (
      <PageShell>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
          <CircularProgress size={24} />
          <Typography>Memuat penugasan...</Typography>
        </Stack>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <Alert severity="error" role="alert">
          {error || 'Data penugasan tidak dapat dimuat.'}
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

  if (!currentUser || assignment.technicianId !== currentUser.id) {
    return (
      <PageShell>
        <Alert severity="error" role="alert">
          <AlertTitle>Akses ditolak</AlertTitle>
          Anda tidak memiliki akses ke penugasan ini.
        </Alert>
      </PageShell>
    );
  }

  const isEditable = EDITABLE_ASSIGNMENT_STATUSES.includes(assignment.status);
  const latestReport = data.reports.find((report) => report.id === assignment.currentReportId) ?? null;
  const savedDraft = data.reportDrafts.find((draft) => draft.assignmentId === assignment.id);

  // Laporan terkirim memakai snapshot agar identitas mengikuti laporan tersebut.
  const useSnapshot = !isEditable && latestReport;
  const tank = useSnapshot
    ? latestReport.tankSnapshot
    : data.tanks.find((item) => item.id === assignment.tankId);
  const technician = useSnapshot
    ? latestReport.technicianSnapshot
    : data.users.find((user) => user.id === assignment.technicianId);

  const revisionReview =
    assignment.status === ASSIGNMENT_STATUS.REVISION_REQUIRED
      ? data.reviews
          .filter(
            (review) =>
              review.assignmentId === assignment.id &&
              review.decision === REVIEW_DECISION.REVISION_REQUIRED,
          )
          .sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))[0]
      : null;

  const initialDraft = isEditable
    ? (savedDraft ?? createReportDraft(assignment.id, latestReport))
    : null;

  return (
    <PageShell>
      <Box>
        <Typography component="h1" variant="h4">
          Formulir Pemeriksaan
        </Typography>
        <Typography color="text.secondary">
          {isEditable
            ? 'Isi hasil pemeriksaan tangki sesuai kondisi di lapangan.'
            : 'Laporan pemeriksaan ditampilkan hanya-baca.'}
        </Typography>
      </Box>

      <AssignmentInfo assignment={assignment} tank={tank} technician={technician} />

      {isEditable ? (
        <InspectionEditor
          key={assignment.id}
          assignment={assignment}
          initialDraft={initialDraft}
          revisionReview={revisionReview}
        />
      ) : (
        <SubmittedReportView assignment={assignment} report={latestReport} />
      )}
    </PageShell>
  );
}
