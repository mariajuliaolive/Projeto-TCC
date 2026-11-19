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
    /* todos os eixos, e não só os dois primeiros: o joystick pode
       vir em outro par, e um eixo parado em -1 ou 1 mostra que
       o controle informa um eixo que não existe */
    const eixos = Array.prototype.slice.call(gamepad.axes)
      .map(function (v, i) { return `${i}: ${v.toFixed(2)}`; }).join('  ');

    caixaControle.classList.add('controle--ok');
    situacao.textContent = 'Controle reconhecido (modo jogo).';
    detalhe.textContent =
      `${gamepad.id} · padrão: ${gamepad.mapping || 'não'} · `
      + `${gamepad.buttons.length} botões · eixos ${eixos || '—'} · apertados agora: `
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

/* ---------------------------------------------------------
   REGISTRO DO QUE O CONTROLE MANDA

   Cada modo do controle manda uma coisa diferente: o modo jogo
   manda botões e eixos; o modo teclado, teclas; o modo mouse,
   cliques e movimento de ponteiro. Listar tudo o que chega, na
   ordem, mostra em qual modo ele está — e se o que chega é algo
   que a experiência entende.
   --------------------------------------------------------- */
const registro = document.querySelector('#controleRegistro');
const anteriores = { botoes: [], eixos: [] };

function registrar(texto) {
  if (!palco.hidden) {
    return;
  }
  const item = document.createElement('li');
  item.textContent = texto;
  registro.prepend(item);
  while (registro.children.length > 8) {
    registro.removeChild(registro.lastChild);
  }
}

function vigiarGamepad() {
  const gamepad = primeiroGamepad();
  if (gamepad) {
    gamepad.buttons.forEach(function (botao, i) {
      const apertado = botao.pressed || botao.value > 0.5;
      if (apertado !== Boolean(anteriores.botoes[i])) {
        registrar(`jogo · botão ${i} ${apertado ? 'apertado' : 'solto'}`);
      }
      anteriores.botoes[i] = apertado;
    });
    gamepad.axes.forEach(function (v, i) {
      const antes = anteriores.eixos[i];
      if (antes === undefined || Math.abs(v - antes) > 0.4) {
        registrar(`jogo · eixo ${i} = ${v.toFixed(2)}`);
        anteriores.eixos[i] = v;
      }
    });
  }
  if (palco.hidden) {
    requestAnimationFrame(vigiarGamepad);
  }
}
vigiarGamepad();

window.addEventListener('gamepadconnected', function (evento) {
  registrar(`jogo · conectado: ${evento.gamepad.id}`);
});
window.addEventListener('keydown', function (evento) {
  registrar(`teclado · ${evento.key} (${evento.code || 'sem código'})`);
});
['pointerdown', 'wheel'].forEach(function (tipo) {
  window.addEventListener(tipo, function (evento) {
    if (evento.target.closest && evento.target.closest('button, a, input')) {
      return;
    }
    registrar(tipo === 'wheel'
      ? 'mouse · rodinha'
      : `${evento.pointerType || 'toque'} · clique na tela`);
  });
});

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
        buttons: gamepad.buttons.map(function (b) { return { pressed: b.pressed, value: b.value }; }),
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

/* =========================================================
   6. CALIBRAR O JOYSTICK

   Duas perguntas: para onde vai "frente" e para onde vai
   "direita". A resposta fica guardada neste aparelho e a
   experiência gira a leitura do controle de acordo (ver
   joystick.js). Sem isso, um controle feito para ser segurado
   de lado anda de lado quando se empurra para a frente.
   ========================================================= */
const caixaCalibrar = document.querySelector('.calibrar');
const textoCalibrar = document.querySelector('#calibrarTexto');
const botaoCalibrar = document.querySelector('#calibrar');
const botaoApagar = document.querySelector('#apagarCalibracao');

let calibrando = null;          // 'frente' | 'direita' | null
let leituraFrente = null;
let empurradoDesde = 0;
let ultimaLeitura = null;
const estadoCalibracao = JOYSTICK.novoEstado();

