# Design System — MultiURL

Dokumen ini mendefinisikan panduan visual dan tata letak untuk antarmuka **MultiURL** berdasarkan referensi UI. Warna aksen ungu pada desain asli diganti menjadi **biru**. Pertahankan karakter antarmuka yang ringkas, bersih, ringan, dan berfokus pada pengelolaan serta pembukaan banyak URL.

## 1. Tujuan Desain

- Membantu pengguna memasukkan, memvalidasi, memilih, dan membuka banyak URL sekaligus.
- Menampilkan status pemrosesan dan hasil secara jelas.
- Menjaga seluruh kontrol utama tetap mudah ditemukan dalam satu panel.
- Menggunakan aksen biru sebagai warna identitas utama, menggantikan ungu dari desain referensi.

## 2. Gaya Visual

- **Gaya:** minimal, modern, utilitas produktivitas.
- **Latar:** abu-abu sangat muda dengan panel putih.
- **Tipografi:** sans-serif modern; gunakan font UI sistem atau Inter.
- **Sudut:** membulat sedang, konsisten pada panel, daftar, tombol, dan input.
- **Bayangan:** lembut pada ikon aplikasi dan tombol utama; hindari bayangan berat.
- **Kepadatan:** relatif padat, tetapi tetap memiliki jarak dan pemisah yang jelas.
- **Ikon:** gunakan ikon sederhana, bukan emoji.

## 3. Palet Warna

Gunakan palet berikut sebagai dasar. Semua elemen yang sebelumnya berwarna ungu diganti dengan warna biru yang sesuai.

| Token | Warna | Penggunaan |
|---|---|---|
| `color-primary` | `#2563EB` | Tombol utama, tab aktif, aksen utama |
| `color-primary-hover` | `#1D4ED8` | Hover tombol dan kontrol aktif |
| `color-primary-pressed` | `#1E40AF` | Kondisi ditekan |
| `color-primary-soft` | `#DBEAFE` | Latar lembut untuk elemen aktif |
| `color-primary-tint` | `#EFF6FF` | Sorotan ringan |
| `color-background` | `#F5F7FB` | Latar keseluruhan |
| `color-surface` | `#FFFFFF` | Kartu, input, daftar |
| `color-border` | `#D8E0EC` | Garis tepi dan pemisah |
| `color-text` | `#172033` | Judul dan teks utama |
| `color-text-secondary` | `#718096` | Deskripsi, label sekunder |
| `color-success` | `#0D9488` | Status valid/sukses dan tanda centang |
| `color-warning` | `#D97706` | Duplikat/peringatan |
| `color-danger` | `#DC3545` | Hapus, URL invalid, aksi berbahaya |
| `color-track` | `#E5EAF2` | Jalur progress bar |

### Aturan penggunaan warna

- Biru adalah aksen utama dan hanya digunakan pada kontrol penting atau status aktif.
- Gunakan teks putih di atas tombol biru untuk kontras yang baik.
- Warna hijau kebiruan menandai keberhasilan; merah khusus untuk penghapusan atau kegagalan.
- Hindari menggunakan biru untuk semua teks. Label biasa tetap memakai warna teks sekunder.
- Pastikan teks dan kontrol memiliki kontras yang memadai.

## 4. Tipografi

Gunakan skala tipografi berikut:

| Elemen | Ukuran | Ketebalan |
|---|---:|---|
| Nama aplikasi | 22–24 px | Bold / 700 |
| Judul bagian | 13–14 px | Semibold / 600 |
| Isi URL | 13–14 px | Regular / 400, monospace |
| Teks utama | 13–14 px | Regular / 400 |
| Label sekunder | 12 px | Regular / 400 |
| Catatan footer | 11–12 px | Regular / 400 |
| Angka statistik | 18–20 px | Bold / 700 |

- Gunakan font sans-serif untuk antarmuka dan font monospace untuk URL.
- URL panjang harus dapat dibungkus atau dipotong secara visual tanpa merusak tata letak.
- Jangan mengandalkan warna saja untuk menyampaikan status; sertakan teks atau ikon.

## 5. Struktur Layout

Antarmuka dirancang sebagai panel vertikal dengan lebar sekitar **630–660 px** pada ukuran referensi. Pada layar yang lebih kecil, panel mengikuti lebar viewport dengan padding yang konsisten.

Urutan elemen dari atas ke bawah:

1. Header aplikasi.
2. Label dan area input URL.
3. Ringkasan jumlah URL.
4. Kontrol pemilihan dan penghapusan.
5. Daftar URL yang terdeteksi.
6. Pengaturan mode pembukaan.
7. Panel status dan progress.
8. Tombol kontrol proses.
9. Footer.

