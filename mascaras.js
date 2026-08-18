/**
 * Máscaras de digitação — só afetam o que a pessoa vê.
 * O que é enviado ao backend (e daí ao PagBank) vai sempre em números puros,
 * via somenteNumeros(), porque a API do PagBank espera CPF e telefone sem pontuação.
 */

function somenteNumeros(texto) {
  return String(texto || '').replace(/\D/g, '');
}

/** 12345678901 -> 123.456.789-01 (formata parcialmente enquanto digita) */
function mascaraCPF(texto) {
  var d = somenteNumeros(texto).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + '.' + d.slice(3);
  if (d.length <= 9) return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6);
  return d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
}

/** 67999999999 -> (67) 99999-9999 · aceita fixo (10) e celular (11) */
function mascaraTelefone(texto) {
  var d = somenteNumeros(texto).slice(0, 13);
  /* Quem digita o número com o código do país (55 + DDD + número, 12-13
     dígitos) não pode perder o FIM do número — aconteceu de verdade: o campo
     enchia com o 55 e os dois últimos dígitos nem entravam. O 55 é descartado
     assim que o 12º dígito chega. Com 11 dígitos começando em 55 nada é
     feito: 55 também é um DDD real (região de Santa Maria-RS). */
  if (d.length >= 12 && d.indexOf('55') === 0) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return '(' + d;
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

/**
 * Liga uma máscara a um campo, preservando a posição do cursor quando a pessoa
 * edita no meio do texto (senão o cursor pula para o fim a cada tecla).
 */
function aplicarMascara(input, formatar) {
  if (!input) return;
  input.addEventListener('input', function () {
    var posicao = input.selectionStart;
    var tamanhoAntes = input.value.length;
    var digitosAteCursor = somenteNumeros(input.value.slice(0, posicao)).length;

    input.value = formatar(input.value);

    // Reposiciona o cursor depois do mesmo dígito em que ele estava.
    if (posicao < tamanhoAntes) {
      var contador = 0, novaPosicao = input.value.length;
      for (var i = 0; i < input.value.length; i++) {
        if (/\d/.test(input.value[i])) contador++;
        if (contador === digitosAteCursor) { novaPosicao = i + 1; break; }
      }
      input.setSelectionRange(novaPosicao, novaPosicao);
    }
  });
}

/** Campo que aceita apenas dígitos (idade, quantidade de filhos). */
function apenasDigitos(input) {
  if (!input) return;
  input.addEventListener('input', function () {
    input.value = somenteNumeros(input.value);
  });
}

/** E-mail: tira espaços e deixa em minúsculas quando a pessoa sai do campo. */
function normalizarEmail(input) {
  if (!input) return;
  input.addEventListener('blur', function () {
    input.value = input.value.trim().toLowerCase();
  });
}
