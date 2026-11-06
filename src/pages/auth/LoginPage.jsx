import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Droplets } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function LoginPage() {
  const { login, isLoading, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const value = username.trim();

    if (!value) {
      setError('Masukkan username akun demo.');
      return;
    }

    if (!password) {
      setError('Masukkan password akun demo.');
      return;
    }

    setError('');
    try {
      login(value, password);
    } catch (cause) {
      setError(cause.message || 'Login gagal. Silakan coba lagi.');
    }
  }

  return (
    <Stack
      component="main"
      sx={{
        minHeight: '100dvh',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 2, sm: 4 },
        background: (theme) => `radial-gradient(ellipse at center, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 450,
          p: { xs: 3, sm: 4 },
          boxShadow: '0 5px 15px rgb(22 50 79 / 5%), 0 15px 35px -5px rgb(22 50 79 / 5%)',
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', color: 'primary.main', mb: 1 }}>
            <Droplets size={26} aria-hidden="true" />
            <Typography variant="h6" sx={{ fontWeight: 750, letterSpacing: '-0.5px' }}>
              AquaCheck
            </Typography>
          </Stack>
          <Box>
            <Typography component="h1" variant="h4" sx={{ fontSize: 'clamp(2rem, 7vw, 2.15rem)', mb: 1 }}>
              Masuk
            </Typography>
            <Typography color="text.secondary">
              Gunakan akun demo untuk mengakses aplikasi pemeriksaan tangki.
            </Typography>
          </Box>

          {isLoading ? (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }} role="status">
              <CircularProgress size={24} />
              <Typography>Memulihkan sesi...</Typography>
            </Stack>
          ) : (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="login-username" sx={{ mb: 1, color: 'text.primary', fontSize: '0.875rem' }}>Username</FormLabel>
                  <TextField
                  id="login-username"
                  autoFocus
                  fullWidth
                  required
                  placeholder="Masukkan username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    if (error) setError('');
                  }}
                  error={Boolean(error) && !username.trim()}
                  slotProps={{ htmlInput: { 'aria-label': 'Username' } }}
                />
                </FormControl>
                <FormControl fullWidth>
                  <FormLabel htmlFor="login-password" sx={{ mb: 1, color: 'text.primary', fontSize: '0.875rem' }}>Password</FormLabel>
                  <TextField
                  id="login-password"
                  fullWidth
                  required
                  type="password"
                  placeholder="••••••••"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError('');
                  }}
                  error={Boolean(error) && Boolean(username.trim()) && !password}
                  slotProps={{ htmlInput: { 'aria-label': 'Password' } }}
                />
                </FormControl>
                <Button fullWidth type="submit" variant="contained" sx={{ minHeight: 44, mt: 1 }}>
                  Masuk
                </Button>
              </Stack>
            </Box>
          )}

          {(error || authError) && (
            <Alert severity="error" role="alert">
              {error || authError}
            </Alert>
          )}
          <Divider sx={{ pt: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Akun demo: admin, teknisi1, atau teknisi2.
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