Gunakan jarak vertikal sekitar 10–16 px antarseksi dan 6–10 px di dalam kelompok kontrol.

## 6. Komponen UI

### 6.1 Header

- Ikon aplikasi berbentuk persegi membulat, sekitar 48 × 48 px.
- Latar ikon menggunakan `color-primary`; simbol tautan berwarna putih.
- Judul **MultiURL** berada di sebelah kanan ikon.
- Subjudul: “Detect, organize, and reliably open every link”.
- Status proses berada di sisi kanan header, dengan titik indikator dan teks, misalnya “Completed”.
- Saat ruang terbatas, status boleh turun ke baris berikutnya.

### 6.2 Area input URL

- Label “URLs” di sisi kiri dan keterangan “One URL per line” di sisi kanan.
- Textarea berlatar putih, border tipis, radius 12 px.
- URL ditampilkan satu per baris dengan font monospace.
- Tinggi awal sekitar 96 px, dengan scrollbar vertikal saat konten melebihi area.
- Teks bantuan di bawah input: “Supports http(s)://, www., bare domains, and common separators”.
- Fokus input menggunakan border biru dan focus ring biru lembut.

### 6.3 Ringkasan statistik

Tampilkan empat statistik dalam satu panel horizontal:

- **Total** — jumlah semua baris yang terdeteksi.
- **Valid** — jumlah URL yang valid.
- **Duplicates** — jumlah URL duplikat.
- **Invalid** — jumlah URL tidak valid.

Ketentuan:
- Keempat statistik memiliki lebar seimbang.
- Pisahkan tiap statistik dengan garis vertikal tipis.
- Angka ditampilkan lebih tegas daripada label.
- Gunakan biru untuk angka total, hijau kebiruan untuk valid, amber untuk duplikat, dan merah untuk invalid.
- Pada layar sempit, statistik dapat berubah menjadi grid dua kolom.

### 6.4 Kontrol daftar

Baris kontrol di atas daftar berisi:

- “Select all”
- “Select none”
- “Delete selected”
- “Clear” di sisi kanan

Gunakan gaya link atau tombol teks tanpa latar besar. “Delete selected” dan “Clear” memakai warna merah karena merupakan aksi destruktif.

### 6.5 Daftar URL

- Panel putih dengan border tipis dan radius 12 px.
- Tinggi dibatasi; daftar memiliki scrollbar internal.
- Setiap baris memiliki nomor urut, checkbox, URL, indikator validasi, dan tombol hapus.
- Tinggi baris sekitar 52–56 px.
- Gunakan garis pemisah horizontal yang lembut.
- Checkbox terpilih memakai biru utama dengan tanda centang putih.
- URL ditampilkan dengan font monospace, satu baris jika memungkinkan, dan ellipsis jika terlalu panjang.
- Indikator valid menggunakan tanda centang hijau kebiruan.
- Tombol hapus per item memakai ikon “x” yang netral; berubah merah saat hover.
- Baris terpilih boleh memakai latar `color-primary-tint` yang sangat lembut.

### 6.6 Pengaturan mode pembukaan

- Label “Open mode” di kiri dan keterangan “Tasks continue in the background” di kanan.
- Tampilkan tiga opsi sebagai segmented control:
  - **Open all**
  - **At intervals**
  - **After load**
- Kontrol aktif memakai latar biru utama, teks putih, radius 9–10 px, dan bayangan sangat halus.
- Opsi nonaktif menggunakan latar putih dan teks abu-abu gelap.
- Saat **At intervals** dipilih, tampilkan input angka interval dan label “seconds” di sebelah kanan.
- Input interval berukuran ringkas, dengan border tipis dan radius 10 px.
- Validasi input agar nilainya angka positif yang masuk akal.

### 6.7 Panel status dan progress

- Panel berlatar putih atau abu-abu sangat muda dengan border tipis dan radius 12 px.
- Bagian atas menampilkan status seperti “Completed” di kiri dan “Opened 49 / 50” di kanan.
- Progress bar horizontal memakai track abu-abu dan isi biru utama.
- Ujung progress bar membulat.
- Di bawahnya tampilkan ringkasan:
  - Success
  - Failed
  - Remaining
- Angka harus mudah dibaca dan diperbarui selama proses berjalan.

### 6.8 Tombol kontrol proses

Susunan tombol:
- **Pause** — tombol sekunder.
- **Stop** — tombol sekunder/destruktif ringan.
- **Open selected URLs** — tombol utama dengan porsi lebar terbesar.

