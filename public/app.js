// State management
let currentTab = 'dashboard';
let currentTable = 'Equipment';
let schemaData = {};
let lookupOptions = { members: [], equipment: [], trainers: [] };
let activeTableRecords = [];
let editingRecordId = null;
let deletingRecordId = null;
let allQueries = [];

// Table mapping from tab ID to SQL table name
const TAB_TO_TABLE = {
  'equipment': 'Equipment',
  'member': 'Member',
  'trainer': 'Trainer',
  'maintenance': 'Maintenance',
  'usage': 'Equipment_Usage',
  'payment': 'Payment'
};

const TABLE_TITLES = {
  'Equipment': { title: 'Gym Equipment Inventory', desc: 'Browse, register, inspect and maintain gym machines and workout gear' },
  'Member': { title: 'Gym Member Directory', desc: 'Manage member accounts, subscription plans and contact information' },
  'Trainer': { title: 'Fitness Trainers & Instructors', desc: 'Manage gym trainers, specializations and experience levels' },
  'Maintenance': { title: 'Equipment Maintenance Logs', desc: 'Track maintenance services, costs, technicians and repairs' },
  'Equipment_Usage': { title: 'Daily Workout & Machine Usage', desc: 'Monitor member workout sessions, machine usage and trainer guidance' },
  'Payment': { title: 'Membership Fees & Billing Transactions', desc: 'Manage membership payments, transaction methods and pending dues' }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  await loadSchema();
  await loadLookupOptions();
  await refreshDashboard();
  await loadPresetQueries();
});

// Toast notification helper
function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : ''}`;
  toast.innerHTML = `<span>${isError ? '❌' : '✅'}</span> <div>${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Navigation handler
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      navigateToTab(tabId);
    });
  });
}

function navigateToTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
  if (activeNavItem) activeNavItem.classList.add('active');

  // Hide all panes
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

  const addRecordBtn = document.getElementById('btn-add-record');
  const tabTitle = document.getElementById('current-tab-title');
  const tabDesc = document.getElementById('current-tab-desc');

  if (tabId === 'dashboard') {
    document.getElementById('tab-dashboard').classList.add('active');
    addRecordBtn.style.display = 'none';
    tabTitle.textContent = 'Dashboard Overview';
    tabDesc.textContent = 'High-level operational metrics and quick system overview';
    refreshDashboard();
  } else if (tabId === 'queries') {
    document.getElementById('tab-queries').classList.add('active');
    addRecordBtn.style.display = 'none';
    tabTitle.textContent = '10 DBMS Queries (SQL)';
    tabDesc.textContent = 'Pre-configured analytical queries using Joins, Group By, Views & Subqueries';
  } else if (tabId === 'console') {
    document.getElementById('tab-console').classList.add('active');
    addRecordBtn.style.display = 'none';
    tabTitle.textContent = 'Interactive SQL Query Console';
    tabDesc.textContent = 'Execute custom SQL commands directly against the SQLite database';
  } else if (tabId === 'report') {
    document.getElementById('tab-report').classList.add('active');
    addRecordBtn.style.display = 'none';
    tabTitle.textContent = 'DA-2 Academic Project Report';
    tabDesc.textContent = 'Complete system report, relational model, queries & PL/SQL implementation';
  } else if (TAB_TO_TABLE[tabId]) {
    // It is a data table tab
    currentTable = TAB_TO_TABLE[tabId];
    document.getElementById('tab-table-view').classList.add('active');
    addRecordBtn.style.display = 'inline-flex';
    addRecordBtn.innerHTML = `<span>➕</span> Add ${currentTable.replace('_', ' ')}`;

    const info = TABLE_TITLES[currentTable];
    tabTitle.textContent = info.title;
    tabDesc.textContent = info.desc;
    document.getElementById('table-display-name').textContent = `${currentTable.replace('_', ' ')} Records`;

    document.getElementById('table-search-input').value = '';
    loadTableData(currentTable);
  }
}

