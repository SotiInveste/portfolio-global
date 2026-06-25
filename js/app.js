// ============================================================
// App init, auth flow, page navigation
// ============================================================

function showScreen(id) {
  document.body.classList.remove('booting');
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

async function bootApp(session) {
  showScreen('screen-loading');
  try {
    await loadAllData();
    showScreen('screen-app');
    renderDashboard();
    renderRegisto();
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
    showToast('Erro ao carregar dados: ' + e.message, 'error');
    showScreen('screen-login');
  }
}

async function initApp() {
  initSupabase();

  // Handle magic link: Supabase v2 picks up the token from the URL hash
  // automatically when we call getSession(), but we need to give it a moment
  const { data: { session } } = await sb.auth.getSession();

  if (session) {
    await bootApp(session);
  } else {
    // Check if there's a hash fragment — magic link redirect
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Let Supabase process the token from the URL
      showScreen('screen-loading');
      const { data, error } = await sb.auth.exchangeCodeForSession
        ? sb.auth.exchangeCodeForSession(hash)   // PKCE flow (newer)
        : Promise.resolve({ data: null });         // fallback

      if (!error && data?.session) {
        await bootApp(data.session);
        return;
      }
    }
    showScreen('screen-login');
  }

  // Keep listening for auth changes (sign in via magic link tab, sign out)
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      await bootApp(session);
    } else if (event === 'SIGNED_OUT') {
      showScreen('screen-login');
    }
  });
}

document.addEventListener('DOMContentLoaded', initApp);
