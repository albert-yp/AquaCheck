import { useState } from 'react';
import { Plus } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
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
  ACTIVITY_TYPE,
  ACTIVITY_TYPE_LABELS,
  ASSIGNMENT_STATUS_COLORS,
  ASSIGNMENT_STATUS_LABELS,
  ROLES,
} from '../../constants/statuses.js';
import { useAppData } from '../../hooks/useAppData.js';
import { formatDate } from '../../utils/dateFormat.js';
import { validateAssignment } from '../../utils/reportValidation.js';

const EMPTY_FORM = {
  tankId: '',
  technicianId: '',
  scheduledDate: '',
  activityTypes: [],
  instructions: '',
};

const capacityFormat = new Intl.NumberFormat('id-ID');

export default function AssignmentsPage() {
  const { data, actions, isLoading, error: loadError } = useAppData();

  const [form, setForm] = useState(EMPTY_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const assignments = [...(data?.assignments ?? [])].sort(
    (a, b) => b.scheduledDate.localeCompare(a.scheduledDate) || b.number.localeCompare(a.number),
  );

  const activeTanks = (data?.tanks ?? []).filter((tank) => tank.isActive);

  const activeTechnicians = (data?.users ?? []).filter(
    (user) => user.isActive && user.role === ROLES.TECHNICIAN,
  );

  const tanksById = new Map((data?.tanks ?? []).map((tank) => [tank.id, tank]));
  const usersById = new Map((data?.users ?? []).map((user) => [user.id, user]));
  const selectedTank = tanksById.get(form.tankId);
  const canCreate = activeTanks.length > 0 && activeTechnicians.length > 0;

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError('');
    setDialogOpen(true);
  }

  function closeDialog() {
    if (isSaving) return;
    setDialogOpen(false);
  }

  function handleFieldChange(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((previous) => ({ ...previous, [key]: undefined }));
    }
  }

  function toggleActivity(type, checked) {
    handleFieldChange(
      'activityTypes',
      checked
        ? [...form.activityTypes, type]
        : form.activityTypes.filter((item) => item !== type),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateAssignment(form);

    setFieldErrors(validation.errors);
    setFormError('');

    if (!validation.isValid) {
      setFormError('Periksa kembali isian formulir.');
      return;
    }

    setIsSaving(true);

    try {
      const assignment = await actions.createAssignment(form);

      setSuccessMessage(`Penugasan ${assignment.number} berhasil dibuat.`);
      setDialogOpen(false);
    } catch (cause) {
      setFieldErrors(cause.errors ?? {});
      setFormError(cause.message || 'Gagal membuat penugasan.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Box>
            <Typography component="h1" variant="h4">
              Penugasan
            </Typography>
            <Typography color="text.secondary">
              Jadwalkan pemeriksaan tangki dan tugaskan teknisi.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={openCreateDialog}
            disabled={isLoading || !data || !canCreate}
          >
            Tambah Penugasan
          </Button>
        </Stack>

        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {data && !canCreate && (
          <Alert severity="warning">
            {activeTanks.length === 0 && activeTechnicians.length === 0
              ? 'Belum tersedia tangki aktif dan teknisi aktif.'
              : activeTanks.length === 0
                ? 'Belum tersedia tangki aktif. Tambahkan atau aktifkan tangki di menu Data Tangki.'
                : 'Belum tersedia teknisi aktif.'}{' '}
            Penugasan baru belum dapat dibuat.
          </Alert>
        )}

        {isLoading && !data ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
            <CircularProgress size={24} />
            <Typography>Memuat data penugasan...</Typography>
          </Stack>
        ) : !data ? (
          <Alert severity="error" role="alert">
            {loadError || 'Data penugasan tidak dapat dimuat.'}
          </Alert>
        ) : assignments.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Belum ada penugasan
            </Typography>
            <Typography color="text.secondary">
              Buat penugasan pertama untuk menjadwalkan pemeriksaan tangki.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nomor Tugas</TableCell>
                  <TableCell>Tangki dan Lokasi</TableCell>
                  <TableCell>Teknisi</TableCell>
                  <TableCell>Jadwal Pemeriksaan</TableCell>
                  <TableCell>Kegiatan</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => {
                  const tank = tanksById.get(assignment.tankId);
                  const technician = usersById.get(assignment.technicianId);
                  return (
                    <TableRow key={assignment.id} hover>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {assignment.number}
                      </TableCell>
                      <TableCell>
                        {tank ? (
                          <>
                            <Typography variant="body2">
                              {tank.code} · {tank.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {tank.location}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Tangki tidak ditemukan
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{technician?.name ?? '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(assignment.scheduledDate)}
                      </TableCell>
                      <TableCell>
                        {assignment.activityTypes
                          .map((type) => ACTIVITY_TYPE_LABELS[type] || type)
                          .join(', ')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={ASSIGNMENT_STATUS_LABELS[assignment.status] || assignment.status}
                          color={ASSIGNMENT_STATUS_COLORS[assignment.status] || 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <DialogTitle>
            Tambah Penugasan
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Pilih tangki dan teknisi, lalu tentukan jadwal serta kegiatan pemeriksaan.</Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, '& > .MuiAlert-root, & > .MuiPaper-root, & > fieldset, & > .MuiTextField-root:last-child': { gridColumn: '1 / -1' } }}>
              {formError && (
                <Alert severity="error" role="alert">
                  {formError}
                </Alert>
              )}

              <TextField
                select
                fullWidth
                required
                name="tankId"
                label="Tangki"
                value={form.tankId}
                onChange={(event) => handleFieldChange('tankId', event.target.value)}
                error={Boolean(fieldErrors.tankId)}
                helperText={fieldErrors.tankId}
                disabled={isSaving}
              >
                {activeTanks.map((tank) => (
                  <MenuItem key={tank.id} value={tank.id}>
                    {tank.code} · {tank.name}
                  </MenuItem>
                ))}
              </TextField>

              {selectedTank && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">
                      <strong>Lokasi:</strong> {selectedTank.location}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Kapasitas:</strong> {capacityFormat.format(selectedTank.capacityLiters)} liter
                    </Typography>
                    <Typography variant="body2">
                      <strong>Jenis filter:</strong> {selectedTank.filterType}
                    </Typography>
                  </Stack>
                </Paper>
              )}

              <TextField
                select
                fullWidth
                required
                name="technicianId"
                label="Teknisi"
                value={form.technicianId}
                onChange={(event) => handleFieldChange('technicianId', event.target.value)}
                error={Boolean(fieldErrors.technicianId)}
                helperText={fieldErrors.technicianId}
                disabled={isSaving}
              >
                {activeTechnicians.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                required
                type="date"
                name="scheduledDate"
                label="Jadwal Pemeriksaan"
                value={form.scheduledDate}
                onChange={(event) => handleFieldChange('scheduledDate', event.target.value)}
                error={Boolean(fieldErrors.scheduledDate)}
                helperText={fieldErrors.scheduledDate}
                disabled={isSaving}
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <FormControl
                required
                component="fieldset"
                error={Boolean(fieldErrors.activityTypes)}
                disabled={isSaving}
              >
                <FormLabel component="legend">Kegiatan</FormLabel>
                <FormGroup>
                  {Object.values(ACTIVITY_TYPE).map((type) => (
                    <FormControlLabel
                      key={type}
                      label={ACTIVITY_TYPE_LABELS[type]}
                      control={
                        <Checkbox
                          name="activityTypes"
                          value={type}
                          checked={form.activityTypes.includes(type)}
                          onChange={(event) => toggleActivity(type, event.target.checked)}
                        />
                      }
                    />
                  ))}
                </FormGroup>
                <FormHelperText>
                  {fieldErrors.activityTypes || 'Pilih minimal satu kegiatan.'}
                </FormHelperText>
              </FormControl>

              <TextField
                fullWidth
                required
                multiline
                minRows={3}
                name="instructions"
                label="Instruksi"
                value={form.instructions}
                onChange={(event) => handleFieldChange('instructions', event.target.value)}
                error={Boolean(fieldErrors.instructions)}
                helperText={fieldErrors.instructions}
                disabled={isSaving}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={isSaving}>
              Batal
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Container>
  );
}
