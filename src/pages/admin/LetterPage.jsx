import { Link as RouterLink, useParams } from 'react-router';
import { useState } from 'react';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InspectionLetter from '../../components/letter/InspectionLetter.jsx';
import { useAppData } from '../../hooks/useAppData.js';
import '../../styles/print.css';
import { downloadLetterPdf } from '../../utils/letterPdf.js';

export default function LetterPage() {
  const { letterId } = useParams();
  const { data, isLoading, error } = useAppData();
  const [pdfError, setPdfError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    setPdfError('');
    try { await downloadLetterPdf(letter); }
    catch (cause) { setPdfError(cause.message || 'PDF gagal dibuat. Silakan coba lagi.'); }
    finally { setIsDownloading(false); }
  }

  const letter = data?.letters.find((item) => item.id === letterId);

  let content;
  if (isLoading && !data) {
    content = (
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', py: 4 }} role="status">
        <CircularProgress size={24} />
        <Typography>Memuat surat...</Typography>
      </Stack>
    );
  } else if (!data) {
    content = (
      <Alert severity="error" role="alert">
        {error || 'Surat tidak dapat dimuat.'}
      </Alert>
    );
  } else if (!letter) {
    content = (
      <Alert severity="error" role="alert">
        Surat tidak ditemukan.
      </Alert>
    );
  } else {
    content = <InspectionLetter letter={letter} />;
  }

  return (
    <Container maxWidth="md" className="print-container" sx={{ py: { xs: 3, sm: 4 } }}>
      <Stack spacing={3}>
        <Stack
          className="no-print"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between' }}
        >
          <Button
            component={RouterLink}
            to={letter ? `/admin/verifikasi/${letter.assignmentId}` : '/admin/verifikasi'}
            startIcon={<ArrowLeft size={18} />}
          >
            Kembali ke Detail Verifikasi
          </Button>
          {letter && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button variant="outlined" startIcon={<Printer size={18} />} onClick={() => window.print()}>Cetak</Button>
              <Button variant="contained" startIcon={<Download size={18} />} onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? 'Menyiapkan PDF...' : 'Unduh PDF'}
              </Button>
            </Stack>
          )}
        </Stack>

        {pdfError && <Alert severity="error" className="no-print">{pdfError}</Alert>}
        {content}
      </Stack>
    </Container>
  );
}
