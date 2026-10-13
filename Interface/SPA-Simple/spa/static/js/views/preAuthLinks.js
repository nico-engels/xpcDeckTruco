import AbstractView from './abstractview.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);

    this.setTitle('xpcDeckTruco | Jogos Pré-Autorizados');
  }

  async getHtml() {
    const req = await fetch('/api-truco/auth/pre_game/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player1username: this.params.player1,
        player2username: this.params.player2,
      }),
    });
    const resp = await req.text();

    let linkPlayer1;
    let linkPlayer2;
    if (req.status === 200) {
      const ret = JSON.parse(resp);

      linkPlayer1 = `${location.origin}/lnk/${ret.player1Link}/${this.params.player1}`;
      linkPlayer2 = `${location.origin}/lnk/${ret.player2Link}/${this.params.player2}`;
    }

    return `
      <pre>Criado o jogo para o usuário '${this.params.player1}' e '${this.params.player2}'</pre><br/>
      <pre>HTTP ${req.status}</pre>
      <pre>${resp}</pre><br/>
      <pre><a href="${linkPlayer1}">${linkPlayer1}</a></pre><br/>
      <pre><a href="${linkPlayer2}">${linkPlayer2}</a></pre>
    `;
  }
}