// Event Listeners setup
function setupEventListeners() {
  // Reset DB
  document.getElementById('btn-reset-db').addEventListener('click', async () => {
    if (confirm('Are you sure you want to restore the initial DA-1 sample database? Any new records will be reset.')) {
      try {
        const res = await fetch('/api/reset', { method: 'POST' });
        const data = await res.json();
        showToast(data.message || 'Database reset successfully');
        await loadLookupOptions();
        await refreshDashboard();
        if (TAB_TO_TABLE[currentTab]) {
          loadTableData(currentTable);
        }
      } catch (err) {
        showToast('Failed to reset database: ' + err.message, true);
      }
    }
  });

  // Add Record Button
  document.getElementById('btn-add-record').addEventListener('click', () => {
    openAddModal(currentTable);
  });

  // Modal close buttons
  document.getElementById('modal-close-x').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

  // Modal Form Submission
  document.getElementById('crud-form').addEventListener('submit', handleFormSubmit);

  // Delete modal confirm button
  document.getElementById('btn-confirm-delete').addEventListener('click', executeDelete);

  // Table search input
  document.getElementById('table-search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    filterTableRows(q);
  });

  // Console Run Button
  document.getElementById('btn-run-console-query').addEventListener('click', executeConsoleQuery);
}

// Load Schema
async function loadSchema() {
  try {
    const res = await fetch('/api/schema');
    schemaData = await res.json();
  } catch (err) {
    console.error('Error fetching schema:', err);
  }
}

// Load Lookup options
async function loadLookupOptions() {
  try {
    const res = await fetch('/api/lookup-options');
    lookupOptions = await res.json();
  } catch (err) {
    console.error('Error fetching lookup options:', err);
  }
}

// Refresh Dashboard Stats
async function refreshDashboard() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();

    document.getElementById('stat-members').textContent = data.totalMembers;
    document.getElementById('stat-equipment').textContent = data.totalEquipment;
    document.getElementById('stat-maintenance').textContent = data.equipmentUnderMaintenance;
    document.getElementById('stat-trainers').textContent = data.totalTrainers;
    document.getElementById('stat-revenue').textContent = `₹${data.totalRevenue.toLocaleString()}`;

    // Update badges in sidebar
    if (document.getElementById('badge-equipment')) document.getElementById('badge-equipment').textContent = data.totalEquipment;
    if (document.getElementById('badge-member')) document.getElementById('badge-member').textContent = data.totalMembers;
    if (document.getElementById('badge-trainer')) document.getElementById('badge-trainer').textContent = data.totalTrainers;
    if (document.getElementById('badge-maintenance')) document.getElementById('badge-maintenance').textContent = data.equipmentUnderMaintenance;

    // Load recent members table on dashboard
    const membersRes = await fetch('/api/tables/Member');
    const members = await membersRes.json();
    const tbody = document.querySelector('#dashboard-members-table tbody');
    tbody.innerHTML = '';
    members.slice(0, 5).forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong style="color: var(--accent-cyan);">${m.Member_ID}</strong></td>
        <td><strong>${m.Member_Name}</strong></td>
        <td>${m.Age}</td>
        <td>${m.Gender}</td>
        <td>${m.Phone}</td>
        <td>${renderBadge(m.Membership_Type)}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// Load Table Data
async function loadTableData(tableName) {
  try {
    const res = await fetch(`/api/tables/${tableName}`);
    const rows = await res.json();
    activeTableRecords = rows;
    renderTable(tableName, rows);
    document.getElementById('table-record-count').textContent = `${rows.length} Records`;
  } catch (err) {
    showToast('Failed to load ' + tableName + ': ' + err.message, true);
  }
}

