# Requirements Document

## Introduction

Expense & Budget Visualizer is a mobile-friendly web application that allows users to track daily expenses. Users can add transactions with a name, amount, and category; view all recorded transactions; delete entries; monitor their total spending balance; and visualize spending distribution by category via a pie chart. All data is stored client-side using the browser's LocalStorage API. The application is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks, no backend, no build tools required.

## Glossary

- **App**: The Expense & Budget Visualizer web application
- **Transaction**: A single expense entry consisting of an Item Name, Amount, and Category
- **Item Name**: A short text label describing the expense (e.g., "Lunch", "Bus ticket")
- **Amount**: A positive numeric value representing the cost of a transaction in the user's local currency
- **Category**: One of three predefined spending categories: Food, Transport, or Fun
- **Transaction List**: The scrollable list displaying all recorded transactions
- **Balance Display**: The UI element at the top of the App showing the total sum of all transaction amounts
- **Pie Chart**: A visual chart displaying the proportional spending breakdown by Category
- **LocalStorage**: The browser's built-in client-side key-value storage API used to persist transaction data
- **Theme**: The visual color scheme of the App, either light mode or dark mode
- **Sort Order**: The ordering applied to the Transaction List display

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category, so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE App SHALL render an input form containing three fields: Item Name (text input), Amount (numeric input), and Category (dropdown with options: Food, Transport, Fun).
2. THE App SHALL render a submit button that, when activated, attempts to add a new Transaction.
3. WHEN the submit button is activated and all fields are filled with valid values, THE App SHALL add the Transaction to the Transaction List and clear the form fields.
4. WHEN the submit button is activated and one or more fields are empty, THE App SHALL display an inline validation error message indicating which fields are required and SHALL NOT add any Transaction.
5. WHEN the submit button is activated and the Amount field contains a non-positive or non-numeric value, THE App SHALL display a validation error message and SHALL NOT add any Transaction.

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions, so that I can review my recorded expenses.

#### Acceptance Criteria

1. THE App SHALL render a Transaction List that displays all stored Transactions.
2. WHILE Transactions exist in LocalStorage, THE App SHALL display each Transaction as a list item showing its Item Name, Amount, and Category.
3. THE App SHALL render the Transaction List as a scrollable container when the number of items exceeds the visible area.
4. WHEN no Transactions have been recorded, THE App SHALL display an empty-state message indicating that no expenses have been added yet.

### Requirement 3: Delete Transaction

**User Story:** As a user, I want to delete a transaction from the list, so that I can remove incorrect or unwanted entries.

#### Acceptance Criteria

1. THE App SHALL render a delete control (e.g., a button or icon) for each item in the Transaction List.
2. WHEN a delete control is activated for a Transaction, THE App SHALL remove that Transaction from LocalStorage and from the Transaction List.
3. WHEN a Transaction is deleted, THE App SHALL update the Balance Display and the Pie Chart to reflect the removal without requiring a page reload.

### Requirement 4: Total Balance Display

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL render a Balance Display at the top of the page showing the sum of the Amount values of all Transactions.
2. WHEN a new Transaction is added, THE App SHALL update the Balance Display immediately to include the new Amount.
3. WHEN a Transaction is deleted, THE App SHALL update the Balance Display immediately to exclude the deleted Amount.
4. WHILE no Transactions exist, THE App SHALL display a balance of zero in the Balance Display.

### Requirement 5: Spending Distribution Pie Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL render a Pie Chart that shows the spending distribution across all Categories (Food, Transport, Fun).
2. WHEN a Transaction is added, THE App SHALL update the Pie Chart immediately to reflect the new spending distribution.
3. WHEN a Transaction is deleted, THE App SHALL update the Pie Chart immediately to reflect the updated spending distribution.
4. WHILE only one Category has recorded Transactions, THE App SHALL render the Pie Chart showing a single segment for that Category.
5. WHILE no Transactions exist, THE App SHALL render the Pie Chart in an empty or placeholder state with a descriptive label.

### Requirement 6: Data Persistence with LocalStorage

