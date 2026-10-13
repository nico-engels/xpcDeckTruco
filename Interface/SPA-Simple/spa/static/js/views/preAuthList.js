import AbstractView from './abstractview.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);

    this.setTitle('xpcDeckTruco | Jogos Pré-Autorizados');
  }

  async getHtml() {
    return `
      <h1>Lista de Jogos</h1>
      <div id="all">
        <table id="games">
          <tr>
            <th>id</th>
            <th>Player1</th>
            <th>lnk</th>
            <th>Player2</th>
            <th>lnk</th>
            <th>Game</th>
          </tr>
        </table>
      </div>
    `;
  }

  async afterLoad() {
    const req = await fetch('/api-truco/auth/pre_game/list', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (req.status === 200) {
      const ret = await req.json();
      const tab = document.getElementById('games');

      for (const ag of ret.preAuthGames) {
        const row = tab.insertRow();

        const celId = row.insertCell();
        celId.innerHTML = ag.id;

        const celPly1 = row.insertCell();
        celPly1.innerHTML = ag.player1;

        const celPly1lnk = row.insertCell();
        celPly1lnk.innerHTML = `<a href="${location.origin}/lnk/${ag.player1Link}/${ag.player1}">${ag.player1Link}</a>`;

        const celPly2 = row.insertCell();
        celPly2.innerHTML = ag.player2;

        const celPly2lnk = row.insertCell();
        celPly2lnk.innerHTML = `<a href="${location.origin}/lnk/${ag.player2Link}/${ag.player2}">${ag.player2Link}</a>`;

        const celGameId = row.insertCell();
        celGameId.innerHTML = ag.gameId;
      }
    }
  }
}
