import { uuid } from '../utils.js';

export function addArticolo(store, nome, unita) {
  store.data.magazzino.push({
    id: uuid(),
    nome,
    unita,
    giacenza: 0
  });
  store.save();
}

export function addMovimento(store, mov) {
  store.data.movimenti.push({
    id: uuid(),
    ...mov,
    data: Date.now()
  });

  const art = store.data.magazzino.find(a=>a.id===mov.articoloId);

  if (mov.tipo === 'entrata') art.giacenza += mov.qta;
  else art.giacenza -= mov.qta;

  store.save();
}

export function getMagazzino(store) {
  return store.data.magazzino;
}

export function getMovimenti(store) {
  return store.data.movimenti.sort((a,b)=>b.data-a.data);
}
