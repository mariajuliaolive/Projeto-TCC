/* =========================================================
   CENA 3D — lê a escolha feita em selecao.html, prepara a cena
   e ajusta os controles ao dispositivo.
   Depende de dados.js (ANIMAIS, NIVEIS), carregado antes.
   ========================================================= */

const cena = document.querySelector('#cena');
const camera = document.querySelector('#camera');
const mira = document.querySelector('#mira');
const cubo = document.querySelector('#cuboTeste');

const selecaoInfo = document.querySelector('#selecaoInfo');
const ajuda = document.querySelector('#ajuda');

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
   4. ADAPTAR OS CONTROLES AO DISPOSITIVO
   No computador existe teclado; no celular e no óculos, não.
   O A-Frame nos diz em qual caso estamos.
   --------------------------------------------------------- */
const ehMobile = AFRAME.utils.device.isMobile();

if (ehMobile) {
  // Sem teclado: a mira dispara olhando fixo por um tempo (fuse)
  mira.setAttribute('fuse', true);
  ajuda.textContent = 'Gire o aparelho para olhar em volta. '
    + 'Mire em um objeto e segure o olhar para selecionar.';
} else {
  ajuda.textContent = 'Arraste o mouse para olhar. '
    + 'Use W A S D para andar. Clique para selecionar.';
}

/* ---------------------------------------------------------
   5. INTERAÇÃO DE TESTE
   Semente do Nível 5: qualquer objeto com a classe "clicavel"
   responde à mira. Aqui o cubo apenas troca de cor.
   --------------------------------------------------------- */
if (cubo) {
  cubo.addEventListener('click', function () {
    const corAtual = cubo.getAttribute('material').color;
    const novaCor = corAtual === '#4C6EF5' ? '#E8B84B' : '#4C6EF5';
    cubo.setAttribute('color', novaCor);
    console.log('Cubo selecionado. Nova cor:', novaCor);
  });
}

/* ---------------------------------------------------------
   6. CONFIRMAR QUE A CENA CARREGOU
   --------------------------------------------------------- */
cena.addEventListener('loaded', function () {
  console.log('Cena 3D carregada com sucesso.');
  console.log('Versão do A-Frame:', AFRAME.version);
  console.log('Animal:', animal ? animal.nome : '(nenhum)');
  console.log('Nível:', nivel ? nivel.numero : '(nenhum)');
  console.log('Dispositivo móvel:', ehMobile);
  console.log('Altura dos olhos:', camera.getAttribute('position').y, 'm');
});

/* ---------------------------------------------------------
   7. AVISAR SE O NAVEGADOR SUPORTA VR
   --------------------------------------------------------- */
cena.addEventListener('enter-vr', function () {
  console.log('Entrou no modo VR.');
});

cena.addEventListener('exit-vr', function () {
  console.log('Saiu do modo VR.');
});
