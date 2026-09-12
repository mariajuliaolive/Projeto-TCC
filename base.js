/* =========================================================
   JavaScript da página inicial.
   Só duas funções: abrir o menu no celular e revelar as
   seções conforme a rolagem. Nada além disso é necessário —
   o botão "Iniciar experiência" é um link comum.
   ========================================================= */

/* ---------------------------------------------------------
   1. MENU DO CELULAR
   --------------------------------------------------------- */
const menuBotao = document.querySelector('#menuBotao');
const menu = document.querySelector('#menu');

menuBotao.addEventListener('click', function () {
  // Lê o estado atual a partir do próprio HTML
  const estaAberto = menuBotao.getAttribute('aria-expanded') === 'true';

  // Inverte o estado
  menuBotao.setAttribute('aria-expanded', String(!estaAberto));
  menu.classList.toggle('aberto');
});

// Fecha o menu depois de clicar em um item
menu.addEventListener('click', function (evento) {
  if (evento.target.tagName === 'A') {
    menuBotao.setAttribute('aria-expanded', 'false');
    menu.classList.remove('aberto');
  }
});

/* ---------------------------------------------------------
   2. REVELAR SEÇÕES AO ROLAR
   --------------------------------------------------------- */
const elementosRevelaveis = document.querySelectorAll('.revelar');

const observador = new IntersectionObserver(function (entradas) {
  entradas.forEach(function (entrada) {
    if (entrada.isIntersecting) {
      entrada.target.classList.add('visivel');
      observador.unobserve(entrada.target);   // anima uma vez só
    }
  });
}, {
  threshold: 0.15                             // dispara com 15% do elemento visível
});

elementosRevelaveis.forEach(function (elemento) {
  observador.observe(elemento);
});
