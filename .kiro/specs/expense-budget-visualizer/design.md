# Design Document

## Expense & Budget Visualizer

---

## Overview

The Expense & Budget Visualizer is a fully client-side, single-page web application delivered as a set of static files (one HTML, one CSS, one JavaScript file). It runs entirely in the browser with no server-side runtime, build tools, or frameworks required.

The application allows users to:
- Record expense transactions (item name, amount, category)
- View and delete transactions from a scrollable list
- Monitor total spending via a live Balance Display
- Visualise spending distribution by category via an interactive Pie Chart
- Persist all data across sessions using the browser's LocalStorage API
- Toggle between dark mode and light mode, with preference persisted to LocalStorage
- Sort the Transaction List by default order, amount, or category
- View a Monthly Summary of spending grouped by calendar month

The primary design goals are simplicity, correctness, and mobile-first responsiveness. All state lives in a single in-memory array that is mirrored to LocalStorage on every mutation, and all UI components are re-rendered from that array after every state change.

---

## Architecture

### High-Level Structure

```
┌────────────────────────────────────┐
│           index.html               │
│  Markup skeleton + CDN script tag  │
│  for Chart.js 4.5.x                │
└────────────┬───────────────────────┘
             │ loads
┌────────────▼───────────────────────┐
│             app.js                 │
│                                    │
│  ┌──────────┐   ┌────────────────┐ │
│  │  State   │◄──│  StorageService│ │
│  │ (Array)  │   │ (LocalStorage) │ │
│  └────┬─────┘   └────────────────┘ │
│       │ triggers                   │
│  ┌────▼─────────────────────────┐  │
│  │         render()             │  │
│  │  ┌───────────┐ ┌──────────┐  │  │
│  │  │ renderList│ │renderChart│  │  │
│  │  └───────────┘ └──────────┘  │  │
│  │  ┌──────────────────────────┐ │  │
│  │  │   renderBalance          │ │  │
│  │  └──────────────────────────┘ │  │
│  │  ┌──────────────────────────┐ │  │
│  │  │  renderMonthlySummary    │ │  │
│  │  └──────────────────────────┘ │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

### Data Flow

Every user action follows the same cycle:

```
User Action
    │
    ▼
validateInput()  ──► (error) ──► show inline error, stop
    │ (valid)
    ▼
mutateState()   (add or remove from the in-memory array)
    │
    ▼
persistToStorage()  (JSON.stringify → localStorage.setItem)
    │
    ▼
render()  (re-renders List, Balance, Pie Chart, Monthly Summary from state)
```

This unidirectional flow makes it easy to reason about correctness — the UI is always a pure function of the current state array.

### Module Layout

All JavaScript lives in a single `app.js` file, organised into logical sections using comments:

| Section | Responsibility |
|---|---|
| `// --- Constants` | Category names, LocalStorage keys, colours |
| `// --- State` | In-memory `transactions` array, `currentSort`, `currentTheme` |
| `// --- Storage` | `loadFromStorage()`, `saveToStorage()`, `loadTheme()`, `saveTheme()` |
| `// --- Validation` | `validateForm()` |
| `// --- State Mutations` | `addTransaction()`, `deleteTransaction()` |
| `// --- Theme` | `applyTheme()` |
| `// --- Sort` | `getSortedTransactions()` |
| `// --- Render` | `renderList()`, `renderBalance()`, `renderChart()`, `renderMonthlySummary()`, `render()` |
| `// --- Event Handlers` | Form submit, delete button delegation, theme toggle, sort control |
| `// --- Init` | `init()` called on `DOMContentLoaded` |

---

## Components and Interfaces

### HTML Structure (`index.html`)

