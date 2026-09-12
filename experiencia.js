// Arquivo principal de JavaScript do protótipo.
// Por enquanto ele só verifica se tudo carregou corretamente.

// Pegamos a cena 3D pelo id que definimos no index.html
const cena = document.querySelector('#cena');

// 'loaded' é um evento do A-Frame: dispara quando a cena terminou de carregar
cena.addEventListener('loaded', function () {
  console.log('Cena 3D carregada com sucesso.');
  console.log('Versão do A-Frame:', AFRAME.version);
});
