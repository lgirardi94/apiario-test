import { uuid } from '../utils.js';

export function addArnia(store, nome) {
  store.data.arnie.push({ id: uuid(), nome });
  store.save();
}

export function getArnie(store) {
  return store.data.arnie;
}
