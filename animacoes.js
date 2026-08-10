/**
 * Revelação dos blocos conforme a pessoa rola a página.
 * Se o navegador não tiver IntersectionObserver (ou se a pessoa pediu menos
 * movimento), tudo aparece imediatamente — a página nunca fica invisível.
 */
(function () {
  var alvos = document.querySelectorAll('.revela');
  if (!alvos.length) return;

  var semMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  alvos.forEach(function (el) { observador.observe(el); });
})();
