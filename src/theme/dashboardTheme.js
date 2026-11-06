import { alpha, createTheme } from '@mui/material/styles';
import theme from './theme.js';

// Tema workspace terpisah agar halaman login tetap memakai tema semula.
const dashboardTheme = createTheme(theme, {
  typography: {
    h4: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.6px' },
    h6: { fontSize: '1rem', fontWeight: 650 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600, minHeight: 36 } },
    },
    MuiPaper: {
      styleOverrides: { outlined: { borderColor: alpha(theme.palette.text.primary, 0.12), boxShadow: 'none' } },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: alpha(theme.palette.text.primary, 0.08) },
        head: { backgroundColor: theme.palette.background.default, fontSize: '0.75rem', fontWeight: 650, paddingTop: 14, paddingBottom: 14, whiteSpace: 'nowrap' },
        body: { paddingTop: 16, paddingBottom: 16 },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: theme.palette.background.paper,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.secondary },
        },
        notchedOutline: { borderColor: alpha(theme.palette.text.primary, 0.22) },
      },
    },
    MuiFormLabel: { styleOverrides: { root: { fontSize: '0.875rem' } } },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16, backgroundImage: 'none',
          '& > form': { display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
        },
      },
    },
    MuiDialogContent: { styleOverrides: { root: { minHeight: 0 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontSize: '1.25rem', fontWeight: 700, padding: '24px' } } },
    MuiDialogActions: {
      styleOverrides: { root: { flexShrink: 0, borderTop: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`, padding: '16px 24px', gap: 8 } },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } } },
  },
});

export default dashboardTheme;