Aturan:
- Tombol utama berwarna biru dengan teks putih, radius 12 px, dan tinggi sekitar 46 px.
- Tombol sekunder memakai latar putih, border abu-abu, dan teks abu-abu gelap.
- Tombol yang tidak tersedia pada status tertentu harus terlihat disabled dengan kontras yang masih terbaca.
- Berikan state hover, active, focus, dan disabled.
- Jangan menampilkan status selesai sebelum proses benar-benar selesai.

### 6.9 Footer

- Letakkan catatan singkat di bagian bawah, rata tengah.
- Contoh: “Tasks continue if you close this popup”.
- Tautan “Support development” memakai biru utama.
- Gunakan teks kecil dan warna sekunder agar tidak bersaing dengan tombol utama.

## 7. Spacing, Radius, dan Dimensi

| Token | Nilai |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `radius-small` | 6 px |
| `radius-control` | 10 px |
| `radius-panel` | 12 px |
| `radius-icon` | 14 px |
| `border-width` | 1 px |
| `control-height` | 40–46 px |
| `list-row-height` | 52–56 px |

- Gunakan padding utama 18–20 px.
- Jaga alignment kiri-kanan antarseksi.
- Hindari jarak yang tidak konsisten atau panel dengan padding terlalu besar.

## 8. Responsivitas

- **Lebar ≥ 600 px:** tampilkan statistik dalam satu baris; kontrol mode dan tombol proses tetap horizontal.
- **Lebar 400–599 px:** pertahankan layout vertikal; kecilkan jarak dan izinkan kontrol tertentu membungkus.
- **Lebar < 400 px:** statistik menjadi grid dua kolom; tombol proses dapat membungkus atau disusun vertikal; label kanan pada header bagian dapat turun ke baris berikutnya.
- Daftar URL harus mempertahankan nomor, checkbox, URL, status, dan tombol hapus tanpa membuat overflow horizontal.
- Panel mengikuti lebar layar, dengan padding minimal 12 px.

## 9. Status dan Interaksi

Rancang tampilan untuk status berikut:

- **Idle:** belum ada proses yang berjalan.
- **Ready:** URL sudah diperiksa dan siap dibuka.
- **Opening:** proses sedang berlangsung; progress dan angka status diperbarui.
- **Paused:** proses berhenti sementara dan dapat dilanjutkan.
- **Completed:** seluruh URL yang dipilih sudah diproses.
- **Failed:** sebagian atau seluruh URL gagal dibuka.
- **Empty:** tidak ada URL yang dimasukkan.
- **Validation error:** ada URL yang tidak valid.

Interaksi utama:
- Memasukkan atau menempelkan banyak URL.
- Memvalidasi dan menghapus duplikat sesuai aturan produk.
- Memilih semua, membatalkan pilihan, menghapus pilihan, atau membersihkan daftar.
- Memilih mode pembukaan dan interval.
- Memulai, menjeda, dan menghentikan proses.
- Menampilkan jumlah sukses, gagal, dan tersisa secara akurat.

## 10. Aksesibilitas

- Gunakan kontras teks yang memadai pada semua latar.
- Semua kontrol dapat dioperasikan dengan keyboard.
- Sediakan focus ring yang terlihat dan konsisten dengan aksen biru.
- Setiap checkbox dan ikon aksi memiliki label aksesibel.
- Jangan menyampaikan validitas URL hanya melalui warna; tambahkan tooltip, teks, atau atribut aksesibilitas.
- Target klik sebaiknya minimal sekitar 36 × 36 px untuk kontrol kecil.
- Hormati preferensi reduced motion jika animasi digunakan.

## 11. Prinsip Implementasi

- Jadikan token warna sebagai variabel atau design tokens agar tema mudah diubah.
- Jangan mencampur kode warna ungu lama dengan palet biru baru.
- Gunakan satu nilai radius dan spacing yang konsisten untuk komponen sejenis.
- Progress, statistik, dan status harus bersumber dari state proses yang sebenarnya.
- Pastikan tombol dan kontrol memiliki perilaku nyata, bukan sekadar dekorasi.
- Pertahankan urutan informasi dan karakter visual referensi; perubahan utama yang diminta adalah penggantian aksen ungu menjadi biru.

## 12. Checklist Implementasi

- [ ] Aksen ungu diganti dengan biru.
- [ ] Header, input, statistik, daftar URL, mode, progress, dan footer mengikuti spesifikasi.
- [ ] Kondisi hover, focus, active, disabled, error, dan completed tersedia.
- [ ] Layout responsif dan tidak mengalami overflow.
- [ ] Teks URL menggunakan font monospace.
- [ ] Warna status valid, duplikat, dan invalid dibedakan dengan jelas.
- [ ] Semua aksi utama dapat digunakan dengan keyboard.
- [ ] Status dan progress sesuai dengan hasil proses aktual.
