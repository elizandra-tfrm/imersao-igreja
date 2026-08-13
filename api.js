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
