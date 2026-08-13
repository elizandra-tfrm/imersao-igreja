// Helpers de acesso à API pública do Apps Script (definida em WebApp.gs).
// GET para leituras (sem preflight de CORS); POST em text/plain para
// escritas (também evita o preflight, que o Apps Script não sabe responder).

function apiUrl(params) {
  var partes = Object.keys(params || {}).map(function (chave) {
    return encodeURIComponent(chave) + '=' + encodeURIComponent(params[chave]);
  });
  return WEBAPP_URL + (partes.length ? '?' + partes.join('&') : '');
}

function apiGet(action, params) {
  var query = Object.assign({ action: action }, params || {});
  return fetch(apiUrl(query)).then(function (resposta) { return resposta.json(); });
}

function apiPost(action, corpo) {
  return fetch(WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ action: action }, corpo || {}))
  }).then(function (resposta) { return resposta.json(); });
}

/**
 * POST que tolera falha passageira: sinal de celular oscilando, ou o Apps Script
 * devolvendo uma página de erro em HTML enquanto uma nova versão é publicada
 * (fetch não rejeita em erro HTTP, então nesse caso quem estoura é o .json()).
 *
 * SÓ para ações idempotentes. Repetir `reiniciarPagamento`, por exemplo, criaria
 * duas cobranças na PagBank. Hoje isto serve a `registrarInscricao`, que é
 * seguro repetir porque o servidor reconhece o CPF e reaproveita a linha em vez
 * de criar outra.
 *
 * Marca `houveRetentativa` na resposta: numa repetição, o CPF que o servidor
 * reconhece pode ser o que ele mesmo acabou de gravar na tentativa perdida, e
 * isso não é a mesma coisa que a pessoa já estar inscrita de antes.
 */
function apiPostComRetentativa(action, corpo, opcoes) {
  var config = opcoes || {};
  var maximo = config.tentativas === undefined ? 3 : config.tentativas;
  var esperaMs = config.esperaMs === undefined ? 1500 : config.esperaMs;
  var repetiu = false;

  function tentar(restantes) {
    return apiPost(action, corpo).catch(function (erro) {
      if (restantes <= 1) throw erro;
      repetiu = true;
      if (config.aoRepetir) config.aoRepetir();
      return new Promise(function (resolve) { setTimeout(resolve, esperaMs); })
        .then(function () { return tentar(restantes - 1); });
    });
  }

  return tentar(maximo).then(function (resposta) {
    if (resposta && typeof resposta === 'object') resposta.houveRetentativa = repetiu;
    return resposta;
  });
}

/* ------------------------------------------------------------------ */
/* Avisos e confirmações no padrão visual do site                      */
/* ------------------------------------------------------------------ */
/* Substituem alert() e confirm() do navegador, que destoam de tudo.
   Montam o modal na hora (classes .modal-fundo/.modal-caixa do styles.css)
   e o removem ao fechar — nenhuma página precisa de HTML próprio.

   IMPORTANTE para quem for mexer: os callbacks aoConfirmar/aoCancelar são
   chamados DENTRO do clique do botão do modal. É isso que permite usar
   window.open neles sem cair no bloqueio de pop-up. */

function montarModalBase_(titulo, mensagem) {
  var fundo = document.createElement('div');
  fundo.className = 'modal-fundo';

  var caixa = document.createElement('div');
  caixa.className = 'vidro modal-caixa';
  caixa.setAttribute('role', 'alertdialog');
  caixa.setAttribute('aria-modal', 'true');

  var h2 = document.createElement('h2');
  h2.textContent = titulo;
  caixa.appendChild(h2);

  var p = document.createElement('p');
  p.textContent = mensagem;
  p.style.whiteSpace = 'pre-line'; // mensagens com \n (ex: lista de erros) quebram certo
  caixa.appendChild(p);

  var acoes = document.createElement('div');
  acoes.className = 'modal-acoes';
  caixa.appendChild(acoes);

  fundo.appendChild(caixa);
  return { fundo: fundo, acoes: acoes };
}

function botaoDeModal_(texto, classe, aoClicar) {
  var botao = document.createElement('button');
  botao.type = 'button';
  botao.className = classe;
  botao.textContent = texto;
  botao.addEventListener('click', aoClicar);
  return botao;
}

/** Aviso com um botão OK. Devolve uma Promise que resolve quando fechar. */
function mostrarAviso(mensagem, titulo) {
  return new Promise(function (resolve) {
    var m = montarModalBase_(titulo || 'Aviso', mensagem);
    var fechar = function () { m.fundo.remove(); resolve(); };
    var ok = botaoDeModal_('Entendi', 'botao', fechar);
    m.acoes.appendChild(ok);
    m.fundo.addEventListener('click', function (e) { if (e.target === m.fundo) fechar(); });
    document.body.appendChild(m.fundo);
    ok.focus();
  });
}

/**
 * Confirmação com dois caminhos nomeados (nada de "OK/Cancelar" genérico).
 * opcoes: { titulo, mensagem, textoConfirmar, textoCancelar, aoConfirmar, aoCancelar }
 * Clicar fora da caixa só fecha, sem escolher caminho nenhum.
 */
function mostrarConfirmacao(opcoes) {
  var m = montarModalBase_(opcoes.titulo || 'Confirmar', opcoes.mensagem || '');
  var fechar = function () { m.fundo.remove(); };

  var confirmar = botaoDeModal_(opcoes.textoConfirmar || 'Confirmar', 'botao', function () {
    fechar();
    if (opcoes.aoConfirmar) opcoes.aoConfirmar();
  });
  var cancelar = botaoDeModal_(opcoes.textoCancelar || 'Cancelar', 'botao-mini', function () {
    fechar();
    if (opcoes.aoCancelar) opcoes.aoCancelar();
  });

  m.acoes.appendChild(confirmar);
  m.acoes.appendChild(cancelar);
  m.fundo.addEventListener('click', function (e) { if (e.target === m.fundo) fechar(); });
  document.body.appendChild(m.fundo);
  confirmar.focus();
}
