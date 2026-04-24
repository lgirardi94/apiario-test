import { Store } from './store.js';
import { today } from './utils.js';

import { addArnia, getArnie } from './modules/arnie.js';
import { addLog, getLogs } from './modules/log.js';
import { addArticolo, addMovimento, getMagazzino, getMovimenti } from './modules/magazzino.js';

import {
  renderArnie,
  renderLogs,
  renderArniaSelect,
  renderMagazzino,
  renderMovimenti
} from './ui.js';

const store = new Store();

document.getElementById('logData').value = today();

/* NAV */
document.querySelector('.nav').onclick = e => {
  if (!e.target.dataset.section) return;

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(e.target.dataset.section).classList.add('active');
};

/* ARNIE */
document.getElementById('addArnia').onclick = () => {
  const nome = document.getElementById('arniaNome').value;
  if (!nome) return;
  addArnia(store, nome);
  update();
};

/* LOG */
document.getElementById('saveLog').onclick = () => {
  addLog(store,{
    data: document.getElementById('logData').value,
    note: document.getElementById('logNote').value,
    arniaId: document.getElementById('logArnia').value
  });
  update();
};

/* MAGAZZINO */
document.getElementById('addArticolo').onclick = () => {
  addArticolo(
    store,
    document.getElementById('artNome').value,
    document.getElementById('artUnita').value
  );
  update();
};

/* MODALE */
let currentArt = null;

document.addEventListener('click', e => {
  if (e.target.dataset.mov) {
    currentArt = e.target.dataset.mov;
    document.getElementById('modal').classList.remove('hidden');
  }
});

document.getElementById('confirmMov').onclick = () => {
  addMovimento(store,{
    articoloId: currentArt,
    tipo: document.getElementById('movTipo').value,
    qta: parseFloat(document.getElementById('movQta').value)
  });
  document.getElementById('modal').classList.add('hidden');
  update();
};

document.getElementById('closeModal').onclick = () => {
  document.getElementById('modal').classList.add('hidden');
};

/* UPDATE */
function update(){
  const arnie = getArnie(store);
  renderArnie(arnie);
  renderArniaSelect(arnie);
  renderLogs(getLogs(store), arnie);

  const mag = getMagazzino(store);
  renderMagazzino(mag);
  renderMovimenti(getMovimenti(store), mag);
}

update();
