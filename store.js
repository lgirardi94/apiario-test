export class Store {
  constructor() {
    this.key = 'apiario-data';
    this.data = this.load();
  }

  load() {
    return JSON.parse(localStorage.getItem(this.key)) || {
      arnie: [],
      log: [],
      magazzino: [],
      movimenti: []
    };
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.data));
  }
}
