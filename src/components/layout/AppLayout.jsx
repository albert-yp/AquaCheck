import { useState } from 'react';
import { Outlet } from 'react-router';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import { ThemeProvider } from '@mui/material/styles';
import dashboardTheme from '../../theme/dashboardTheme.js';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

const DRAWER_WIDTH = 256;

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ThemeProvider theme={dashboardTheme}>
    <Box className="app-layout" sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Header drawerWidth={DRAWER_WIDTH} onMenuClick={() => setMobileOpen((open) => !open)} />
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        className="app-main"
        sx={{
          flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          '& > .MuiContainer-root': { px: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1440 },
        }}
      >
        <Toolbar className="app-toolbar-spacer" />
        <Outlet />
      </Box>
    </Box>
    </ThemeProvider>
  );
}
