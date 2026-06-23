// ============================================================
// Account types page
// ============================================================

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function addType() {
  const label     = document.getElementById('novo-tipo-nome').value.trim();
  const color     = document.getElementById('novo-tipo-cor').value;
  const trackRent = document.getElementById('novo-tipo-rent').checked;
  const trackDiv  = document.getElementById('novo-tipo-div').checked;

  if (!label) { showAlert('tipos', 'Indica um nome para o tipo.', 'info'); return; }
  if (state.types.some(t => t.label.toLowerCase() === label.toLowerCase())) {
    showAlert('tipos', 'Já existe um tipo com esse nome.', 'info'); return;
  }

  const type = {
    id:         slugify(label) + '_' + Date.now().toString().slice(-4),
    label,
    color,
    track_rent: trackRent,
    track_div:  trackDiv,
    sort_order: state.types.length,
  };

  try {
    const created = await dbInsertType(type);
    state.types.push(created);
    document.getElementById('novo-tipo-nome').value = '';
    document.getElementById('novo-tipo-rent').checked = false;
    document.getElementById('novo-tipo-div').checked  = false;
    showAlert('tipos', 'Tipo adicionado.', 'success');
    renderTipos();
  } catch (e) {
    showAlert('tipos', 'Erro: ' + e.message, 'info');
  }
}

async function updateTypeColor(id, color) {
  try {
    await dbUpdateType(id, { color });
    const t = state.types.find(t => t.id === id);
    if (t) t.color = color;
    renderTipos();
  } catch (e) { console.error(e); }
}

async function updateTypeName(id, label) {
  try {
    await dbUpdateType(id, { label });
    const t = state.types.find(t => t.id === id);
    if (t) t.label = label;
  } catch (e) { console.error(e); }
}

async function updateTypeFlag(id, field, value) {
  try {
    await dbUpdateType(id, { [field]: value });
    const t = state.types.find(t => t.id === id);
    if (t) t[field] = value;
  } catch (e) { console.error(e); }
}

async function removeType(id) {
  const n = state.accounts.filter(a => a.type_id === id).length;
  if (n > 0) {
    showAlert('tipos', `Não é possível remover: ${n} conta(s) usam este tipo.`, 'info');
    return;
  }
  try {
    await dbDeleteType(id);
    state.types = state.types.filter(t => t.id !== id);
    renderTipos();
  } catch (e) {
    showAlert('tipos', 'Erro ao remover: ' + e.message, 'info');
  }
}

function renderTipos() {
  if (!state.types.length) {
    document.getElementById('lista-tipos').innerHTML = '<div class="empty-state">Ainda sem tipos definidos.</div>';
    return;
  }

  let html = '<div class="card">';
  state.types.forEach(t => {
    const count = state.accounts.filter(a => a.type_id === t.id).length;
    html += `<div class="tipo-row">
      <input type="color" class="tipo-color-input" value="${t.color}"
        onchange="updateTypeColor('${t.id}', this.value)">
      <input type="text" class="tipo-name-input" value="${t.label}"
        onchange="updateTypeName('${t.id}', this.value)">
      <label class="toggle-wrap">
        <input type="checkbox" ${t.track_rent ? 'checked' : ''}
          onchange="updateTypeFlag('${t.id}', 'track_rent', this.checked)">
        rentabilidade
      </label>
      <label class="toggle-wrap">
        <input type="checkbox" ${t.track_div ? 'checked' : ''} style="accent-color:#9A6B00"
          onchange="updateTypeFlag('${t.id}', 'track_div', this.checked)">
        div./juros
      </label>
      <span class="tipo-count">${count} conta${count === 1 ? '' : 's'}</span>
      <button class="remove-btn" onclick="removeType('${t.id}')"><i class="ti ti-trash"></i></button>
    </div>`;
  });
  html += '</div>';
  document.getElementById('lista-tipos').innerHTML = html;
}
