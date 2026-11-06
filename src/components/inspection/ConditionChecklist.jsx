import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  CHECKLIST_FIELDS,
  CHECK_RESULT,
  CHECK_RESULT_LABELS,
  WATER_OPTIONS,
} from '../../constants/statuses.js';

const CHECK_OPTIONS = Object.values(CHECK_RESULT).map((value) => ({
  value,
  label: CHECK_RESULT_LABELS[value],
}));

const WATER_LABELS = {
  color: 'Warna air',
  clarity: 'Kejernihan air',
  odor: 'Bau air',
};

const CHECKLIST_GROUPS = CHECKLIST_FIELDS.reduce((groups, field) => {
  const group = groups.find((item) => item.title === field.group);
  if (group) group.fields.push(field);
  else groups.push({ title: field.group, fields: [field] });
  return groups;
}, []);

function ChecklistItem({ field, item, errors, readOnly, disabled, onItemChange }) {
  const resultKey = `checklist.${field.key}.result`;
  const notesKey = `checklist.${field.key}.notes`;
  const result = item?.result ?? '';
  const notesRequired = result === CHECK_RESULT.NOT_APPLICABLE;

  return (
    <Box sx={{ py: 1.5 }}>
      <FormControl error={Boolean(errors[resultKey])} disabled={readOnly || disabled} fullWidth>
        <FormLabel id={`${resultKey}-label`} sx={{ color: 'text.primary', fontWeight: 600 }}>
          {field.label}
        </FormLabel>
        <RadioGroup
          row
          aria-labelledby={`${resultKey}-label`}
          name={resultKey}
          value={result}
          onChange={(event) => onItemChange(field.key, { result: event.target.value }, resultKey)}
        >
          {CHECK_OPTIONS.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio size="small" />}
              label={option.label}
            />
          ))}
        </RadioGroup>
        {errors[resultKey] && <FormHelperText>{errors[resultKey]}</FormHelperText>}
      </FormControl>
      {(!readOnly || item?.notes) && (
        <TextField
          fullWidth
          size="small"
          name={notesKey}
          label={notesRequired ? 'Alasan tidak berlaku' : 'Catatan (opsional)'}
          required={notesRequired}
          value={item?.notes ?? ''}
          onChange={(event) => onItemChange(field.key, { notes: event.target.value }, notesKey)}
          error={Boolean(errors[notesKey])}
          helperText={errors[notesKey]}
          disabled={disabled}
          slotProps={{ input: { readOnly } }}
          sx={{ mt: 1 }}
        />
      )}
    </Box>
  );
}

export default function ConditionChecklist({
  value,
  onChange,
  errors = {},
  readOnly = false,
  disabled = false,
}) {
  const checklist = value?.checklist ?? {};
  const waterObservations = value?.waterObservations ?? {};

  function handleItemChange(key, changes, errorKey) {
    if (readOnly) return;
    onChange(
      { checklist: { ...checklist, [key]: { ...checklist[key], ...changes } } },
      errorKey,
    );
  }

  function handleWaterChange(key, nextValue) {
    if (readOnly) return;
    onChange(
      { waterObservations: { ...waterObservations, [key]: nextValue } },
      `waterObservations.${key}`,
    );
  }

  return (
    <Stack spacing={3}>
      {CHECKLIST_GROUPS.map((group) => (
        <Box key={group.title}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {group.title}
          </Typography>
          <Stack divider={<Divider flexItem />}>
            {group.fields.map((field) => (
              <ChecklistItem
                key={field.key}
                field={field}
                item={checklist[field.key]}
                errors={errors}
                readOnly={readOnly}
                disabled={disabled}
                onItemChange={handleItemChange}
              />
            ))}
          </Stack>
        </Box>
      ))}

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Pengamatan air
        </Typography>
        <Stack spacing={2}>
          {Object.entries(WATER_OPTIONS).map(([key, options]) => {
            const errorKey = `waterObservations.${key}`;
            return (
              <FormControl
                key={key}
                error={Boolean(errors[errorKey])}
                disabled={readOnly || disabled}
              >
                <FormLabel id={`${errorKey}-label`} sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {WATER_LABELS[key]}
                </FormLabel>
                <RadioGroup
                  row
                  aria-labelledby={`${errorKey}-label`}
                  name={errorKey}
                  value={waterObservations[key] ?? ''}
                  onChange={(event) => handleWaterChange(key, event.target.value)}
                >
                  {options.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio size="small" />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
                {errors[errorKey] && <FormHelperText>{errors[errorKey]}</FormHelperText>}
              </FormControl>
            );
          })}
          {(!readOnly || waterObservations.notes) && (
            <TextField
              fullWidth
              multiline
              minRows={2}
              name="waterObservations.notes"
              label="Catatan pengamatan air (opsional)"
              value={waterObservations.notes ?? ''}
              onChange={(event) => handleWaterChange('notes', event.target.value)}
              disabled={disabled}
              slotProps={{ input: { readOnly } }}
            />
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
