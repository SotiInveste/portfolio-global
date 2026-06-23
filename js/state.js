// ============================================================
// Global state + calculation helpers
// ============================================================

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// State — loaded from Supabase on login
const state = {
  types:    [],  // account_types rows
  accounts: [],  // accounts rows
  records:  [],  // monthly_records rows
};

let mesAtual = new Date();
mesAtual.setDate(1);

// ── Type helpers ──────────────────────────────────────────

function getType(id) {
  return state.types.find(t => t.id === id) || { id, label: id, color: '#888780', track_rent: false, track_div: false };
}
function trackRent(typeId) { return !!getType(typeId).track_rent; }
function trackDiv(typeId)  { return !!getType(typeId).track_div; }

function badgeStyle(typeId) {
  const c = getType(typeId).color;
  return `background:${c}22;color:${c}`;
}

// ── Date helpers ──────────────────────────────────────────

function mesKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function mesDisplay(d) {
  return MESES[d.getMonth()] + ' ' + d.getFullYear();
}

// ── Format helpers ────────────────────────────────────────

function fmt(v, currency = 'EUR') {
  const sym = { EUR: '€', USD: '$', GBP: '£', BTC: '₿' };
  if (currency === 'BTC') return '₿' + parseFloat(v).toFixed(4);
  return parseFloat(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    + ' ' + (sym[currency] || currency);
}
function fmtPct(p) { return (p >= 0 ? '+' : '') + parseFloat(p).toFixed(2) + '%'; }
function rentClass(p) { return p > 0 ? 'rent-pos' : p < 0 ? 'rent-neg' : 'rent-neu'; }

// ── Record helpers ────────────────────────────────────────

function getRecord(accountId, month) {
  return state.records.find(r => r.account_id === accountId && r.month === month);
}

function getValue(accountId, month) {
  return parseFloat(getRecord(accountId, month)?.value || 0);
}
function getTopUp(accountId, month) {
  return parseFloat(getRecord(accountId, month)?.top_up || 0);
}
function getDividends(accountId, month) {
  return parseFloat(getRecord(accountId, month)?.dividends || 0);
}

// Invested total up to and including a given month
function investedUpTo(account, upToMonth) {
  if (!trackRent(account.type_id)) return null;
  let total = parseFloat(account.initial_inv || 0);
  state.records
    .filter(r => r.account_id === account.id && r.month <= upToMonth)
    .forEach(r => { total += parseFloat(r.top_up || 0); });
  return total;
}

// All months that have at least one record
function allMonths() {
  return [...new Set(state.records.map(r => r.month))].sort();
}

function totalForMonth(month) {
  return state.accounts.reduce((sum, acc) => sum + getValue(acc.id, month), 0);
}

// ── Load all data from Supabase ───────────────────────────

async function loadAllData() {
  const [types, accounts, records] = await Promise.all([
    dbGetTypes(),
    dbGetAccounts(),
    dbGetRecords(),
  ]);
  state.types    = types;
  state.accounts = accounts;
  state.records  = records;
}

// ── Export backup (JSON) ──────────────────────────────────

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'portfolio-backup-' + mesKey(new Date()) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ── UI alert helper ───────────────────────────────────────

function showAlert(page, msg, type) {
  const el = document.getElementById(page + '-alert');
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}