```
<body>
  <div class="app-container">
    <!-- Header / Balance -->
    <header>
      <h1>Expense Tracker</h1>
      <div id="balance-display">Total: Rp 0</div>
      <button id="theme-toggle" aria-label="Toggle dark/light mode">🌙</button>
    </header>

    <!-- Storage warning banner (hidden by default) -->
    <div id="storage-warning" hidden>
      Peringatan: data tidak dapat disimpan di sesi ini.
    </div>

    <!-- Input Form -->
    <section id="form-section">
      <form id="transaction-form" novalidate>
        <div class="field-group">
          <label for="item-name">Nama Item</label>
          <input id="item-name" type="text" autocomplete="off" />
          <span class="field-error" id="item-name-error" aria-live="polite"></span>
        </div>
        <div class="field-group">
          <label for="amount">Jumlah (Rp)</label>
          <input id="amount" type="number" min="0.01" step="any" />
          <span class="field-error" id="amount-error" aria-live="polite"></span>
        </div>
        <div class="field-group">
          <label for="category">Kategori</label>
          <select id="category">
            <option value="">-- Pilih Kategori --</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Fun">Fun</option>
          </select>
          <span class="field-error" id="category-error" aria-live="polite"></span>
        </div>
        <button type="submit" id="add-btn">Tambah</button>
      </form>
    </section>

    <!-- Transaction List -->
    <section id="list-section">
      <h2>Daftar Transaksi</h2>
      <div id="sort-control">
        <label for="sort-select">Urutkan:</label>
        <select id="sort-select">
          <option value="default">Terbaru</option>
          <option value="amount">Jumlah Terbesar</option>
          <option value="category">Kategori (A-Z)</option>
        </select>
      </div>
      <ul id="transaction-list"></ul>
      <!-- empty-state injected by JS when list is empty -->
    </section>

    <!-- Pie Chart -->
    <section id="chart-section">
      <h2>Distribusi Pengeluaran</h2>
      <div id="chart-wrapper">
        <canvas id="spending-chart"></canvas>
        <p id="chart-empty-label" hidden>Belum ada data untuk ditampilkan.</p>
      </div>
    </section>

    <!-- Monthly Summary -->
    <section id="monthly-summary-section">
      <h2>Ringkasan Bulanan</h2>
      <div id="monthly-summary"></div>
    </section>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.min.js"></script>
  <script src="app.js"></script>
</body>
```

