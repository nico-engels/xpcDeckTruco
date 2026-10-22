import AbstractView from './abstractview.js';
import game from './game.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);

    this.setTitle('xpcDeckTruco | Acessando o link');
  }

  getHtml() {
    return `
      <h1>Carregando o jogo...</h1>
    `;
  }

  async afterLoad() {
    if (!this.params.linkToken)
      return;

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = crypto.randomUUID();

      localStorage.setItem('deviceId', deviceId);
    }

    const req = await fetch('/api-truco/auth/pre_game/consume_link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerLink: this.params.linkToken,
        deviceId,
      }),
    });

    if (req.status === 200) {
      const ret = await req.json();

      sessionStorage.setItem('jwtToken', ret.jwtToken);

      const view = new game({ gameId: ret.gameId });

      document.querySelector('#app').innerHTML = await view.getHtml();
      history.pushState(null, null, location.pathname);
      location.pathname = `/jogos/${ret.gameId}`;

      await view.afterLoad();
    }

  }
}
