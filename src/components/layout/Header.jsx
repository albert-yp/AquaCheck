import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { useState } from 'react';
import { ChevronDown, LogOut, Menu as MenuIcon } from 'lucide-react';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import { ROLE_LABELS } from '../../constants/statuses.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function Header({ drawerWidth, onMenuClick }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [logoutFailed, setLogoutFailed] = useState(false);
  const section = {
    tangki: 'Data Tangki', penugasan: 'Penugasan', verifikasi: 'Verifikasi Laporan',
    arsip: 'Arsip', surat: 'Surat Inspeksi', tugas: 'Tugas Saya', dashboard: 'Dashboard',
  }[pathname.split('/')[2]] || 'Halaman';
  const isDetail = pathname.split('/').filter(Boolean).length > 2;

  function handleLogout() {
    setMenuAnchor(null);
    setLogoutFailed(false);
    try {
      logout();
    } catch {
      setLogoutFailed(true);
      return;
    }
    navigate('/login', { replace: true });
  }

  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role;
  const initial = currentUser?.name?.charAt(0).toUpperCase() || '?';

  return (
    <AppBar
      position="fixed"
      className="app-header"
      color="inherit"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${drawerWidth}px)` },
        ml: { md: `${drawerWidth}px` },
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ gap: 1, px: { sm: 3, lg: 4 }, bgcolor: 'background.default' }}>
        <IconButton
          edge="start"
          aria-label="Buka menu navigasi"
          onClick={onMenuClick}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
          <MenuIcon size={22} />
        </IconButton>

        <Breadcrumbs separator="›" aria-label="Lokasi halaman" sx={{ flexGrow: 1, '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' }, '& .MuiBreadcrumbs-ol > li:nth-of-type(2)': { display: { xs: 'none', sm: 'flex' } } }}>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {currentUser?.role === 'ADMIN' ? 'Admin' : 'Teknisi'}
          </Typography>
          {isDetail ? (
            <Link component={RouterLink} to={pathname.split('/').slice(0, 3).join('/') === '/admin/surat' ? '/admin/arsip' : pathname.split('/').slice(0, 3).join('/')} underline="hover" color="inherit" variant="body2">{section}</Link>
          ) : <Typography variant="body2" sx={{ fontWeight: 600 }}>{section}</Typography>}
          {isDetail && <Typography variant="body2" sx={{ fontWeight: 600 }}>Detail</Typography>}
        </Breadcrumbs>

        {currentUser && (
          <>
            <Button
              id="account-menu-button"
              color="inherit"
              aria-label={`Menu akun ${currentUser.name}`}
              aria-controls={menuAnchor ? 'account-menu' : undefined}
              aria-haspopup="menu"
              aria-expanded={Boolean(menuAnchor)}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              endIcon={<ChevronDown size={16} />}
              sx={{ textAlign: 'left', gap: 1.5, px: 1, py: 0.75 }}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>{initial}</Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>
                  {currentUser.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {roleLabel}
                </Typography>
              </Box>
            </Button>
            <Menu
              id="account-menu"
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ list: { 'aria-labelledby': 'account-menu-button' }, paper: { sx: { minWidth: 220, mt: 1, border: 1, borderColor: 'divider' } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{currentUser.name}</Typography>
                <Typography variant="caption" color="text.secondary">{roleLabel} · @{currentUser.username}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon><LogOut size={16} /></ListItemIcon>
                Keluar
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
      <Snackbar open={logoutFailed} onClose={() => setLogoutFailed(false)}>
        <Alert severity="error" onClose={() => setLogoutFailed(false)}>
          Gagal keluar karena sesi tidak dapat dihapus. Silakan coba lagi.
        </Alert>
      </Snackbar>
    </AppBar>
  );
}
