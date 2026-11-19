/* =========================================================
   PREPARAR O VR BOX — a página que fica por fora
   ---------------------------------------------------------
   Faz o que só pode ser feito com o celular ainda na mão:

   1. mostrar se o controle Bluetooth foi reconhecido, e como;
   2. ajustar o afastamento das duas imagens às lentes;
   3. entrar em tela cheia, deitar a tela e mantê-la acesa —
      o navegador só permite isso depois de um toque da pessoa.

   Depois, a experiência roda num quadro dentro desta página
   (ver o comentário em vrbox.html). Esta página continua
   viva por trás e cuida de três coisas:

   - repassar o controle ao quadro, se ele não o enxergar
     sozinho;
   - perceber quando a experiência termina (foi para o
     questionário ou para a seleção) e sair da tela cheia;
   - oferecer a volta à tela cheia, se ela cair.

   Depende de dados.js (buscarAnimal, buscarNivel).
   ========================================================= */

const parametros = new URLSearchParams(window.location.search);
const animal = buscarAnimal(parametros.get('animal'));
const nivel = buscarNivel(parametros.get('nivel'));

const preparo = document.querySelector('#preparo');
const palco = document.querySelector('#palco');
const quadro = document.querySelector('#quadro');
const botaoEntrar = document.querySelector('#entrar');
const botaoRetomar = document.querySelector('#retomar');
const nota = document.querySelector('#notaAparelho');

/* ---------------------------------------------------------
   O QUE FOI ESCOLHIDO
   --------------------------------------------------------- */
const escolha = document.querySelector('#escolha');

if (!animal || !nivel) {
  escolha.innerHTML = 'Nenhum estímulo escolhido. <a href="selecao.html">Escolher agora</a>.';
  botaoEntrar.disabled = true;
} else {
  escolha.innerHTML =
    `<strong>${animal.icone} ${animal.nome}</strong> &middot; ` +
    `começando no <strong>nível ${nivel.numero}</strong> (${nivel.nome})`;
}

/* O que este aparelho não oferece, dito antes de entrar. */
const ehIphone = /iPhone|iPod/.test(navigator.userAgent);
if (ehIphone) {
  nota.textContent =
    'No iPhone o navegador não permite tela cheia: a barra de endereço '
    + 'continua visível. Funciona, mas um celular Android fica melhor no VR Box.';
} else if (!document.documentElement.requestFullscreen) {
  nota.textContent = 'Este navegador não permite tela cheia. Use o Chrome.';
}

/* =========================================================
   1. TESTE DO CONTROLE

   O controle do VR Box tem modos, trocados por combinações de
   botões descritas no manual dele. Para esta experiência:

   - MODO JOGO (gamepad): o melhor. O navegador enxerga o
     joystick e os botões.
   - MODO TECLADO: também serve. O joystick chega como setas e
     os botões como teclas.
   - MODO MÍDIA/VÍDEO (o que costuma vir ligado): os botões
     mexem no volume e no player, e o navegador não recebe
     nada. Se nada aparecer aqui, é provavelmente esse.
   ========================================================= */
const caixaControle = document.querySelector('#controle');
const situacao = document.querySelector('#controleSituacao');
const detalhe = document.querySelector('#controleDetalhe');

let ultimaTecla = null;

function primeiroGamepad() {
  if (!navigator.getGamepads) {
    return null;
  }
  const lista = navigator.getGamepads();
  for (let i = 0; i < lista.length; i++) {
    if (lista[i]) {
      return lista[i];
    }
  }
  return null;
}

function mostrarControle() {
  const gamepad = primeiroGamepad();

  if (gamepad) {
    const apertados = [];
    gamepad.buttons.forEach(function (botao, indice) {
      if (botao.pressed) {
        apertados.push(indice);
      }
    });
    const eixos = Array.prototype.slice.call(gamepad.axes, 0, 2)
      .map(function (v) { return v.toFixed(2); }).join(' , ');

    caixaControle.classList.add('controle--ok');
    situacao.textContent = 'Controle reconhecido (modo jogo).';
    detalhe.textContent =
      `${gamepad.id} · joystick: ${eixos || '—'} · botões apertados: `
      + (apertados.length ? apertados.join(', ') : 'nenhum');
  } else if (ultimaTecla) {
    caixaControle.classList.add('controle--ok');
    situacao.textContent = 'Controle reconhecido como teclado.';
    detalhe.textContent = `Última tecla: ${ultimaTecla}. Setas andam; as outras selecionam.`;
  }

  if (palco.hidden) {
    requestAnimationFrame(mostrarControle);
  }
}

