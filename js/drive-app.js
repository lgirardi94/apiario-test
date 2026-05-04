// ======= GOOGLE DRIVE — LOGIN OBBLIGATORIO + AUTO-SAVE =======

// Costanti di timing
const DRIVE_DEBOUNCE_MS    = 800;   // Attesa prima di salvare dopo modifica
const DRIVE_RETRY_MS       = 5000;  // Ritento dopo errore di rete
const DRIVE_INIT_DELAY_MS  = 500;   // Attesa caricamento Google API

let _isAuthorized = false;
let _isSaving = false;
let _hasUnsavedChanges = false;

// Detect connessione persa per avvisare l'utente
window.addEventListener('online',  () => {
  if(_hasUnsavedChanges && _isAuthorized) {
    showImportToast('🔄 Connessione tornata, sincronizzo...');
    pushToCloud(true);
  }
});
window.addEventListener('offline', () => {
  setDriveLoading(false);
  const status = document.getElementById('driveStatus');
  if(status) {
    status.textContent = '📵 Offline — modifiche salvate localmente';
    status.style.color = 'rgba(245,150,80,0.9)';
  }
});

function updateDriveUI(connected) {
  const btnLogin  = document.getElementById('btnDriveLogin');
  const btnLogout = document.getElementById('btnDriveLogout');
  const status    = document.getElementById('driveStatus');
  if(btnLogin)  btnLogin.style.display  = connected ? 'none' : 'flex';
  if(btnLogout) btnLogout.style.display = connected ? 'inline-block' : 'none';
  if(status) {
    status.textContent = connected ? '☁️ Sincronizzato con Google Drive' : '☁️ Non connesso';
    status.style.color = connected ? 'rgba(100,220,100,0.8)' : 'rgba(251,245,230,0.55)';
  }
}

function setDriveLoading(on, msg = '') {
  const status = document.getElementById('driveStatus');
  if(!status) return;
  if(on) { status.textContent = msg; status.style.color = 'rgba(245,200,66,0.8)'; }
  else { updateDriveUI(_isAuthorized); }
}

function initGoogleDrive() {
  initDrive(
    async () => {
      // Login completato — carica i dati PRIMA di abilitare i salvataggi
      const gateStatus = document.getElementById('loginGateStatus');
      if(gateStatus) gateStatus.textContent = '🔄 Caricamento dati da Drive...';
      try {
        await loadFromCloud();
        // Solo ora attiva i salvataggi su Drive — evita di salvare array vuoti
        // se qualche evento di rendering innesca un save durante il caricamento
        _isAuthorized = true;
        showApp();
      } catch(e) {
        console.error('Errore caricamento iniziale:', e);
        if(gateStatus) gateStatus.textContent = '❌ Errore: ' + e.message;
      }
    },
    () => {
      // Token salvato trovato — mostra "caricamento"
      const gateStatus = document.getElementById('loginGateStatus');
      if(gateStatus) gateStatus.textContent = '🔄 Riprendo la sessione...';
    },
    () => {
      // Token non valido — mostra schermata login
      _isAuthorized = false;
      const gateStatus = document.getElementById('loginGateStatus');
      if(gateStatus) gateStatus.textContent = '👇 Tocca il pulsante per accedere';
    }
  );
}

async function loadFromCloud() {
  const { db, mag, cont, ob, settings: settingsData } = await driveLoadAll();
  if(db && db.arnie && db.logBook) { arnie = db.arnie; logBook = db.logBook; }
  if(mag && mag.articoli && mag.movimentazioni) { articoli = mag.articoli; movimentazioni = mag.movimentazioni; }
  if(cont && cont.movimentiContabili) { movimentiContabili = cont.movimentiContabili; }
  if(ob && ob.obiettivi) { obiettivi = ob.obiettivi; }
  if(settingsData) {
    // Riempie settings con le proprietà da Drive, mantenendo i default per quelle nuove
    Object.assign(settings, settingsData);
    delete settings.version;
    delete settings.savedAt;
  }
}

