/**
 * Animações do site — mesma linguagem de movimento da landing page do livro.
 *
 * 1) Borboleta "viva": igual à landing, a borboleta não é um GIF — são 4
 *    quadros PNG trocados por JavaScript a cada 200ms, na sequência
 *    1-2-3-4-3-2 (abre e fecha as asas). A deriva pelo ar fica por conta
 *    dos keyframes CSS já aplicados no elemento.
 * 2) Revelação por rolagem: blocos .revela surgem quando entram na tela,
 *    com os mesmos valores do Reveal da landing (y:40, 0.9s, ease luxury).
 */
(function () {
  var semMovimento = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Borboletas de asas batendo ─────────────────────────── */

  var FRAMES = ['img/borboleta-1.png', 'img/borboleta-2.png', 'img/borboleta-3.png', 'img/borboleta-4.png'];
  var SEQUENCIA = [0, 1, 2, 3, 2, 1]; // abre → fecha, como na landing

  function iniciarBorboletas() {
    var borboletas = document.querySelectorAll('img.borboleta, img.borboleta-fundo');
    if (!borboletas.length) return;

    // Pré-carrega os 4 quadros uma única vez para a troca não piscar.
    FRAMES.forEach(function (src) { var im = new Image(); im.src = src; });

    if (semMovimento) return; // ficam paradas no quadro de asas abertas

    var passo = 0;
    setInterval(function () {
      passo = (passo + 1) % SEQUENCIA.length;
      var src = FRAMES[SEQUENCIA[passo]];
      borboletas.forEach(function (img) { img.src = src; });
    }, 200);
  }

  iniciarBorboletas();

  /* ── Revelação por rolagem ──────────────────────────────── */

  var alvos = document.querySelectorAll('.revela');
  if (!alvos.length) return;

  if (semMovimento || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visivel'); });
    return;
  }

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -80px 0px' });

  alvos.forEach(function (el) { observador.observe(el); });
})();
