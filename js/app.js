// --- Constants
const CATEGORIES = ['Food', 'Transport', 'Fun'];
const STORAGE_KEY = 'expense_tracker_transactions';
const THEME_KEY = 'expense_tracker_theme';
const CATEGORY_COLORS = ['#FF6384', '#36A2EB', '#FFCE56'];

// --- State
let transactions = [];
let storageAvailable = true;
let chartInstance = null;
let currentSort = 'default'; // 'default' | 'amount' | 'category'
let currentTheme = 'light';  // 'light' | 'dark'

// --- Storage

/**
 * Loads transactions from LocalStorage.
 * Returns [] and sets storageAvailable = false on any error.
 * @returns {Array} Array of Transaction objects
 */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    storageAvailable = false;
    const warning = document.getElementById('storage-warning');
    if (warning) warning.hidden = false;
    return [];
  }
}

/**
 * Saves transactions array to LocalStorage.
 * Sets storageAvailable = false on any error.
 * @param {Array} txns - Array of Transaction objects
 */
function saveToStorage(txns) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
  } catch (e) {
    storageAvailable = false;
    const warning = document.getElementById('storage-warning');
    if (warning) warning.hidden = false;
  }
}

/**
 * Loads the saved theme preference from LocalStorage.
 * Returns 'light' if no preference is saved or on any error.
 * @returns {string} 'light' or 'dark'
 */
function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  } catch (e) {
    return 'light';
  }
}

/**
 * Saves the theme preference to LocalStorage.
 * Silently ignores errors.
 * @param {string} theme - 'light' or 'dark'
 */
function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // silently ignore — theme is non-critical
  }
}

// --- Validation

/**
 * Validates form inputs.
 * @param {string} name - Item name
 * @param {string} amount - Amount as string
 * @param {string} category - Category string
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateForm(name, amount, category) {
  const errors = {};

  if (!name || name.trim() === '') {
    errors.name = 'Nama item tidak boleh kosong';
  }

  const parsedAmount = parseFloat(amount);
  if (amount === '' || amount === null || amount === undefined || isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Jumlah harus berupa angka positif';
  }

  if (!CATEGORIES.includes(category)) {
    errors.category = 'Pilih kategori terlebih dahulu';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// --- State Mutations

/**
 * Creates a new Transaction and adds it to state.
 * @param {string} name - Item name
 * @param {string|number} amount - Amount value
 * @param {string} category - Category
 * @returns {Object} The created Transaction object
 */
function addTransaction(name, amount, category) {
  const transaction = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Date.now().toString(),
    name: name.trim(),
    amount: parseFloat(amount),
    category,
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);
  saveToStorage(transactions);
  render();

  return transaction;
}

/**
 * Deletes a transaction by id.
 * @param {string} id - Transaction id to remove
 */
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveToStorage(transactions);
  render();
}

// --- Theme

/**
 * Applies the given theme to the document.
 * Toggles the 'dark' class on document.body and updates the toggle button icon.
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  currentTheme = theme;
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

// --- Sort

/**
 * Returns a sorted copy of the transactions array based on the sort value.
 * Does NOT mutate the original array.
 * @param {Array} txns - Array of Transaction objects
 * @param {string} sort - 'default' | 'amount' | 'category'
 * @returns {Array} Sorted copy of the array
 */
