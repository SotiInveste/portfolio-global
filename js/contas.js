// ============================================================
// Accounts page
// ============================================================

function populateTypeSelect() {
  const sel = document.getElementById('nova-tipo');
  const cur = sel.value;
  sel.innerHTML = state.types.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
  if (cur && state.types.find(t => t.id === cur)) sel.value = cur;
  toggleInvInicialField();
}

function toggleInvInicialField() {
  const typeId = document.getElementById('nova-tipo').value;
  const wrap = document.getElementById('inv-inicial-wrap');
  wrap.style.display = trackRent(typeId) ? 'flex' : 'none';
  wrap.style.flexDirection = 'column';
}

async function addAccount() {
  const name      = document.getElementById('nova-nome').value.trim();
  const inst      = document.getElementById('nova-banco').value.trim();
  const typeId    = document.getElementById('nova-tipo').value;
  const currency  = document.getElementById('nova-moeda').value;

  if (!name || !inst) {
    showAlert('contas', 'Preenche o nome e o banco / entidade.', 'info');
    return;
  }

  const account = {
    id:          'acc_' + Date.now(),
    name,
    institution: inst,
    type_id:     typeId,
    currency,
    sort_order:  state.accounts.length,
  };

  if (trackRent(typeId)) {
    const inv = parseFloat(document.getElementById('nova-inv-inicial').value || 0);
    if (inv > 0) account.initial_inv = inv;
  }

  try {
    const created = await dbInsertAccount(account);
    state.accounts.push(created);
    document.getElementById('nova-nome').value = '';
    document.getElementById('nova-banco').value = '';
    document.getElementById('nova-inv-inicial').value = '';
    showAlert('contas', 'Conta adicionada com sucesso.', 'success');
    renderContas();
  } catch (e) {
    showAlert('contas', 'Erro ao adicionar conta: ' + e.message, 'info');
  }
}

async function removeAccount(id) {
  if (!confirm('Remover esta conta? Os registos mensais associados também serão eliminados.')) return;
  try {
    await dbDeleteAccount(id);
    state.accounts = state.accounts.filter(a => a.id !== id);
    state.records  = state.records.filter(r => r.account_id !== id);
    renderContas();
  } catch (e) {
    showToast('Erro ao remover conta: ' + e.message, 'error');
  }
}

function renderContas() {
  if (!state.accounts.length) {
    document.getElementById('lista-contas').innerHTML =
      '<div class="empty-state">Ainda sem contas adicionadas.</div>';
    return;
  }

  const months  = allMonths();
  const lastMonth = months[months.length - 1];

  const byInst = {};
  state.accounts.forEach(acc => {
    if (!byInst[acc.institution]) byInst[acc.institution] = [];
    byInst[acc.institution].push(acc);
  });

  let html = '';
  Object.entries(byInst).forEach(([inst, accs]) => {
    html += `<div class="card"><div style="font-weight:500;font-size:14px;margin-bottom:8px">${inst}</div>`;
    accs.forEach(acc => {
      const t   = getType(acc.type_id);
      const v   = lastMonth ? getValue(acc.id, lastMonth) : null;
      const inv = trackRent(acc.type_id) && lastMonth ? investedUpTo(acc, lastMonth) : null;
      const pct = inv && inv > 0 ? ((v - inv) / inv * 100) : null;

      html += `<div class="account-row">
        <span class="account-dot" style="background:${t.color}"></span>
        <div class="account-name">
          ${acc.name}
          <div class="account-institution">${acc.currency}${acc.initial_inv > 0 ? ` · inv. inicial: ${fmt(acc.initial_inv, acc.currency)}` : ''}</div>
        </div>
        <span class="type-badge" style="${badgeStyle(acc.type_id)}">${t.label}</span>
        ${pct !== null ? `<span class="rent-pill ${rentClass(pct)}">${fmtPct(pct)}</span>` : ''}
        ${v !== null ? `<div class="account-val">${fmt(v, acc.currency)}</div>` : ''}
        <button class="remove-btn" onclick="removeAccount('${acc.id}')" aria-label="Remover ${acc.name}">
          <i class="ti ti-trash"></i>
        </button>
      </div>`;
    });
    html += '</div>';
  });

  document.getElementById('lista-contas').innerHTML = html;
}
