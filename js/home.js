// ======= HOME =======
const STAGIONI_INFO = {
  primavera: { nome: 'Primavera 2026', sub: 'Mar–Mag · Periodo acacia e sciamatura', mesi: [2,3,4] },
  estate:    { nome: 'Estate 2026',    sub: 'Giu–Ago · Raccolta e trattamenti estivi', mesi: [5,6,7] },
  autunno:   { nome: 'Autunno 2026',  sub: 'Set–Nov · Preparazione invernamento', mesi: [8,9,10] },
  inverno:   { nome: 'Inverno 2026',  sub: 'Dic–Feb · Riposo e preparazione', mesi: [11,0,1] },
};

function getStagioneCorrente() {
  const m = new Date().getMonth();
  if([2,3,4].includes(m))  return 'primavera';
  if([5,6,7].includes(m))  return 'estate';
  if([8,9,10].includes(m)) return 'autunno';
  return 'inverno';
}

function renderHome() {
  const anno = new Date().getFullYear();
  const stagione = getStagioneCorrente();
  const info = STAGIONI_INFO[stagione];
  const giorniSettimana = ['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'];
  const mesiNome = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const oggi = new Date();

  // Banner
  document.getElementById('homeSeasonName').textContent = info.nome;
  document.getElementById('homeSeasonSub').textContent  = info.sub;
  document.getElementById('homeDate').textContent = `${giorniSettimana[oggi.getDay()]} ${oggi.getDate()} ${mesiNome[oggi.getMonth()]} ${oggi.getFullYear()}`;

  // Alerts
  const alerts = [];
  const sottoSoglia = articoli.filter(a => a.soglia && getGiacenzaLocale(a.id) <= parseFloat(a.soglia));
  if(sottoSoglia.length > 0)
    alerts.push({ msg: `${sottoSoglia.length} articol${sottoSoglia.length>1?'i':'o'} sotto soglia: ${sottoSoglia.map(a=>a.nome).join(', ')}`, target: 'magazzino', color: '#854F0B', bg: '#FAEEDA', border: '#EF9F27' });
  const arnieProblema = arnie.filter(a => a.status === 'problema');
  if(arnieProblema.length > 0)
    alerts.push({ msg: `${arnieProblema.length} arni${arnieProblema.length>1?'e':'a'} in stato problema: ${arnieProblema.map(a=>'#'+a.num).join(', ')}`, target: 'arnie', color: '#8A2C2C', bg: '#fce8e8', border: '#C03030' });
  const arnieDebole = arnie.filter(a => a.status === 'debole');
  if(arnieDebole.length > 0)
    alerts.push({ msg: `${arnieDebole.length} arni${arnieDebole.length>1?'e':'a'} deboli: ${arnieDebole.map(a=>'#'+a.num).join(', ')}`, target: 'arnie', color: '#854F0B', bg: '#FAEEDA', border: '#EF9F27' });

  document.getElementById('homeAlerts').innerHTML = alerts.map(al => `
    <div class="home-alert clickable" onclick="navigateTo('${al.target}')" style="background:${al.bg};border:1px solid ${al.border};border-radius:4px;padding:0.55rem 1rem;font-size:0.88rem;color:${al.color};margin-bottom:0.5rem;display:flex;align-items:center;gap:0.6rem">
      <span>⚠️</span><span style="flex:1">${al.msg}</span><span style="font-size:0.8rem;opacity:0.7">↗</span>
    </div>`).join('');

  // KPI — miele dalla fonte unica di verità (state.js)
  const mieleStats = getMieleStats();
  const totMiele = mieleStats.totale;
  const totMieleAnno = mieleStats.perAnno[anno] || 0;
  const giorniVisitaAnno = countGiorniVisita(anno);
  const mc = movimentiContabili || [];
  const annoStr = String(anno);
  const saldoAnno = mc.filter(m=>m.data&&m.data.startsWith(annoStr)&&m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0)
                  - mc.filter(m=>m.data&&m.data.startsWith(annoStr)&&m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
  const saldoTot  = mc.filter(m=>m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0)
                  - mc.filter(m=>m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);

  document.getElementById('homeKpi').innerHTML = `
    <div class="stat-card clickable" onclick="navigateTo('arnie')"><div class="stat-number">${arnie.filter(a=>a.status==='attiva').length}</div><div class="stat-label">Arnie attive</div></div>
    <div class="stat-card"><div class="stat-number">${totMieleAnno.toFixed(1)} kg</div><div class="stat-label">Miele ${anno}</div></div>
    <div class="stat-card"><div class="stat-number">${totMiele.toFixed(1)} kg</div><div class="stat-label">Miele totale</div></div>
    <div class="stat-card clickable" onclick="navigateTo('registro')"><div class="stat-number">${giorniVisitaAnno}</div><div class="stat-label">Giorni visita ${anno}</div></div>
    <div class="stat-card clickable" onclick="navigateTo('contabilita')"><div class="stat-number" style="color:${saldoAnno>=0?'var(--green)':'var(--red)'}">€${saldoAnno>=0?'':'-'}${fmt(Math.abs(saldoAnno))}</div><div class="stat-label">Saldo ${anno}</div></div>
    <div class="stat-card clickable" onclick="navigateTo('contabilita')"><div class="stat-number" style="color:${saldoTot>=0?'var(--green)':'var(--red)'}">€${saldoTot>=0?'':'-'}${fmt(Math.abs(saldoTot))}</div><div class="stat-label">Saldo totale</div></div>
  `;

  // Arnie cards — usa getTelainoInfo() da shared.js per coerenza colori
  const statusLabel = {attiva:'Attiva',debole:'Debole',problema:'Problema',invernata:'Invernata'};
  const statusCls = {attiva:'status-attiva',debole:'status-debole',problema:'status-problema',invernata:'status-invernata'};

  document.getElementById('homeArnieGrid').innerHTML = arnie.length === 0
    ? `<div class="empty-state" style="grid-column:1/-1"><span class="big">🏠</span>Nessuna arnia registrata.</div>`
    : arnie.map(a => {
        const isp = findUltimaIspezione(a.id);
        const mappaHtml = isp?.ispezione?.mappa?.length ? `
          <div style="display:flex;gap:2px;margin-top:6px;flex-wrap:wrap">
            ${isp.ispezione.mappa.map((tipo,i) => {
              const info = getTelainoInfo(tipo);
              const border = info.borderColor ? `border:1.5px solid ${info.borderColor}` : 'border:1px solid rgba(0,0,0,0.12)';
              return `<div title="T${i+1}: ${info.label}" style="width:22px;height:32px;border-radius:2px;${border};background:${info.color};display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-weight:700;color:${info.textColor}">${info.short}</div>`;
            }).join('')}
          </div>` : '';
        return `
        <div class="arnia-card clickable" onclick="navigateTo('arnie')">
          <div class="arnia-num">#${a.num}</div>
          <div class="arnia-name">${a.nome||'—'}</div>
          <span class="arnia-status ${statusCls[a.status]}">${statusLabel[a.status]}</span>
          <div class="arnia-info" style="font-size:0.85rem">
            ${a.razza?`🐝 <em>${a.razza}</em><br>`:''}
            ${isp?`📅 Isp: ${formatDate(isp.data)}<br>`:''}
            ${isp?.ispezione?.telaini?`📏 ${isp.ispezione.telaini} telaini`:''}
            ${isp?.ispezione?.covata?` · 🟤 ${isp.ispezione.covata}/5`:''}
            ${isp?.ispezione?.celleReali?` · 👑 ${CELLE_REALI_LABEL[isp.ispezione.celleReali]||''}`:``}
          </div>
          ${mappaHtml}
        </div>`;
      }).join('');

  // Ultime visite
  const tipoEmoji = {ispezione:'🔍',trattamento:'💊',nutrizione:'🍬',produzione:'🍯',salute:'⚕️',altro:'📌'};
  const tipoCol = {ispezione:'var(--brown-light)',trattamento:'var(--blue)',nutrizione:'var(--green)',produzione:'var(--amber)',salute:'var(--red)',altro:'var(--text-light)'};
  const ultime5 = logBook.slice(0,5);
  document.getElementById('homeUltimeVisite').innerHTML = ultime5.length === 0
    ? '<div style="color:var(--text-light);font-style:italic;font-size:0.9rem">Nessuna visita registrata.</div>'
    : ultime5.map(e => {
        const tipi = getTipi(e);
        const col = tipoCol[tipi[0]]||'var(--text-light)';
        return `<div style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px dotted var(--cream-dark)">
          <div style="width:8px;height:8px;border-radius:50%;background:${col};margin-top:5px;flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:0.9rem;color:var(--text)">${tipi.map(t=>tipoEmoji[t]||'📌').join('')} ${e.arniaNome}</div>
            <div style="font-size:0.78rem;color:var(--text-light)">${formatDate(e.data)} · ${e.note.substring(0,45)}${e.note.length>45?'...':''}</div>
          </div>
        </div>`;
      }).join('');

  // Obiettivi in corso
  const obInCorso = obiettivi.filter(o => o.stato !== 'completato' && Number(o.anno) === anno).slice(0,5);
  document.getElementById('homeObiettivi').innerHTML = obInCorso.length === 0
    ? '<div style="color:var(--text-light);font-style:italic;font-size:0.9rem">Nessun obiettivo attivo.</div>'
    : obInCorso.map(o => {
        const pct = o.target ? Math.min(100,Math.round((parseFloat(o.attuale||0)/parseFloat(o.target))*100)) : null;
        const stato = o.stato==='in_corso'?'🔄':'🔲';
        const tipoBadge = o.tipo==='annuale'?`<span style="font-size:0.7rem;background:var(--amber-pale);color:var(--brown);padding:1px 5px;border-radius:3px;margin-left:4px">Annuale</span>`:`<span style="font-size:0.7rem;background:#e8f5e9;color:var(--green);padding:1px 5px;border-radius:3px;margin-left:4px">Stagionale</span>`;
        return `<div style="padding:5px 0;border-bottom:1px dotted var(--cream-dark)">
          <div style="font-size:0.9rem;color:var(--text);display:flex;align-items:center;gap:4px">${stato} ${o.titolo}${tipoBadge}</div>
          ${pct!==null?`<div style="height:4px;background:var(--cream-dark);border-radius:2px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${pct>=100?'var(--green)':pct>=50?'var(--amber)':'var(--red)'};border-radius:2px"></div></div>`:''}
        </div>`;
      }).join('');

  // Grafico miele per anno — riusa mieleStats già calcolato sopra
  const mielePerAnno = mieleStats.perAnno;
  const anniMiele = Object.keys(mielePerAnno).sort();
  const maxMiele = Math.max(...Object.values(mielePerAnno), 1);
  document.getElementById('homeGraficoMiele').innerHTML = anniMiele.length === 0
    ? '<div style="color:var(--text-light);font-style:italic;font-size:0.85rem">Nessun dato. Registra una raccolta per vedere questo grafico.</div>'
    : anniMiele.map(a => {
        const tot = mielePerAnno[a];
        const w = Math.round((tot/maxMiele)*100);
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.82rem">
          <span style="min-width:32px;color:var(--text-light)">${a}</span>
          <div style="flex:1;height:10px;background:var(--cream-dark);border-radius:3px;overflow:hidden"><div style="height:100%;width:${w}%;background:var(--amber);border-radius:3px${a===String(anno)?';opacity:0.65':''}"></div></div>
          <span style="min-width:40px;text-align:right;color:var(--text-light)">${tot.toFixed(1)} kg${a===String(anno)?' *':''}</span>
        </div>`;
      }).join('') + (anniMiele.includes(String(anno)) ? '<div style="font-size:11px;color:var(--text-light);margin-top:4px">* anno in corso</div>' : '');

  // Grafico arnie per anno — conta arnie attive in ogni anno
  const annoCorrente = new Date().getFullYear();
  const anniConDati = arnie.filter(a => a.annoIntroduzione).map(a => a.annoIntroduzione);
  if(anniConDati.length === 0) {
    document.getElementById('homeGraficoArnie').innerHTML = '<div style="color:var(--text-light);font-style:italic;font-size:0.85rem">Aggiungi l\'anno di introduzione alle arnie per vedere questo grafico.</div>';
  } else {
    const minAnnoA = Math.min(...anniConDati);
    const tuttiAnniA = Array.from({length: annoCorrente - minAnnoA + 1}, (_, i) => minAnnoA + i);
    const serieArnie = tuttiAnniA.map(a => ({
      anno: a,
      tot: arnie.filter(ar => ar.annoIntroduzione && ar.annoIntroduzione <= a && (!ar.annoDismissione || ar.annoDismissione >= a)).length
    }));
    const maxAr = Math.max(...serieArnie.map(s => s.tot), 1);
    document.getElementById('homeGraficoArnie').innerHTML = serieArnie.map(s => {
      const w = Math.round((s.tot / maxAr) * 100);
      return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.82rem">
        <span style="min-width:32px;color:var(--text-light)">${s.anno}</span>
        <div style="flex:1;height:10px;background:var(--cream-dark);border-radius:3px;overflow:hidden"><div style="height:100%;width:${w}%;background:var(--green);border-radius:3px${s.anno===annoCorrente?';opacity:0.7':''}"></div></div>
        <span style="min-width:30px;text-align:right;color:var(--text-light)">${s.tot}</span>
      </div>`;
    }).join('');
  }

  // Grafico contabilità per anno
  const anniCont = [...new Set((movimentiContabili||[]).map(m=>m.data?.slice(0,4)).filter(Boolean))].sort();
  const maxCont = Math.max(...anniCont.map(a=>{
    const e=(movimentiContabili||[]).filter(m=>m.data?.startsWith(a)&&m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0);
    const u=(movimentiContabili||[]).filter(m=>m.data?.startsWith(a)&&m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
    return Math.max(e,u);
  }),1);
  document.getElementById('homeGraficoContabilita').innerHTML = anniCont.length===0
    ? '<div style="color:var(--text-light);font-style:italic;font-size:0.85rem">Nessun dato.</div>'
    : anniCont.map(a=>{
        const e=(movimentiContabili||[]).filter(m=>m.data?.startsWith(a)&&m.tipo==='entrata').reduce((s,m)=>s+parseFloat(m.importo||0),0);
        const u=(movimentiContabili||[]).filter(m=>m.data?.startsWith(a)&&m.tipo==='uscita').reduce((s,m)=>s+parseFloat(m.importo||0),0);
        const we=Math.round((e/maxCont)*100);
        const wu=Math.round((u/maxCont)*100);
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.82rem">
          <span style="min-width:32px;color:var(--text-light)">${a}</span>
          <div style="flex:1;display:flex;flex-direction:column;gap:2px">
            <div style="height:5px;background:var(--cream-dark);border-radius:3px;overflow:hidden"><div style="height:100%;width:${we}%;background:var(--green);border-radius:3px"></div></div>
            <div style="height:5px;background:var(--cream-dark);border-radius:3px;overflow:hidden"><div style="height:100%;width:${wu}%;background:var(--red);border-radius:3px"></div></div>
          </div>
          <span style="min-width:60px;text-align:right;color:var(--text-light);font-size:0.75rem"><span style="color:var(--green)">+${fmt(e)}</span><br><span style="color:var(--red)">-${fmt(u)}</span></span>
        </div>`;
      }).join('') + `<div style="display:flex;gap:10px;margin-top:6px;font-size:0.75rem;color:var(--text-light)">
        <span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:var(--green);display:inline-block"></span>Entrate</span>
        <span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:var(--red);display:inline-block"></span>Uscite</span>
      </div>`;
}

