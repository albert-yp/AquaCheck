# AquaCheck

AquaCheck adalah aplikasi React untuk mencatat kondisi tangki air filtrasi, menjadwalkan pemeriksaan, dan mendokumentasikan pemeliharaan. Proyek 1 berjalan sebagai prototipe frontend dengan akun demo dan penyimpanan lokal di browser.

## Peran pengguna

- **Admin** mengelola data tangki, membuat penugasan, memeriksa ulang laporan, meminta revisi atau menyetujui hasil inspeksi, serta membuka surat dan arsip. Dashboard menampilkan ringkasan tangki dan status tugas.
- **Teknisi** melihat tugas miliknya, menyimpan draf, mengunggah bukti foto, dan mengirim laporan untuk diverifikasi.

## Fitur utama

| Fitur | Kegunaan |
| --- | --- |
| **Data Tangki** | Menambah, mengubah, dan mengarsipkan data tangki serta perangkat filtrasi. |
| **Penjadwalan dan Penugasan** | Menentukan tangki, teknisi, tanggal, kegiatan, dan instruksi pemeriksaan. |
| **Formulir Pemeriksaan dan Foto** | Mencatat kondisi, temuan, tindakan, serta bukti foto sebelum mengirim laporan. |
| **Verifikasi dan Revisi** | Admin mencatat pengecekan ulang. Jika diperlukan revisi, teknisi mengirim versi baru dan versi sebelumnya tetap tersimpan. |
| **Surat Edaran** | Persetujuan menutup tugas dan menerbitkan satu surat yang dapat dicetak atau diunduh sebagai PDF A4. |
| **Arsip** | Menelusuri riwayat penugasan, versi laporan, keputusan admin, dan surat. |

## Menjalankan aplikasi

Gunakan Node.js 22.22 atau lebih baru dalam seri 22, atau Node.js 24 ke atas. Jalankan dari folder proyek.

```bash
npm ci
npm run dev
```

Buka alamat yang ditampilkan Vite di terminal. Masuk dengan username dan password akun demo yang tercantum di [konfigurasi akun demo](src/data/mockData.js).

Data terstruktur dan sesi disimpan di `localStorage`, sedangkan foto disimpan di `IndexedDB`. Data tersimpan pada browser dan alamat aplikasi yang sama.

```bash
npm run lint
npm run build
npm run preview
```

`npm run build` menghasilkan versi produksi di `dist/`. `npm run preview` menyajikan hasil build secara lokal.

## Isi repositori

```text
public/
src/
eslint.config.js
index.html
package.json
package-lock.json
README.md
vite.config.js
```

Aplikasi menggunakan React, React Router, Material UI, Lucide, dan jsPDF. Vite digunakan untuk pengembangan dan build, sedangkan ESLint digunakan untuk pemeriksaan kode.