window.addEventListener('keydown', function (evento) {
  if (palco.hidden) {
    ultimaTecla = evento.key === ' ' ? 'Espaço' : evento.key;
  }
});

mostrarControle();

/* =========================================================
   2. AJUSTE DAS IMAGENS

   O número é a distância entre os centros das duas imagens,
   como fração da largura da tela. 0,5 divide a tela ao meio.
   Fica guardado neste aparelho: a medida das lentes não muda.
   ========================================================= */
const CHAVE_SEPARACAO = 'vr-exposicao:vrbox-separacao';
const campoSeparacao = document.querySelector('#separacao');
const valorSeparacao = document.querySelector('#separacaoValor');

function lerSeparacao() {
  try {
    const guardada = parseFloat(localStorage.getItem(CHAVE_SEPARACAO));
    if (guardada >= 0.38 && guardada <= 0.5) {
      return guardada;
    }
  } catch (erro) { /* navegação anônima */ }
  return 0.5;
}

function mostrarSeparacao() {
  const valor = parseFloat(campoSeparacao.value);
  valorSeparacao.textContent = valor >= 0.5
    ? 'padrão (tela dividida ao meio)'
    : `${Math.round(valor * 100)}% da largura da tela`;
}

campoSeparacao.value = lerSeparacao();
mostrarSeparacao();

campoSeparacao.addEventListener('input', function () {
  mostrarSeparacao();
  try {
    localStorage.setItem(CHAVE_SEPARACAO, campoSeparacao.value);
  } catch (erro) { /* navegação anônima */ }
});

/* ---------- testar: duas cruzes onde ficam os centros ---------- */
const testeAjuste = document.querySelector('#testeAjuste');

function posicionarCruzes() {
  const separacao = parseFloat(campoSeparacao.value);
  document.querySelector('#cruzEsquerda').style.left = `${(0.5 - separacao / 2) * 100}%`;
  document.querySelector('#cruzDireita').style.left = `${(0.5 + separacao / 2) * 100}%`;
}

document.querySelector('#testarAjuste').addEventListener('click', function () {
  posicionarCruzes();
  testeAjuste.hidden = false;
  pedirTelaCheia();
});

testeAjuste.addEventListener('click', function () {
  testeAjuste.hidden = true;
  sairDaTelaCheia();
});

/* =========================================================
   3. TELA CHEIA, TELA DEITADA, TELA ACESA

   Todas exigem um toque da pessoa, e por isso são pedidas
   dentro do clique em "Entrar". Nenhuma falha é fatal: sem
   tela cheia, a experiência ainda funciona, com a barra do
   navegador à vista.
   ========================================================= */
function pedirTelaCheia() {
  const raiz = document.documentElement;
  if (!raiz.requestFullscreen || document.fullscreenElement) {
    return Promise.resolve();
  }
  return raiz.requestFullscreen({ navigationUI: 'hide' })
    .then(function () {
      if (screen.orientation && screen.orientation.lock) {
        return screen.orientation.lock('landscape').catch(function () {});
      }
    })
    .catch(function () {});
}

function sairDaTelaCheia() {
  if (screen.orientation && screen.orientation.unlock) {
    try { screen.orientation.unlock(); } catch (erro) { /* sem trava */ }
  }
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(function () {});
  }
}

function manterTelaAcesa() {
  if (navigator.wakeLock && document.visibilityState === 'visible') {
    navigator.wakeLock.request('screen').catch(function () {});
  }
}

/* No iPhone, os sensores de movimento precisam de permissão,
   pedida com um toque. Dentro da caixa não haveria como tocar. */
