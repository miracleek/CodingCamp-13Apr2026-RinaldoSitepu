# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi aplikasi web client-side menggunakan plain HTML, CSS, dan Vanilla JavaScript. Semua state dikelola dalam satu array in-memory yang di-mirror ke LocalStorage, dan seluruh UI di-render ulang dari state tersebut setiap kali ada mutasi. Chart.js 4.5.x dimuat via CDN untuk pie chart.

## Tasks

- [ ] 1. Buat struktur file dan skeleton HTML
  - Buat file `index.html` dengan struktur markup lengkap: header balance display, storage warning banner, form section, transaction list section, dan chart section
  - Sertakan CDN script tag untuk Chart.js 4.5.0 (jsDelivr UMD build) sebelum `app.js`
  - Buat file `app.js` kosong dengan komentar section: Constants, State, Storage, Validation, State Mutations, Render, Event Handlers, Init
  - Buat file `style.css` kosong dan hubungkan ke `index.html`
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 8.3_

- [ ] 2. Implementasi Constants, State, dan StorageService
  - [ ] 2.1 Implementasi Constants dan State
    - Definisikan `CATEGORIES`, `STORAGE_KEY`, dan `CATEGORY_COLORS` di section Constants
    - Definisikan module-level state: `let transactions = []`, `let storageAvailable = true`, `let chartInstance = null`
    - _Requirements: 6.1, 6.2_

  - [ ] 2.2 Implementasi StorageService (`loadFromStorage` dan `saveToStorage`)
    - `loadFromStorage()`: baca dari LocalStorage, parse JSON dalam `try/catch`, return `[]` dan set `storageAvailable = false` jika error, tampilkan `#storage-warning`
    - `saveToStorage(txns)`: serialisasi array ke LocalStorage dalam `try/catch`, set `storageAvailable = false` jika error
    - Tangani `SecurityError` dan malformed JSON
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.3 Tulis property test untuk LocalStorage round-trip (Property 6)
    - **Property 6: LocalStorage round-trip preserves transactions**
    - Gunakan `fc.array(validTransactionArbitrary)` untuk generate random transaction arrays
    - Verifikasi `loadFromStorage(saveToStorage(txns))` menghasilkan array yang deeply equal ke input
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [ ] 3. Implementasi Validation
  - [ ] 3.1 Implementasi `validateForm(name, amount, category)`
    - Return `{ valid: boolean, errors: { name?, amount?, category? } }`
    - Validasi: name tidak boleh kosong/whitespace-only; amount harus angka positif; category harus salah satu dari CATEGORIES
    - _Requirements: 1.4, 1.5_

  - [ ]* 3.2 Tulis property test untuk invalid inputs (Property 2)
    - **Property 2: Invalid inputs are always rejected**
    - Generate kombinasi input invalid: empty/whitespace name, zero/negative/non-numeric amount, invalid category
    - Verifikasi `validateForm()` selalu return `{ valid: false }` untuk semua kombinasi tersebut
    - **Validates: Requirements 1.4, 1.5**

- [ ] 4. Implementasi State Mutations
  - [ ] 4.1 Implementasi `addTransaction(name, amount, category)`
    - Buat Transaction object dengan `id` (gunakan `crypto.randomUUID()` atau `Date.now().toString()` sebagai fallback), `name` (trimmed), `amount` (number), `category`, `createdAt` (ISO 8601)
    - Push ke `transactions` array, panggil `saveToStorage()`, panggil `render()`
    - _Requirements: 1.3, 6.1_

  - [ ]* 4.2 Tulis property test untuk valid transaction (Property 1)
    - **Property 1: Valid transaction always appears in the list**
    - Generate valid inputs: `fc.string({ minLength: 1 })`, `fc.float({ min: 0.01 })`, `fc.constantFrom(...CATEGORIES)`
    - Verifikasi setelah `addTransaction()`, array bertambah tepat 1 elemen dengan name/amount/category yang benar
    - **Validates: Requirements 1.3**

  - [ ] 4.3 Implementasi `deleteTransaction(id)`
    - Filter `transactions` array untuk menghapus elemen dengan `id` yang cocok
    - Panggil `saveToStorage()`, panggil `render()`
    - _Requirements: 3.2, 6.2_

  - [ ]* 4.4 Tulis property test untuk delete (Property 4)
    - **Property 4: Delete removes the correct transaction**
    - Generate random non-empty array dan pilih random id dari dalamnya
    - Verifikasi setelah `deleteTransaction(id)`, tidak ada elemen dengan id tersebut, dan semua elemen lain tetap ada dan tidak berubah
    - **Validates: Requirements 3.2**