function getSortedTransactions(txns, sort) {
  const copy = txns.slice();
  if (sort === 'amount') {
    copy.sort((a, b) => b.amount - a.amount);
  } else if (sort === 'category') {
    copy.sort((a, b) => a.category.localeCompare(b.category));
  } else {
    // default: newest first by createdAt
    copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return copy;
}

// --- Render

/**
 * Calculates sum of amounts per category.
 * @param {Array} txns - Array of Transaction objects
 * @returns {number[]} [sumFood, sumTransport, sumFun]
 */
function aggregateByCategory(txns) {
  return CATEGORIES.map(cat =>
    txns
      .filter(t => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0)
  );
}

/**
 * Updates the balance display element.
 * @param {Array} txns - Array of Transaction objects
 */
function renderBalance(txns) {
  const total = txns.reduce((sum, t) => sum + t.amount, 0);
  const el = document.getElementById('balance-display');
  if (el) {
    el.textContent = 'Total: Rp ' + total.toFixed(2);
  }
}

/**
 * Rebuilds the transaction list DOM, applying the current sort order.
 * @param {Array} txns - Array of Transaction objects
 */
function renderList(txns) {
  const list = document.getElementById('transaction-list');
  if (!list) return;

  // Remove existing empty-state paragraph if present
  const existingEmpty = list.parentElement.querySelector('.empty-state');
  if (existingEmpty) existingEmpty.remove();

  list.innerHTML = '';

  if (txns.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Belum ada transaksi. Tambahkan pengeluaran pertama Anda!';
    list.parentElement.appendChild(empty);
    return;
  }

  // Apply current sort before rendering
  const sorted = getSortedTransactions(txns, currentSort);

  sorted.forEach(txn => {
    const li = document.createElement('li');
    li.className = 'transaction-item';
    li.dataset.id = txn.id;

    const info = document.createElement('div');
    info.className = 'transaction-info';

    const nameEl = document.createElement('span');
    nameEl.className = 'transaction-name';
    nameEl.textContent = txn.name;

    const amountEl = document.createElement('span');
    amountEl.className = 'transaction-amount';
    amountEl.textContent = 'Rp ' + txn.amount.toFixed(2);

    const categoryEl = document.createElement('span');
    categoryEl.className = 'transaction-category category-badge';
    categoryEl.textContent = txn.category;

    info.appendChild(nameEl);
    info.appendChild(amountEl);
    info.appendChild(categoryEl);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = txn.id;
    deleteBtn.setAttribute('aria-label', 'Hapus transaksi ' + txn.name);
    deleteBtn.textContent = '✕';

    li.appendChild(info);
    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}

/**
 * Updates the Chart.js pie chart with current data.
 * @param {Array} txns - Array of Transaction objects
 */
function renderChart(txns) {
  // Fallback: if Chart.js not available, hide chart section
  if (typeof window.Chart === 'undefined') {
    const chartSection = document.getElementById('chart-section');
    if (chartSection) chartSection.hidden = true;
    return;
  }

  if (!chartInstance) return;

  const totals = aggregateByCategory(txns);
  chartInstance.data.datasets[0].data = totals;
  chartInstance.update();

  const canvas = document.getElementById('spending-chart');
  const emptyLabel = document.getElementById('chart-empty-label');

  if (canvas) canvas.hidden = txns.length === 0;
  if (emptyLabel) emptyLabel.hidden = txns.length > 0;
}

/**
 * Renders the monthly summary section.
 * Groups transactions by calendar month-year, sums amounts, and renders sorted newest-first.
 * @param {Array} txns - Array of Transaction objects
 */
function renderMonthlySummary(txns) {
  const container = document.getElementById('monthly-summary');
  if (!container) return;

  container.innerHTML = '';

  if (txns.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Belum ada data untuk ditampilkan.';
    container.appendChild(empty);
    return;
  }

  // Group by YYYY-MM key
  const monthMap = {};
  txns.forEach(txn => {
    const date = new Date(txn.createdAt);
    // Build a sortable key: YYYY-MM
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const key = year + '-' + String(month + 1).padStart(2, '0');
    if (!monthMap[key]) {
      monthMap[key] = { year, month, total: 0 };
    }
    monthMap[key].total += txn.amount;
  });

  // Sort keys newest first
  const sortedKeys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a));

  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  sortedKeys.forEach(key => {
    const { year, month, total } = monthMap[key];
    const label = MONTH_NAMES[month] + ' ' + year;
    const formattedAmount = total.toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const item = document.createElement('div');
    item.className = 'monthly-item';

    const monthEl = document.createElement('span');
    monthEl.className = 'monthly-month';
    monthEl.textContent = label;

    const amountEl = document.createElement('span');
    amountEl.className = 'monthly-amount';
    amountEl.textContent = 'Rp ' + formattedAmount;

    item.appendChild(monthEl);
    item.appendChild(amountEl);
    container.appendChild(item);
  });
}

/**
 * Orchestrates all render functions.
 */
function render() {
  renderList(transactions);
  renderBalance(transactions);
  renderChart(transactions);
  renderMonthlySummary(transactions);
}

// --- Event Handlers

/**
 * Clears all inline field error messages.
 */
function clearErrors() {
  document.getElementById('item-name-error').textContent = '';
  document.getElementById('amount-error').textContent = '';
  document.getElementById('category-error').textContent = '';
}

/**
 * Handles form submit event.
 * @param {Event} e - Submit event
 */
function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('item-name').value;
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;

  clearErrors();

  const result = validateForm(name, amount, category);

  if (!result.valid) {
    if (result.errors.name) {
      document.getElementById('item-name-error').textContent = result.errors.name;
    }
    if (result.errors.amount) {
      document.getElementById('amount-error').textContent = result.errors.amount;
    }
    if (result.errors.category) {
      document.getElementById('category-error').textContent = result.errors.category;
    }
    return;
  }

  addTransaction(name, amount, category);

  // Reset form
  document.getElementById('transaction-form').reset();
}

/**
 * Handles click events on the transaction list (event delegation for delete buttons).
 * @param {Event} e - Click event
 */
function handleListClick(e) {
  const target = e.target.closest('[data-id]');
  if (target && target.classList.contains('delete-btn')) {
    const id = target.dataset.id;
    deleteTransaction(id);
  }
}

/**
 * Handles theme toggle button click.
 */
function handleThemeToggle() {
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  saveTheme(newTheme);
}

/**
 * Handles sort control change event.
 * @param {Event} e - Change event
 */
function handleSortChange(e) {
  currentSort = e.target.value;
  renderList(transactions);
}

// --- Init

/**
 * Initialises the application.
 */
function init() {
  // Load persisted transactions
  transactions = loadFromStorage();

  // Load and apply saved theme
  const savedTheme = loadTheme();
  applyTheme(savedTheme);

  // Initialise Chart.js instance (once)
  if (typeof window.Chart !== 'undefined') {
    const canvas = document.getElementById('spending-chart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      chartInstance = new window.Chart(ctx, {
        type: 'pie',
        data: {
          labels: CATEGORIES,
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: CATEGORY_COLORS
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  } else {
    // Chart.js not available — hide chart section
    const chartSection = document.getElementById('chart-section');
    if (chartSection) chartSection.hidden = true;
  }

  // Attach event handlers
  const form = document.getElementById('transaction-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  const list = document.getElementById('transaction-list');
  if (list) list.addEventListener('click', handleListClick);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) themeToggle.addEventListener('click', handleThemeToggle);

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', handleSortChange);

  // Initial render
  render();
}

document.addEventListener('DOMContentLoaded', init);
