/* =========================================================
   CENA 3D — lê a escolha feita em selecao.html, carrega o
   modelo do animal e ajusta os controles ao dispositivo.
   Depende de dados.js (ANIMAIS, NIVEIS), carregado antes.
   ========================================================= */

const cena = document.querySelector('#cena');
const camera = document.querySelector('#camera');
const mira = document.querySelector('#mira');

const animalEl = document.querySelector('#animal');
const modeloEl = document.querySelector('#animalModelo');
const apoioEl = document.querySelector('#animalApoio');

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
    `<strong>${animal.icone} ${animal.nome}</strong> &middot; ` +
    `Nível ${nivel.numero}: ${nivel.nome}` +
    `<br />Distância: ${nivel.distancia} m` +
    ` &middot; Tamanho real: ${animal.tamanhoReal} m`;
} else {
  selecaoInfo.innerHTML =
    'Nenhuma seleção válida na URL. ' +
    '<a href="selecao.html">Escolher estímulo e nível</a>.';
}

/* ---------------------------------------------------------
   3. POSICIONAR O ANIMAL NA DISTÂNCIA DO NÍVEL
   Z negativo = para a frente, longe de quem observa.
   --------------------------------------------------------- */
if (nivel) {
  animalEl.setAttribute('position', '0 0 ' + (-nivel.distancia));
}

/* ---------------------------------------------------------
   4. A CAIXA PROVISÓRIA
   Enquanto não existir o arquivo 3D, mostramos uma caixa com
   o tamanho REAL do animal. Assim já dá para avaliar escala e
   distância antes de ter o modelo em mãos.
   --------------------------------------------------------- */
function mostrarApoio(tamanho) {
  apoioEl.setAttribute('width', tamanho);
  apoioEl.setAttribute('height', tamanho * 0.4);
  apoioEl.setAttribute('depth', tamanho * 0.4);
  // sobe metade da altura para a caixa apoiar no chão
  apoioEl.setAttribute('position', '0 ' + (tamanho * 0.2) + ' 0');
  apoioEl.setAttribute('visible', true);
}

/* ---------------------------------------------------------
   5. AJUSTAR O MODELO 3D CARREGADO

   Dois problemas que todo modelo baixado traz:

   a) Escala imprevisível. Um arquivo pode vir em centímetros,
      outro em metros, outro numa unidade arbitrária. Em vez de
      adivinhar, medimos o modelo e calculamos o fator que o
      deixa com o tamanho real informado em dados.js.

   b) Origem em lugar qualquer. O ponto (0,0,0) do arquivo pode
      estar no centro do bicho, ou acima dele. Medimos onde fica
      a base e deslocamos para ela encostar no chão.
   --------------------------------------------------------- */
function ajustarModelo(elemento, tamanhoReal) {
  const objeto = elemento.getObject3D('mesh');
  if (!objeto) {
    return;
  }

  // Box3 é uma "caixa invisível" que envolve o modelo inteiro
  const caixa = new AFRAME.THREE.Box3().setFromObject(objeto);
  const medidas = new AFRAME.THREE.Vector3();
  caixa.getSize(medidas);

  const maiorLado = Math.max(medidas.x, medidas.y, medidas.z);
  if (maiorLado === 0) {
    return;
  }

  // (a) escala
  const fator = tamanhoReal / maiorLado;
  elemento.setAttribute('scale', `${fator} ${fator} ${fator}`);

  // (b) apoiar no chão: a base do modelo, já escalada, sobe até y = 0
  const baseY = caixa.min.y * fator;
  elemento.setAttribute('position', '0 ' + (-baseY) + ' 0');

  console.log(
    `Modelo medido: ${medidas.x.toFixed(2)} x ${medidas.y.toFixed(2)} x ` +
    `${medidas.z.toFixed(2)} unidades. Fator aplicado: ${fator.toFixed(4)}`
  );
}

/* ---------------------------------------------------------
   6. CARREGAR O MODELO DO ANIMAL

   Se o arquivo não existir ainda, o evento "model-error"
   dispara e a caixa provisória continua no lugar.
   --------------------------------------------------------- */
if (animal) {
  mostrarApoio(animal.tamanhoReal);
  modeloEl.setAttribute('rotation', animal.rotacao);

  modeloEl.addEventListener('model-loaded', function () {
    ajustarModelo(modeloEl, animal.tamanhoReal);
    apoioEl.setAttribute('visible', false);   // esconde a caixa
    console.log('Modelo carregado:', animal.modelo);
  });

  modeloEl.addEventListener('model-error', function () {
    console.warn(
      `Modelo não encontrado: ${animal.modelo}. ` +
      'Mostrando a caixa provisória. Coloque o arquivo .glb em assets/models/.'
    );
  });

  modeloEl.setAttribute('gltf-model', 'url(' + animal.modelo + ')');
}

/* ---------------------------------------------------------
   7. ADAPTAR OS CONTROLES AO DISPOSITIVO
   No computador existe teclado; no celular e no óculos, não.
   --------------------------------------------------------- */
const ehMobile = AFRAME.utils.device.isMobile();

if (ehMobile) {
  mira.setAttribute('fuse', true);
  ajuda.textContent = 'Gire o aparelho para olhar em volta. '
    + 'Mire no animal e segure o olhar para selecionar.';
} else {
  ajuda.textContent = 'Arraste o mouse para olhar. '
    + 'Use W A S D para andar. Clique para selecionar.';
}

/* ---------------------------------------------------------
   8. INTERAÇÃO DE TESTE
   Semente do Nível 5: por enquanto só registra no console.
   --------------------------------------------------------- */
animalEl.addEventListener('click', function () {
  console.log('Animal selecionado pela mira.');
});

/* ---------------------------------------------------------
   9. CONFIRMAR QUE A CENA CARREGOU
   --------------------------------------------------------- */
cena.addEventListener('loaded', function () {
  console.log('Cena 3D carregada com sucesso.');
  console.log('Versão do A-Frame:', AFRAME.version);
  console.log('Animal:', animal ? animal.nome : '(nenhum)');
  console.log('Nível:', nivel ? nivel.numero : '(nenhum)');
  console.log('Dispositivo móvel:', ehMobile);
  console.log('Altura dos olhos:', camera.getAttribute('position').y, 'm');
});

cena.addEventListener('enter-vr', function () {
  console.log('Entrou no modo VR.');
});

cena.addEventListener('exit-vr', function () {
  console.log('Saiu do modo VR.');
});