- [ ] 5. Checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

- [ ] 6. Implementasi Render Functions
  - [ ] 6.1 Implementasi `renderBalance(txns)`
    - Hitung sum dari semua `amount` values, format ke 2 desimal
    - Update text content `#balance-display`
    - Tampilkan `Rp 0` jika array kosong
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.2 Tulis property test untuk balance calculation (Property 5)
    - **Property 5: Balance equals sum of all amounts**
    - Generate random transaction arrays (termasuk empty array)
    - Verifikasi nilai balance yang dihitung sama dengan `array.reduce((sum, t) => sum + t.amount, 0)`
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ] 6.3 Implementasi `renderList(txns)`
    - Rebuild `#transaction-list` DOM: render satu `<li>` per transaction dengan item name, formatted amount, category, dan delete button (dengan `data-id` attribute)
    - Tampilkan empty-state `<p>` jika array kosong
    - _Requirements: 2.1, 2.2, 2.4, 3.1_

  - [ ]* 6.4 Tulis property test untuk list rendering fidelity (Property 3)
    - **Property 3: List rendering fidelity**
    - Generate random arrays of valid transactions
    - Verifikasi `renderList()` menghasilkan tepat sebanyak transactions `<li>` elements, masing-masing berisi name/amount/category dan delete control
    - **Validates: Requirements 2.1, 2.2, 3.1**

  - [ ] 6.5 Implementasi `renderChart(txns)` dan inisialisasi Chart.js
    - Inisialisasi single `Chart` instance di `init()` dan simpan di `chartInstance`
    - `renderChart(txns)`: hitung `aggregateByCategory(txns)` → `[sumFood, sumTransport, sumFun]`, mutasi `chartInstance.data.datasets[0].data`, panggil `chartInstance.update()`
    - Toggle visibility `#spending-chart` dan `#chart-empty-label` berdasarkan `txns.length`
    - Tangani kasus Chart.js tidak tersedia (CDN offline): sembunyikan `#chart-section`, tampilkan fallback message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 6.6 Tulis property test untuk pie chart data aggregation (Property 7)
    - **Property 7: Pie chart data matches category aggregation**
    - Generate random transaction arrays dengan varying category distributions
    - Verifikasi data array yang dikirim ke Chart.js instance sama dengan `[sumOf("Food"), sumOf("Transport"), sumOf("Fun")]`
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ] 6.7 Implementasi `render()` orchestrator
    - Panggil `renderList(transactions)`, `renderBalance(transactions)`, `renderChart(transactions)`, `renderMonthlySummary(transactions)` secara berurutan
    - _Requirements: 1.3, 3.3, 4.2, 4.3, 5.2, 5.3_

- [ ] 7. Implementasi Event Handlers dan Init
  - [ ] 7.1 Implementasi form submit handler
    - Attach listener ke `#transaction-form` submit event
    - Baca nilai dari `#item-name`, `#amount`, `#category`
    - Panggil `validateForm()`: jika invalid, tampilkan inline error messages di `<span class="field-error">` yang sesuai dan stop; jika valid, clear errors, panggil `addTransaction()`, reset form fields
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ] 7.2 Implementasi delete button event delegation
    - Attach single click listener ke `#transaction-list` (event delegation)
    - Jika target memiliki `data-id` attribute, panggil `deleteTransaction(id)`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 7.3 Implementasi `init()` dan DOMContentLoaded
    - `init()`: panggil `loadFromStorage()` untuk populate `transactions`, inisialisasi Chart.js instance, panggil `render()`
    - Attach `init` ke `DOMContentLoaded` event
    - _Requirements: 6.3, 6.4_

