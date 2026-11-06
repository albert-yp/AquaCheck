import { Navigate, Outlet } from 'react-router';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../hooks/useAuth.js';

export default function RequireRole({ allowedRoles = [] }) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack
        spacing={2}
        role="status"
        sx={{ minHeight: '50vh', alignItems: 'center', justifyContent: 'center' }}
      >
        <CircularProgress size={28} />
        <Typography>Memeriksa akses...</Typography>
      </Stack>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/akses-ditolak" replace />;
  }

  return <Outlet />;
}
