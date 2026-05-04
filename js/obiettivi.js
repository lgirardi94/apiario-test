
const OB_STAGIONI = {
  primavera: { label: 'Primavera', icon: '🌿', mesi: 'Mar–Mag' },
  estate:    { label: 'Estate',    icon: '☀️',  mesi: 'Giu–Ago' },
  autunno:   { label: 'Autunno',   icon: '🍂',  mesi: 'Set–Nov' },
  inverno:   { label: 'Inverno',   icon: '🌨️',  mesi: 'Dic–Feb' }
};
const OB_STATO = {
  da_fare:    { label: 'Da fare',    icon: '🔲', cls: 'ob-da-fare' },
  in_corso:   { label: 'In corso',   icon: '🔄', cls: 'ob-in-corso' },
  completato: { label: 'Completato', icon: '✅', cls: 'ob-completato' }
};


function getAnniObiettivi() {
  const anni = [...new Set(obiettivi.map(o => o.anno))].sort().reverse();
  const annoCorr = new Date().getFullYear();
  if(!anni.includes(annoCorr)) anni.unshift(annoCorr);
  return anni;
}

function populateAnnoSelects() {
  const anni = getAnniObiettivi();
  ['obFiltroAnnoS','obFiltroAnnoA'].forEach(id => {
    const sel = document.getElementById(id);
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Tutti gli anni</option>' +
      anni.map(a => `<option value="${a}">${a}</option>`).join('');
    if(cur) sel.value = cur;
  });
}

