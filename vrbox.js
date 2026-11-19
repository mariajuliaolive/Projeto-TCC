/* =========================================================
   MODO VR BOX — o celular dentro de um óculos de encaixe
   ---------------------------------------------------------
   O VR Box é uma caixa com duas lentes: o celular entra na
   frente, deitado, e cada olho enxerga METADE da tela. Não
   há nada de eletrônico nele. Quem faz a Realidade Virtual
   é o próprio celular, e para isso precisa de três coisas
   que o modo normal não tem:

   1. DUAS IMAGENS. Cada metade da tela mostra a cena vista
      de um olho, com 6,4 cm de distância entre eles — a
      distância média entre os olhos de um adulto. É essa
      pequena diferença que o cérebro transforma em
      profundidade.

   2. OUTRA FORMA DE SELECIONAR. Com o celular dentro da
      caixa, não há tela para tocar. Seleciona-se com o
      círculo no centro da visão (a "mira"): mira-se e aperta
      um botão do controle Bluetooth — ou, sem controle,
      segura-se o olhar até o círculo fechar.

   3. OUTRA FORMA DE ANDAR. O joystick do controle substitui
      o círculo "andar" desenhado na tela.

   POR QUE NÃO O BOTÃO "VR" DO A-FRAME

   O botão do A-Frame só funciona no celular se o navegador
   tiver suporte a WebXR para óculos de encaixe — e isso varia
   de aparelho para aparelho. Este modo não depende de nada
   disso: dividir a tela em duas é desenho comum, e funciona
   em qualquer celular que já rode a experiência.

   COMO SE LIGA

   Pela página vrbox.html, que coloca esta experiência em
   tela cheia e acrescenta "vrbox=1" ao endereço. Também dá
   para abrir direto, para testar no computador:

       experiencia.html?animal=rato&nivel=1&vrbox=1

   Este arquivo é carregado DEPOIS do A-Frame e ANTES de
   experiencia.js, que consulta MODO_VRBOX.
   ========================================================= */

const MODO_VRBOX = new URLSearchParams(window.location.search).get('vrbox') === '1';

if (MODO_VRBOX) {
  /* A classe esconde a camada de HTML (o círculo "andar" e o
     botão VR do A-Frame): dentro da caixa ninguém alcança a
     tela, e eles apareceriam desenhados por cima das lentes. */
  document.documentElement.classList.add('vrbox');

  /* No iPhone, o A-Frame pede permissão para usar os sensores
     com uma caixa de diálogo que exige um toque — impossível
     com o celular dentro do óculos. A permissão é pedida antes,
     na página vrbox.html, quando a pessoa ainda tem o celular na
     mão. */
  const cenaVrbox = document.querySelector('a-scene');
  if (cenaVrbox) {
    cenaVrbox.setAttribute('device-orientation-permission-ui', 'enabled', false);
  }
}

/* ---------------------------------------------------------
   ONDE A PESSOA ESTAVA OLHANDO

   Cada nível é uma página nova, e o celular só sabe para onde
   a pessoa GIROU desde que a página abriu — não para onde ela
   está virada no mundo. Sem cuidado, a frente da cena passaria
   a ser a direção em que ela olhava ao apertar "Próximo nível"
   (o console, à esquerda), e a cada nível o cenário giraria
   mais um pouco.

   A saída é anotar o giro da cabeça na hora de sair e
   devolvê-lo na página seguinte. A pessoa não se moveu entre
   uma página e outra; só a contagem recomeçou.

   O registro vale por 15 segundos: mais que isso e já não se
   sabe se ela continua virada para o mesmo lado.
   --------------------------------------------------------- */
const CHAVE_GIRO_VRBOX = 'vr-exposicao:vrbox-giro';

function guardarGiroVrbox(radianos) {
  try {
    sessionStorage.setItem(CHAVE_GIRO_VRBOX,
      JSON.stringify({ giro: radianos, quando: Date.now() }));
  } catch (erro) { /* navegação anônima: segue sem */ }
}

function lerGiroVrbox() {
  try {
    const registro = JSON.parse(sessionStorage.getItem(CHAVE_GIRO_VRBOX));
    sessionStorage.removeItem(CHAVE_GIRO_VRBOX);
    if (registro && Date.now() - registro.quando < 15000) {
      return registro.giro;
    }
  } catch (erro) { /* sem registro */ }
  return null;
}