// Render dynamic table
function renderTable(tableName, rows) {
  const thead = document.getElementById('active-table-head');
  const tbody = document.getElementById('active-table-body');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted);">No records found in ${tableName}. Click "Add Record" to insert one.</td></tr>`;
    return;
  }

  const columns = Object.keys(rows[0]);
  const pkCol = schemaData[tableName]?.pk || columns[0];

  // Build Head
  const headerTr = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.replace(/_/g, ' ');
    headerTr.appendChild(th);
  });
  const actionTh = document.createElement('th');
  actionTh.textContent = 'Actions';
  actionTh.style.textAlign = 'right';
  headerTr.appendChild(actionTh);
  thead.appendChild(headerTr);

  // Build Body
  rows.forEach(row => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      const val = row[col];
      if (col === pkCol) {
        td.innerHTML = `<strong style="color: var(--accent-cyan); font-family: var(--font-mono);">${val}</strong>`;
      } else if (['Status', 'Condition', 'Membership_Type', 'Payment_Status'].includes(col)) {
        td.innerHTML = renderBadge(val);
      } else if (col === 'Amount' || col === 'Cost') {
        td.innerHTML = `<span style="font-weight: 600; color: #34d399;">₹${Number(val).toLocaleString()}</span>`;
      } else {
        td.textContent = val !== null && val !== undefined ? val : '-';
      }
      tr.appendChild(td);
    });

    // Actions
    const actionTd = document.createElement('td');
    actionTd.style.textAlign = 'right';
    actionTd.innerHTML = `
      <div class="actions-col" style="justify-content: flex-end;">
        <button class="action-btn edit" onclick="openEditModal('${tableName}', '${row[pkCol]}')">✏️ Edit</button>
        <button class="action-btn delete" onclick="openDeleteModal('${row[pkCol]}')">🗑️ Delete</button>
      </div>
    `;
    tr.appendChild(actionTd);
    tbody.appendChild(tr);
  });
}

// Badge styling helper
function renderBadge(val) {
  if (!val) return '-';
  const str = String(val);
  if (['Available', 'Paid', 'Good', 'Premium'].includes(str)) {
    return `<span class="badge badge-success">${str}</span>`;
  }
  if (['Pending', 'Fair', 'Standard'].includes(str)) {
    return `<span class="badge badge-warning">${str}</span>`;
  }
  if (['Maintenance', 'Out of Order', 'Failed', 'Poor'].includes(str)) {
    return `<span class="badge badge-danger">${str}</span>`;
  }
  if (['Basic', 'Cardio', 'Strength'].includes(str)) {
    return `<span class="badge badge-info">${str}</span>`;
  }
  return `<span class="badge badge-neutral">${str}</span>`;
}

// Filter table rows on search
function filterTableRows(searchQuery) {
  if (!searchQuery) {
    renderTable(currentTable, activeTableRecords);
    return;
  }
  const filtered = activeTableRecords.filter(row => {
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchQuery)
    );
  });
  renderTable(currentTable, filtered);
  document.getElementById('table-record-count').textContent = `${filtered.length} of ${activeTableRecords.length} Records`;
}

// Open Add Modal
function openAddModal(tableName) {
  editingRecordId = null;
  document.getElementById('modal-title').textContent = `Add New ${tableName.replace('_', ' ')}`;
  document.getElementById('modal-submit-btn').textContent = 'Insert Record';
  buildModalForm(tableName, null);
  document.getElementById('crud-modal').classList.add('active');
}

// Open Edit Modal
async function openEditModal(tableName, recordId) {
  try {
    const res = await fetch(`/api/tables/${tableName}/${recordId}`);
    const record = await res.json();
    editingRecordId = recordId;
    document.getElementById('modal-title').textContent = `Edit ${tableName.replace('_', ' ')} (${recordId})`;
    document.getElementById('modal-submit-btn').textContent = 'Update Record';
    buildModalForm(tableName, record);
    document.getElementById('crud-modal').classList.add('active');
  } catch (err) {
    showToast('Failed to load record details: ' + err.message, true);
  }
}

// Close Modal
function closeModal() {
  document.getElementById('crud-modal').classList.remove('active');
  editingRecordId = null;
}

