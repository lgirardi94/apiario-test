// ======= FUZZY SIMILARITY =======
function similarity(a, b) {
  a = a.toLowerCase().trim();
  b = b.toLowerCase().trim();
  if(a === b) return 1;
  if(a.length < 2 || b.length < 2) return 0;
  // Bigram similarity
  const getBigrams = s => {
    const bg = new Set();
    for(let i = 0; i < s.length - 1; i++) bg.add(s.slice(i, i+2));
    return bg;
  };
  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  let intersection = 0;
  bgA.forEach(bg => { if(bgB.has(bg)) intersection++; });
  return (2 * intersection) / (bgA.size + bgB.size);
}

function findSimili(nome, escludiId) {
  return articoli
    .filter(a => a.id !== escludiId)
    .map(a => ({ ...a, sim: similarity(nome, a.nome) }))
    .filter(a => a.sim >= 0.5)
    .sort((a, b) => b.sim - a.sim);
}

// ======= CONTROLLI MAGAZZINO =======
function runControlli() {
  const container = document.getElementById('controlliResult');
  container.innerHTML = '<div style="color:var(--text-light);font-style:italic;font-size:0.9rem">Analisi in corso...</div>';

  // Trova coppie di duplicati sospetti (esclude coppie ignorate)
  const ignorati = settings.duplicatiIgnorati || [];
  const coppie = [];
  const visti = new Set();
  articoli.forEach((a, i) => {
    articoli.forEach((b, j) => {
      if(i >= j) return;
      const key = [a.id, b.id].sort().join('_');
      if(visti.has(key) || ignorati.includes(key)) return;
      const sim = similarity(a.nome, b.nome);
      if(sim >= 0.5) {
        visti.add(key);
        coppie.push({ a, b, sim });
      }
    });
  });

  if(coppie.length === 0) {
    container.innerHTML = `
      <div style="background:#e8f5e9;border:1px solid #9FC9B0;border-radius:6px;padding:1.2rem 1.5rem;display:flex;align-items:center;gap:0.8rem">
        <span style="font-size:1.5rem">✅</span>
        <div>
          <div style="font-weight:600;color:var(--green)">Nessun duplicato rilevato</div>
          <div style="font-size:0.88rem;color:var(--text-light)">Tutti i ${articoli.length} articoli sembrano unici.</div>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div style="margin-bottom:1rem;font-size:0.9rem;color:var(--text-light)">
      Trovate <strong>${coppie.length}</strong> coppie di articoli potenzialmente duplicati. Puoi fare il merge per unire le movimentazioni nel primo articolo ed eliminare il secondo.
    </div>
    ${coppie.map((c, idx) => {
      const giacA = getGiacenzaLocale(c.a.id);
      const giacB = getGiacenzaLocale(c.b.id);
      const movA = movimentazioni.filter(m => m.articoloId === c.a.id).length;
      const movB = movimentazioni.filter(m => m.articoloId === c.b.id).length;
      const pct = Math.round(c.sim * 100);
      const colSim = pct >= 80 ? 'var(--red)' : pct >= 65 ? '#e65100' : 'var(--amber)';
      return `
      <div class="card" style="margin-bottom:1rem;padding:1.2rem">
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1rem">
          <span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light)">Similarità</span>
          <span style="font-family:'Playfair Display',serif;font-size:1.1rem;color:${colSim};font-weight:700">${pct}%</span>
          <div style="flex:1;height:6px;background:var(--cream-dark);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${colSim};border-radius:3px"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:0.8rem;align-items:center;margin-bottom:1rem">
          <div style="background:var(--amber-pale);border:1px solid var(--amber-light);border-radius:6px;padding:0.8rem">
            <div style="font-weight:600;color:var(--brown);margin-bottom:0.3rem">${c.a.nome}</div>
            <div style="font-size:0.82rem;color:var(--text-light)">Giacenza: ${giacA % 1 === 0 ? giacA : giacA.toFixed(1)} ${c.a.unita}</div>
            <div style="font-size:0.82rem;color:var(--text-light)">${movA} movimentazioni</div>
          </div>
          <span style="font-size:1.2rem;color:var(--text-light)">⟷</span>
          <div style="background:var(--cream);border:1px solid var(--cream-dark);border-radius:6px;padding:0.8rem">
            <div style="font-weight:600;color:var(--brown);margin-bottom:0.3rem">${c.b.nome}</div>
            <div style="font-size:0.82rem;color:var(--text-light)">Giacenza: ${giacB % 1 === 0 ? giacB : giacB.toFixed(1)} ${c.b.unita}</div>
            <div style="font-size:0.82rem;color:var(--text-light)">${movB} movimentazioni</div>
          </div>
        </div>
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap">
          <button class="btn" style="font-size:0.85rem;padding:0.45rem 1rem" onclick="mergeArticoli('${c.a.id}','${c.b.id}')">
            ⬅ Merge: tieni "${c.a.nome}"
          </button>
          <button class="btn btn-secondary" style="font-size:0.85rem;padding:0.45rem 1rem" onclick="mergeArticoli('${c.b.id}','${c.a.id}')">
            ➡ Merge: tieni "${c.b.nome}"
          </button>
          <button class="btn-icon" style="padding:0.45rem 0.8rem;font-size:0.82rem;color:var(--text-light)" onclick="ignoraDuplicato(${idx},'${c.a.id}','${c.b.id}')" title="Non sono duplicati, ignora">
            ✕ Non sono duplicati
          </button>
        </div>
      </div>`;
    }).join('')}
  `;
}

