# SPASimple - Jogo de Truco Paulista usando API

Front-end simples desenvolvido para demonstrar o consumo da API back-end.

Usa o conceito de Single Page Aplication (SPA) onde existe apenas uma página
HTML e a navegação e renderização de páginas é feito via Javascript no
navegador.

O servidor utilizado é o nginx para servir as páginas estáticas de html e
recursos e também como proxy encaminhando as requisições para a API back-end.

Atualmente apenas cria novos jogos pela API de jogos pré-autorizados.

## Tecnologias

Clientside HTML + CSS + Javascript

nginx

## Arquitetura

O roteamento é feito do lado do cliente e encaminhado ao nginx.

`/static e /*`: Rotas utilizada pelo SPA.

`/api-truco/`: Rotas de consumo do back-end acessadas pelo SPA via fetch.

Rotas no SPA /spa/static/js/index.js:

`/*`: Página inicial vazia.

`/jogos`: Lista de Jogos (não implementado).

`/jogos/gameId`: Jogo.

`/pre-autz/player1/player2`: Gerador de links para jogos pré-autorizados.

`/pre-autz/lista`: Lista dos jogos pré-autorizados criados.

`/lnk/`: Módulo de geração de links com jogos pré-autorizados onde o link serve
de chave para autenticar o usuário.

Utilizado localStorage e sessionStorage para controle de sessão.

## Executando

Deve ser configurado no arquivo nginx.conf:

location /api-truco/ {
  proxy_pass http://localhost:7777/;
}

Para o local onde servidor da API esteja executando.

Rodar

```nginx -p "{seu path absoluto}/SPA-Simple/" -c nginx.conf```

O front executará na porta 7781 conexões HTTP.

## Demonstração

![Demonstração](game-demo.gif 'Demonstração')