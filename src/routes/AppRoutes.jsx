import { Component, lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ROLES } from '../constants/statuses.js';
import { useAuth } from '../hooks/useAuth.js';
import RequireAuth from './RequireAuth.jsx';
import RequireRole from './RequireRole.jsx';

const AppLayout = lazy(() => import('../components/layout/AppLayout.jsx'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage.jsx'));
const ArchivePage = lazy(() => import('../pages/admin/ArchivePage.jsx'));
const AssignmentsPage = lazy(() => import('../pages/admin/AssignmentsPage.jsx'));
const DashboardPage = lazy(() => import('../pages/admin/DashboardPage.jsx'));
const LetterPage = lazy(() => import('../pages/admin/LetterPage.jsx'));
const ReviewDetailPage = lazy(() => import('../pages/admin/ReviewDetailPage.jsx'));
const ReviewQueuePage = lazy(() => import('../pages/admin/ReviewQueuePage.jsx'));
const TanksPage = lazy(() => import('../pages/admin/TanksPage.jsx'));
const InspectionFormPage = lazy(() => import('../pages/technician/InspectionFormPage.jsx'));
const MyTasksPage = lazy(() => import('../pages/technician/MyTasksPage.jsx'));

class RouteErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.locationKey !== this.props.locationKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">
          <AlertTitle>Halaman gagal dimuat</AlertTitle>
          Muat ulang halaman untuk mencoba kembali.
          <Button color="inherit" variant="outlined" onClick={() => window.location.reload()} sx={{ display: 'block', mt: 2 }}>
            Muat ulang
          </Button>
        </Alert>
      </Container>
    );
  }
}

function RouteContent({ children }) {
  const { key: locationKey } = useLocation();

  return (
    <RouteErrorBoundary locationKey={locationKey}>
      <Suspense fallback={
        <Stack direction="row" spacing={2} role="status" sx={{ justifyContent: 'center', alignItems: 'center', py: 6 }}>
          <CircularProgress size={24} aria-hidden="true" />
          <Typography>Memuat halaman...</Typography>
        </Stack>
      }>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}

function homePath(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard';
  if (role === ROLES.TECHNICIAN) return '/petugas/tugas';
  return '/akses-ditolak';
}

function LoginRoute() {
  const { currentUser, isLoading } = useAuth();

  if (!isLoading && currentUser) {
    return <Navigate to={homePath(currentUser.role)} replace />;
  }

  return (
    <RouteContent>
      <LoginPage />
    </RouteContent>
  );
}

function HomeRoute() {
  const { currentUser } = useAuth();
  return <Navigate to={homePath(currentUser.role)} replace />;
}

function PlaceholderPage({ title, description }) {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography component="h1" variant="h4" gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Paper>
    </Container>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomeRoute />} />

        <Route element={<RouteContent><AppLayout /></RouteContent>}>
          <Route
            path="/akses-ditolak"
            element={
              <PlaceholderPage
                title="Akses ditolak"
                description="Anda tidak memiliki izin untuk membuka halaman ini."
              />
            }
          />

          <Route element={<RouteContent><Outlet /></RouteContent>}>
            <Route element={<RequireRole allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/tangki" element={<TanksPage />} />
              <Route path="/admin/penugasan" element={<AssignmentsPage />} />
              <Route path="/admin/verifikasi" element={<ReviewQueuePage />} />
              <Route path="/admin/verifikasi/:assignmentId" element={<ReviewDetailPage />} />
              <Route path="/admin/arsip" element={<ArchivePage />} />
              <Route path="/admin/surat/:letterId" element={<LetterPage />} />
            </Route>

            <Route element={<RequireRole allowedRoles={[ROLES.TECHNICIAN]} />}>
              <Route path="/petugas" element={<Navigate to="/petugas/tugas" replace />} />
              <Route path="/petugas/tugas" element={<MyTasksPage />} />
              <Route path="/petugas/tugas/:assignmentId" element={<InspectionFormPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <PlaceholderPage
            title="Halaman tidak ditemukan"
            description="Alamat halaman yang Anda buka tidak tersedia."
          />
        }
      />
    </Routes>
  );
}
