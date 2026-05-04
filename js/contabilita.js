
function getCatList(tipo) { return tipo === 'entrata' ? CAT_ENTRATA : CAT_USCITA; }

// ======= CONTABILITÀ NAV =======
function showContTab(tab, btn) {
  document.getElementById('contTabRiepilogo').style.display = tab === 'riepilogo' ? 'block' : 'none';
  document.getElementById('contTabMovimenti').style.display = tab === 'movimenti' ? 'block' : 'none';
  document.querySelectorAll('#contabilita .mag-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if(tab === 'riepilogo') renderContRiepilogo();
  if(tab === 'movimenti') { populateContAnnoFilter(); renderContMovimenti(); }
}

// ======= RIEPILOGO =======
function renderContRiepilogo() {
  const anno = new Date().getFullYear();
  const mesi = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

  // Totals all time
  const totEntrate = movimentiContabili.filter(m=>m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0);
  const totUscite = movimentiContabili.filter(m=>m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
  const saldoTot = totEntrate - totUscite;

  // Totals current year
  const annoCurr = movimentiContabili.filter(m=>m.data&&m.data.startsWith(anno));
  const entAnno = annoCurr.filter(m=>m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0);
  const uscAnno = annoCurr.filter(m=>m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
  const saldoAnno = entAnno - uscAnno;

  // KPI
  document.getElementById('contKpiGrid').innerHTML = `
    <div class="cont-kpi"><div class="cont-kpi-label">Saldo ${anno}</div><div class="cont-kpi-val saldo ${saldoAnno>=0?'pos':'neg'}">${saldoAnno>=0?'+':''}€ ${fmt(saldoAnno)}</div></div>
    <div class="cont-kpi"><div class="cont-kpi-label">Entrate ${anno}</div><div class="cont-kpi-val entrata">€ ${fmt(entAnno)}</div></div>
    <div class="cont-kpi"><div class="cont-kpi-label">Uscite ${anno}</div><div class="cont-kpi-val uscita">€ ${fmt(uscAnno)}</div></div>
    <div class="cont-kpi"><div class="cont-kpi-label">Saldo totale</div><div class="cont-kpi-val saldo ${saldoTot>=0?'pos':'neg'}">${saldoTot>=0?'+':''}€ ${fmt(saldoTot)}</div></div>
    <div class="cont-kpi"><div class="cont-kpi-label">Entrate totali</div><div class="cont-kpi-val entrata">€ ${fmt(totEntrate)}</div></div>
    <div class="cont-kpi"><div class="cont-kpi-label">Uscite totali</div><div class="cont-kpi-val uscita">€ ${fmt(totUscite)}</div></div>
  `;

  // Chart mensile anno corrente
  const maxMens = Math.max(...Array.from({length:12},(_,i)=>{
    const m = String(i+1).padStart(2,'0');
    const prefix = `${anno}-${m}`;
    const e = annoCurr.filter(x=>x.data.startsWith(prefix)&&x.tipo==='entrata').reduce((s,x)=>s+parseFloat(x.importo||0),0);
    const u = annoCurr.filter(x=>x.data.startsWith(prefix)&&x.tipo==='uscita').reduce((s,x)=>s+parseFloat(x.importo||0),0);
    return Math.max(e,u);
  }), 1);

  document.getElementById('chartMensile').innerHTML = Array.from({length:12},(_,i)=>{
    const m = String(i+1).padStart(2,'0');
    const prefix = `${anno}-${m}`;
    const e = annoCurr.filter(x=>x.data.startsWith(prefix)&&x.tipo==='entrata').reduce((s,x)=>s+parseFloat(x.importo||0),0);
    const u = annoCurr.filter(x=>x.data.startsWith(prefix)&&x.tipo==='uscita').reduce((s,x)=>s+parseFloat(x.importo||0),0);
    const we = Math.round((e/maxMens)*100);
    const wu = Math.round((u/maxMens)*100);
    return `<div class="bar-row">
      <span class="bar-label">${mesi[i]}</span>
      <div style="flex:1;display:flex;flex-direction:column;gap:2px">
        <div class="bar-track"><div class="bar-fill-e" style="width:${we}%"></div></div>
        <div class="bar-track"><div class="bar-fill-u" style="width:${wu}%"></div></div>
      </div>
      <span class="bar-vals" style="text-align:right"><span style="color:var(--green)">+€${fmt(e)}</span><br><span style="color:var(--red)">-€${fmt(u)}</span></span>
    </div>`;
  }).join('');

  // Chart annate
  const anni = [...new Set(movimentiContabili.map(m=>m.data&&m.data.slice(0,4)).filter(Boolean))].sort();
  const maxAnn = Math.max(...anni.map(a=>{
    const e = movimentiContabili.filter(m=>m.data&&m.data.startsWith(a)&&m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0);
    const u = movimentiContabili.filter(m=>m.data&&m.data.startsWith(a)&&m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
    return Math.max(e,u);
  }), 1);

  document.getElementById('chartAnnate').innerHTML = anni.length === 0
    ? '<div style="color:var(--text-light);font-style:italic;font-size:0.9rem">Nessun dato disponibile.</div>'
    : anni.map(a=>{
      const e = movimentiContabili.filter(m=>m.data&&m.data.startsWith(a)&&m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0);
      const u = movimentiContabili.filter(m=>m.data&&m.data.startsWith(a)&&m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
      const we = Math.round((e/maxAnn)*100);
      const wu = Math.round((u/maxAnn)*100);
      return `<div class="bar-row">
        <span class="bar-label">${a}</span>
        <div style="flex:1;display:flex;flex-direction:column;gap:2px">
          <div class="bar-track"><div class="bar-fill-e" style="width:${we}%"></div></div>
          <div class="bar-track"><div class="bar-fill-u" style="width:${wu}%"></div></div>
        </div>
        <span class="bar-vals" style="text-align:right"><span style="color:var(--green)">+€${fmt(e)}</span><br><span style="color:var(--red)">-€${fmt(u)}</span></span>
      </div>`;
    }).join('');

  // Ultime 8
  const ultime = [...movimentiContabili].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,8);
  document.getElementById('contUltime').innerHTML = ultime.length === 0
    ? '<div style="color:var(--text-light);font-style:italic;font-size:0.9rem">Nessun movimento registrato.</div>'
    : ultime.map(m=>`
      <div class="mov-cont-item ${m.tipo}">
        <span class="mov-date">${formatDate(m.data)}</span>
        <span class="mov-cont-importo ${m.tipo}">${m.tipo==='entrata'?'+':'-'}€ ${fmt(m.importo)}</span>
        <div style="flex:1"><div style="font-weight:600;color:var(--brown)">${m.descrizione||'—'}</div>
        <div style="font-size:0.82rem;color:var(--text-light)">${(Array.isArray(m.categorie)?m.categorie:[]).map(c=>{
          const all=[...CAT_ENTRATA,...CAT_USCITA]; const found=all.find(x=>x.id===c); return found?found.label:c;
        }).join(', ')}</div></div>
      </div>`).join('');
}

// ======= MOVIMENTI =======
function populateContAnnoFilter() {
  const anni = [...new Set(movimentiContabili.map(m=>m.data&&m.data.slice(0,4)).filter(Boolean))].sort().reverse();
  const sel = document.getElementById('contFiltroAnno');
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">Tutti gli anni</option>' + anni.map(a=>`<option value="${a}">${a}</option>`).join('');
  if(cur) sel.value = cur;
}

function renderContMovimenti() {
  const filtroTipo = document.getElementById('contFiltroTipo')?.value||'';
  const filtroAnno = document.getElementById('contFiltroAnno')?.value||'';
  const filtroSearch = (document.getElementById('contFiltroSearch')?.value||'').toLowerCase();
  const all=[...CAT_ENTRATA,...CAT_USCITA];

  let filtered = [...movimentiContabili]
    .sort((a,b)=>b.data.localeCompare(a.data))
    .filter(m=>{
      if(filtroTipo && m.tipo!==filtroTipo) return false;
      if(filtroAnno && !m.data.startsWith(filtroAnno)) return false;
      if(filtroSearch && !(m.descrizione||'').toLowerCase().includes(filtroSearch) && !(m.note||'').toLowerCase().includes(filtroSearch)) return false;
      return true;
    });

  const el = document.getElementById('contMovList');
  if(!el) return;
  if(filtered.length===0){ el.innerHTML='<div class="empty-state"><span class="big">💰</span>Nessun movimento trovato.</div>'; return; }

  el.innerHTML = filtered.map(m=>{
    const cats = (Array.isArray(m.categorie)?m.categorie:[]).map(c=>{const f=all.find(x=>x.id===c);return f?f.label:c;}).join(', ');
    return `<div class="mov-cont-item ${m.tipo}">
      <span class="mov-date">${formatDate(m.data)}</span>
      <span class="mov-cont-importo ${m.tipo}">${m.tipo==='entrata'?'+':'-'}€ ${fmt(m.importo)}</span>
      <div style="flex:1">
        <div style="font-weight:600;color:var(--brown)">${m.descrizione||'—'}</div>
        <div style="font-size:0.82rem;color:var(--text-light)">${cats}${m.note?' · '+m.note:''}</div>
      </div>
      <button class="btn-icon del" onclick="deleteContMov('${m.id}')" title="Elimina">🗑</button>
    </div>`;
  }).join('');
}

function deleteContMov(id) {
  if(!confirm('Eliminare questo movimento?')) return;
  movimentiContabili = movimentiContabili.filter(m=>m.id!==id);
  saveContabilita();
  renderContMovimenti();
  renderContRiepilogo();
}


// ======= MODAL MOVIMENTO CONTABILE =======
function renderCatChips() {
  const tipo = document.getElementById('contMovTipo')?.value||'entrata';
  const cats = getCatList(tipo);
  document.getElementById('contCatChips').innerHTML = cats.map(c=>`
    <label class="cat-chip"><input type="checkbox" value="${c.id}"> ${c.label}</label>
  `).join('');
}

function openContMovModal() {
  document.getElementById('contMovModalTitle').textContent = '💰 Nuovo movimento';
  document.getElementById('editContMovId').value = '';
  document.getElementById('contMovData').value = new Date().toISOString().slice(0,10);
  document.getElementById('contMovTipo').value = 'entrata';
  document.getElementById('contMovDesc').value = '';
  document.getElementById('contMovImporto').value = '';
  document.getElementById('contMovNote').value = '';
  renderCatChips();
  document.getElementById('contMovModal').classList.add('open');
}

function closeContMovModal() { document.getElementById('contMovModal').classList.remove('open'); }

function saveContMov() {
  const data = document.getElementById('contMovData').value;
  const importo = document.getElementById('contMovImporto').value;
  const descrizione = document.getElementById('contMovDesc').value.trim();
  if(!data||!importo||!descrizione){ alert('Compila data, importo e descrizione'); return; }
  const categorie = Array.from(document.querySelectorAll('#contCatChips input:checked')).map(x=>x.value);
  const mov = {
    id: Date.now().toString(), data,
    tipo: document.getElementById('contMovTipo').value,
    descrizione, importo: parseFloat(importo), categorie,
    note: document.getElementById('contMovNote').value.trim()
  };
  movimentiContabili.unshift(mov);
  saveContabilita();
  closeContMovModal();
  populateContAnnoFilter();
  renderContMovimenti();
  renderContRiepilogo();
  showImportToast('✅ Movimento salvato!');
}