// Dynamic Form Generator
function buildModalForm(tableName, existingData) {
  const container = document.getElementById('modal-form-fields');
  container.innerHTML = '';

  const tableSchema = schemaData[tableName];
  if (!tableSchema) return;

  const pkCol = tableSchema.pk;

  tableSchema.columns.forEach(col => {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.textContent = col.name.replace(/_/g, ' ') + (col.name === pkCol ? ' (Primary Key)' : '');
    formGroup.appendChild(label);

    const isEdit = !!existingData;
    const isPk = col.name === pkCol;
    const value = existingData ? existingData[col.name] : '';

    // Specialized inputs
    if (tableName === 'Maintenance' && col.name === 'Equipment_ID') {
      const select = document.createElement('select');
      select.name = col.name;
      select.className = 'form-select';
      select.required = true;
      lookupOptions.equipment.forEach(eq => {
        const opt = document.createElement('option');
        opt.value = eq.Equipment_ID;
        opt.textContent = `${eq.Equipment_ID} - ${eq.Equipment_Name} (${eq.Status})`;
        if (value === eq.Equipment_ID) opt.selected = true;
        select.appendChild(opt);
      });
      formGroup.appendChild(select);
    } else if (tableName === 'Equipment_Usage' && col.name === 'Member_ID') {
      const select = document.createElement('select');
      select.name = col.name;
      select.className = 'form-select';
      select.required = true;
      lookupOptions.members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.Member_ID;
        opt.textContent = `${m.Member_ID} - ${m.Member_Name}`;
        if (value === m.Member_ID) opt.selected = true;
        select.appendChild(opt);
      });
      formGroup.appendChild(select);
    } else if (tableName === 'Equipment_Usage' && col.name === 'Equipment_ID') {
      const select = document.createElement('select');
      select.name = col.name;
      select.className = 'form-select';
      select.required = true;
      lookupOptions.equipment.forEach(eq => {
        const opt = document.createElement('option');
        opt.value = eq.Equipment_ID;
        opt.textContent = `${eq.Equipment_ID} - ${eq.Equipment_Name}`;
        if (value === eq.Equipment_ID) opt.selected = true;
        select.appendChild(opt);
      });
      formGroup.appendChild(select);
    } else if (tableName === 'Equipment_Usage' && col.name === 'Trainer_ID') {
      const select = document.createElement('select');
      select.name = col.name;
      select.className = 'form-select';
      select.required = true;
      lookupOptions.trainers.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.Trainer_ID;
        opt.textContent = `${t.Trainer_ID} - ${t.Trainer_Name} (${t.Specialization})`;
        if (value === t.Trainer_ID) opt.selected = true;
        select.appendChild(opt);
      });
      formGroup.appendChild(select);
    } else if (tableName === 'Payment' && col.name === 'Member_ID') {
      const select = document.createElement('select');
      select.name = col.name;
      select.className = 'form-select';
      select.required = true;
      lookupOptions.members.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.Member_ID;
        opt.textContent = `${m.Member_ID} - ${m.Member_Name}`;
        if (value === m.Member_ID) opt.selected = true;
        select.appendChild(opt);
      });
      formGroup.appendChild(select);
    } else if (col.name === 'Category') {
      const select = createSelect(col.name, ['Cardio', 'Strength', 'Free Weight'], value);
      formGroup.appendChild(select);
    } else if (col.name === 'Condition') {
      const select = createSelect(col.name, ['Good', 'Fair', 'Poor'], value);
      formGroup.appendChild(select);
    } else if (col.name === 'Status') {
      const select = createSelect(col.name, ['Available', 'Maintenance', 'Out of Order'], value);
      formGroup.appendChild(select);
    } else if (col.name === 'Membership_Type') {
      const select = createSelect(col.name, ['Premium', 'Standard', 'Basic'], value);
      formGroup.appendChild(select);
    } else if (col.name === 'Gender') {
      const select = createSelect(col.name, ['Female', 'Male', 'Other'], value);
      formGroup.appendChild(select);
    } else if (col.name === 'Payment_Mode') {
      const select = createSelect(col.name, ['UPI', 'Card', 'Cash', 'Net Banking'], value);
      formGroup.appendChild(select);
    } else if (col.name === 'Payment_Status') {
      const select = createSelect(col.name, ['Paid', 'Pending'], value);
      formGroup.appendChild(select);
    } else {
      // Standard input
      const input = document.createElement('input');
      input.name = col.name;
      input.className = 'form-input';
      input.value = value;
      input.required = col.notnull;

      if (isEdit && isPk) {
        input.disabled = true;
      }

      if (col.type === 'INTEGER') input.type = 'number';
      else if (col.type === 'REAL') { input.type = 'number'; input.step = '0.01'; }
      else input.type = 'text';

      // Helpful placeholder defaults
      if (!value) {
        if (col.name.includes('Date')) input.placeholder = 'YYYY-MM-DD (e.g. 2026-10-07)';
        else if (col.name === 'Duration') input.placeholder = 'e.g. 45 mins, 1 hour';
        else if (col.name === 'Experience') input.placeholder = 'e.g. 5 years';
      }

      formGroup.appendChild(input);
    }

    container.appendChild(formGroup);
  });
}

