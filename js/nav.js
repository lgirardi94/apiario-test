// ===== NAVIGAZIONE =====
function navigateTo(id) {
  const btn = [...document.querySelectorAll('nav button')].find(b => b.getAttribute('onclick')?.includes(`'${id}'`));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if(btn) btn.classList.add('active');
  if(id === 'home') renderHome();
  if(id === 'utility') { sciCalc(); }
  if(id === 'registro') { updateArniSelects(); renderLog(); renderStats(); }
  if(id === 'arnie') renderArnie();
  if(id === 'magazzino') { renderMagArticoli(); updateMovArticoloSelect(); }
  if(id === 'contabilita') { renderContRiepilogo(); populateContAnnoFilter(); }
  if(id === 'obiettivi') { populateAnnoSelects(); renderObStagionali(); }
}

function showSection(id) { navigateTo(id); }

// ===== UTILITY TABS (Calendario / Sciroppo) =====
function showUtilTab(tab, btn) {
  document.getElementById('utilTabCalendario').style.display = tab === 'calendario' ? 'block' : 'none';
  document.getElementById('utilTabSciroppo').style.display   = tab === 'sciroppo'   ? 'block' : 'none';
  document.querySelectorAll('#utility > .mag-tabs .mag-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if(tab === 'sciroppo') sciCalc();
}

// ===== ACCORDION CALENDARIO MENSILE =====
function toggleCard(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}