/* =========================================================
   O COMPONENTE
   Fica no <a-scene>. experiencia.js o liga quando MODO_VRBOX
   é verdadeiro.
   ========================================================= */
AFRAME.registerComponent('modo-vrbox', {

  schema: {
    /* Distância entre os centros das duas imagens, como fração
       da largura da tela. 0,5 = cada imagem ocupa exatamente uma
       metade. Em celular grande, as metades ficam mais afastadas
       que as lentes; diminuir este número aproxima as imagens.
       Ajustado na página vrbox.html. */
    separacao: { type: 'number', default: 0.5 },

    /* Distância entre os olhos virtuais, em metros. */
    olhos: { type: 'number', default: 0.064 },

    /* A página vrbox.html já viu o controle funcionando: começa
       sabendo que ele existe, com a seleção pelo olhar desligada. */
    controle: { type: 'boolean', default: false },

    /* Quanto tempo segurar o olhar para selecionar, sem controle. */
    olhar: { type: 'number', default: 1500 },

    /* Apertar e soltar rápido seleciona; segurar este tempo
       recentraliza a cena. */
    segurar: { type: 'number', default: 1200 },

    /* Joystick parado não fica exatamente em zero. Abaixo disto,
       considera-se solto. */
    zonaMorta: { type: 'number', default: 0.25 }
  },

  init: function () {
    this.ligado = true;
    this.temControle = false;
    this.apertadoDesde = 0;        // quando o botão foi apertado
    this.botoes = {};              // estado de cada botão, por índice
    this.botaoDoAperto = null;     // qual botão começou o aperto atual
    this.eixoUtil = {};            // eixos que já passaram pelo centro
    this.eixoDirecional = {};      // eixos que são direcional de 8 posições
    this.ultimoSinal = null;       // o que chegou do controle por último
    this.teclasAndar = { cima: false, baixo: false, esquerda: false, direita: false };
    this.estereo = new AFRAME.THREE.StereoCamera();
    this.tamanho = new AFRAME.THREE.Vector2();

    this.mira = document.querySelector('#mira');
    this.camera = document.querySelector('#camera');
    this.rig = document.querySelector('#rig');

    this.aoApertar = this.aoApertar.bind(this);
    this.aoSoltar = this.aoSoltar.bind(this);
    this.aoTeclaDescer = this.aoTeclaDescer.bind(this);
    this.aoTeclaSubir = this.aoTeclaSubir.bind(this);
    this.aoToque = this.aoToque.bind(this);
    this.aoToqueFim = this.aoToqueFim.bind(this);
    this.aoVoltar = this.aoVoltar.bind(this);

    this.prepararMira();
    this.prepararPonteiro();
    this.prepararTeclado();
    this.manterTelaAcesa();

    if (this.data.controle) {
      this.avisarQueHaControle();
    }

    /* anota o giro da cabeça ao sair, para a página seguinte */
    this.aoSair = function () {
      guardarGiroVrbox(this.giroAtual());
    }.bind(this);
    window.addEventListener('pagehide', this.aoSair);
  },

  /* ---------------------------------------------------------
     A MIRA

     A mira passa a enxergar também os botões (.alvo), e não
     só os animais. No modo normal isso é proibido, porque a
     seleção por olhar acionava sozinha o botão que estivesse
     no centro da tela. Aqui o risco é menor: o console fica ao
     lado e abaixo, e só é atingido de propósito.

     O clique deixa de vir da tela (que ninguém alcança) e
     passa a vir de eventos que este componente dispara — de
     um botão do controle, de uma tecla ou de um toque.

     O círculo encolhe enquanto o olhar é segurado. Sem esse
     retorno, a pessoa não sabe que algo vai acontecer, nem
     quanto falta.
     --------------------------------------------------------- */
  prepararMira: function () {
    const mira = this.mira;
    if (!mira) {
      return;
    }

    mira.setAttribute('raycaster', 'objects', '.clicavel, .alvo');

    /* downEvents e upEvents com nomes que ninguém dispara: com
       eles preenchidos, o cursor do A-Frame deixa de escutar a
       tela sozinho. Quem decide o que é clique passa a ser este
       componente (ver "selecionar", mais abaixo). */
    mira.setAttribute('cursor', {
      fuse: true,
      fuseTimeout: this.data.olhar,
      downEvents: ['vrbox-nunca'],
      upEvents: ['vrbox-nunca']
    });

    mira.setAttribute('animation__fechando', {
      property: 'scale', startEvents: 'fusing', easing: 'linear',
      dur: this.data.olhar, from: '1 1 1', to: '0.25 0.25 0.25'
    });
    /* Pulso a cada botão recebido. Sem ele, apertar sem nada na
       mira parece igual a o controle não funcionar. */
    mira.setAttribute('animation__pulso', {
      property: 'scale', startEvents: 'vrbox-pulso', easing: 'easeOutQuad',
      dur: 250, from: '1.8 1.8 1.8', to: '1 1 1'
    });
    mira.setAttribute('animation__abrindo', {
      property: 'scale', startEvents: 'mouseleave, click', easing: 'easeOutQuad',
      dur: 150, to: '1 1 1'
    });
  },

  /* O ponteiro do mouse aponta pelo lugar da tela onde se
     clica. Com a tela dividida em duas, esse lugar não
     corresponde a nada: um toque na metade esquerda apontaria
     para a esquerda da cena. Ele é desligado. */
  prepararPonteiro: function () {
    const ponteiro = document.querySelector('#ponteiro');
    if (ponteiro) {
      ponteiro.removeAttribute('cursor');
      ponteiro.removeAttribute('raycaster');
    }

    /* As teclas W A S D movem a câmera sem respeitar as paredes.
       Aqui quem anda é o controle, pelo mesmo caminho do círculo
       "andar", que respeita os limites do cenário. */
    if (this.camera) {
      this.camera.setAttribute('wasd-controls', 'enabled', false);
    }

    /* Toque na tela vale como botão: alguns VR Box têm uma
       alavanca que encosta na tela, e o controle em "modo mouse"
       produz cliques. */
    const canvas = this.el.canvas;
    const ligar = function (alvo) {
      alvo.addEventListener('touchstart', this.aoToque, { passive: false });
      alvo.addEventListener('touchend', this.aoToqueFim);
      alvo.addEventListener('mousedown', this.aoToque);
      alvo.addEventListener('mouseup', this.aoToqueFim);
    }.bind(this);

    if (canvas) {
      ligar(canvas);
    } else {
      this.el.addEventListener('render-target-loaded', function () {
        ligar(this.el.canvas);
      }.bind(this));
    }
  },

  prepararTeclado: function () {
    window.addEventListener('keydown', this.aoTeclaDescer);
    window.addEventListener('keyup', this.aoTeclaSubir);
  },

  /* ---------------------------------------------------------
     TELA ACESA

     Sem toque nenhum por um minuto, o celular apaga a tela —
     e com ele dentro da caixa ninguém toca. O "wake lock" pede
     ao sistema que não apague. Ele é solto sozinho quando a
     página fica escondida, por isso é pedido de novo na volta.
     --------------------------------------------------------- */
  manterTelaAcesa: function () {
    const pedir = function () {
      if (navigator.wakeLock && document.visibilityState === 'visible') {
        navigator.wakeLock.request('screen').catch(function () {});
      }
    };
    pedir();
    document.addEventListener('visibilitychange', this.aoVoltar);
    this.pedirTelaAcesa = pedir;
  },

  aoVoltar: function () {
    if (document.visibilityState === 'visible' && this.pedirTelaAcesa) {
      this.pedirTelaAcesa();
    }
  },

  /* =========================================================
     BOTÕES: APERTAR, SOLTAR, SEGURAR

     Todas as fontes — controle, teclado, toque — terminam aqui.
     A decisão é tomada ao SOLTAR, e não ao apertar, porque só
     então se sabe quanto tempo o botão ficou apertado:

       rápido   seleciona o que está na mira
       longo    recentraliza a cena (a frente passa a ser para
                onde a pessoa está olhando agora)

     Um controle presente desliga a seleção pelo olhar. Com ele
     na mão, segurar o olhar para ler um painel não deve acionar
     nada sozinho.
     ========================================================= */
  avisarQueHaControle: function () {
    if (this.temControle) {
      return;
    }
    this.temControle = true;
    if (this.mira) {
      this.mira.setAttribute('cursor', 'fuse', false);
      this.mira.setAttribute('scale', '1 1 1');
    }
    this.el.emit('vrbox-controle');
  },

  /* "fonte" é quem apertou: o controle, uma tecla ou um toque.
     Só quem apertou pode soltar — sem isso, o controle, lido a
     cada quadro e sem nenhum botão apertado, "soltaria" uma
     tecla no quadro seguinte ao aperto. */
  aoApertar: function (fonte) {
    if (!this.apertadoDesde) {
      this.apertadoDesde = performance.now();
      this.fonteDoAperto = fonte;
    }
  },

  aoSoltar: function (fonte) {
    if (!this.apertadoDesde || fonte !== this.fonteDoAperto) {
      return;
    }
    const segurou = performance.now() - this.apertadoDesde;
    this.apertadoDesde = 0;
    this.fonteDoAperto = null;

    if (segurou >= this.data.segurar) {
      this.recentralizar();
      return;
    }

    /* Avisa a cena que houve um botão, esteja a mira onde
       estiver. É o que dá a partida no primeiro nível: ali a
       pessoa acabou de pôr o óculos e não precisa mirar nada. */
    this.el.emit('vrbox-botao', { fonte: fonte });
    if (this.mira) {
      this.mira.emit('vrbox-pulso', null, false);
    }

    this.selecionar();
  },

  /* Anota o último sinal, para o quadro de preparo mostrar. */
  anotarSinal: function (texto) {
    this.ultimoSinal = { texto: texto, quando: performance.now() };
  },

  /* Uma frase sobre o que chega do controle agora. */
  descreverSinal: function () {
    if (!this.ultimoSinal) {
      return this.temControle
        ? 'controle esperado, mas nenhum sinal ainda.'
        : 'nenhum sinal ainda.';
    }
    const segundos = Math.round((performance.now() - this.ultimoSinal.quando) / 1000);
    return this.ultimoSinal.texto
      + (segundos < 2 ? ' (agora)' : ` (há ${segundos} s)`) + '.';
  },

  /* ---------------------------------------------------------
     SELECIONAR o que está na mira.

     O clique é disparado direto no objeto, com o mesmo formato
     que o cursor do A-Frame usaria. Fazer isso aqui, e não pelo
     cursor, permite selecionar mesmo enquanto a seleção pelo
     olhar está ligada (o cursor, nesse caso, só aceita o olhar).

     Se o olhar já estava contando, a contagem é cancelada: sem
     isso, o mesmo botão seria acionado duas vezes — agora pelo
     toque e daqui a pouco pelo olhar. Abrir e fechar a ajuda no
     mesmo segundo parece defeito.
     --------------------------------------------------------- */
  selecionar: function () {
    const cursor = this.mira && this.mira.components.cursor;
    const alvo = cursor && cursor.intersectedEl;
    if (!alvo) {
      return;
    }

    clearTimeout(cursor.fuseTimeout);
    this.mira.removeState('cursor-fusing');

    const raycaster = this.mira.components.raycaster;
    const detalhe = {
      cursorEl: this.mira,
      intersection: raycaster ? raycaster.getIntersection(alvo) : null
    };
    alvo.emit('click', detalhe);
    this.mira.emit('click', { intersectedEl: alvo });
  },

  aoToque: function (evento) {
    if (evento.cancelable) {
      evento.preventDefault();
    }
    this.aoApertar('toque');
  },

  aoToqueFim: function () {
    this.aoSoltar('toque');
  },

  /* ---------------------------------------------------------
     TECLADO

     O controle do VR Box, em alguns modos, se apresenta ao
     celular como um teclado: o joystick vira setas e os botões
     viram Enter ou letras. Setas andam; qualquer outra tecla é
     botão.
     --------------------------------------------------------- */
  direcaoDaTecla: function (evento) {
    const mapa = {
      ArrowUp: 'cima', KeyW: 'cima',
      ArrowDown: 'baixo', KeyS: 'baixo',
      ArrowLeft: 'esquerda', KeyA: 'esquerda',
      ArrowRight: 'direita', KeyD: 'direita'
    };
    return mapa[evento.code] || mapa[evento.key] || null;
  },

  ehTeclaIgnorada: function (evento) {
    return ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock',
            'Escape', 'F5', 'F12'].indexOf(evento.key) !== -1;
  },

  aoTeclaDescer: function (evento) {
    if (this.ehTeclaIgnorada(evento)) {
      return;
    }
    this.avisarQueHaControle();
    this.anotarSinal('tecla ' + (evento.key === ' ' ? 'Espaço' : evento.key));

    const direcao = this.direcaoDaTecla(evento);
    if (direcao) {
      this.teclasAndar[direcao] = true;
    } else if (!evento.repeat) {
      this.aoApertar('tecla');
    }
    if (evento.cancelable) {
      evento.preventDefault();
    }
  },

  aoTeclaSubir: function (evento) {
    if (this.ehTeclaIgnorada(evento)) {
      return;
    }
    const direcao = this.direcaoDaTecla(evento);
    if (direcao) {
      this.teclasAndar[direcao] = false;
    } else {
      this.aoSoltar('tecla');
    }
  },

  /* ---------------------------------------------------------
     CONTROLE COMO "GAMEPAD"

     No modo de jogo, o controle aparece para o navegador como
     um gamepad. Não há evento para "botão apertado": o estado
     precisa ser lido a cada quadro e comparado com o anterior.

     TRÊS CUIDADOS, aprendidos no teste com o controle de verdade

     1. DUAS FONTES. A experiência roda dentro de vrbox.html, e
        em alguns celulares o quadro de dentro enxerga o
        controle mal ou nada. A página de fora enxerga e repassa
        (window.__controleExterno). As duas leituras são somadas:
        um botão conta como apertado se qualquer uma o vir.

     2. BOTÃO PRESO. Controles baratos costumam informar algum
        botão ou gatilho como apertado o tempo todo. A primeira
        versão esperava TODOS os botões soltos para registrar o
        clique — com um preso, nunca registrava. Agora cada botão
        é acompanhado sozinho: o clique é o aperto e a soltura do
        MESMO botão, e um botão que já aparece apertado é
        ignorado até ser solto uma vez.

     3. EIXO PRESO. Do mesmo jeito, alguns informam um eixo que
        não existe parado em -1 ou 1, o que faria a pessoa andar
        sozinha. Um eixo só passa a valer depois de ter sido visto
        perto do centro — e um joystick solto está no centro.

     Os botões 12 a 15 são as setas (direcional) no padrão do
     navegador; eles andam, não selecionam.
     --------------------------------------------------------- */
  lerControles: function () {
    const lidos = [];

    if (navigator.getGamepads) {
      const lista = navigator.getGamepads();
      for (let i = 0; i < lista.length; i++) {
        if (lista[i] && lista[i].connected !== false) {
          lidos.push({ fonte: 'direto', pad: lista[i] });
        }
      }
    }

    const externo = window.__controleExterno;
    if (externo && performance.now() - externo.recebidoEm < 250) {
      lidos.push({ fonte: 'repassado', pad: externo });
    }

    return lidos;
  },

  estaApertado: function (botao) {
    if (!botao) {
      return false;
    }
    if (typeof botao !== 'object') {
      return Boolean(botao);
    }
    return Boolean(botao.pressed) || (botao.value || 0) > 0.5;
  },

  tratarControles: function (lidos) {
    const padrao = lidos.some(function (l) { return l.pad.mapping === 'standard'; });
    const setas = padrao ? [12, 13, 14, 15] : [];
    const apertados = {};
    const eixos = [];
    const componente = this;
    let fontes = [];

    lidos.forEach(function (lido) {
      fontes.push(lido.fonte);
      for (let i = 0; i < lido.pad.buttons.length; i++) {
        if (componente.estaApertado(lido.pad.buttons[i])) {
          apertados[i] = true;
        }
      }
      for (let i = 0; i < lido.pad.axes.length; i++) {
        const v = lido.pad.axes[i] || 0;
        if (eixos[i] === undefined || Math.abs(v) > Math.abs(eixos[i])) {
          eixos[i] = v;
        }
      }
    });
    fontes = fontes.filter(function (f, i) { return fontes.indexOf(f) === i; }).join(' + ');

    /* ---------- botões, um a um ---------- */
    const total = Math.max.apply(null, lidos.map(function (l) { return l.pad.buttons.length; }).concat([0]));
    for (let i = 0; i < total; i++) {
      const agora = Boolean(apertados[i]);
      let estado = this.botoes[i];

      if (!estado) {
        /* primeira vez que este botão é visto: se já está
           apertado, é tratado como preso */
        this.botoes[i] = { apertado: agora, preso: agora };
        continue;
      }

      if (agora && !estado.apertado) {                 // apertou
        estado.preso = false;
        this.avisarQueHaControle();
        this.anotarSinal(`botão ${i} (${fontes})`);
        if (setas.indexOf(i) === -1 && this.botaoDoAperto === null) {
          this.botaoDoAperto = i;
          this.aoApertar('controle');
        }
      } else if (!agora && estado.apertado) {          // soltou
        estado.preso = false;
        if (i === this.botaoDoAperto) {
          this.botaoDoAperto = null;
          this.aoSoltar('controle');
        }
      }
      estado.apertado = agora;
    }

    /* ---------- direção ----------

       O joystick pode chegar de dois jeitos, conforme o controle.

       PAR DE EIXOS. Um eixo para o lado, outro para frente e
       trás. Pode ser qualquer par — 0 e 1, 2 e 3, 6 e 7... — e
       a primeira versão só olhava os dois primeiros. Agora vale
       o par que estiver mais empurrado.

       DIRECIONAL NUM EIXO SÓ. Alguns controles mandam as oito
       direções num único número: parado ele fica acima de 1
       (cerca de 1,29), e cada direção é um valor entre -1 e 1.
       -1 é para cima, e a cada 2/7 gira-se 45 graus no sentido
       do relógio. É assim que o Chrome entrega o "hat" de muitos
       controles genéricos no Android. */
    for (let i = 0; i < eixos.length; i++) {
      const v = eixos[i];
      if (this.eixoDirecional[i] === undefined) {
        /* o primeiro valor visto diz que tipo de eixo é */
        this.eixoDirecional[i] = Math.abs(v) > 1.05;
      }
      if (!this.eixoDirecional[i] && Math.abs(v) < 0.5) {
        this.eixoUtil[i] = true;
      }
    }
    const valor = function (i) {
      return componente.eixoUtil[i] ? eixos[i] || 0 : 0;
    };

    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < eixos.length; i += 2) {
      if (Math.hypot(valor(i), valor(i + 1)) > Math.hypot(x, y)) {
        x = valor(i);
        y = valor(i + 1);
      }
    }

    for (let i = 0; i < eixos.length; i++) {
      const v = eixos[i];
      if (this.eixoDirecional[i] && Math.abs(v) <= 1.0001) {
        const passo = Math.round((v + 1) * 3.5) % 8;     // 0 = cima, 2 = direita...
        const angulo = passo * Math.PI / 4;
        x = Math.sin(angulo);
        y = -Math.cos(angulo);
      }
    }

    if (Math.hypot(x, y) < this.data.zonaMorta) {
      x = 0;
      y = 0;
    } else {
      this.avisarQueHaControle();
      this.anotarSinal(`joystick (${fontes})`);
    }

    if (padrao) {
      if (apertados[12]) { y = -1; }
      if (apertados[13]) { y = 1; }
      if (apertados[14]) { x = -1; }
      if (apertados[15]) { x = 1; }
    }

    return { x: x, y: y };
  },

  /* ---------------------------------------------------------
     RECENTRALIZAR

     A frente da cena passa a ser a direção para onde a pessoa
     olha agora. Útil quando ela se ajeita na cadeira, ou quando
     colocou o celular na caixa virada para outro lado.

     Mexe só no giro horizontal. A inclinação (olhar para cima
     ou para baixo) vem do sensor e já está certa: o chão está
     sempre embaixo.
     --------------------------------------------------------- */
  recentralizar: function () {
    const controles = this.camera && this.camera.components['look-controls'];
    if (!controles) {
      return;
    }
    controles.yawObject.rotation.y = -controles.magicWindowDeltaEuler.y;
    controles.pitchObject.rotation.x = 0;
    this.el.emit('vrbox-recentralizou');

    /* retorno: a mira pisca */
    if (this.mira) {
      const cor = this.mira.getAttribute('material').color;
      this.mira.setAttribute('material', 'color', '#FFFFFF');
      setTimeout(function () {
        this.mira.setAttribute('material', 'color', cor);
      }.bind(this), 300);
    }
  },

  /* O giro atual da cabeça, contado a partir da frente da cena. */
  giroAtual: function () {
    return this.camera ? this.camera.object3D.rotation.y : 0;
  },

  /* Devolve o giro anotado pela página anterior (ver o começo do
     arquivo). Chamado por experiencia.js quando a cena carrega. */
  restaurarGiro: function () {
    const giro = lerGiroVrbox();
    const controles = this.camera && this.camera.components['look-controls'];
    if (giro === null || !controles) {
      return false;
    }
    controles.yawObject.rotation.y = giro - controles.magicWindowDeltaEuler.y;
    controles.pitchObject.rotation.x = 0;
    return true;
  },

  /* =========================================================
     A CADA QUADRO
     ========================================================= */
  tick: function () {
    this.instalarDesenhoDuplo();

    /* controle */
    let direcao = { x: 0, y: 0 };
    const lidos = this.lerControles();
    if (lidos.length) {
      direcao = this.tratarControles(lidos);
    }

    /* teclado soma com o controle */
    const t = this.teclasAndar;
    if (t.cima) { direcao.y = -1; }
    if (t.baixo) { direcao.y = 1; }
    if (t.esquerda) { direcao.x = -1; }
    if (t.direita) { direcao.x = 1; }

    /* Quem anda é o componente andar-toque, o mesmo do círculo
       na tela: ele já sabe andar na direção do olhar e parar
       nas paredes. Aqui só se diz para onde. */
    const andar = this.rig && this.rig.components['andar-toque'];
    if (andar && andar.direcao && !andar.ativo) {
      andar.direcao.x = direcao.x;
      andar.direcao.y = direcao.y;
    }
  },

  /* =========================================================
     DESENHAR DUAS VEZES

     O A-Frame desenha a cena uma vez por quadro, chamando
     renderer.render(cena, câmera). Aqui essa chamada é trocada
     por outra que desenha duas vezes, cada uma numa metade da
     tela e vista de um olho.

     A câmera de cada olho vem do StereoCamera, do próprio
     Three.js: ele parte da câmera da cena e desloca 3,2 cm
     para cada lado.

     Só o desenho principal é trocado. Se a cena estiver num
     óculos de verdade (WebXR), o óculos já faz isso sozinho.
     ========================================================= */
  instalarDesenhoDuplo: function () {
    const renderer = this.el.renderer;
    if (this.desenhoInstalado || !renderer) {
      return;
    }
    this.desenhoInstalado = true;

    const original = renderer.render;
    const componente = this;

    renderer.render = function (cena, camera) {
      if (!componente.ligado
          || renderer.xr.isPresenting
          || camera !== componente.el.camera) {
        return original.call(renderer, cena, camera);
      }
      componente.desenharDoisOlhos(original, renderer, cena, camera);
    };
  },

  desenharDoisOlhos: function (desenhar, renderer, cena, camera) {
    const tamanho = renderer.getSize(this.tamanho);
    const largura = tamanho.x;
    const altura = tamanho.y;

    /* distância entre os centros das duas imagens, em pixels */
    const separacao = Math.max(0.3, Math.min(0.5, this.data.separacao)) * largura;
    /* cada imagem é tão larga quanto possível sem invadir a outra
       nem sair da tela */
    const larguraOlho = Math.min(separacao, largura - separacao);
    const xEsquerdo = largura / 2 - separacao / 2 - larguraOlho / 2;
    const xDireito = largura / 2 + separacao / 2 - larguraOlho / 2;

    camera.updateWorldMatrix(true, false);

    const estereo = this.estereo;
    estereo.eyeSep = this.data.olhos;
    estereo.aspect = (larguraOlho / altura) / camera.aspect;
    estereo.update(camera);

    /* o que sobra fora das duas imagens fica preto */
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, largura, altura);
    renderer.clear();

    renderer.setScissorTest(true);

    renderer.setScissor(xEsquerdo, 0, larguraOlho, altura);
    renderer.setViewport(xEsquerdo, 0, larguraOlho, altura);
    desenhar.call(renderer, cena, estereo.cameraL);

    renderer.setScissor(xDireito, 0, larguraOlho, altura);
    renderer.setViewport(xDireito, 0, larguraOlho, altura);
    desenhar.call(renderer, cena, estereo.cameraR);

    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, largura, altura);
  },

  remove: function () {
    this.ligado = false;
    window.removeEventListener('pagehide', this.aoSair);
    window.removeEventListener('keydown', this.aoTeclaDescer);
    window.removeEventListener('keyup', this.aoTeclaSubir);
    document.removeEventListener('visibilitychange', this.aoVoltar);
  }
});
