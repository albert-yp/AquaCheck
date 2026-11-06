import { NavLink } from 'react-router';
import { Archive, ClipboardCheck, ClipboardList, Droplets, LayoutDashboard, ListTodo } from 'lucide-react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { ROLES } from '../../constants/statuses.js';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/tangki', label: 'Data Tangki', icon: Droplets },
    { to: '/admin/penugasan', label: 'Penugasan', icon: ClipboardList },
    { to: '/admin/verifikasi', label: 'Verifikasi Laporan', icon: ClipboardCheck },
    { to: '/admin/arsip', label: 'Arsip', icon: Archive },
  ],
  [ROLES.TECHNICIAN]: [{ to: '/petugas/tugas', label: 'Tugas Saya', icon: ListTodo }],
};

function SidebarContent({ onNavigate }) {
  const { currentUser } = useAuth();
  const items = NAV_ITEMS[currentUser?.role] || [];

  return (
    <Stack sx={{ height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', p: 0.75, borderRadius: 2, display: 'flex' }}><Droplets size={22} /></Box>
        <Typography variant="h6" component="div" sx={{ fontWeight: 750, color: 'primary.main' }}>
          AquaCheck
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1.2 }}>Ruang kerja</Typography>
      </Box>
      <List component="nav" aria-label="Navigasi utama" sx={{ px: 1.5 }}>
        {items.map(({ to, label, icon: Icon }) => (
          <ListItemButton
            key={to}
            component={NavLink}
            to={to}
            onClick={onNavigate}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              py: 0.75,
              '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: 500 },
              transition: 'background-color 150ms, color 150ms',
              '&.active': {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.09),
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34 }}>
              <Icon size={18} />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ m: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Typography variant="subtitle2">Pemeriksaan tangki</Typography>
        <Typography variant="caption" color="text.secondary">Catat pekerjaan, periksa laporan, dan pantau tindak lanjut.</Typography>
      </Box>
      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ p: 2.5, alignItems: 'center' }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>{currentUser?.name?.charAt(0)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentUser?.name}</Typography>
          <Typography variant="caption" color="text.secondary">{currentUser?.role === ROLES.ADMIN ? 'Administrator' : 'Teknisi'}</Typography>
        </Box>
      </Stack>
    </Stack>
  );
}

export default function Sidebar({ drawerWidth, mobileOpen, onClose }) {
  return (
    <Box component="aside" className="app-sidebar" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent onNavigate={onClose} />
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <SidebarContent />
      </Drawer>
    </Box>
  );
}
