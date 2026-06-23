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
  // Wait for Supabase SDK to load
  await new Promise(resolve => {
    if (typeof supabase !== 'undefined') return resolve();
    const s = document.querySelector('script[src*="supabase"]');
    s.addEventListener('load', resolve);
  });

  initSupabase();

  // Handle magic link redirect (token in URL hash)
  const { data: { session: urlSession } } = await sb.auth.getSessionFromUrl?.() || { data: { session: null } };

  // Listen for auth state changes
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
      showScreen('screen-login');
    }
  });

  // Check existing session
  const session = await getSession();
  if (!session) showScreen('screen-login');
}

// Start
initApp();