function pedirSensores() {
  if (typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function') {
    return DeviceOrientationEvent.requestPermission().catch(function () {});
  }
  return Promise.resolve();
}

/* =========================================================
   4. ENTRAR
   ========================================================= */
botaoEntrar.addEventListener('click', function () {
  if (!animal || !nivel) {
    return;
  }

  /* os dois pedidos saem juntos, ainda dentro do toque */
  pedirSensores();
  pedirTelaCheia();
  manterTelaAcesa();

  /* Se o controle já apareceu no teste, a experiência começa
     sabendo: a seleção pelo olhar fica desligada desde o início,
     e só um botão dá a partida. */
  const viuControle = Boolean(primeiroGamepad()) || Boolean(ultimaTecla);

  const separacao = parseFloat(campoSeparacao.value);
  quadro.src = `experiencia.html?animal=${animal.id}&nivel=${nivel.numero}`
    + `&vrbox=1&preparar=1&sep=${separacao}`
    + (viuControle ? '&controle=1' : '');

  preparo.hidden = true;
  palco.hidden = false;
  repassarControle();
});

/* =========================================================
   5. ENQUANTO A EXPERIÊNCIA RODA
   ========================================================= */

/* ---------- a experiência terminou? ----------
   A cada página carregada no quadro, confere onde ele está.
   Se saiu da experiência — foi para o questionário final ou
   para a seleção —, a página inteira vai junto, fora da tela
   cheia: o questionário é respondido com o celular na mão. */
quadro.addEventListener('load', function () {
  let endereco;
  try {
    endereco = quadro.contentWindow.location;
  } catch (erro) {
    return;
  }

  if (!/experiencia(\.html)?$/.test(endereco.pathname)) {
    sairDaTelaCheia();
    window.location.href = endereco.href;
    return;
  }

  /* as teclas do controle (modo teclado) vão para quem tem o foco */
  quadro.contentWindow.focus();
});

/* ---------- repassar o controle ----------
   Em alguns celulares, o quadro não enxerga o controle por
   conta própria. Esta página enxerga e repassa o estado a cada
   quadro; a experiência só usa o repasse se não tiver o seu. */
function repassarControle() {
  if (palco.hidden) {
    return;
  }

  const gamepad = primeiroGamepad();
  const janela = quadro.contentWindow;

  if (gamepad && janela) {
    try {
      janela.__controleExterno = {
        id: gamepad.id,
        mapping: gamepad.mapping,
        buttons: gamepad.buttons.map(function (b) { return { pressed: b.pressed }; }),
        axes: Array.prototype.slice.call(gamepad.axes),
        recebidoEm: janela.performance.now()
      };
    } catch (erro) { /* quadro trocando de página */ }
  }

  requestAnimationFrame(repassarControle);
}

/* Teclas que chegarem aqui, e não no quadro (o foco escapou),
   são repassadas a ele. */
['keydown', 'keyup'].forEach(function (tipo) {
  window.addEventListener(tipo, function (evento) {
    if (palco.hidden || !quadro.contentWindow) {
      return;
    }
    try {
      const JanelaTeclado = quadro.contentWindow.KeyboardEvent;
      quadro.contentWindow.dispatchEvent(new JanelaTeclado(tipo, {
        key: evento.key, code: evento.code, repeat: evento.repeat, cancelable: true
      }));
      evento.preventDefault();
    } catch (erro) { /* quadro trocando de página */ }
  });
});

/* ---------- se a tela cheia cair ----------
   Um gesto de "voltar" do Android ou uma notificação tiram a
   página da tela cheia. Um toque em qualquer lugar a devolve. */
document.addEventListener('fullscreenchange', function () {
  if (palco.hidden || !document.documentElement.requestFullscreen) {
    return;
  }
  botaoRetomar.hidden = Boolean(document.fullscreenElement);
});

botaoRetomar.addEventListener('click', function () {
  pedirTelaCheia();
  manterTelaAcesa();
  botaoRetomar.hidden = true;
  if (quadro.contentWindow) {
    quadro.contentWindow.focus();
  }
});

document.addEventListener('visibilitychange', function () {
  if (!palco.hidden) {
    manterTelaAcesa();
  }
});
