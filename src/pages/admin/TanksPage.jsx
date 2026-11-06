import { useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus, Trash2 } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { TANK_CONDITION, TANK_CONDITION_LABELS } from '../../constants/statuses.js';
import { useAppData } from '../../hooks/useAppData.js';
import { validateTank } from '../../utils/reportValidation.js';

const EMPTY_FORM = {
  code: '',
  name: '',
  location: '',
  capacityLiters: '',
  filterType: '',
};

const FORM_FIELDS = [
  { key: 'code', label: 'Kode Tangki', placeholder: 'TNG-005' },
  { key: 'name', label: 'Nama Tangki' },
  { key: 'location', label: 'Lokasi' },
  { key: 'capacityLiters', label: 'Kapasitas (liter)', type: 'number' },
  { key: 'filterType', label: 'Jenis Filter', placeholder: 'Sedimen dan karbon aktif' },
];

const CONDITION_COLORS = {
  [TANK_CONDITION.UNASSESSED]: 'default',
  [TANK_CONDITION.GOOD]: 'success',
  [TANK_CONDITION.NEEDS_MAINTENANCE]: 'warning',
  [TANK_CONDITION.NEEDS_REPAIR]: 'error',
};

const capacityFormat = new Intl.NumberFormat('id-ID');

export default function TanksPage() {
  const { data, actions, isLoading, error: loadError } = useAppData();

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyTankId, setBusyTankId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const tanks = [...(data?.tanks ?? [])].sort((a, b) => a.code.localeCompare(b.code));

  function showSuccess(message) {
    setActionError('');
    setSuccessMessage(message);
  }

  function showError(cause, fallback) {
    setSuccessMessage('');
    setActionError(cause?.message || fallback);
  }

  function openCreateDialog() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFieldErrors({});
    setFormError('');
    setDialogOpen(true);
  }

  function openEditDialog(tank) {
    setForm({
      code: tank.code,
      name: tank.name,
      location: tank.location,
      capacityLiters: String(tank.capacityLiters),
      filterType: tank.filterType,
    });
    setEditingId(tank.id);
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

  async function handleSubmit(event) {
    event.preventDefault();

    const validation = validateTank(form);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFormError('Periksa kembali isian formulir.');
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    setFormError('');
    try {
      const saved = editingId
        ? await actions.saveTank({ ...form, id: editingId })
        : await actions.saveTank(form);

      setDialogOpen(false);
      showSuccess(
        editingId
          ? `Tangki ${saved.code} berhasil diperbarui.`
          : `Tangki ${saved.code} berhasil ditambahkan.`,
      );
    } catch (cause) {
      // Isian dipertahankan agar bisa diperbaiki.
      setFieldErrors(cause.errors ?? {});
      setFormError(cause.message || 'Gagal menyimpan tangki. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetActive(tank, isActive) {
    setBusyTankId(tank.id);
    try {
      await actions.setTankActive(tank.id, isActive);
      showSuccess(
        isActive
          ? `Tangki ${tank.code} berhasil diaktifkan kembali.`
          : `Tangki ${tank.code} berhasil diarsipkan.`,
      );
    } catch (cause) {
      showError(cause, 'Gagal mengubah status tangki.');
    } finally {
      setBusyTankId(null);
    }
  }

  async function handleConfirmDelete() {
    const tank = deleteTarget;
    setBusyTankId(tank.id);
    try {
      const result = await actions.deleteTank(tank.id);
      showSuccess(
        result.archived
          ? `Tangki ${tank.code} memiliki riwayat tugas sehingga diarsipkan, bukan dihapus.`
          : `Tangki ${tank.code} berhasil dihapus.`,
      );
    } catch (cause) {
      showError(cause, 'Gagal menghapus tangki.');
    } finally {
      setBusyTankId(null);
      setDeleteTarget(null);
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
              Data Tangki
            </Typography>
            <Typography color="text.secondary">
              Kelola data master tangki air beserta status aktif dan arsipnya.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={openCreateDialog}
            disabled={isLoading || !data}
          >
            Tambah Tangki
          </Button>
        </Stack>

        {successMessage && (
          <Alert severity="success" onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        {actionError && (
          <Alert severity="error" role="alert" onClose={() => setActionError('')}>
            {actionError}
          </Alert>
        )}

        {isLoading && !data ? (
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
            <CircularProgress size={24} />
            <Typography>Memuat data tangki...</Typography>
          </Stack>
        ) : !data ? (
          <Alert severity="error" role="alert">
            {loadError || 'Data tangki tidak dapat dimuat.'}
          </Alert>
        ) : tanks.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Belum ada data tangki
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Tambahkan tangki pertama untuk mulai membuat penugasan pemeriksaan.
            </Typography>
            <Button variant="outlined" startIcon={<Plus size={18} />} onClick={openCreateDialog}>
              Tambah Tangki
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Kode</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Lokasi</TableCell>
                  <TableCell align="right">Kapasitas (L)</TableCell>
                  <TableCell>Jenis Filter</TableCell>
                  <TableCell>Kondisi Terakhir</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Aksi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tanks.map((tank) => {
                  const isBusy = busyTankId === tank.id;
                  return (
                    <TableRow key={tank.id} hover sx={{ opacity: tank.isActive ? 1 : 0.7 }}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{tank.code}</TableCell>
                      <TableCell>{tank.name}</TableCell>
                      <TableCell>{tank.location}</TableCell>
                      <TableCell align="right">{capacityFormat.format(tank.capacityLiters)}</TableCell>
                      <TableCell>{tank.filterType}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={TANK_CONDITION_LABELS[tank.condition] || tank.condition}
                          color={CONDITION_COLORS[tank.condition] || 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={tank.isActive ? 'Aktif' : 'Arsip'}
                          color={tank.isActive ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Edit ${tank.code}`}
                              onClick={() => openEditDialog(tank)}
                              disabled={isBusy}
                            >
                              <Pencil size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        {tank.isActive ? (
                          <Tooltip title="Arsipkan">
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Arsipkan ${tank.code}`}
                                onClick={() => handleSetActive(tank, false)}
                                disabled={isBusy}
                              >
                                <Archive size={18} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Aktifkan kembali">
                            <span>
                              <IconButton
                                size="small"
                                aria-label={`Aktifkan kembali ${tank.code}`}
                                onClick={() => handleSetActive(tank, true)}
                                disabled={isBusy}
                              >
                                <ArchiveRestore size={18} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Hapus">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              aria-label={`Hapus ${tank.code}`}
                              onClick={() => setDeleteTarget(tank)}
                              disabled={isBusy}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </span>
                        </Tooltip>
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
            {editingId ? 'Edit Tangki' : 'Tambah Tangki'}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Lengkapi identitas dan spesifikasi tangki untuk penjadwalan pemeriksaan.</Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, '& > .MuiAlert-root, & > .MuiTypography-root, & > .MuiTextField-root:last-of-type': { gridColumn: '1 / -1' } }}>
              {formError && (
                <Alert severity="error" role="alert">
                  {formError}
                </Alert>
              )}
              {FORM_FIELDS.map(({ key, label, type, placeholder }, index) => (
                <TextField
                  key={key}
                  autoFocus={index === 0}
                  fullWidth
                  required
                  name={key}
                  label={label}
                  type={type ?? 'text'}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(event) => handleFieldChange(key, event.target.value)}
                  error={Boolean(fieldErrors[key])}
                  helperText={fieldErrors[key]}
                  disabled={isSaving}
                  slotProps={type === 'number' ? { htmlInput: { min: 1 } } : undefined}
                />
              ))}
              {!editingId && (
                <Typography variant="body2" color="text.secondary">
                  Tangki baru otomatis berstatus aktif dengan kondisi “Belum diperiksa”.
                </Typography>
              )}
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

      <Dialog open={Boolean(deleteTarget)} onClose={() => !busyTankId && setDeleteTarget(null)}>
        <DialogTitle>Hapus tangki?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tangki <strong>{deleteTarget?.code}</strong> ({deleteTarget?.name}) akan dihapus permanen.
            Jika tangki sudah memiliki riwayat tugas, tangki akan diarsipkan sebagai gantinya.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={Boolean(busyTankId)}>
            Batal
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={Boolean(busyTankId)}
          >
            {busyTankId ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