**User Story:** As a user, I want my transactions to persist across browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL save it to LocalStorage immediately.
2. WHEN a Transaction is deleted, THE App SHALL remove it from LocalStorage immediately.
3. WHEN the App is loaded or refreshed, THE App SHALL read all Transactions from LocalStorage and render them in the Transaction List, Balance Display, and Pie Chart.
4. IF LocalStorage is unavailable or returns a parse error, THEN THE App SHALL display a warning message and operate in a session-only mode without persisting data.

### Requirement 7: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on both mobile and desktop screens, so that I can track expenses from any device.

#### Acceptance Criteria

1. THE App SHALL render a responsive layout that adapts to viewport widths from 320px to 1920px without horizontal scrolling.
2. THE App SHALL use readable font sizes (minimum 14px for body text) and sufficient touch target sizes (minimum 44×44px for interactive elements) on mobile viewports.
3. THE App SHALL load and render fully in modern browsers: Chrome, Firefox, Edge, and Safari, without requiring plugins or extensions.

### Requirement 8: Performance and Load Time

**User Story:** As a user, I want the app to load quickly and respond without noticeable lag, so that my experience is smooth and efficient.

#### Acceptance Criteria

1. THE App SHALL load and become fully interactive within 3 seconds on a standard broadband connection.
2. WHEN a Transaction is added or deleted, THE App SHALL update the Transaction List, Balance Display, and Pie Chart within 100ms of the user action.
3. THE App SHALL operate as a self-contained set of static files (HTML, CSS, JavaScript) requiring no server-side runtime or build step to run.

### Requirement 9: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between dark mode and light mode, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL render a theme toggle button in the header that allows the user to switch between light mode and dark mode.
2. THE App SHALL default to light mode on first load when no theme preference has been saved.
3. WHEN the theme toggle button is activated, THE App SHALL switch the active theme and update the visual appearance of all UI components immediately.
4. WHEN the theme is changed, THE App SHALL save the user's theme preference to LocalStorage under the key `expense_tracker_theme`.
5. WHEN the App is loaded or refreshed, THE App SHALL read the saved theme preference from LocalStorage and apply it before rendering any content.
6. THE App SHALL use CSS custom properties (variables) for theming, toggling a `dark` class on `<body>` to switch between light and dark color schemes.
7. THE App SHALL update the theme toggle button's icon or label to reflect the currently active theme (e.g., 🌙 for dark mode, ☀️ for light mode).

### Requirement 10: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by different criteria, so that I can find and review transactions more easily.

#### Acceptance Criteria

1. THE App SHALL render a sort control (dropdown or buttons) above the Transaction List.
2. THE App SHALL provide three sort options: Default (newest first, by `createdAt` descending), Amount (highest first, descending), and Category (A–Z, ascending).
3. WHEN a sort option is selected, THE App SHALL re-render the Transaction List in the selected order immediately.
4. THE sort operation SHALL only affect the display order of the Transaction List and SHALL NOT modify the order of transactions in the underlying `transactions` array or in LocalStorage.
5. THE App SHALL store the current sort selection in a module-level variable `let currentSort = 'default'`.
6. WHEN a new Transaction is added or deleted, THE App SHALL re-render the Transaction List using the currently active sort order.

### Requirement 11: Monthly Summary View

**User Story:** As a user, I want to see a summary of my spending grouped by month, so that I can track how my expenses change over time.

#### Acceptance Criteria

1. THE App SHALL render a "Ringkasan Bulanan" (Monthly Summary) section below the Pie Chart section.
2. THE App SHALL display the total spending per calendar month across all recorded Transactions.
3. EACH month entry SHALL be displayed in a human-readable format showing the month name, year, and total amount (e.g., "April 2026: Rp 150.000,00").
4. THE monthly entries SHALL be ordered from the most recent month to the oldest.
5. WHEN no Transactions exist, THE App SHALL display an empty-state message in the Monthly Summary section.
6. WHEN a Transaction is added or deleted, THE App SHALL update the Monthly Summary section immediately to reflect the change.