> Chart.js is loaded via [jsDelivr CDN](https://www.jsdelivr.com/package/npm/chart.js) (UMD build) before `app.js` so the global `Chart` constructor is available.

### JavaScript Public API (internal module boundary)

| Function | Signature | Description |
|---|---|---|
| `loadFromStorage()` | `() → Transaction[]` | Reads and parses from LocalStorage; returns `[]` on error |
| `saveToStorage(txns)` | `(Transaction[]) → void` | Serialises array to LocalStorage; sets `storageAvailable = false` on failure |
| `loadTheme()` | `() → string` | Reads saved theme from LocalStorage; returns `'light'` if not set |
| `saveTheme(theme)` | `(string) → void` | Saves theme preference to LocalStorage under `THEME_KEY` |
| `validateForm(name, amount, category)` | `(string, string, string) → ValidationResult` | Returns `{ valid: boolean, errors: {field: string} }` |
| `addTransaction(name, amount, category)` | `(string, number, string) → Transaction` | Creates Transaction object, pushes to state, persists, renders |
| `deleteTransaction(id)` | `(string) → void` | Removes from state by id, persists, renders |
| `applyTheme(theme)` | `(string) → void` | Toggles `dark` class on `document.body`; updates toggle button icon |
| `getSortedTransactions(txns, sort)` | `(Transaction[], string) → Transaction[]` | Returns a sorted copy of the array without mutating the original |
| `render()` | `() → void` | Calls renderList + renderBalance + renderChart + renderMonthlySummary |
| `renderList(txns)` | `(Transaction[]) → void` | Applies sort via `getSortedTransactions`, rebuilds `#transaction-list` DOM |
| `renderBalance(txns)` | `(Transaction[]) → void` | Updates `#balance-display` text |
| `renderChart(txns)` | `(Transaction[]) → void` | Updates Chart.js instance with new data |
| `renderMonthlySummary(txns)` | `(Transaction[]) → void` | Groups transactions by month-year, renders totals to `#monthly-summary` |

### Chart.js Integration

A single `Chart` instance is created during `init()` and kept in a module-level variable `chartInstance`. On every `renderChart()` call, the existing instance's `.data` is mutated and `.update()` is called — the instance is **never destroyed and re-created**, which avoids a known Chart.js "canvas is already in use" warning.

```javascript
// Initialisation (once)
const ctx = document.getElementById('spending-chart').getContext('2d');
chartInstance = new Chart(ctx, {
  type: 'pie',
  data: { labels: CATEGORIES, datasets: [{ data: [0, 0, 0], backgroundColor: CATEGORY_COLORS }] },
  options: {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  }
});

// Update (on every render)
function renderChart(txns) {
  const totals = aggregateByCategory(txns);
  chartInstance.data.datasets[0].data = totals;
  chartInstance.update();
  document.getElementById('chart-empty-label').hidden = txns.length > 0;
  document.getElementById('spending-chart').hidden = txns.length === 0;
}
```

---

## Data Models

### Transaction

A Transaction is the core data entity. It is a plain JavaScript object:

```javascript
{
  id: string,        // crypto.randomUUID() or Date.now().toString() fallback
  name: string,      // Item name; trimmed, non-empty
  amount: number,    // Positive float; e.g. 15000.0
  category: string,  // One of: "Food" | "Transport" | "Fun"
  createdAt: string  // ISO 8601 timestamp; e.g. "2025-07-14T08:30:00.000Z"
}
```

The `id` field is used as the stable key for delete operations and as the `data-id` attribute on list item DOM nodes.

### State

```javascript
// Module-level mutable state
let transactions = [];          // Array<Transaction>
let storageAvailable = true;    // boolean flag
let chartInstance = null;       // Chart.js Chart instance
let currentSort = 'default';    // 'default' | 'amount' | 'category'
let currentTheme = 'light';     // 'light' | 'dark'
```

### LocalStorage Schema

| Key | Value |
|---|---|
| `"expense_tracker_transactions"` | `JSON.stringify(Transaction[])` |
| `"expense_tracker_theme"` | `"light"` or `"dark"` |

The entire transactions array is stored under a single key. On `loadFromStorage()`, the value is parsed inside a `try/catch`; if it throws (malformed JSON) or if `window.localStorage` access throws a `SecurityError`, the app falls back to an empty array and sets `storageAvailable = false`.

The theme preference is stored as a plain string under `THEME_KEY`. On `loadTheme()`, if the key is absent or access fails, the default `'light'` is returned.

### ValidationResult

```javascript
{
  valid: boolean,
  errors: {
    name?: string,      // e.g. "Nama item tidak boleh kosong"
    amount?: string,    // e.g. "Jumlah harus berupa angka positif"
    category?: string   // e.g. "Pilih kategori terlebih dahulu"
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid transaction always appears in the list

*For any* valid combination of item name (non-empty, non-whitespace string), positive numeric amount, and a valid category (`"Food"`, `"Transport"`, or `"Fun"`), after calling `addTransaction()`, the resulting `transactions` array SHALL contain exactly one more element than before, and that element SHALL have the provided name, amount, and category.

**Validates: Requirements 1.3**

---

### Property 2: Invalid inputs are always rejected

*For any* combination of inputs where at least one of the following is true — the name is empty or whitespace-only, the amount is zero or negative or non-numeric, or the category is not one of the three valid values — `validateForm()` SHALL return `{ valid: false }` and the `transactions` array SHALL remain unchanged in length and content.

**Validates: Requirements 1.4, 1.5**

---

### Property 3: List rendering fidelity

*For any* `transactions` array, calling `renderList()` SHALL produce exactly as many `<li>` elements as there are transactions, each `<li>` SHALL contain the transaction's item name, formatted amount, and category, and each `<li>` SHALL contain a delete control element.

**Validates: Requirements 2.1, 2.2, 3.1**

---

### Property 4: Delete removes the correct transaction

*For any* non-empty `transactions` array and any transaction `id` that exists within it, after calling `deleteTransaction(id)`, no element with that `id` SHALL remain in the `transactions` array, and all other transactions SHALL be present and unchanged.

**Validates: Requirements 3.2**

---

### Property 5: Balance equals sum of all amounts

*For any* `transactions` array (including the empty array), the numeric value computed for the Balance Display SHALL equal the arithmetic sum of all `amount` values in the array (and SHALL equal zero when the array is empty).

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

---

### Property 6: LocalStorage round-trip preserves transactions

*For any* array of valid Transaction objects, serialising with `saveToStorage()` and then deserialising with `loadFromStorage()` SHALL produce an array that is deeply equal to the original — preserving all fields (`id`, `name`, `amount`, `category`, `createdAt`) for every element.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 7: Pie chart data matches category aggregation

*For any* `transactions` array, the data array fed to the Chart.js instance by `renderChart()` SHALL equal `[sumOf("Food"), sumOf("Transport"), sumOf("Fun")]` where each element is the sum of `amount` values for transactions in that category (0 if no transactions exist for that category).

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

---

### Property 8: Sort does not mutate the transactions array

*For any* `transactions` array and any valid sort value (`'default'`, `'amount'`, `'category'`), calling `getSortedTransactions(txns, sort)` SHALL return a new array containing the same elements as the input, and the original `transactions` array SHALL remain unchanged in order and content.

**Validates: Requirements 10.4**

---

### Property 9: Theme toggle persists and applies correctly

*For any* theme value (`'light'` or `'dark'`), calling `saveTheme(theme)` followed by `loadTheme()` SHALL return the same theme value. Additionally, calling `applyTheme('dark')` SHALL add the `dark` class to `document.body`, and calling `applyTheme('light')` SHALL remove the `dark` class from `document.body`.

**Validates: Requirements 9.4, 9.5, 9.6**

---

### Property 10: Monthly summary totals match per-month aggregation

*For any* `transactions` array, the totals rendered by `renderMonthlySummary()` SHALL equal the sum of `amount` values for all transactions sharing the same calendar month and year, and the entries SHALL be ordered from the most recent month to the oldest.

**Validates: Requirements 11.2, 11.4**

---

## Error Handling

### LocalStorage Unavailability

Some browsers block LocalStorage in private/incognito mode or when third-party cookies are disabled. Access to `window.localStorage` can throw a `SecurityError`. Additionally, stored JSON may become corrupted.

**Strategy:**
- Wrap all LocalStorage access in `try/catch`
- On any error during `loadFromStorage()`: return `[]`, set `storageAvailable = false`, show `#storage-warning` banner
- On any error during `saveToStorage()`: set `storageAvailable = false`, show `#storage-warning` banner
- Theme storage errors are silently ignored — the app defaults to light mode
- The app continues to function fully for the current session (in-memory only)

### Form Validation Errors

- Inline error messages are rendered in `<span class="field-error">` elements adjacent to each input
- Errors are cleared before each validation pass
- `aria-live="polite"` on error spans ensures screen readers announce validation errors
- The form is submitted with `novalidate` to allow custom validation messages in the user's language

### Chart.js Unavailability

If the CDN is unreachable (offline scenario), `window.Chart` will be `undefined`. The `init()` function checks for this:
- If `Chart` is not defined: hide `#chart-section`, show a fallback message, and continue without charting

### Edge Cases

| Case | Behaviour |
|---|---|
| Empty transaction list | Show empty-state `<p>` in list; show `#chart-empty-label`; show `Rp 0` balance; show empty-state in monthly summary |
| Single category | Pie chart renders a single full-circle segment |
| Very large amounts | JavaScript `Number` (IEEE 754 double) handles up to ~9 quadrillion without precision loss for typical currency values |
| Amount with many decimals | `validateForm` accepts any positive number; `renderBalance` formats to 2 decimal places |
| Duplicate item names | Allowed — uniqueness is enforced by `id`, not `name` |
| Sort with equal values | Stable sort order maintained; ties broken by original array order |
| Transactions spanning many months | Monthly summary scrolls within its container |

---

## Testing Strategy

### Approach

This feature uses a **dual testing approach**:
- **Unit / example-based tests** for specific behaviours, edge cases, and error conditions
- **Property-based tests** for universal correctness properties (listed above)

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, no build tools required — can be loaded via CDN in a test HTML file, or used with Node.js + a test runner).

