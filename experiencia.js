/* =========================================================
   CENA 3D — lê a escolha feita em selecao.html e prepara a cena.
   Depende de dados.js (ANIMAIS, NIVEIS), carregado antes.
   ========================================================= */

const cena = document.querySelector('#cena');
const selecaoInfo = document.querySelector('#selecaoInfo');
const cubo = document.querySelector('#cuboTeste');

/* ---------------------------------------------------------
   1. LER A ESCOLHA QUE VEIO NA URL
   Exemplo: experiencia.html?animal=cobra&nivel=3
   --------------------------------------------------------- */
const parametros = new URLSearchParams(window.location.search);

const animal = buscarAnimal(parametros.get('animal'));
const nivel = buscarNivel(parametros.get('nivel'));

/* ---------------------------------------------------------
   2. MOSTRAR O QUE FOI SELECIONADO
   --------------------------------------------------------- */
if (animal && nivel) {
  selecaoInfo.innerHTML =
    `<strong>${animal.nome}</strong> &middot; Nível ${nivel.numero}: ${nivel.nome}` +
    `<br />Distância: ${nivel.distancia} m` +
    ` &middot; Movimento: ${nivel.movimento ? 'sim' : 'não'}` +
    ` &middot; Interação: ${nivel.interacao ? 'sim' : 'não'}`;
} else {
  // A URL veio sem parâmetros, ou com valores que não existem
  selecaoInfo.innerHTML =
    'Nenhuma seleção válida na URL. ' +
    '<a href="selecao.html">Escolher estímulo e nível</a>.';
}

/* ---------------------------------------------------------
   3. DEMONSTRAÇÃO TEMPORÁRIA
   Posiciona o cubo de teste na distância do nível escolhido,
   só para tornar visível que o dado chegou até a cena.
   Nas etapas 5 a 9 o cubo dá lugar ao modelo do animal.
   --------------------------------------------------------- */
if (nivel && cubo) {
  // Mesmo formato de texto usado no HTML: "X Y Z".
  // Z negativo = para a frente, longe de quem observa.
  cubo.setAttribute('position', '0 1 ' + (-nivel.distancia));
}

/* ---------------------------------------------------------
   4. CONFIRMAR QUE A CENA CARREGOU
   --------------------------------------------------------- */
cena.addEventListener('loaded', function () {
  console.log('Cena 3D carregada com sucesso.');
  console.log('Versão do A-Frame:', AFRAME.version);
  console.log('Animal:', animal ? animal.nome : '(nenhum)');
  console.log('Nível:', nivel ? nivel.numero : '(nenhum)');
});