function mergeArticoli(mantieniId, eliminaId) {
  const mantieni = articoli.find(a => a.id === mantieniId);
  const elimina  = articoli.find(a => a.id === eliminaId);
  if(!mantieni || !elimina) return;

  const movElimina = movimentazioni.filter(m => m.articoloId === eliminaId).length;
  const msg = `Stai per:\n• Spostare ${movElimina} movimentazioni da "${elimina.nome}" → "${mantieni.nome}"\n• Eliminare "${elimina.nome}"\n\nL'operazione non è reversibile. Continuare?`;
  if(!confirm(msg)) return;

  // Sposta tutte le movimentazioni
  movimentazioni = movimentazioni.map(m =>
    m.articoloId === eliminaId ? { ...m, articoloId: mantieniId } : m
  );
  // Elimina l'articolo duplicato
  articoli = articoli.filter(a => a.id !== eliminaId);
  saveMagazzino();
  showImportToast(`✅ Merge completato — ${movElimina} movimentazioni spostate su "${mantieni.nome}"`);
  runControlli();
  renderMagArticoli();
}

function ignoraDuplicato(idx, idA, idB) {
  // Salva la coppia come "ignorata" nelle settings (sincronizzata su Drive)
  if(!settings.duplicatiIgnorati) settings.duplicatiIgnorati = [];
  const key = [idA, idB].sort().join('_');
  if(!settings.duplicatiIgnorati.includes(key)) settings.duplicatiIgnorati.push(key);
  saveSettings();
  showImportToast('✅ Coppia ignorata — non verrà più segnalata');
  runControlli();
}