**Configuration**: Minimum 100 iterations per property test.

**Tag format per test**: `// Feature: expense-budget-visualizer, Property N: <property_text>`

Each correctness property maps to exactly one property-based test:

| Property | Test focus | Arbitraries |
|---|---|---|
| P1: Valid transaction in list | `addTransaction` adds correct element | `fc.string({ minLength: 1 })`, `fc.float({ min: 0.01 })`, `fc.constantFrom(...CATEGORIES)` |
| P2: Invalid inputs rejected | `validateForm` returns `valid: false` | Empty strings, whitespace strings, zero/negative numbers, invalid category strings |
| P3: List rendering fidelity | `renderList` produces correct DOM count, content, and delete controls | Random arrays of valid transactions |
| P4: Delete removes correct item | `deleteTransaction` removes only the target | Random arrays (minLength 1) + random id selection |
| P5: Balance equals sum | Balance calculation equals `array.reduce(sum)` | Random arrays of transactions including empty array |
| P6: LocalStorage round-trip | `saveToStorage` + `loadFromStorage` deep-equal | Random arrays of valid transactions |
| P7: Pie chart data = aggregation | Chart data array equals per-category sums | Random arrays with varying category distributions |
| P8: Sort does not mutate array | `getSortedTransactions` returns new array, original unchanged | Random arrays + random sort value |
| P9: Theme toggle persists and applies | `saveTheme` + `loadTheme` round-trip; `applyTheme` toggles class | `fc.constantFrom('light', 'dark')` |
| P10: Monthly summary totals match | `renderMonthlySummary` totals equal per-month sums, ordered newest first | Random arrays with varying `createdAt` dates |

### Unit / Example-Based Tests

- **Form validation**: empty name, zero amount, negative amount, invalid category, all-whitespace name
- **Empty state**: list shows empty message, balance shows 0, chart shows empty label
- **Delete**: removing the only item leaves an empty list
- **LocalStorage error**: `SecurityError` triggers warning banner and session-only mode
- **LocalStorage corrupt JSON**: app loads with empty state and shows warning
- **Chart.js absent**: chart section hidden, app still functional
- **Sort**: default sort orders by `createdAt` desc; amount sort orders by amount desc; category sort orders A-Z
- **Theme**: dark class toggled correctly; toggle button icon updates
- **Monthly summary**: correct grouping and formatting; empty state when no transactions

### Browser Compatibility Testing

Manual smoke tests in Chrome, Firefox, Edge, and Safari to verify:
- Rendering correctness
- LocalStorage read/write
- Chart.js pie chart display
- Touch targets and responsive layout at 320px and 1920px viewport widths
- Dark mode and light mode visual consistency