function showApp() {
  document.getElementById('loginGate').style.display = 'none';
  document.getElementById('appContent').style.display = 'block';
  updateDriveUI(true);
  // Setup form
  document.getElementById('logData').value = today();
  const artCat = document.getElementById('artCategoria');
  if(artCat) {
    artCat.addEventListener('change', toggleCampiConsumabile);
    toggleCampiConsumabile();
  }
  document.getElementById('logTipo').addEventListener('change', toggleIspezioneFields);
  document.getElementById('logArnia').addEventListener('change', () => {
    const tipi = Array.from(document.querySelectorAll('#logTipo input:checked')).map(x => x.value);
    if(tipi.includes('ispezione')) precompilaDaUltimaIspezione();
  });
  renderArnie();
  renderStats();
  updateArniSelects();
  renderMagArticoli();
  renderContRiepilogo();
  renderHome();
}

/**
 * Salva tutti i dati su Drive con debouncing.
 * Se chiamata più volte in rapida successione, accumula le richieste e salva una volta sola.
 * Se un salvataggio è in corso quando arriva una nuova richiesta, segna che dovrà essere rifatto.
 */
let _saveTimer = null;
let _pendingSave = false;

function pushToCloud(silent = false) {
  if(!_isAuthorized) return;
  _hasUnsavedChanges = true;
  // Debounce: aspetta 800ms di silenzio prima di salvare
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => _doSave(silent), DRIVE_DEBOUNCE_MS);
}

async function _doSave(silent) {
  if(_isSaving) {
    // Salvataggio già in corso — segna che dovremo rifarlo dopo
    _pendingSave = true;
    return;
  }
  if(!navigator.onLine) {
    // Offline — non tentare nemmeno
    setDriveLoading(false);
    return;
  }
  _isSaving = true;
  if(!silent) setDriveLoading(true, '☁️ Salvataggio...');
  try {
    await driveSaveAll(
      { arnie, logBook },
      { articoli, movimentazioni },
      { movimentiContabili },
      { obiettivi },
      settings
    );
    _hasUnsavedChanges = false;
    if(!silent) showImportToast('☁️ Salvato su Drive');
  } catch(e) {
    showImportToast('❌ Errore salvataggio: ' + e.message);
    console.error('Errore pushToCloud:', e);
    // Riprova fra 5 secondi (nel caso di errore di rete temporaneo)
    setTimeout(() => pushToCloud(true), DRIVE_RETRY_MS);
  } finally {
    _isSaving = false;
    setDriveLoading(false);
    // Se sono arrivate richieste durante il salvataggio, rifai il salvataggio
    if(_pendingSave) {
      _pendingSave = false;
      pushToCloud(true);
    }
  }
}

function driveLogoutApp() {
  if(!confirm('Disconnettersi da Google Drive? Per accedere di nuovo dovrai rifare il login.')) return;
  // Cancella timer e flag pendenti
  if(_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
  _pendingSave = false;
  _hasUnsavedChanges = false;
  driveLogout();
  _isAuthorized = false;
  // Azzera lo stato in memoria
  arnie = []; logBook = [];
  articoli = []; movimentazioni = [];
  movimentiContabili = [];
  obiettivi = [];
  settings = { duplicatiIgnorati: [] };
  // Pulisci anche la cache locale
  ['arnie','logBook','articoli','movimentazioni','movimentiContabili','obiettivi','apiario_settings'].forEach(k => localStorage.removeItem(k));
  document.getElementById('appContent').style.display = 'none';
  document.getElementById('loginGate').style.display = 'flex';
  document.getElementById('loginGateStatus').textContent = '👇 Tocca il pulsante per accedere';
}

window.addEventListener('load', () => {
  document.getElementById('loginGate').style.display = 'flex';
  setTimeout(initGoogleDrive, DRIVE_INIT_DELAY_MS);
});

// Avvisa prima di chiudere la scheda se ci sono modifiche non salvate
window.addEventListener('beforeunload', (e) => {
  if(_hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
