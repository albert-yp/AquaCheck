import { Plus, Trash2 } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {
  ACTIVITY_TYPE,
  ACTIVITY_TYPE_LABELS,
  RECOMMENDATION,
  RECOMMENDATION_LABELS,
  TANK_CONDITION,
  TANK_CONDITION_LABELS,
} from '../../constants/statuses.js';
import { createId } from '../../utils/ids.js';

const FINAL_CONDITIONS = Object.values(TANK_CONDITION).filter(
  (condition) => condition !== TANK_CONDITION.UNASSESSED,
);

const labelSx = { color: 'text.primary', fontWeight: 600 };

export default function WorkActionForm({
  value,
  onChange,
  errors = {},
  readOnly = false,
  disabled = false,
}) {
  const findings = value?.findings ?? [];
  const actions = value?.actions ?? [];
  const isLocked = readOnly || disabled;
  const textInputProps = { input: { readOnly } };

  function update(patch, errorKey) {
    if (readOnly) return;
    onChange(patch, errorKey);
  }

  function addFinding() {
    update(
      { findings: [...findings, { id: createId('finding'), component: '', description: '' }] },
      'findings',
    );
  }

  function removeFinding(index) {
    update({ findings: findings.filter((_, itemIndex) => itemIndex !== index) }, 'findings');
  }

  function changeFinding(index, key, nextValue) {
    update(
      {
        findings: findings.map((finding, itemIndex) =>
          itemIndex === index ? { ...finding, [key]: nextValue } : finding,
        ),
      },
      `findings.${index}.${key}`,
    );
  }

  function toggleAction(type, checked) {
    update(
      { actions: checked ? [...actions, type] : actions.filter((item) => item !== type) },
      'actions',
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Temuan
          </Typography>
          {!readOnly && (
            <Button size="small" startIcon={<Plus size={16} />} onClick={addFinding} disabled={disabled}>
              Tambah Temuan
            </Button>
          )}
        </Stack>
        {errors.findings && (
          <FormHelperText error sx={{ mb: 1 }}>
            {errors.findings}
          </FormHelperText>
        )}
        {findings.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {readOnly ? 'Tidak ada temuan.' : 'Belum ada temuan. Tambahkan jika ditemukan masalah.'}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {findings.map((finding, index) => (
              <Paper key={finding.id ?? index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Temuan {index + 1}
                    </Typography>
                    {!readOnly && (
                      <Tooltip title="Hapus temuan">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            aria-label={`Hapus temuan ${index + 1}`}
                            onClick={() => removeFinding(index)}
                            disabled={disabled}
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    name={`findings.${index}.component`}
                    label="Bagian yang bermasalah"
                    value={finding.component ?? ''}
                    onChange={(event) => changeFinding(index, 'component', event.target.value)}
                    error={Boolean(errors[`findings.${index}.component`])}
                    helperText={errors[`findings.${index}.component`]}
                    disabled={disabled}
                    slotProps={textInputProps}
                  />
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    required
                    name={`findings.${index}.description`}
                    label="Deskripsi temuan"
                    value={finding.description ?? ''}
                    onChange={(event) => changeFinding(index, 'description', event.target.value)}
                    error={Boolean(errors[`findings.${index}.description`])}
                    helperText={errors[`findings.${index}.description`]}
                    disabled={disabled}
                    slotProps={textInputProps}
                  />
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      <FormControl component="fieldset" required error={Boolean(errors.actions)} disabled={isLocked}>
        <FormLabel component="legend" sx={labelSx}>
          Tindakan yang dilakukan
        </FormLabel>
        <FormGroup>
          {Object.values(ACTIVITY_TYPE).map((type) => (
            <FormControlLabel
              key={type}
              label={ACTIVITY_TYPE_LABELS[type]}
              control={
                <Checkbox
                  name="actions"
                  value={type}
                  checked={actions.includes(type)}
                  onChange={(event) => toggleAction(type, event.target.checked)}
                />
              }
            />
          ))}
        </FormGroup>
        <FormHelperText>{errors.actions || 'Pilih satu atau lebih tindakan.'}</FormHelperText>
      </FormControl>

      <TextField
        fullWidth
        multiline
        minRows={3}
        name="workDetails"
        label="Detail pekerjaan"
        value={value?.workDetails ?? ''}
        onChange={(event) => update({ workDetails: event.target.value }, 'workDetails')}
        error={Boolean(errors.workDetails)}
        helperText={errors.workDetails || 'Wajib jika ada tindakan selain pemeriksaan.'}
        disabled={disabled}
        slotProps={textInputProps}
      />

      <FormControl required error={Boolean(errors.finalCondition)} disabled={isLocked}>
        <FormLabel id="finalCondition-label" sx={labelSx}>
          Kondisi akhir tangki
        </FormLabel>
        <RadioGroup
          row
          aria-labelledby="finalCondition-label"
          name="finalCondition"
          value={value?.finalCondition === TANK_CONDITION.UNASSESSED ? '' : (value?.finalCondition ?? '')}
          onChange={(event) => update({ finalCondition: event.target.value }, 'finalCondition')}
        >
          {FINAL_CONDITIONS.map((condition) => (
            <FormControlLabel
              key={condition}
              value={condition}
              control={<Radio size="small" />}
              label={TANK_CONDITION_LABELS[condition]}
            />
          ))}
        </RadioGroup>
        {errors.finalCondition && <FormHelperText>{errors.finalCondition}</FormHelperText>}
      </FormControl>

      <TextField
        fullWidth
        multiline
        minRows={2}
        name="remainingIssues"
        label="Masalah tersisa"
        value={value?.remainingIssues ?? ''}
        onChange={(event) => update({ remainingIssues: event.target.value }, 'remainingIssues')}
        error={Boolean(errors.remainingIssues)}
        helperText={errors.remainingIssues || 'Kosongkan jika tidak ada masalah yang tersisa.'}
        disabled={disabled}
        slotProps={textInputProps}
      />

      <FormControl required error={Boolean(errors.recommendation)} disabled={isLocked}>
        <FormLabel id="recommendation-label" sx={labelSx}>
          Rekomendasi
        </FormLabel>
        <RadioGroup
          aria-labelledby="recommendation-label"
          name="recommendation"
          value={value?.recommendation ?? ''}
          onChange={(event) => update({ recommendation: event.target.value }, 'recommendation')}
        >
          {Object.values(RECOMMENDATION).map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio size="small" />}
              label={RECOMMENDATION_LABELS[option]}
            />
          ))}
        </RadioGroup>
        {errors.recommendation && <FormHelperText>{errors.recommendation}</FormHelperText>}
      </FormControl>
    </Stack>
  );
}