- [ ] 8. Implementasi CSS dan Responsive Layout
  - Tulis CSS untuk mobile-first responsive layout yang bekerja dari 320px hingga 1920px tanpa horizontal scrolling
  - Pastikan font size minimum 14px untuk body text dan touch target minimum 44×44px untuk interactive elements (button, select)
  - Styling untuk: app container, header/balance display, form fields dan validation errors, transaction list items, chart section, storage warning banner, empty state
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9. Tulis unit tests untuk edge cases dan error conditions
  - [ ]* 9.1 Tulis unit tests untuk form validation
    - Test: empty name, zero amount, negative amount, invalid category, all-whitespace name
    - _Requirements: 1.4, 1.5_

  - [ ]* 9.2 Tulis unit tests untuk empty state
    - Test: list menampilkan empty message, balance menampilkan 0, chart menampilkan empty label
    - _Requirements: 2.4, 4.4, 5.5_

  - [ ]* 9.3 Tulis unit tests untuk LocalStorage error handling
    - Test: `SecurityError` memicu warning banner dan session-only mode
    - Test: malformed JSON menyebabkan app load dengan empty state dan menampilkan warning
    - _Requirements: 6.4_

- [ ] 10. Final Checkpoint — Pastikan semua tests lulus
  - Pastikan semua tests lulus, tanyakan ke user jika ada pertanyaan.

- [ ] 11. Implementasi Dark/Light Mode Toggle (Fitur A)
  - [ ] 11.1 Update HTML — tambahkan theme toggle button di header
    - Tambahkan `<button id="theme-toggle">` di dalam `<header>` dengan ikon 🌙 (default light mode)
    - Tambahkan `aria-label="Toggle dark/light mode"` untuk aksesibilitas
    - _Requirements: 9.1, 9.7_

  - [ ] 11.2 Update app.js — tambahkan Constants, State, Storage untuk theme
    - Tambahkan `THEME_KEY = 'expense_tracker_theme'` di Constants
    - Tambahkan `let currentTheme = 'light'` di State
    - Implementasi `loadTheme()`: baca dari LocalStorage, return `'light'` jika tidak ada
    - Implementasi `saveTheme(theme)`: simpan ke LocalStorage dengan key `THEME_KEY`
    - _Requirements: 9.2, 9.4, 9.5_

  - [ ] 11.3 Update app.js — implementasi `applyTheme(theme)`
    - Toggle class `dark` di `document.body` berdasarkan theme value
    - Update icon/text pada `#theme-toggle` button (🌙 untuk dark, ☀️ untuk light)
    - Update `currentTheme` state variable
    - _Requirements: 9.3, 9.6, 9.7_

  - [ ] 11.4 Update app.js — tambahkan event handler dan update `init()`
    - Attach click listener ke `#theme-toggle` button
    - Handler: toggle antara `'light'` dan `'dark'`, panggil `applyTheme()` dan `saveTheme()`
    - Update `init()`: panggil `loadTheme()` dan `applyTheme()` sebelum `render()`
    - _Requirements: 9.3, 9.4, 9.5_

  - [ ] 11.5 Update style.css — tambahkan CSS custom properties dan dark mode overrides
    - Definisikan CSS custom properties di `:root` untuk light mode colors
    - Tambahkan `body.dark` selector dengan overrides untuk dark mode colors
    - Styling untuk `#theme-toggle` button di header
    - Pastikan semua komponen (header, sections, form, list items, chart) mendukung dark mode
    - _Requirements: 9.6_

  - [ ]* 11.6 Tulis property test untuk theme toggle (Property 9)
    - **Property 9: Theme toggle persists and applies correctly**
    - Verifikasi `saveTheme` + `loadTheme` round-trip untuk `'light'` dan `'dark'`
    - Verifikasi `applyTheme('dark')` menambahkan class `dark` ke `document.body`
    - Verifikasi `applyTheme('light')` menghapus class `dark` dari `document.body`
    - **Validates: Requirements 9.4, 9.5, 9.6**