function createSelect(name, options, selectedVal) {
  const select = document.createElement('select');
  select.name = name;
  select.className = 'form-select';
  options.forEach(optVal => {
    const opt = document.createElement('option');
    opt.value = optVal;
    opt.textContent = optVal;
    if (selectedVal === optVal) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
}

// Handle Form Submission (INSERT / UPDATE)
async function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {};

  formData.forEach((value, key) => {
    payload[key] = value.trim();
  });

  const isEdit = !!editingRecordId;
  const url = isEdit ? `/api/tables/${currentTable}/${editingRecordId}` : `/api/tables/${currentTable}`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Operation failed');
    }

    showToast(result.message || 'Operation successful!');
    closeModal();
    await loadLookupOptions();
    await loadTableData(currentTable);
    await refreshDashboard();
  } catch (err) {
    showToast(err.message, true);
  }
}

// Open Delete Modal
function openDeleteModal(recordId) {
  deletingRecordId = recordId;
  document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('active');
  deletingRecordId = null;
}

// Execute Delete
async function executeDelete() {
  if (!deletingRecordId) return;
  try {
    const res = await fetch(`/api/tables/${currentTable}/${deletingRecordId}`, { method: 'DELETE' });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Delete failed');
    }
    showToast(result.message || 'Record deleted successfully');
    closeDeleteModal();
    await loadLookupOptions();
    await loadTableData(currentTable);
    await refreshDashboard();
  } catch (err) {
    showToast(err.message, true);
  }
}

// Load and Render 10 Preset Queries
async function loadPresetQueries() {
  try {
    const res = await fetch('/api/queries');
    allQueries = await res.json();
    renderQueriesCards(allQueries);
    renderReportQueries(allQueries);
  } catch (err) {
    console.error('Failed to load preset queries:', err);
  }
}