function mostrarCalibracao() {
  let guardada = null;
  try {
    guardada = JSON.parse(localStorage.getItem('vr-exposicao:vrbox-joystick'));
  } catch (erro) { /* nada guardado */ }
  botaoApagar.hidden = !guardada;
  if (!calibrando) {
    textoCalibrar.textContent = guardada
      ? 'Joystick calibrado neste celular. Se ainda andar torto, calibre de novo.'
      : 'Para andar na direção certa, calibre o joystick: toque no botão e '
        + 'siga o que aparecer aqui.';
  }
}

function pedir(qual) {
  calibrando = qual;
  empurradoDesde = 0;
  caixaCalibrar.classList.add('calibrar--ativa');
  textoCalibrar.textContent = qual === 'frente'
    ? 'Empurre o joystick para a FRENTE e segure…'
    : 'Agora empurre para a DIREITA e segure…';
}

/* A leitura de agora: do joystick ou de uma seta do teclado. */
let setaApertada = null;
window.addEventListener('keydown', function (evento) {
  const v = JOYSTICK.vetorDaTecla(evento);
  if (v && calibrando) {
    setaApertada = v;
    evento.preventDefault();
  }
});
window.addEventListener('keyup', function (evento) {
  if (JOYSTICK.vetorDaTecla(evento)) {
    setaApertada = null;
  }
});

function leituraAtual() {
  if (setaApertada) {
    return setaApertada;
  }
  const gamepad = primeiroGamepad();
  if (!gamepad) {
    return { x: 0, y: 0 };
  }
  return JOYSTICK.lerEixos(Array.prototype.slice.call(gamepad.axes), estadoCalibracao);
}

function acompanharCalibracao() {
  if (!calibrando) {
    return;
  }
  const v = leituraAtual();
  const forca = Math.hypot(v.x, v.y);

  if (forca > 0.6) {
    if (!empurradoDesde) {
      empurradoDesde = performance.now();
    }
    ultimaLeitura = { x: v.x / forca, y: v.y / forca };

    /* segurou por um terço de segundo: vale */
    if (performance.now() - empurradoDesde > 350) {
      if (calibrando === 'frente') {
        leituraFrente = ultimaLeitura;
        calibrando = 'esperandoSoltar';
        textoCalibrar.textContent = 'Pode soltar.';
      } else if (calibrando === 'direita') {
        const calibracao = JOYSTICK.calcularCalibracao(leituraFrente, ultimaLeitura);
        JOYSTICK.guardarCalibracao(calibracao);
        calibrando = null;
        caixaCalibrar.classList.remove('calibrar--ativa');
        textoCalibrar.textContent = 'Pronto! Joystick calibrado'
          + (calibracao.espelhado ? ' (estava invertido).' : '.');
        botaoApagar.hidden = false;
        return;
      }
    }
  } else {
    empurradoDesde = 0;
    if (calibrando === 'esperandoSoltar') {
      pedir('direita');
    }
  }
  requestAnimationFrame(acompanharCalibracao);
}

botaoCalibrar.addEventListener('click', function () {
  pedir('frente');
  acompanharCalibracao();
});

botaoApagar.addEventListener('click', function () {
  JOYSTICK.apagarCalibracao();
  mostrarCalibracao();
});

mostrarCalibracao();

/* =========================================================
   7. MARCHAR NO LUGAR (ligado ou desligado)
   ========================================================= */
const campoMarcha = document.querySelector('#marcha');
try {
  campoMarcha.checked = localStorage.getItem('vr-exposicao:vrbox-marcha') !== 'nao';
} catch (erro) { /* navegação anônima */ }

campoMarcha.addEventListener('change', function () {
  try {
    localStorage.setItem('vr-exposicao:vrbox-marcha', campoMarcha.checked ? 'sim' : 'nao');
  } catch (erro) { /* navegação anônima */ }
});
