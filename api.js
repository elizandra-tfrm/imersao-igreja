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
