import { Save } from 'lucide-react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {
  REVIEW_CHECKS,
  REVIEW_DECISION,
  REVIEW_DECISION_LABELS,
  TANK_CONDITION,
  TANK_CONDITION_LABELS,
} from '../../constants/statuses.js';
import { getTodayDate } from '../../utils/dateFormat.js';

const labelSx = { color: 'text.primary', fontWeight: 600 };

// onChange(patch, errorKey): patch digabung induk ke state form.
export default function AdminReviewForm({ value, onChange, errors = {}, onSubmit, loading = false }) {
  const checks = value?.checks ?? {};
  const checkErrors = REVIEW_CHECKS.map(({ key }) => errors[`checks.${key}`]).filter(Boolean);

  function handleSubmit(event) {
    event.preventDefault();
    if (!loading) onSubmit();
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          <TextField
            fullWidth
            name="reportId"
            label="ID laporan"
            value={value?.reportId ?? ''}
            error={Boolean(errors.reportId)}
            helperText={errors.reportId || 'Terisi otomatis dari laporan terbaru.'}
            disabled={loading}
            slotProps={{ input: { readOnly: true } }}
          />
          <TextField
            fullWidth
            required
            type="date"
            name="reviewDate"
            label="Tanggal pengecekan ulang"
            value={value?.reviewDate ?? ''}
            onChange={(event) => onChange({ reviewDate: event.target.value }, 'reviewDate')}
            error={Boolean(errors.reviewDate)}
            helperText={errors.reviewDate}
            disabled={loading}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: getTodayDate() } }}
          />
        </Box>

        <FormControl component="fieldset" error={checkErrors.length > 0} disabled={loading}>
          <FormLabel component="legend" sx={labelSx}>
            Pengecekan ulang
          </FormLabel>
          <FormGroup>
            {REVIEW_CHECKS.map(({ key, label }) => (
              <FormControlLabel
                key={key}
                label={label}
                control={
                  <Checkbox
                    name={`checks.${key}`}
                    checked={checks[key] === true}
                    onChange={(event) =>
                      onChange({ checks: { ...checks, [key]: event.target.checked } }, `checks.${key}`)
                    }
                  />
                }
              />
            ))}
          </FormGroup>
          {checkErrors.length > 0 && <FormHelperText>{checkErrors[0]}</FormHelperText>}
        </FormControl>

        <FormControl required error={Boolean(errors.finalCondition)} disabled={loading}>
          <FormLabel id="review-finalCondition-label" sx={labelSx}>
            Kondisi akhir hasil pengecekan admin
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby="review-finalCondition-label"
            name="finalCondition"
            value={value?.finalCondition ?? ''}
            onChange={(event) => onChange({ finalCondition: event.target.value }, 'finalCondition')}
          >
            {Object.values(TANK_CONDITION).map((condition) => (
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
          label="Masalah yang masih tersisa"
          value={value?.remainingIssues ?? ''}
          onChange={(event) => onChange({ remainingIssues: event.target.value }, 'remainingIssues')}
          error={Boolean(errors.remainingIssues)}
          helperText={errors.remainingIssues || 'Kosongkan jika tidak ada masalah yang tersisa.'}
          disabled={loading}
        />

        <FormControl required error={Boolean(errors.decision)} disabled={loading}>
          <FormLabel id="review-decision-label" sx={labelSx}>
            Keputusan
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby="review-decision-label"
            name="decision"
            value={value?.decision ?? ''}
            onChange={(event) => onChange({ decision: event.target.value }, 'decision')}
          >
            {[REVIEW_DECISION.REVISION_REQUIRED, REVIEW_DECISION.PASSED].map((decision) => (
              <FormControlLabel
                key={decision}
                value={decision}
                control={<Radio size="small" />}
                label={REVIEW_DECISION_LABELS[decision]}
              />
            ))}
          </RadioGroup>
          {errors.decision && <FormHelperText>{errors.decision}</FormHelperText>}
        </FormControl>

        <TextField
          fullWidth
          required
          multiline
          minRows={3}
          name="notes"
          label="Catatan pemeriksaan / alasan revisi"
          value={value?.notes ?? ''}
          onChange={(event) => onChange({ notes: event.target.value }, 'notes')}
          error={Boolean(errors.notes)}
          helperText={errors.notes}
          disabled={loading}
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save size={18} />}
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Keputusan'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
