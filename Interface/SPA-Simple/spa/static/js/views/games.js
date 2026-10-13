import AbstractView from './abstractview.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);

    this.setTitle('xpcDeckTruco | Jogos');
  }

  getHtml() {
    return `
      <h1>Lista de Jogos</h1> 
    `;
  }
}