// ======= MAGAZZINO NAV =======
function showMagTab(tab, btn) {
  document.getElementById('magTabArticoli').style.display       = tab === 'articoli'       ? 'block' : 'none';
  document.getElementById('magTabMovimentazioni').style.display = tab === 'movimentazioni' ? 'block' : 'none';
  document.getElementById('magTabControlli').style.display      = tab === 'controlli'      ? 'block' : 'none';
  document.querySelectorAll('.mag-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if(tab === 'articoli') renderMagArticoli();
  if(tab === 'movimentazioni') { renderMagMovimentazioni(); updateMovArticoloSelect(); }
  if(tab === 'controlli') { document.getElementById('controlliResult').innerHTML = ''; }
}

// ======= GIACENZA (wrapper per shared.js) =======
// shared.js espone getGiacenza(articoloId, movimentazioni)
// qui usiamo la variabile locale movimentazioni per comodità
function getGiacenzaLocale(articoloId) {
  return getGiacenza(articoloId, movimentazioni);
}

// ======= RENDER ARTICOLI =======
function renderMagArticoli() {
  const filtroCategoria = document.getElementById('magFiltroCategoria')?.value || '';
  const filtroSearch = (document.getElementById('magFiltroSearch')?.value || '').toLowerCase();
  const catLabel = { materiale: '🔧 Materiale', consumabile: '💊 Consumabile', prodotto: '🍯 Prodotto finito' };
  const catColor = { materiale: 'var(--brown-light)', consumabile: 'var(--blue)', prodotto: 'var(--amber)' };

  let filtered = articoli.filter(a => {
    if(filtroCategoria && a.categoria !== filtroCategoria) return false;
    if(filtroSearch && !a.nome.toLowerCase().includes(filtroSearch)) return false;
    return true;
  });

  const grid = document.getElementById('magGrid');
  if(!grid) return;

  if(filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="big">📦</span>${articoli.length === 0 ? 'Nessun articolo. Aggiungine uno!' : 'Nessun articolo trovato.'}</div>`;
    return;
  }

  grid.innerHTML = filtered.map(a => {
    const giac = getGiacenzaLocale(a.id);
    const giacClass = giac === 0 ? 'zero' : (a.soglia && giac <= parseFloat(a.soglia) ? 'bassa' : '');
    const sogliaAlert = a.soglia && giac <= parseFloat(a.soglia) && giac > 0
      ? `<div style="font-size:0.78rem;color:var(--red);margin-top:0.2rem">⚠️ Sotto soglia minima (${a.soglia} ${a.unita})</div>` : '';
    const scadenzaHtml = a.scadenza ? (() => {
      const [y, m] = a.scadenza.split('-');
      const scadMs = new Date(parseInt(y, 10), parseInt(m, 10)-1, 1).getTime();
      const oggi = Date.now();
      const mesiAllaScad = Math.round((scadMs - oggi) / (1000 * 60 * 60 * 24 * 30));
      const cls = mesiAllaScad <= 3 ? 'vicina' : '';
      return `<div class="mag-scadenza ${cls}">Scad: ${m}/${y}${a.lotto ? ' · Lotto: '+a.lotto : ''}</div>`;
    })() : '';

    return `
    <div class="mag-card">
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:${catColor[a.categoria]||'var(--brown-light)'};margin-bottom:0.4rem">${catLabel[a.categoria]||a.categoria}</div>
      <div class="mag-card-nome">${a.nome}</div>
      ${a.note ? `<div style="font-size:0.82rem;color:var(--text-light);margin-bottom:0.5rem">${a.note}</div>` : ''}
      <div style="margin-top:0.5rem">
        <span class="mag-giacenza ${giacClass}">${giac % 1 === 0 ? giac : giac.toFixed(1)}</span>
        <span class="mag-unita">${a.unita}</span>
      </div>
      ${sogliaAlert}
      ${scadenzaHtml}
      <div class="mag-actions">
        <button class="btn" style="padding:0.35rem 0.8rem;font-size:0.82rem" onclick="openMovModal('${a.id}')">+ Mov.</button>
        <button class="btn btn-secondary" style="padding:0.35rem 0.7rem;font-size:0.82rem" onclick="openArticoloModal('${a.id}')">✏️</button>
        <button class="btn btn-danger" style="padding:0.35rem 0.7rem;font-size:0.82rem" onclick="deleteArticolo('${a.id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ======= RENDER MOVIMENTAZIONI =======
function renderMagMovimentazioni() {
  const filtroTipo = document.getElementById('magFiltroMov')?.value || '';
  const filtroArt = document.getElementById('magFiltroMovArticolo')?.value || '';
  const tipoEmoji = { entrata: '➕', uscita: '➖', rettifica: '🔧' };
  const tipoLabel = { entrata: 'Entrata', uscita: 'Uscita', rettifica: 'Rettifica' };

  let filtered = [...movimentazioni]
    .sort((a, b) => b.data.localeCompare(a.data))
    .filter(m => {
      if(filtroTipo && m.tipo !== filtroTipo) return false;
      if(filtroArt && m.articoloId !== filtroArt) return false;
      return true;
    });

  const list = document.getElementById('movList');
  if(!list) return;

  if(filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="big">🔄</span>Nessuna movimentazione trovata.</div>`;
    return;
  }

  list.innerHTML = filtered.map(m => {
    const art = articoli.find(a => a.id === m.articoloId);
    const segno = m.tipo === 'entrata' ? '+' : m.tipo === 'uscita' ? '−' : '=';
    return `
    <div class="mov-item ${m.tipo}">
      <span class="mov-date">${formatDate(m.data)}</span>
      <span class="mov-qta ${m.tipo}">${segno}${parseFloat(m.qta) % 1 === 0 ? parseFloat(m.qta) : parseFloat(m.qta).toFixed(1)} ${art?.unita||''}</span>
      <div class="mov-info">
        <div class="mov-nome">${art ? art.nome : '—'}</div>
        <div class="mov-note">${tipoEmoji[m.tipo]} ${tipoLabel[m.tipo]}${m.note ? ' · ' + m.note : ''}</div>
      </div>
      <button class="btn-icon del" onclick="deleteMov('${m.id}')" title="Elimina">🗑</button>
    </div>`;
  }).join('');
}

// ======= ARTICOLO MODAL =======
function openArticoloModal(id) {
  const modal = document.getElementById('articoloModal');
  if(id && typeof id === 'string' && articoli.find(a => a.id === id)) {
    const a = articoli.find(x => x.id === id);
    document.getElementById('articoloModalTitle').textContent = '✏️ Modifica articolo';
    document.getElementById('editArticoloId').value = id;
    document.getElementById('artNome').value = a.nome;
    document.getElementById('artCategoria').value = a.categoria;
    document.getElementById('artUnita').value = a.unita;
    document.getElementById('artScadenza').value = a.scadenza || '';
    document.getElementById('artLotto').value = a.lotto || '';
    document.getElementById('artSoglia').value = a.soglia || '';
    document.getElementById('artNote').value = a.note || '';
  } else {
    document.getElementById('articoloModalTitle').textContent = '📦 Nuovo articolo';
    document.getElementById('editArticoloId').value = '';
    document.getElementById('artNome').value = '';
    document.getElementById('artCategoria').value = 'materiale';
    document.getElementById('artUnita').value = 'pz';
    document.getElementById('artScadenza').value = '';
    document.getElementById('artLotto').value = '';
    document.getElementById('artSoglia').value = '';
    document.getElementById('artNote').value = '';
  }
  toggleCampiConsumabile();
  // Live fuzzy search listener
  const artNome = document.getElementById('artNome');
  const editId = document.getElementById('editArticoloId').value;
  artNome.oninput = () => {
    const nome = artNome.value.trim();
    const suggerimenti = document.getElementById('artSimili');
    if(!suggerimenti) return;
    if(nome.length < 2) { suggerimenti.innerHTML = ''; return; }
    const simili = findSimili(nome, editId);
    if(simili.length === 0) { suggerimenti.innerHTML = ''; return; }
    suggerimenti.innerHTML = `
      <div style="background:#fff3e0;border:1px solid #e65100;border-radius:4px;padding:0.6rem 0.9rem;font-size:0.85rem;color:#7f3100;margin-top:0.3rem">
        ⚠️ Articoli simili già presenti:
        ${simili.slice(0,3).map(s=>`<strong>${s.nome}</strong> (${Math.round(s.sim*100)}%)`).join(', ')}
      </div>`;
  };
  modal.classList.add('open');
}
function closeArticoloModal() { document.getElementById('articoloModal').classList.remove('open'); }

function toggleCampiConsumabile() {
  const cat = document.getElementById('artCategoria').value;
  document.getElementById('artCampiConsumabile').style.display = cat === 'consumabile' ? 'grid' : 'none';
}

function saveArticolo() {
  const nome = document.getElementById('artNome').value.trim();
  if(!nome) { alert('Inserisci il nome dell\'articolo'); return; }
  const editId = document.getElementById('editArticoloId').value;

  // Controllo similarità prima di salvare
  const simili = findSimili(nome, editId);
  if(simili.length > 0) {
    const nomiSimili = simili.slice(0,3).map(s=>`"${s.nome}" (${Math.round(s.sim*100)}% simile)`).join('\n• ');
    const conferma = confirm(
      `⚠️ Esistono già articoli simili:\n• ${nomiSimili}\n\nVuoi salvare comunque come nuovo articolo?`
    );
    if(!conferma) return;
  }

  const data = {
    id: editId || Date.now().toString(),
    nome,
    categoria: document.getElementById('artCategoria').value,
    unita: document.getElementById('artUnita').value,
    scadenza: document.getElementById('artScadenza').value || '',
    lotto: document.getElementById('artLotto').value.trim(),
    soglia: document.getElementById('artSoglia').value,
    note: document.getElementById('artNote').value.trim()
  };
  if(editId) { articoli = articoli.map(a => a.id === editId ? data : a); }
  else { articoli.push(data); }
  saveMagazzino();
  closeArticoloModal();
  renderMagArticoli();
}

function deleteArticolo(id) {
  if(!confirm('Eliminare questo articolo e tutte le sue movimentazioni?')) return;
  articoli = articoli.filter(a => a.id !== id);
  movimentazioni = movimentazioni.filter(m => m.articoloId !== id);
  saveMagazzino();
  renderMagArticoli();
}

// ======= MOVIMENTAZIONE MODAL =======
function updateMovArticoloSelect(preselect) {
  const filtSel = document.getElementById('magFiltroMovArticolo');
  if(filtSel) filtSel.innerHTML = '<option value="">Tutti gli articoli</option>' + articoli.map(a => `<option value="${a.id}">${a.nome}</option>`).join('');
}

function buildMovRiga(idx, preselect) {
  const div = document.createElement('div');
  div.id = `movRiga_${idx}`;
  div.style.cssText = 'margin-bottom:0.7rem;';
  div.innerHTML = `
    <div style="display:flex;gap:0.4rem;margin-bottom:0.3rem">
      <select id="movFiltrocat_${idx}" onchange="filtraMovArt(${idx})" style="padding:0.45rem 0.6rem;border:1px solid var(--cream-dark);border-radius:3px;font-family:'Crimson Pro',serif;font-size:0.85rem;background:white;color:var(--text)">
        <option value="">Tutte le categorie</option>
        <option value="materiale">🔧 Materiale</option>
        <option value="consumabile">💊 Consumabili</option>
        <option value="prodotto">🍯 Prodotto finito</option>
      </select>
      <input type="text" id="movSearch_${idx}" placeholder="🔍 Cerca..." oninput="filtraMovArt(${idx})" style="flex:1;padding:0.45rem 0.6rem;border:1px solid var(--cream-dark);border-radius:3px;font-family:'Crimson Pro',serif;font-size:0.85rem;background:white">
    </div>
    <div style="display:grid;grid-template-columns:1fr auto auto;gap:0.5rem;align-items:center">
      <select id="movArt_${idx}" onchange="movArtChange(${idx})" style="width:100%;padding:0.5rem 0.7rem;border:1px solid var(--cream-dark);border-radius:3px;font-family:'Crimson Pro',serif;font-size:0.95rem;background:white">
        <option value="">— Seleziona articolo —</option>
        ${articoli.map(a=>`<option value="${a.id}" data-unita="${a.unita}" data-cat="${a.categoria}" ${a.id===preselect?'selected':''}>${a.nome} (${a.unita})</option>`).join('')}
      </select>
    <div style="display:flex;align-items:center;gap:0.3rem">
      <input type="number" id="movQta_${idx}" min="0" step="0.1" placeholder="Qtà" style="width:80px;padding:0.5rem 0.5rem;border:1px solid var(--cream-dark);border-radius:3px;font-family:'Crimson Pro',serif;font-size:0.95rem;background:white">
      <span id="movUnita_${idx}" style="font-size:0.82rem;color:var(--text-light);min-width:24px">—</span>
    </div>
    <button type="button" onclick="removeMovRiga(${idx})" class="btn-icon del">✕</button>
  `;
  document.getElementById('movRighe').appendChild(div);
  if(preselect) {
    const opt = div.querySelector(`option[value="${preselect}"]`);
    if(opt) document.getElementById(`movUnita_${idx}`).textContent = opt.dataset.unita || '—';
  }
}

let movRigheCount = 0;

function addMovRiga() { buildMovRiga(movRigheCount++); }
function removeMovRiga(idx) { const el = document.getElementById(`movRiga_${idx}`); if(el) el.remove(); }
function filtraMovArt(idx) {
  const cat    = document.getElementById(`movFiltrocat_${idx}`)?.value || '';
  const search = (document.getElementById(`movSearch_${idx}`)?.value || '').toLowerCase();
  const sel    = document.getElementById(`movArt_${idx}`);
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Seleziona articolo —</option>' +
    articoli
      .filter(a => (!cat || a.categoria === cat) && (!search || a.nome.toLowerCase().includes(search)))
      .map(a => `<option value="${a.id}" data-unita="${a.unita}" data-cat="${a.categoria}" ${a.id===cur?'selected':''}>${a.nome} (${a.unita})</option>`)
      .join('');
  if(cur) sel.value = cur;
  movArtChange(idx);
}

function movArtChange(idx) {
  const sel = document.getElementById(`movArt_${idx}`);
  const opt = sel.options[sel.selectedIndex];
  document.getElementById(`movUnita_${idx}`).textContent = opt?.dataset?.unita || '—';
}

function openMovModal(articoloId) {
  updateMovArticoloSelect();
  document.getElementById('editMovId').value = '';
  document.getElementById('movData').value = today();
  document.getElementById('movTipo').value = 'entrata';
  document.getElementById('movNote').value = '';
  document.getElementById('movRighe').innerHTML = '';
  movRigheCount = 0;
  buildMovRiga(movRigheCount++, articoloId || '');
  document.getElementById('movModal').classList.add('open');
}
function closeMovModal() { document.getElementById('movModal').classList.remove('open'); }

function saveMov() {
  const data = document.getElementById('movData').value;
  const tipo = document.getElementById('movTipo').value;
  const note = document.getElementById('movNote').value.trim();
  if(!data) { alert('Inserisci la data'); return; }

  const righe = document.getElementById('movRighe').querySelectorAll('[id^="movRiga_"]');
  const movs = [];
  let errore = false;
  righe.forEach(riga => {
    const idx = riga.id.split('_')[1];
    const artId = document.getElementById(`movArt_${idx}`)?.value;
    const qta   = parseFloat(document.getElementById(`movQta_${idx}`)?.value);
    if(!artId || !qta || qta <= 0) { errore = true; return; }
    movs.push({ articoloId: artId, qta });
  });
  if(errore || movs.length === 0) { alert('Compila articolo e quantità per ogni riga'); return; }

  movs.forEach(m => {
    movimentazioni.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      data, articoloId: m.articoloId, tipo, qta: m.qta, note
    });
  });
  saveMagazzino();
  closeMovModal();
  renderMagArticoli();
  renderMagMovimentazioni();
  showImportToast(`✅ ${movs.length} movimentazion${movs.length>1?'i':'e'} salvata${movs.length>1?'':'!'}`);
}

function deleteMov(id) {
  if(!confirm('Eliminare questa movimentazione?')) return;
  movimentazioni = movimentazioni.filter(m => m.id !== id);
  saveMagazzino();
  renderMagMovimentazioni();
  renderMagArticoli();
}


