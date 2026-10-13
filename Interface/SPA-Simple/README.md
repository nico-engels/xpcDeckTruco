# xpcDeckTrucoFE-SPASimple - Jogo de Truco Paulista usando API

Front-end desenvolvido usando Typescript simples para demonstrar o consumo de API
back-end (xpcDeckTrucoBE).

Usa o conceito de Single Page Aplication (SPA) onde existe apenas uma página
HTML e a navegação e renderização de páginas é feito via Javascript no
navegador.

Atualmente apenas cria novos jogos pela API de jogos pré-autorizados.

## Tecnologias

Typescript 6

NodeJs 24

## Arquitetura

Arquivo de rotas no index.ts:

`/static e /*`: Rotas utilizada pelo SPA.

`/api-truco/`: Rotas de consumo do back-end acessadas pelo SPA via fetch.

`/lnk/`: Módulo de geração de links com jogos pré-autorizados onde o link serve
de chave para autenticar o usuário.

Rotas no SPA /spa/static/js/index.js:

`/*`: Página inicial vazia.

`/jogos`: Lista de Jogos (não implementado).

`/jogos/gameId`: Jogo.

`/pre-autz/player1/player2`: Gerador de links para jogos pré-autorizados.

`/pre-autz/lista`: Lista dos jogos pré-autorizados criados.

Utilizado cookies para controle de sessão.

## Executando

Deve ser definido no arquivo `.env`:

- BASE_URL_API: URL para o servidor de back-end.
- TEMP_TOKEN_XT_ADMIN: Token JWT para a criação de jogos pré-autorizados.
- COOKIE_SCRT: Secret (string) utilizado ao assinar o cookie. Informar uma
  string aleatória.

O servidor é https e escuta na porta 7779 (https). O certificado deve ser
informado na pasta rec/sslcert/(selfsigned.key e selfsigned.crt).