- [ ] 12. Implementasi Sort Transactions (Fitur B)
  - [ ] 12.1 Update HTML — tambahkan sort control di atas transaction list
    - Tambahkan `<div id="sort-control">` dengan `<label>` dan `<select id="sort-select">` di dalam `#list-section`, sebelum `<ul id="transaction-list">`
    - Options: `value="default"` (Terbaru), `value="amount"` (Jumlah Terbesar), `value="category"` (Kategori A-Z)
    - _Requirements: 10.1, 10.2_

  - [ ] 12.2 Update app.js — tambahkan State dan implementasi `getSortedTransactions()`
    - Tambahkan `let currentSort = 'default'` di State
    - Implementasi `getSortedTransactions(txns, sort)`:
      - `'default'`: sort by `createdAt` descending (terbaru dulu)
      - `'amount'`: sort by `amount` descending (tertinggi dulu)
      - `'category'`: sort by `category` ascending (A-Z)
      - Return sorted copy, jangan mutasi array asli
    - _Requirements: 10.2, 10.4, 10.5_

  - [ ] 12.3 Update `renderList(txns)` — gunakan `getSortedTransactions` sebelum render
    - Di awal `renderList()`, buat sorted copy: `const sorted = getSortedTransactions(txns, currentSort)`
    - Gunakan `sorted` untuk render list items, bukan `txns` langsung
    - _Requirements: 10.3, 10.4, 10.6_

  - [ ] 12.4 Update app.js — tambahkan event handler untuk sort control
    - Attach `change` event listener ke `#sort-select`
    - Handler: update `currentSort` dengan value yang dipilih, panggil `renderList(transactions)`
    - _Requirements: 10.3_

  - [ ] 12.5 Update style.css — styling untuk sort control
    - Styling untuk `#sort-control` container (flex layout, margin bawah)
    - Styling untuk `#sort-select` dropdown (konsisten dengan form select styling)
    - Pastikan dark mode styling juga diterapkan
    - _Requirements: 10.1_

  - [ ]* 12.6 Tulis property test untuk sort (Property 8)
    - **Property 8: Sort does not mutate the transactions array**
    - Generate random transaction arrays dan random sort value
    - Verifikasi `getSortedTransactions(txns, sort)` return array baru dengan elemen yang sama
    - Verifikasi array asli tidak berubah setelah pemanggilan
    - **Validates: Requirements 10.4**

- [ ] 13. Implementasi Monthly Summary View (Fitur C)
  - [ ] 13.1 Update HTML — tambahkan monthly summary section
    - Tambahkan `<section id="monthly-summary-section">` setelah `#chart-section`
    - Di dalamnya: `<h2>Ringkasan Bulanan</h2>` dan `<div id="monthly-summary"></div>`
    - _Requirements: 11.1_

  - [ ] 13.2 Update app.js — implementasi `renderMonthlySummary(txns)`
    - Group transactions by month-year key (format: `YYYY-MM`)
    - Sum amounts per group
    - Sort groups dari terbaru ke terlama
    - Format setiap entry: "April 2026: Rp 150.000,00" (gunakan `toLocaleString('id-ID')` untuk format angka)
    - Render ke `#monthly-summary`: satu `<div class="monthly-item">` per bulan
    - Tampilkan empty-state `<p>` jika tidak ada transaksi
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [ ] 13.3 Update `render()` — tambahkan `renderMonthlySummary(transactions)`
    - Panggil `renderMonthlySummary(transactions)` di dalam `render()` orchestrator
    - _Requirements: 11.6_

  - [ ] 13.4 Update style.css — styling untuk monthly summary section
    - Styling untuk `#monthly-summary-section` (inherits section styles)
    - Styling untuk `.monthly-item` (flex layout, border-bottom separator)
    - Styling untuk `.monthly-month` (font-weight bold) dan `.monthly-amount` (color accent)
    - Pastikan dark mode styling juga diterapkan
    - _Requirements: 11.1, 11.3_

  - [ ]* 13.5 Tulis property test untuk monthly summary (Property 10)
    - **Property 10: Monthly summary totals match per-month aggregation**
    - Generate random transaction arrays dengan varying `createdAt` dates
    - Verifikasi totals yang dirender sama dengan sum per bulan dari data asli
    - Verifikasi urutan dari terbaru ke terlama
    - **Validates: Requirements 11.2, 11.4**

## Notes

- Task yang ditandai `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirements spesifik untuk traceability
- Checkpoint memastikan validasi inkremental di setiap tahap
- Property tests memvalidasi correctness properties universal (P1–P10 dari design.md)
- Unit tests memvalidasi contoh spesifik dan edge cases
- Gunakan fast-check untuk property-based testing (dapat dimuat via CDN atau Node.js)
- Tasks 11, 12, 13 adalah penambahan fitur baru di atas implementasi yang sudah ada
