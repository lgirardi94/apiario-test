// ======= EXPORT / IMPORT JSON =======
function exportJSON() {
  const payload = {
    version: 1, exportedAt: new Date().toISOString(),
    arnie, logBook, articoli, movimentazioni, movimentiContabili, obiettivi
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `apiario_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJSON(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if(!data.arnie || !data.logBook) throw new Error('Formato non valido');
      const nArnie = data.arnie.length;
      const nLog = data.logBook.length;
      const nArt = (data.articoli||[]).length;
      const nMov = (data.movimentazioni||[]).length;
      const nCont = (data.movimentiContabili||[]).length;
      const nOb = (data.obiettivi||[]).length;
      const msg = `Il file contiene:\n• ${nArnie} arnie\n• ${nLog} registrazioni\n• ${nArt} articoli magazzino\n• ${nMov} movimentazioni magazzino\n• ${nCont} movimenti contabili\n• ${nOb} obiettivi\n\nI dati attuali verranno sostituiti. Continuare?`;
      if(!confirm(msg)) { event.target.value=''; return; }
      arnie = data.arnie; logBook = data.logBook;
      articoli = data.articoli||[]; movimentazioni = data.movimentazioni||[];
      movimentiContabili = data.movimentiContabili||[];
      obiettivi = data.obiettivi||[];
      saveDB();
      saveMagazzino();
      saveContabilita();
      saveObiettivi();
      renderArnie(); updateArniSelects(); renderLog(); renderStats(); renderMagArticoli();
      showImportToast(`✅ Importazione completata!`);
    } catch(err) { alert('Errore nel file JSON: ' + err.message); }
    event.target.value = '';
  };
  reader.readAsText(file);
}

function showImportToast(msg) {
  let toast = document.getElementById('importToast');
  if(!toast) {
    toast = document.createElement('div');
    toast.id = 'importToast';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:var(--dark);color:var(--amber-glow);padding:0.8rem 1.5rem;border-radius:4px;border:1px solid var(--amber);font-family:"Crimson Pro",serif;font-size:1rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.5s';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