function renderQueriesCards(queries) {
  const container = document.getElementById('queries-container');
  container.innerHTML = '';

  queries.forEach(q => {
    const card = document.createElement('div');
    card.className = 'query-card';
    card.id = `query-card-${q.id}`;
    card.innerHTML = `
      <div class="query-card-header">
        <div class="query-title-wrap">
          <span class="query-number">Query ${q.id}</span>
          <h3 class="query-title">${q.title}</h3>
        </div>
        <span class="badge badge-info">${q.category}</span>
      </div>
      <p class="query-desc">${q.objective}</p>
      <div class="sql-box">${escapeHtml(q.sql)}</div>
      <div class="query-footer">
        <div class="query-concept">Concept: <strong>${q.concept}</strong></div>
        <div style="display:flex; gap: 8px;">
          <button class="btn btn-secondary" onclick="copySql('${escapeHtml(q.sql.replace(/\n/g, ' '))}')">📋 Copy SQL</button>
          <button class="btn btn-primary" onclick="runPresetQuery(${q.id})">▶️ Run Query</button>
        </div>
      </div>
      <div class="query-result-box" id="result-box-${q.id}">
        <div class="query-result-header">
          <span>Execution Output (<span id="count-${q.id}">0</span> records found)</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">Status: 200 OK</span>
        </div>
        <div class="table-container">
          <table class="data-table" id="table-${q.id}">
            <thead></thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Run Preset Query
async function runPresetQuery(queryId) {
  const resultBox = document.getElementById(`result-box-${queryId}`);
  const table = document.getElementById(`table-${queryId}`);
  const countSpan = document.getElementById(`count-${queryId}`);

  try {
    const res = await fetch('/api/queries/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    countSpan.textContent = data.rowCount;
    renderOutputTable(table, data.columns, data.rows);
    resultBox.classList.add('visible');
    showToast(`Query ${queryId} executed successfully (${data.rowCount} rows)`);
  } catch (err) {
    showToast('Query error: ' + err.message, true);
  }
}

// Helper to render output tables
function renderOutputTable(tableElem, columns, rows) {
  const thead = tableElem.querySelector('thead');
  const tbody = tableElem.querySelector('tbody');
  thead.innerHTML = '';
  tbody.innerHTML = '';

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td style="text-align:center; padding: 20px; color: var(--text-muted);">Query returned 0 rows.</td></tr>';
    return;
  }

  const htr = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.replace(/_/g, ' ');
    htr.appendChild(th);
  });
  thead.appendChild(htr);

  rows.forEach(r => {
    const btr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      const val = r[col];
      if (['Status', 'Condition', 'Health_Advisory', 'Payment_Status'].includes(col)) {
        td.innerHTML = renderBadge(val);
      } else {
        td.textContent = val !== null && val !== undefined ? val : '-';
      }
      btr.appendChild(td);
    });
    tbody.appendChild(btr);
  });
}

// SQL Console Runner
async function executeConsoleQuery() {
  const sql = document.getElementById('custom-sql-input').value.trim();
  if (!sql) return;

  const resultCard = document.getElementById('console-result-card');
  const table = document.getElementById('console-result-table');
  const metaBadge = document.getElementById('console-result-meta');

  try {
    const res = await fetch('/api/queries/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    resultCard.style.display = 'block';
    metaBadge.textContent = `${data.rowCount} Row(s) Returned`;
    renderOutputTable(table, data.columns, data.rows);
    showToast('SQL executed successfully!');
  } catch (err) {
    showToast('SQL Execution Error: ' + err.message, true);
  }
}

function loadSampleQueryIntoConsole() {
  document.getElementById('custom-sql-input').value = `SELECT e.Equipment_Name, COUNT(m.Maintenance_ID) AS Total_Repairs, SUM(m.Cost) as Total_Spent
FROM Equipment e
LEFT JOIN Maintenance m ON e.Equipment_ID = m.Equipment_ID
GROUP BY e.Equipment_ID, e.Equipment_Name
ORDER BY Total_Spent DESC;`;
}

function copySql(text) {
  navigator.clipboard.writeText(text);
  showToast('SQL copied to clipboard');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Render Queries in Report Tab
function renderReportQueries(queries) {
  const container = document.getElementById('report-queries-list');
  if (!container) return;
  container.innerHTML = '';

  queries.forEach(q => {
    const div = document.createElement('div');
    div.style.marginBottom = '20px';
    div.innerHTML = `
      <h3 style="color: #38bdf8; margin-top: 14px;">Query ${q.id}: ${q.title}</h3>
      <p style="margin-bottom: 4px;"><strong>Objective:</strong> ${q.objective}</p>
      <p style="margin-bottom: 8px;"><strong>Concept:</strong> <code>${q.concept}</code></p>
      <pre><code>${q.sql}</code></pre>
    `;
    container.appendChild(div);
  });
}
