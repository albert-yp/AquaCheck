import { createTheme } from '@mui/material/styles';
import { colors } from './colors.js';

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      dark: colors.primaryDark,
      light: colors.primaryLight,
      contrastText: colors.paper,
    },
    secondary: { main: colors.secondary, dark: colors.secondaryDark, light: colors.secondaryLight, contrastText: colors.paper },
    success: { main: colors.success, contrastText: colors.paper },
    warning: { main: colors.warning, contrastText: colors.paper },
    error: { main: colors.error, contrastText: colors.paper },
    info: { main: colors.info, contrastText: colors.paper },
    divider: colors.divider,
    background: {
      default: colors.background,
      paper: colors.paper,
    },
    text: {
      primary: colors.ink,
      secondary: colors.muted,
    },
  },

  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
    },
  },

  shape: {
    borderRadius: 12,
  },
});

export default theme;