// ======= OBIETTIVI TABS =======
function showObTab(tab, btn) {
  ['obTabStagionali','obTabAnnuali','obTabStorico'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  document.querySelectorAll('#obiettivi .mag-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`obTab${tab.charAt(0).toUpperCase()+tab.slice(1)}`).style.display = 'block';
  btn.classList.add('active');
  populateAnnoSelects();
  if(tab === 'stagionali') renderObStagionali();
  if(tab === 'annuali')    renderObAnnuali();
  if(tab === 'storico')    renderObStorico();
}

// ======= RENDER STAGIONALI =======
function renderObStagionali() {
  const filtroStagione = document.getElementById('obFiltroStagione')?.value || '';
  const filtroAnno     = document.getElementById('obFiltroAnnoS')?.value || '';
  const filtroStato    = document.getElementById('obFiltroStato')?.value || '';

  let filtered = obiettivi
    .filter(o => o.tipo === 'stagionale')
    .filter(o => !filtroStagione || o.stagione === filtroStagione)
    .filter(o => !filtroAnno    || String(o.anno) === filtroAnno)
    .filter(o => !filtroStato   || o.stato === filtroStato)
    .sort((a,b) => {
      const ord = ['primavera','estate','autunno','inverno'];
      const aSt = ord.indexOf(a.stagione); const bSt = ord.indexOf(b.stagione);
      return b.anno - a.anno || aSt - bSt;
    });

  const container = document.getElementById('obStagionaliList');
  if(filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="big">🎯</span>Nessun obiettivo stagionale trovato.<br>Aggiungine uno!</div>`;
    return;
  }

  // Raggruppa per anno e stagione
  const grouped = {};
  filtered.forEach(o => {
    const key = `${o.anno}_${o.stagione}`;
    if(!grouped[key]) grouped[key] = { anno: o.anno, stagione: o.stagione, items: [] };
    grouped[key].items.push(o);
  });

  container.innerHTML = Object.values(grouped)
    .sort((a,b) => b.anno - a.anno || ['primavera','estate','autunno','inverno'].indexOf(a.stagione) - ['primavera','estate','autunno','inverno'].indexOf(b.stagione))
    .map(group => {
      const st = OB_STAGIONI[group.stagione] || { label: group.stagione, icon: '🌿', mesi: '' };
      return `
      <div style="margin-bottom:1.5rem">
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.7rem;padding-bottom:0.4rem;border-bottom:2px solid var(--amber-light)">
          <span style="font-size:1.3rem">${st.icon}</span>
          <span style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--brown)">${st.label} ${group.anno}</span>
          <span style="font-size:0.8rem;color:var(--text-light);font-style:italic">${st.mesi}</span>
          <span style="margin-left:auto;font-size:0.82rem;color:var(--text-light)">${group.items.filter(o=>o.stato==='completato').length}/${group.items.length} completati</span>
        </div>
        ${group.items.map(o => renderObCard(o)).join('')}
      </div>`;
    }).join('');
}

// ======= RENDER ANNUALI =======
function renderObAnnuali() {
  const filtroAnno = document.getElementById('obFiltroAnnoA')?.value || '';

  let filtered = obiettivi
    .filter(o => o.tipo === 'annuale')
    .filter(o => !filtroAnno || String(o.anno) === filtroAnno)
    .sort((a,b) => b.anno - a.anno);

  const container = document.getElementById('obAnnualiList');
  if(filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="big">📆</span>Nessun obiettivo annuale trovato.<br>Aggiungine uno!</div>`;
    return;
  }

  // Raggruppa per anno
  const grouped = {};
  filtered.forEach(o => {
    if(!grouped[o.anno]) grouped[o.anno] = [];
    grouped[o.anno].push(o);
  });

  container.innerHTML = Object.entries(grouped)
    .sort(([a],[b]) => b - a)
    .map(([anno, items]) => `
      <div style="margin-bottom:1.5rem">
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.7rem;padding-bottom:0.4rem;border-bottom:2px solid var(--amber-light)">
          <span style="font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--brown)">📆 Anno ${anno}</span>
          <span style="margin-left:auto;font-size:0.82rem;color:var(--text-light)">${items.filter(o=>o.stato==='completato').length}/${items.length} completati</span>
        </div>
        ${items.map(o => renderObCard(o)).join('')}
      </div>`).join('');
}

function renderObCard(o) {
  const stato = OB_STATO[o.stato] || OB_STATO.da_fare;
  const arnia = arnie.find(a => a.id === o.arniaId);
  const pct = o.target ? Math.min(100, Math.round((parseFloat(o.attuale||0)/parseFloat(o.target))*100)) : null;

  return `
  <div class="ob-card ${stato.cls}">
    <div class="ob-card-header">
      <span class="ob-stato-icon">${stato.icon}</span>
      <span class="ob-titolo">${o.titolo}</span>
      <div class="ob-actions">
        <select class="ob-stato-select" onchange="changeObStato('${o.id}', this.value)">
          <option value="da_fare"    ${o.stato==='da_fare'   ?'selected':''}>🔲 Da fare</option>
          <option value="in_corso"   ${o.stato==='in_corso'  ?'selected':''}>🔄 In corso</option>
          <option value="completato" ${o.stato==='completato'?'selected':''}>✅ Fatto</option>
        </select>
        <button class="btn-icon" onclick="openObModal(null, '${o.id}')" title="Modifica">✏️</button>
        <button class="btn-icon del" onclick="deleteObiettivo('${o.id}')" title="Elimina">🗑</button>
      </div>
    </div>
    ${o.descrizione ? `<div class="ob-desc">${o.descrizione}</div>` : ''}
    ${arnia ? `<div class="ob-meta">🏠 ${arnia.num}${arnia.nome?' — '+arnia.nome:''}</div>` : ''}
    ${o.note ? `<div class="ob-meta">📝 ${o.note}</div>` : ''}
    ${pct !== null ? `
      <div class="ob-progress-wrap">
        <div class="ob-progress-bar">
          <div class="ob-progress-fill" style="width:${pct}%;background:${pct>=100?'var(--green)':pct>=50?'var(--amber)':'var(--red)'}"></div>
        </div>
        <span class="ob-progress-label">${o.attuale||0} / ${o.target} ${o.unita||''} (${pct}%)</span>
      </div>` : ''}
  </div>`;
}

// ======= RENDER STORICO =======
function renderObStorico() {
  const anni = getAnniObiettivi();
  const container = document.getElementById('obStorico');

  if(obiettivi.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="big">📊</span>Nessun obiettivo registrato ancora.</div>`;
    return;
  }

  container.innerHTML = anni.map(anno => {
    const stagionali = obiettivi.filter(o => o.tipo === 'stagionale' && o.anno === anno);
    const annuali    = obiettivi.filter(o => o.tipo === 'annuale'    && o.anno === anno);
    const stCompleted = stagionali.filter(o => o.stato === 'completato').length;
    const anCompleted = annuali.filter(o => o.stato === 'completato').length;
    const stPct = stagionali.length ? Math.round((stCompleted/stagionali.length)*100) : null;
    const anPct = annuali.length    ? Math.round((anCompleted/annuali.length)*100)    : null;

    const barColor = (pct) => pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';

    // Stagioni breakdown
    const stagBreakdown = Object.entries(OB_STAGIONI).map(([key, st]) => {
      const items = stagionali.filter(o => o.stagione === key);
      if(!items.length) return '';
      const done = items.filter(o => o.stato === 'completato').length;
      const inCorso = items.filter(o => o.stato === 'in_corso').length;
      return `
        <div class="storico-stagione">
          <span style="min-width:110px">${st.icon} ${st.label}</span>
          <div style="display:flex;gap:3px;flex-wrap:wrap">
            ${items.map(o => {
              const ico = o.stato==='completato'?'✅':o.stato==='in_corso'?'🔄':'🔲';
              return `<span title="${o.titolo}" style="cursor:default">${ico}</span>`;
            }).join('')}
          </div>
          <span style="color:var(--text-light);font-size:0.85rem;margin-left:auto">${done}/${items.length}</span>
        </div>`;
    }).join('');

    const annualiBreakdown = annuali.length ? annuali.map(o => {
      const pct = o.target ? Math.min(100, Math.round((parseFloat(o.attuale||0)/parseFloat(o.target))*100)) : null;
      return `
        <div class="storico-stagione">
          <span style="min-width:16px">${o.stato==='completato'?'✅':o.stato==='in_corso'?'🔄':'🔲'}</span>
          <span style="flex:1">${o.titolo}</span>
          ${pct !== null ? `<span style="color:var(--text-light);font-size:0.85rem">${pct}%</span>` : ''}
        </div>`;
    }).join('') : '';

    return `
    <div class="storico-anno">
      <div class="storico-anno-header">
        <span style="font-family:'Playfair Display',serif;font-size:1.3rem;color:var(--amber)">${anno}</span>
        <div style="flex:1;margin:0 1rem">
          ${stPct !== null ? `
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;font-size:0.85rem">
              <span style="min-width:80px;color:var(--text-light)">Stagionali</span>
              <div class="storico-bar-track"><div class="storico-bar-fill" style="width:${stPct}%;background:${barColor(stPct)}"></div></div>
              <span style="color:var(--text-light)">${stCompleted}/${stagionali.length} (${stPct}%)</span>
            </div>` : ''}
          ${anPct !== null ? `
            <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.85rem">
              <span style="min-width:80px;color:var(--text-light)">Annuali</span>
              <div class="storico-bar-track"><div class="storico-bar-fill" style="width:${anPct}%;background:${barColor(anPct)}"></div></div>
              <span style="color:var(--text-light)">${anCompleted}/${annuali.length} (${anPct}%)</span>
            </div>` : ''}
        </div>
        <button class="btn-icon" onclick="toggleStorico('storico-${anno}')" style="font-size:1rem">▼</button>
      </div>
      <div id="storico-${anno}" class="storico-detail" style="display:none">
        ${stagBreakdown ? `<div style="margin-bottom:0.8rem"><div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light);margin-bottom:0.4rem">Obiettivi stagionali</div>${stagBreakdown}</div>` : ''}
        ${annualiBreakdown ? `<div><div style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light);margin-bottom:0.4rem">Obiettivi annuali</div>${annualiBreakdown}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleStorico(id) {
  const el = document.getElementById(id);
  if(!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  const btn = el.previousElementSibling?.querySelector('button');
  if(btn) btn.textContent = open ? '▼' : '▲';
}

// ======= MODAL OBIETTIVO =======
function openObModal(tipo, editId) {
  const modal = document.getElementById('obModal');
  const anno = new Date().getFullYear();

  // Popola select anno
  const anni = getAnniObiettivi();
  document.getElementById('obAnno').innerHTML =
    anni.map(a => `<option value="${a}">${a}</option>`).join('');

  // Popola select arnia
  document.getElementById('obArnia').innerHTML =
    '<option value="">— Nessuna arnia specifica —</option>' +
    arnie.map(a => `<option value="${a.id}">#${a.num}${a.nome?' — '+a.nome:''}</option>`).join('');

  if(editId) {
    const o = obiettivi.find(x => x.id === editId);
    if(!o) return;
    document.getElementById('obModalTitle').textContent = '✏️ Modifica obiettivo';
    document.getElementById('editObId').value = editId;
    document.getElementById('obTipoHidden').value = o.tipo;
    document.getElementById('obTitolo').value = o.titolo;
    document.getElementById('obDescrizione').value = o.descrizione || '';
    document.getElementById('obAnno').value = o.anno;
    document.getElementById('obStato').value = o.stato;
    document.getElementById('obNote').value = o.note || '';
    document.getElementById('obArnia').value = o.arniaId || '';
    if(o.tipo === 'stagionale') {
      document.getElementById('obStagioneRow').style.display = 'block';
      document.getElementById('obStagione').value = o.stagione;
      document.getElementById('obAnnualeFields').style.display = 'none';
    } else {
      document.getElementById('obStagioneRow').style.display = 'none';
      document.getElementById('obAnnualeFields').style.display = 'block';
      document.getElementById('obTarget').value = o.target || '';
      document.getElementById('obAttuale').value = o.attuale || '';
      document.getElementById('obUnita').value = o.unita || '';
    }
  } else {
    document.getElementById('obModalTitle').textContent = tipo === 'stagionale' ? '🌿 Nuovo obiettivo stagionale' : '📆 Nuovo obiettivo annuale';
    document.getElementById('editObId').value = '';
    document.getElementById('obTipoHidden').value = tipo;
    document.getElementById('obTitolo').value = '';
    document.getElementById('obDescrizione').value = '';
    document.getElementById('obAnno').value = anno;
    document.getElementById('obStato').value = 'da_fare';
    document.getElementById('obNote').value = '';
    document.getElementById('obArnia').value = '';
    document.getElementById('obStagioneRow').style.display = tipo === 'stagionale' ? 'block' : 'none';
    document.getElementById('obAnnualeFields').style.display = tipo === 'annuale' ? 'block' : 'none';
    document.getElementById('obTarget').value = '';
    document.getElementById('obAttuale').value = '';
    document.getElementById('obUnita').value = '';
  }
  modal.classList.add('open');
}

function closeObModal() { document.getElementById('obModal').classList.remove('open'); }

function saveObiettivo() {
  const titolo = document.getElementById('obTitolo').value.trim();
  if(!titolo) { alert('Inserisci un titolo'); return; }
  const tipo   = document.getElementById('obTipoHidden').value;
  const editId = document.getElementById('editObId').value;
  const data = {
    id:          editId || Date.now().toString(),
    tipo,
    titolo,
    descrizione: document.getElementById('obDescrizione').value.trim(),
    anno:        parseInt(document.getElementById('obAnno').value, 10),
    stato:       document.getElementById('obStato').value,
    arniaId:     document.getElementById('obArnia').value || null,
    note:        document.getElementById('obNote').value.trim(),
    stagione:    tipo === 'stagionale' ? document.getElementById('obStagione').value : null,
    target:      tipo === 'annuale' ? parseFloat(document.getElementById('obTarget').value) || null : null,
    attuale:     tipo === 'annuale' ? parseFloat(document.getElementById('obAttuale').value) || null : null,
    unita:       tipo === 'annuale' ? document.getElementById('obUnita').value.trim() : null,
  };
  if(editId) { obiettivi = obiettivi.map(o => o.id === editId ? data : o); }
  else { obiettivi.push(data); }
  saveObiettivi();
  closeObModal();
  populateAnnoSelects();
  // Refresh tab attivo
  const activeTab = document.querySelector('#obiettivi .mag-tab.active');
  if(activeTab) activeTab.click();
}

function changeObStato(id, stato) {
  obiettivi = obiettivi.map(o => o.id === id ? {...o, stato} : o);
  saveObiettivi();
  const activeTab = document.querySelector('#obiettivi .mag-tab.active');
  if(activeTab) activeTab.click();
}

function deleteObiettivo(id) {
  if(!confirm('Eliminare questo obiettivo?')) return;
  obiettivi = obiettivi.filter(o => o.id !== id);
  saveObiettivi();
  const activeTab = document.querySelector('#obiettivi .mag-tab.active');
  if(activeTab) activeTab.click();
}

