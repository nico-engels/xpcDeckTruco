import AbstractView from './abstractview.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);

    this.setTitle('xpcDeckTruco | Início');
  }

  getHtml() {
    return `
      <h1>Home</h1>
    `;
  }
}
