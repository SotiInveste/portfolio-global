// ============================================================
// App init, auth flow, page navigation
// ============================================================

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

function showPage(p, evt) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');

  if (p === 'dashboard') renderDashboard();
  if (p === 'registo')   renderRegisto();
  if (p === 'contas')    { populateTypeSelect(); renderContas(); }
  if (p === 'tipos')     renderTipos();
}

async function initApp() {
  // SDK already loaded via <script> tag in index.html
  initSupabase();

  // onAuthStateChange fires once immediately with the current session
  sb.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      showScreen('screen-loading');
      try {
        await loadAllData();
        showScreen('screen-app');
        renderDashboard();
        renderRegisto();
      } catch (e) {
        alert('Erro ao carregar dados: ' + e.message);
        showScreen('screen-login');
      }
    } else {
      // No session — show login (handles both fresh visits and sign-outs)
      showScreen('screen-login');
    }
  });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
