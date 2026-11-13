/* =========================================================
   EXPERIÊNCIA — lê a escolha feita em selecao.html, monta a
   cena e controla o HUD.
   Depende de dados.js (ANIMAIS, NIVEIS), carregado antes.
   ========================================================= */

/* ---------- elementos da cena ---------- */
const cena = document.querySelector('#cena');
const camera = document.querySelector('#camera');
const mira = document.querySelector('#mira');
const cenarioEl = document.querySelector('#cenario');
const animaisEl = document.querySelector('#animais');
const somAmbiente = document.querySelector('#somAmbiente');
const somAnimal = document.querySelector('#somAnimal');
const rig = document.querySelector('#rig');

/* ---------- a interface, que vive dentro da cena 3D ----------

   Não há mais HUD em HTML. Toda a informação — nível, instrução,
   tempo, animais encontrados, desconforto relatado — é objeto da
   cena, desenhado em canvas e usado como textura.

   Sobraram em HTML apenas duas coisas, e as duas por bom motivo:
   o controle de andar, que precisa ser uma superfície de toque de
   verdade, e o botão de entrar em Realidade Virtual, que é criado
   pelo próprio A-Frame. */
const consoleCena = document.querySelector('#consoleCena');
const painelConsole = document.querySelector('#painelConsole');
const avisoAbertura = document.querySelector('#avisoAbertura');
const painelAjuda = document.querySelector('#painelAjuda');
const escalaAnsiedade = document.querySelector('#escalaAnsiedade');
const botoesEscala = document.querySelector('#botoesEscala');
const tituloEscala = document.querySelector('#tituloEscala');

const btn3dProximo = document.querySelector('#btn3dProximo');
const btn3dSom = document.querySelector('#btn3dSom');
const btn3dAjuda = document.querySelector('#btn3dAjuda');
const btn3dAnsiedade = document.querySelector('#btn3dAnsiedade');
const btn3dReiniciar = document.querySelector('#btn3dReiniciar');
const btn3dSair = document.querySelector('#btn3dSair');

const ponteiro = document.querySelector('#ponteiro');
const maoEsquerda = document.querySelector('#maoEsquerda');
const maoDireita = document.querySelector('#maoDireita');

/* =========================================================
   1. LER A ESCOLHA QUE VEIO NA URL
   Exemplo: experiencia.html?animal=aranha&nivel=2
   ========================================================= */
const parametros = new URLSearchParams(window.location.search);

const animal = buscarAnimal(parametros.get('animal'));
const nivel = buscarNivel(parametros.get('nivel'));

/* ---------------------------------------------------------
   Sem escolha válida não há experiência: volta para a seleção.

   Atenção: window.location.replace() NÃO interrompe o script.
   O navegador só troca de página depois que o código atual
   termina de rodar. Por isso o resto precisa ficar dentro de
   uma função, chamada apenas quando a escolha é válida.
   --------------------------------------------------------- */
if (!animal || !nivel) {
  window.location.replace('selecao.html');
} else {
  iniciarExperiencia();
}

function iniciarExperiencia() {

  /* =========================================================
     2. ESTADO DA SESSÃO

     O que antes era escrito direto no HUD em HTML agora vive em
     variáveis, e o console da cena lê daqui. A diferença importa:
     o texto deixou de morar no documento e passou a morar no
     programa, o que é o certo quando a mesma informação precisa
     aparecer em dois lugares (o console e o aviso de abertura).
     ========================================================= */
  let tempoTexto = '00:00';
  let desconfortoTexto = '';

  /* =========================================================
     A SESSÃO DE PESQUISA

     Uma passagem por um nível é uma sessão. Quem percorre os
     cinco níveis gera cinco sessões, porque cada troca de
     nível é uma página nova.

     A sessão é aberta mesmo sem cadastro. Sem participante ela
     não vai para o banco — o campo fica vazio e a linha seria
     recusada — mas continua no navegador, e é o que permite
     você testar ajustes e ver as medidas sem precisar se
     cadastrar antes. */
  const comoEstouUsando = AFRAME.utils.device.checkHeadsetConnected()
    ? 'oculos'
    : (AFRAME.utils.device.isMobile() ? 'celular' : 'computador');

  const sessao = Armazenamento.abrirSessao(
    animal.id, nivel.numero, comoEstouUsando);

  /* O instante de cada evento é medido a partir daqui, e não
     pelo relógio da tela: o contador de segundos só é criado
     mais adiante no arquivo, e um evento disparado antes disso
     quebraria a página. Este também é mais preciso. */
  const inicioSessao = performance.now();

  function marcar(tipo, dado) {
    Armazenamento.gravarEvento(sessao, tipo, dado,
      performance.now() - inicioSessao);
  }

  let tocouNoAnimal = false;
  let ultimoDesconforto = null;
  let sessaoFechada = false;

  /* =========================================================
     3. MONTAR O CENÁRIO

     Cada animal tem o ambiente onde ele seria encontrado de
     verdade. A função devolve os limites do lugar, para os
     animais não atravessarem paredes nem sumirem atrás do muro.
     ========================================================= */
  const cenario = montarCenario(animal.cenario, cenarioEl);
  const limites = cenario.limites;
  const esconderijos = cenario.esconderijos;

  /* =========================================================
     4. ONDE CADA ANIMAL FICA

     A progressão dos níveis acontece em duas dimensões: os
     animais ficam mais PERTO e em maior NÚMERO.

     O primeiro fica exatamente na distância do nível, à frente
     de quem observa — é ele que define a experiência. Os demais
     se espalham num arco em volta, dentro do campo de visão e
     sem se sobrepor.
     ========================================================= */
  const distancia = distanciaDoNivel(animal, nivel);
  const quantidade = quantidadeDoNivel(animal, nivel);

  /* O tamanho com que o animal aparece não é o tamanho real: é o
     real multiplicado pela escala de apresentação, declarada em
     dados.js. Sem isso, os animais pequenos ficam invisíveis. */
  const tamanho = tamanhoApresentado(animal);

  /* Sorteio com semente: o mesmo nível monta sempre igual.
     Sem isso, dois participantes veriam disposições diferentes
     e a comparação entre eles perderia sentido. */
  function sorteador(semente) {
    let estado = semente;
    return function (minimo, maximo) {
      estado = (estado * 1103515245 + 12345) % 2147483648;
      return minimo + (estado / 2147483648) * (maximo - minimo);
    };
  }

  const sorteia = sorteador(nivel.numero * 7919 + animal.id.length * 131);
  const separacao = Math.max(tamanho * 2.2, 0.35);

  /* Quantos animais começam escondidos.

     Do nível 2 em diante, parte deles fica dentro de armários,
     sob móveis ou atrás de obstáculos, e só aparece quando a
     pessoa abre a porta ou chega perto. Assim a exposição
     acontece no ritmo de quem explora, e não de uma vez.

     No nível 1 ninguém se esconde: o primeiro contato deve ser
     previsível. */
  function quantosEscondidos() {
    if (nivel.numero < 2 || esconderijos.length === 0) {
      return 0;
    }
    const fracao = nivel.numero >= 4 ? 0.45 : 0.35;
    return Math.min(esconderijos.length, Math.round(quantidade * fracao));
  }

  function calcularPosicoes() {
    const escondidos = quantosEscondidos();
    const aVista = quantidade - escondidos;

    /* o primeiro fica sempre na distância exata do nível, à
       frente de quem observa: é ele que define a experiência */
    const posicoes = [{ x: 0, z: -distancia, esconderijo: null }];

    /* ---------- os que ficam à vista ---------- */
    for (let i = 1; i < aVista; i++) {
      let melhor = null;

      for (let tentativa = 0; tentativa < 40; tentativa++) {
        /* o arco abre conforme o nível: no começo todos à frente,
           depois espalhados pelos lados, para dar o que explorar */
        const abertura = 40 + nivel.numero * 16;
        const angulo = sorteia(-abertura, abertura) * Math.PI / 180;

        const folga = separacao * Math.sqrt(quantidade);
        const raio = sorteia(distancia * 0.7, distancia * 1.5 + folga);

        const x = Math.sin(angulo) * raio;
        const z = -Math.cos(angulo) * raio;

        if (Math.abs(x) > limites.x || z < limites.zMin || z > -0.55) {
          continue;
        }

        const colide = posicoes.some(function (p) {
          return Math.hypot(p.x - x, p.z - z) < separacao;
        });

        if (!colide) { melhor = { x, z, esconderijo: null }; break; }
        if (!melhor) { melhor = { x, z, esconderijo: null }; }
      }

      if (melhor) { posicoes.push(melhor); }
    }

    /* ---------- os escondidos ---------- */
    const disponiveis = esconderijos.slice();
    for (let i = 0; i < escondidos && disponiveis.length; i++) {
      const escolhido = disponiveis.splice(
        Math.floor(sorteia(0, disponiveis.length)) % disponiveis.length, 1)[0];

      posicoes.push({
        x: escolhido.posicao.x,
        z: escolhido.posicao.z,
        esconderijo: escolhido
      });
    }

    return posicoes;
  }

  /* =========================================================
     5. AJUSTAR UM MODELO 3D CARREGADO

     a) Escala imprevisível: cada arquivo vem numa unidade
        diferente. Medimos o modelo e calculamos o fator que o
        leva ao tamanhoReal declarado em dados.js.

     b) Origem em lugar qualquer: medimos onde fica a base e
        deslocamos para ela encostar no chão.

     c) Pose imprevisível: a maior dimensão do modelo nem sempre
        é a que o tamanhoReal descreve. A cobra vem empinada, e
        escalar pela maior dimensão a deixaria com 1,2 m de
        ALTURA. Por isso cada animal diz, em dados.js, a qual
        dimensão o tamanho dele se refere.
     ========================================================= */
  function dimensaoDeReferencia(medidas, medida) {
    if (medida === 'altura')       return medidas.y;
    if (medida === 'largura')      return medidas.x;
    if (medida === 'profundidade') return medidas.z;
    return Math.max(medidas.x, medidas.y, medidas.z);   // 'maior'
  }

  let jaRegistrouMedida = false;

  function ajustarModelo(elemento, tamanhoAlvo) {
    const objeto = elemento.getObject3D('mesh');
    if (!objeto) {
      return;
    }

    const caixa = new AFRAME.THREE.Box3().setFromObject(objeto);
    const medidas = new AFRAME.THREE.Vector3();
    caixa.getSize(medidas);

    const referencia = dimensaoDeReferencia(medidas, animal.medida);
    if (referencia === 0) {
      return;
    }

    const fator = tamanhoAlvo / referencia;
    elemento.setAttribute('scale', `${fator} ${fator} ${fator}`);

    const baseY = caixa.min.y * fator;
    elemento.setAttribute('position', '0 ' + (-baseY) + ' 0');

    /* o registro sai uma vez só: são até quinze cópias do mesmo
       modelo, e quinze linhas iguais no console não ajudam */
    if (!jaRegistrouMedida) {
      jaRegistrouMedida = true;
      console.log(
        `Modelo medido: ${medidas.x.toFixed(2)} x ${medidas.y.toFixed(2)} x ` +
        `${medidas.z.toFixed(2)} unidades (medida: ${animal.medida || 'maior'}). ` +
        `Fator aplicado: ${fator.toFixed(4)}`
      );
    }
  }

  /* =========================================================
     6. MOVIMENTO DO CORPO INTEIRO

     As animações de dentro do arquivo mexem as patas, a cabeça,
     o corpo — mas o animal continua no mesmo lugar, como quem
     anda numa esteira. Um giro lento do corpo todo completa a
     impressão de que ele está vivo e se deslocando.

     Isso também é o plano B do rato, que não traz animação
     nenhuma: sem o giro e o balanço, ele seria uma estátua.

     Cada cópia recebe uma defasagem própria, senão os quinze
     animais girariam em sincronia, como um corpo de baile.

     Tudo é lento de propósito. Movimento brusco em Realidade
     Virtual causa desconforto e, num sistema de exposição
     gradual, tira de quem usa o controle do próprio ritmo.
     ========================================================= */
  function aplicarMovimentoDoCorpo(giro, indice, comportamento) {
    const temAnimacoes = Boolean(animal.animacoes);
    const defasagem = indice * 260;

    /* O balánço de respiração é o movimento mínimo: nenhuma
       cópia fica completamente imóvel na cena. Quem toca a
       animação do arquivo já respira por conta própria — somar
       os dois deixaria o bicho pulando. */
    const respiraSozinho = temAnimacoes
                           && comportamento !== 'quieto'
                           && indice < LIMITE_ANIMADOS;

    if (!respiraSozinho) {
      giro.setAttribute('animation__respirar', {
        property: 'position',
        from: '0 0 0',
        to: '0 ' + (tamanho * 0.04) + ' 0',
        dir: 'alternate',
        loop: true,
        dur: comportamento === 'quieto' ? 3400 : 2400,
        delay: defasagem,
        easing: 'easeInOutSine'
      });
    }

    /* o quieto só respira. É ele que dá o contraste: sem
       nenhum parado, o grupo inteiro vira um só borrão de
       movimento e nada chama atenção. */
    if (comportamento === 'quieto') {
      return;
    }

    const amplitude = temAnimacoes ? 30 : 42;
    const duracao = temAnimacoes ? 7000 : 5200;

    giro.setAttribute('animation__girar', {
      property: 'rotation',
      from: '0 ' + (-amplitude) + ' 0',
      to: '0 ' + amplitude + ' 0',
      dir: 'alternate',
      loop: true,
      dur: duracao,
      delay: defasagem,
      easing: 'easeInOutSine'
    });
  }

  /* ---------------------------------------------------------
     O PASSEIO

     Girar no lugar já dá vida ao bicho, mas só quem sai do
     lugar parece que está indo a algum lugar. O andarilho vai
     e volta devagar entre dois pontos próximos.

     O trecho é curto de propósito: o animal não pode
     atravessar parede nem chegar mais perto do que o nível
     combinou. Por isso o destino é sempre aparado pelos
     limites do cenário e nunca passa de z = -0,6 (que é
     logo à frente de quem entra).
     --------------------------------------------------------- */
  function aplicarPasseio(raiz, base, indice) {
    const alcance = Math.max(tamanho * 1.6, 0.45);
    const angulo = sorteia(0, Math.PI * 2);

    let destinoX = base.x + Math.sin(angulo) * alcance;
    let destinoZ = base.z + Math.cos(angulo) * alcance;

    destinoX = Math.max(-limites.x + 0.2, Math.min(limites.x - 0.2, destinoX));
    destinoZ = Math.max(limites.zMin + 0.2, Math.min(-0.6, destinoZ));

    raiz.setAttribute('animation__passear', {
      property: 'position',
      from: `${base.x} 0 ${base.z}`,
      to: `${destinoX} 0 ${destinoZ}`,
      dir: 'alternate',
      loop: true,
      dur: 9000 + indice * 450,
      delay: indice * 300,
      easing: 'easeInOutSine'
    });
  }

  /* =========================================================
     7. CRIAR O GRUPO DE ANIMAIS

     Cada cópia repete a estrutura de camadas de sempre. Não
     clonamos o modelo carregado: pedimos o arquivo de novo para
     cada uma. O navegador guarda o arquivo em cache, então ele é
     baixado uma vez só, mas cada cópia ganha o seu próprio
     esqueleto — sem isso as animações se atropelariam.
     ========================================================= */
  const copias = [];

  /* contadores da cena, para o registro no console e para o HUD */
  let animadas = 0;            // quantas tocam a animação do arquivo
  let escondidosNoTotal = 0;   // quantas começam escondidas
  let encontrados = 0;         // quantas já foram descobertas

  /* Quem está explorando precisa saber que ainda falta procurar
     — senão desiste achando que já viu tudo. A linha só aparece
     quando existe alguém escondido. */
  function mostrarEncontrados() {
    if (escondidosNoTotal === 0) {
      return;
    }
    atualizarConsole();
  }

  /* Quantas cópias tocam a animação do arquivo.

     Cada modelo animado mantém um "tocador" próprio, que
     recalcula a posição de cada osso a cada quadro. Quinze deles
     pesam, e o ganho visual do décimo em diante é mínimo: num
     grupo, ninguém acompanha quinze bichos ao mesmo tempo.

     As cópias além deste limite continuam se mexendo — elas têm
     o giro lento do corpo, que é barato — mas ficam na pose
     parada do arquivo.  */
  const LIMITE_ANIMADOS = 8;

  /* ---------------------------------------------------------
     O QUE CADA CÓPIA FAZ

     Um grupo em que todos se mexem igual não parece um grupo,
     parece um enfeite. Cada cópia recebe um comportamento
     próprio, sorteado com semente — logo, sempre o mesmo:

     quieto     fica parado, respirando. Sem a animação do
                arquivo, que é a parte cara: um bicho imóvel
                não precisa de esqueleto animado
     inquieto   toca a animação e gira o corpo, olhando em volta
     andarilho  o mesmo, e ainda se desloca devagar pelo chão

     Nos níveis 1 e 2 a maioria fica quieta; a partir do 3, a
     maioria se mexe. Mas nunca são todos de um jeito só: sempre
     há algum movimento na cena, e sempre algum animal parado.
     --------------------------------------------------------- */
  function comportamentoDaCopia(indice) {
    if (indice === 0) {
      /* O principal nunca fica parado — é o que a pessoa veio
         ver — mas também não passeia: ele está na distância
         exata que define o nível, e sair do lugar desmancharia
         a progressão que estamos medindo. */
      return 'inquieto';
    }

    const sorte = sorteia(0, 1);

    if (!nivel.movimento) {
      return sorte < 0.65 ? 'quieto' : 'inquieto';
    }

    if (sorte < 0.25) { return 'quieto'; }
    if (sorte < 0.65) { return 'inquieto'; }
    return 'andarilho';
  }

  function criarAnimal(posicao, indice) {
    const comportamento = comportamentoDaCopia(indice);
    const esconderijo = posicao.esconderijo;

    const raiz = document.createElement('a-entity');
    raiz.classList.add('animal', 'clicavel');
    raiz.setAttribute('position', `${posicao.x} 0 ${posicao.z}`);

    /* cada um olha para uma direção um pouco diferente */
    const giro = document.createElement('a-entity');
    giro.classList.add('animalGiro');

    const reacao = document.createElement('a-entity');
    reacao.classList.add('animalReacao');

    const modelo = document.createElement('a-entity');
    modelo.classList.add('animalModelo');
    modelo.setAttribute('rotation', animal.rotacao);

    const apoio = document.createElement('a-box');
    apoio.classList.add('animalApoio');
    apoio.setAttribute('color', '#3A3F4B');
    apoio.setAttribute('opacity', 0.95);
    apoio.setAttribute('width', tamanho);
    apoio.setAttribute('height', tamanho * 0.4);
    apoio.setAttribute('depth', tamanho * 0.4);
    apoio.setAttribute('position', '0 ' + (tamanho * 0.2) + ' 0');

    reacao.appendChild(modelo);
    reacao.appendChild(apoio);
    giro.appendChild(reacao);
    raiz.appendChild(giro);
    animaisEl.appendChild(raiz);

    /* O quieto não recebe o tocador de animação: um bicho que
       só respira não precisa de esqueleto recalculado a cada
       quadro. É assim que dá para ter quinze baratas na cozinha
       sem derrubar a taxa de quadros. */
    const usaAnimacao = Boolean(animal.animacoes)
                        && comportamento !== 'quieto'
                        && indice < LIMITE_ANIMADOS;

    if (usaAnimacao) {
      animadas = animadas + 1;
      modelo.setAttribute('animador', {
        clipe: comportamento === 'andarilho'
          ? animal.animacoes.movendo
          : animal.animacoes.parado
      });
    }

    function darVida() {
      aplicarMovimentoDoCorpo(giro, indice, comportamento);

      /* quem começa escondido só passeia depois de aparecer:
         a saída do esconderijo já usa a posição, e duas
         animações na mesma propriedade brigam entre si */
      if (comportamento === 'andarilho' && !esconderijo) {
        aplicarPasseio(raiz, posicao, indice);
      }
    }

    modelo.addEventListener('model-loaded', function () {
      ajustarModelo(modelo, tamanho);
      apoio.setAttribute('visible', false);
      darVida();
    });

    modelo.addEventListener('model-error', function () {
      if (indice === 0) {
        console.warn(
          `Modelo não encontrado: ${animal.modelo}. ` +
          'Mostrando a caixa provisória. Coloque o arquivo .glb em assets/models/.'
        );
      }
      darVida();
    });

    modelo.setAttribute('gltf-model', 'url(' + animal.modelo + ')');

    /* ---------- escondido até ser encontrado ----------

       Dois jeitos de aparecer, conforme o esconderijo:

       com porta    ele só sai quando alguém ABRE a porta do
                    armário. Chegar perto não basta — por isso
                    a distância vai a zero, desligando a
                    verificação por aproximação.
       sem porta    atrás da lixeira, sob o tronco, no canto do
                    muro: aparece quando alguém chega perto.
       ---------------------------------------------------- */
    if (esconderijo) {
      raiz.setAttribute('revela-perto', {
        distancia: esconderijo.porta ? 0 : 1.6,
        saida: { x: esconderijo.saida.x, y: 0, z: esconderijo.saida.z }
      });

      if (esconderijo.porta) {
        esconderijo.porta.addEventListener('porta-aberta', function () {
          raiz.emit('revelar', null, false);
          marcar('porta-aberta', { indice: indice });
        });
      }

      escondidosNoTotal = escondidosNoTotal + 1;

      raiz.addEventListener('animal-descoberto', function () {
        encontrados = encontrados + 1;
        mostrarEncontrados();

        marcar('animal-encontrado', {
          indice: indice,
          comPorta: Boolean(esconderijo.porta),
          deQuantos: escondidosNoTotal
        });

        if (comportamento === 'andarilho') {
          /* espera a saída terminar antes de começar a passear,
             senão as duas animações disputam a posição */
          setTimeout(function () {
            aplicarPasseio(raiz, esconderijo.saida, indice);
          }, 1400);
        }
      });
    }

    /* ---------- reação ao toque ---------- */
    raiz.addEventListener('click', function () {
      if (!nivel.interacao) {
        console.log('Este nível não permite interação.');
        return;
      }

      /* Tocar no animal é a interação mais direta que o sistema
         permite, e só existe no Nível 5. É o indicador mais forte
         que a aplicação tem sobre superação. */
      tocouNoAnimal = true;
      marcar('tocou-no-animal', { indice: indice });

      const animador = modelo.components.animador;
      const temReacaoPropria = animal.animacoes && animal.animacoes.reagindo;

      if (animador && temReacaoPropria) {
        animador.tocarUmaVez(animal.animacoes.reagindo);
        return;
      }

      reacao.setAttribute('animation__reagir', {
        property: 'rotation',
        from: '0 0 0',
        to: '0 38 0',
        dir: 'alternate',
        loop: 1,
        dur: 190,
        easing: 'easeOutQuad'
      });
    });

    return { raiz, giro, reacao, modelo, apoio };
  }

  calcularPosicoes().forEach(function (posicao, indice) {
    copias.push(criarAnimal(posicao, indice));
  });

  mostrarEncontrados();

  console.log(
    `${copias.length} ${copias.length === 1 ? 'animal' : 'animais'} ` +
    `(${animal.nome}) no cenário "${animal.cenario}", nível ${nivel.numero}. ` +
    `Com animação do arquivo: ${animadas}. Escondidos: ${escondidosNoTotal}.`
  );

  /* ---------- som do animal ----------
     Um som só, na posição do animal principal. O navegador
     calcula o volume pela distância, então a progressão dos
     níveis também se ouve. */
  somAnimal.setAttribute('position', '0 ' + (tamanho * 0.5) + ' ' + (-distancia));

  if (animal.som) {
    somAnimal.setAttribute('sound', 'src', 'url(' + animal.som + ')');
  }

  /* =========================================================
     8. INCLINAR A CÂMERA PARA BAIXO

     Quem está em pé olha para baixo quando há algo no chão.
     Sem essa inclinação, um animal pequeno a 2 metros fica
     abaixo do campo de visão e simplesmente não aparece.

     O valor subiu de 24 para 28 graus quando os animais passaram
     a chegar mais perto: a 75 centímetros, o ângulo até o chão é
     mais fechado.

     Escrever rotation="-18 0 0" no HTML NÃO funciona: o
     componente look-controls recalcula a rotação da câmera a
     cada quadro, a partir de dois objetos internos seus.
     Para inclinar de verdade, escrevemos no objeto que ele lê.
     ========================================================= */
  const INCLINACAO_GRAUS = -28;

  function inclinarCamera(graus) {
    const controles = camera.components['look-controls'];
    if (!controles) {
      return;
    }
    controles.pitchObject.rotation.x = AFRAME.THREE.MathUtils.degToRad(graus);
  }

  /* =========================================================
     9. CONTROLES CONFORME O DISPOSITIVO
     ========================================================= */
  const ehMobile = AFRAME.utils.device.isMobile();

  /* Alguns aparelhos com tela sensível ao toque não são
     reconhecidos como celular (tablets, notebooks híbridos).
     Checar o toque diretamente pega todos eles. */
  const temToque = ehMobile
                   || 'ontouchstart' in window
                   || navigator.maxTouchPoints > 0;

  const controleAndar = document.querySelector('#controleAndar');

  /* O cenário só existe depois de montado, então é agora que o
     controle de andar fica sabendo até onde pode ir. Sem isso,
     atravessaria a parede.

     Este arquivo roda antes de o A-Frame terminar de montar a
     cena, então o componente pode ainda não existir. Quando for
     o caso, esperamos o evento "loaded" da entidade. */
  function avisarOsLimites() {
    const componente = rig && rig.components['andar-toque'];
    if (componente) {
      componente.definirLimites(limites);
    }
  }

  if (rig && rig.hasLoaded) {
    avisarOsLimites();
  } else if (rig) {
    rig.addEventListener('loaded', avisarOsLimites);
  }

  /* o controle de andar só aparece em aparelho com toque: no
     computador há teclado, e ali ele só ocuparia tela */
  if (temToque && controleAndar) {
    controleAndar.hidden = false;
  }

  /* ---------- onde o console cabe neste aparelho ----------

     O console está montado para uma tela larga. Num celular em
     pé a conta muda: o campo de visão horizontal cai para cerca
     de 42 graus (contra 106 no computador), porque a câmera do
     A-Frame mede os 80 graus na VERTICAL e o resto sai da
     proporção da tela. Metade de 42 é 21 — e o console, a 32
     graus à esquerda, ficaria inteiramente fora da tela.

     Daí dois arranjos.

     LATERAL (computador e óculos): painel à esquerda, com os
     quatro botões embaixo dele. Sobra tela de lado.

     CELULAR: tudo centraliza e encolhe, aproveitando a altura
     que a tela em pé tem de sobra. O painel sobe, os botões
     ficam menores e mais juntos, e os três pares cabem acima
     dos 40 graus que a metade do campo vertical permite.

     É o mesmo console nos dois casos, com as mesmas medidas em
     metros recalculadas — e não duas interfaces diferentes. A
     pessoa que testar no computador e depois no óculos encontra
     a mesma coisa nos dois. */

  const botoes3d = [btn3dProximo, btn3dSom, btn3dAjuda,
                    btn3dAnsiedade, btn3dReiniciar, btn3dSair];

  function layoutLateral() {
    consoleCena.setAttribute('position', '-0.404 1.370 -0.829');
    consoleCena.setAttribute('rotation', '-14 26 0');
    painelConsole.setAttribute('console-cena', { largura: 0.72, altura: 0.45 });
    painelConsole.setAttribute('position', '0 0.06 0');

    botoes3d.forEach(function (botao) { botao.setAttribute('visible', true); });
    medirBotoes(0.235, 0.095, 0.245, 0.300, 0.110);
    painelAjuda.setAttribute('painel-texto', { largura: 0.92, altura: 0.42 });
    avisoAbertura.setAttribute('painel-texto', { largura: 0.90, altura: 0.34 });
  }

  function layoutCelular() {
    consoleCena.setAttribute('position', '0 1.426 -0.985');
    consoleCena.setAttribute('rotation', '-10 0 0');
    painelConsole.setAttribute('console-cena', { largura: 0.60, altura: 0.38 });
    painelConsole.setAttribute('position', '0 0.03 0');

    botoes3d.forEach(function (botao) { botao.setAttribute('visible', true); });
    medirBotoes(0.195, 0.082, 0.205, 0.270, 0.095);

    /* 0,92 m a 1,10 m de distância dão 45 graus de largura, e a
       tela de um celular em pé só tem 42: o painel de ajuda
       encolhe junto. */
    painelAjuda.setAttribute('painel-texto', { largura: 0.78, altura: 0.46 });

    /* o aviso de abertura também: a 1,15 m, 0,90 m de largura
       dão exatamente os 42 graus da tela, e o título cortava na
       beirada */
    avisoAbertura.setAttribute('painel-texto', { largura: 0.74, altura: 0.42 });
  }

  /* Os botões acompanham o painel: se ele muda de tamanho e
     eles não, sobram para fora das bordas.

     São DUAS fileiras de TRÊS, e não três de dois. A troca foi
     feita para o texto poder crescer: altura é o recurso escasso
     aqui, porque o console já ocupa de 14 a 35 graus abaixo da
     linha dos olhos e o campo vertical acaba nos 40. Largura,
     ao lado, ainda sobrava. */
  function medirBotoes(largura, altura, coluna, primeiraLinha, espacamento) {
    [[btn3dProximo, -coluna, -primeiraLinha],
     [btn3dSom, 0, -primeiraLinha],
     [btn3dAjuda, coluna, -primeiraLinha],
     [btn3dAnsiedade, -coluna, -primeiraLinha - espacamento],
     [btn3dReiniciar, 0, -primeiraLinha - espacamento],
     [btn3dSair, coluna, -primeiraLinha - espacamento]
    ].forEach(function (item) {
      item[0].setAttribute('position', `${item[1]} ${item[2]} 0`);
      item[0].setAttribute('painel-texto', { largura: largura, altura: altura });
    });
  }

  /* O arranjo de celular vale enquanto a pessoa está olhando
     para a tela. Dentro do óculos ela deixa de ver o HTML, e aí
     o arranjo lateral volta — com os botões 3D, que passam a
     ser os únicos que existem. */
  function escolherLayout() {
    /* trocar de arranjo com um painel aberto o deixaria flutuando
       fora de lugar */
    mostrarEscala(false);
    mostrarAjuda(false);

    if (temToque && !cena.is('vr-mode')) {
      layoutCelular();
    } else {
      layoutLateral();
    }
  }

  escolherLayout();

  const comoAndar = temToque
    ? 'Arraste o dedo no círculo "andar", no canto da tela, para caminhar '
      + 'pelo ambiente. '
    : 'Use as teclas W, A, S e D para andar pelo ambiente. ';

  const comoProcurar = escondidosNoTotal > 0
    ? 'Nem todos os animais estão à vista: alguns aparecem quando você '
      + 'chega perto, e outros só quando você abre a porta do armário. '
    : '';

  let textoAjuda;

  if (ehMobile) {
    mira.setAttribute('fuse', true);
    textoAjuda =
      'Gire o aparelho para olhar em volta. ' + comoAndar
      + 'Mire e segure o olhar por um instante para selecionar. '
      + comoProcurar
      + 'Use "Sair" para voltar à escolha de estímulo a qualquer momento.';
  } else {
    textoAjuda =
      'Arraste o mouse para olhar em volta. ' + comoAndar
      + 'Clique para selecionar. ' + comoProcurar
      + 'Use "Sair" para voltar à escolha de estímulo a qualquer momento.';
  }

  painelAjuda.setAttribute('painel-texto', {
    titulo: 'Como usar',
    texto: textoAjuda + '  Este é um protótipo acadêmico· não é tratamento '
           + 'nem diagnóstico.'
  });

  /* =========================================================
     10. TEMPO DA SESSÃO
     setInterval executa a função a cada 1000 ms (1 segundo).
     ========================================================= */
  let segundos = 0;

  function doisDigitos(n) {
    return String(n).padStart(2, '0');
  }

  setInterval(function () {
    segundos = segundos + 1;
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    tempoTexto = doisDigitos(min) + ':' + doisDigitos(seg);
    atualizarConsole();
  }, 1000);

  /* =========================================================
     11. ESCALA DE DESCONFORTO (autorrelato de 0 a 10)

     Nenhum sensor mede desconforto. Quem informa é a própria
     pessoa — é assim que a pesquisa de exposição trabalha, e é
     o único dado honesto que este sistema tem sobre como alguém
     está se sentindo.

     Os onze botões vêm em DUAS fileiras. Numa fileira só, onze
     botões de 9,5 cm dariam mais de um metro de largura, o que
     não cabe no campo de visão de um celular em pé.
     ========================================================= */
  const LARGURA_NOTA = 0.095;
  const ALTURA_NOTA = 0.08;
  const FOLGA_NOTA = 0.012;

  let desconfortoEscolhido = null;
  const notas = [];

  function posicionarNota(valor) {
    /* primeira fileira 0 a 5, segunda 6 a 10 */
    const fileira = valor <= 5 ? 0 : 1;
    const indice = valor <= 5 ? valor : valor - 6;
    const quantos = fileira === 0 ? 6 : 5;

    const passo = LARGURA_NOTA + FOLGA_NOTA;
    const larguraFileira = quantos * passo - FOLGA_NOTA;
    const x = -larguraFileira / 2 + LARGURA_NOTA / 2 + indice * passo;
    const y = -fileira * (ALTURA_NOTA + FOLGA_NOTA);

    return { x: x, y: y };
  }

  for (let valor = 0; valor <= 10; valor++) {
    const nota = document.createElement('a-entity');
    const onde = posicionarNota(valor);

    nota.classList.add('notaEscala', 'interface');
    nota.setAttribute('position', `${onde.x} ${onde.y} 0`);
    nota.setAttribute('painel-texto', {
      largura: LARGURA_NOTA,
      altura: ALTURA_NOTA,
      centralizar: true,
      texto: String(valor)
    });

    nota.addEventListener('click', function () {
      registrarDesconforto(valor);
    });

    /* destaque ao apontar, mas sem apagar a marcação de quem já
       foi escolhido — por isso a checagem */
    nota.addEventListener('mouseenter', function () {
      if (desconfortoEscolhido !== valor) {
        nota.setAttribute('painel-texto', 'destacado', true);
      }
    });
    nota.addEventListener('mouseleave', function () {
      if (desconfortoEscolhido !== valor) {
        nota.setAttribute('painel-texto', 'destacado', false);
      }
    });

    notas.push(nota);
    botoesEscala.appendChild(nota);
  }

  function registrarDesconforto(valor) {
    desconfortoEscolhido = valor;
    desconfortoTexto = valor + '/10';

    notas.forEach(function (nota, i) {
      nota.setAttribute('painel-texto', 'destacado', i === valor);
    });

    atualizarConsole();
    mostrarEscala(false);

    /* Guarda cada relato, e não apenas o último: a pessoa pode
       relatar mais de uma vez no mesmo nível, e a sequência diz
       mais do que o valor final — um 8 que vira 4 ao longo do
       nível é um dado, e a média dos dois esconderia. */
    marcar('desconforto-relatado', { valor: valor });
    ultimoDesconforto = valor;

    console.log(
      `Autorrelato — nível ${nivel.numero}, ${animal.nome}, ` +
      `${segundos}s: ${valor}/10`
    );
  }

  /* A ajuda e a escala abrem à FRENTE de quem olha, e o console
     fica à esquerda. Em tela larga os dois se cruzam no caminho,
     e um painel atravessando o outro é pior do que qualquer um
     dos dois sozinho.

     Por isso o console sai de cena enquanto há painel aberto.
     Além de resolver a sobreposição em qualquer campo de visão,
     tem sentido próprio: quem parou para ler a ajuda ou para
     dizer como se sente não está consultando o nível. */
  /* ---------- quem o apontador enxerga, agora ----------

     A classe .interface diz o que é interface, e nunca muda. A
     classe .alvo diz o que pode ser clicado NESTE momento, e é
     ela que o apontador procura.

     As duas precisam ser separadas porque o A-Frame não ignora
     objeto invisível ao calcular o raio. O painel de ajuda,
     escondido mas ainda no mesmo lugar, ficava na frente dos
     botões e engolia o clique deles: o raio parava nele, que é o
     mais próximo, e o botão atrás nunca era avisado.

     Trocar de classe não basta: o raycaster guarda a lista de
     objetos e só a refaz quando mandam. Daí o refrescar logo
     abaixo. */
  function marcarAlvos(raiz, ativo) {
    const alvos = raiz.classList.contains('interface')
      ? [raiz]
      : Array.prototype.slice.call(raiz.querySelectorAll('.interface'));

    alvos.forEach(function (el) {
      el.classList.toggle('alvo', ativo);
    });

    refrescarApontadores();
  }

  function refrescarApontadores() {
    [ponteiro, maoEsquerda, maoDireita, mira].forEach(function (el) {
      const raycaster = el && el.components && el.components.raycaster;
      if (raycaster) {
        raycaster.refreshObjects();
      }
    });
  }

  function mostrarEscala(mostrar) {
    escalaAnsiedade.setAttribute('visible', mostrar);
    marcarAlvos(escalaAnsiedade, mostrar);
    btn3dAnsiedade.setAttribute('painel-texto', 'texto',
      mostrar ? 'Fechar' : 'Como me sinto');
    ajustarConsoleAosPaineis();
  }

  function mostrarAjuda(mostrar) {
    painelAjuda.setAttribute('visible', mostrar);
    marcarAlvos(painelAjuda, mostrar);
    btn3dAjuda.setAttribute('painel-texto', 'texto',
      mostrar ? 'Fechar ajuda' : 'Ajuda');
    ajustarConsoleAosPaineis();
  }

  function ajustarConsoleAosPaineis() {
    const algumAberto = painelAjuda.getAttribute('visible') === true
                     || escalaAnsiedade.getAttribute('visible') === true
                     || avisoAbertura.getAttribute('visible') === true;
    consoleCena.setAttribute('visible', !algumAberto);
    marcarAlvos(consoleCena, !algumAberto);
  }

  /* O aviso de abertura segue a mesma regra, e por isso o console
     só aparece quando ele sai. Não é só evitar a sobreposição:
     nos primeiros segundos a pessoa tem uma coisa para ler, e
     duas seriam uma a mais. */
  avisoAbertura.addEventListener('aviso-encerrado', ajustarConsoleAosPaineis);
  ajustarConsoleAosPaineis();

  /* Um de cada vez: dois painéis abertos no mesmo lugar ficariam
     um dentro do outro. */
  btn3dAnsiedade.addEventListener('click', function () {
    const abrindo = escalaAnsiedade.getAttribute('visible') === false;
    mostrarAjuda(false);
    mostrarEscala(abrindo);
  });

  btn3dAjuda.addEventListener('click', function () {
    const abrindo = painelAjuda.getAttribute('visible') === false;
    mostrarEscala(false);
    mostrarAjuda(abrindo);
  });

  /* As notas só existem agora, então é agora que dá para acertar
     quem é alvo: console sim, painéis fechados não. */
  mostrarEscala(false);
  mostrarAjuda(false);

  /* Com o console escondido, o botão que abriu some junto — então
     cada painel precisa fechar por si. A ajuda fecha ao ser
     tocada; a escala, ao receber uma nota ou ao tocar no título,
     que é a saída de quem abriu sem querer. */
  painelAjuda.addEventListener('click', function () {
    mostrarAjuda(false);
  });

  tituloEscala.addEventListener('click', function () {
    mostrarEscala(false);
  });

  /* =========================================================
     12. BOTÕES DE AÇÃO
     ========================================================= */

  /* ---------- Som ----------

     Navegadores PROIBEM tocar áudio antes de a pessoa interagir
     com a página. É uma proteção contra sites que tocam som
     sozinhos. Como quem chega aqui veio de outra página, o
     clique anterior não conta: precisa de um novo.

     Por isso o som começa desligado e este botão é a permissão.
     Ele não é um capricho de interface — é a única forma de o
     áudio funcionar. */
  /* A escolha fica guardada na aba do navegador. Sem isso, trocar
     de nível abriria uma página nova com o som desligado, e a
     pessoa teria que reativar a cada nível.

     Usamos sessionStorage, e não localStorage, de propósito: a
     preferência dura enquanto a aba estiver aberta e some ao
     fechar. Cada sessão de uso começa do zero. */
  const CHAVE_SOM = 'vr-exposicao:som';

  function lerPreferencia() {
    try {
      return sessionStorage.getItem(CHAVE_SOM) === 'ligado';
    } catch (erro) {
      return false;   // navegação anônima pode bloquear o acesso
    }
  }

  function guardarPreferencia(ligado) {
    try {
      sessionStorage.setItem(CHAVE_SOM, ligado ? 'ligado' : 'desligado');
    } catch (erro) {
      // sem espaço ou sem permissão: seguimos sem guardar
    }
  }

  let somLigado = lerPreferencia();

  /* O motor de áudio do navegador começa suspenso e precisa ser
     retomado a partir de um gesto da pessoa. */
  function retomarAudio() {
    const contexto = AFRAME.THREE.AudioContext.getContext();
    if (contexto && contexto.state === 'suspended') {
      contexto.resume();
    }
  }

  function aplicarSom() {
    btn3dSom.setAttribute('painel-texto', 'texto',
      somLigado ? 'Som ligado' : 'Ativar som');

    [somAmbiente, somAnimal].forEach(function (entidade) {
      const componente = entidade.components.sound;

      /* O componente pode existir sem estar pronto: o arquivo de
         áudio ainda está baixando. Mexer nele nesse momento
         quebra a página. Quando terminar, o evento "sound-loaded"
         chama esta função de novo. */
      if (!componente || !componente.pool) {
        return;
      }

      if (somLigado) {
        componente.playSound();
      } else {
        componente.pauseSound();
      }
    });
  }

  /* Cada som avisa quando terminou de carregar. */
  [somAmbiente, somAnimal].forEach(function (entidade) {
    entidade.addEventListener('sound-loaded', function () {
      aplicarSom();
    });
  });

  btn3dSom.addEventListener('click', function () {
    somLigado = !somLigado;
    if (somLigado) {
      retomarAudio();
    }
    guardarPreferencia(somLigado);
    aplicarSom();
    console.log('Som:', somLigado ? 'ligado' : 'desligado');
  });

  /* ---------- retomar o som numa página nova ----------
     A pessoa já tinha ligado o som no nível anterior, mas esta é
     outra página: o navegador exige um gesto NOVO. Tentamos
     retomar de imediato e, se ainda estiver bloqueado, esperamos
     o primeiro toque, clique ou tecla — o que vier primeiro. */
  if (somLigado) {
    retomarAudio();
    aplicarSom();

    const contexto = AFRAME.THREE.AudioContext.getContext();

    if (contexto && contexto.state === 'suspended') {
      const aoPrimeiroGesto = function () {
        contexto.resume();
        aplicarSom();
        ['click', 'keydown', 'touchstart'].forEach(function (evento) {
          window.removeEventListener(evento, aoPrimeiroGesto);
        });
      };

      ['click', 'keydown', 'touchstart'].forEach(function (evento) {
        window.addEventListener(evento, aoPrimeiroGesto);
      });
    }
  } else {
    aplicarSom();
  }

  /* ---------- Reiniciar nível ---------- */
  btn3dReiniciar.addEventListener('click', function () {
    window.location.reload();
  });

  /* ---------- Próximo nível ---------- */
  const proximoNumero = nivel.numero + 1;
  const proximoEndereco = buscarNivel(proximoNumero)
    ? `experiencia.html?animal=${animal.id}&nivel=${proximoNumero}`
    : null;

  /* Um ouvinte só, que fecha a sessão E navega.

     Antes eram dois, em partes diferentes do arquivo: um
     navegava e o outro fechava. O resultado foi que, no último
     nível, o que fechava nem rodava — ele só agia quando havia
     próximo nível — e concluir o percurso ficava gravado como
     desistência. Responsabilidade partida em dois lugares
     esquece metade. */
  btn3dProximo.addEventListener('click', function () {
    /* avançar e concluir são as duas formas de TERMINAR o nível;
       nas duas, concluida = verdadeiro */
    fecharSessao('proximo');

    if (proximoEndereco) {
      window.location.href = proximoEndereco;
      return;
    }

    /* Último nível: não há próximo, então o botão encerra o
       percurso e leva ao questionário. Sem isso, quem chegasse
       até o fim ficaria sem saída a não ser o botão "Sair" — que
       registra desistência, e terminar não é desistir. */
    window.location.href = enderecoDeSaida('concluiu');
  });

  /* Para onde "Sair" leva depende de haver participante.

     Com cadastro, leva ao questionário final — e leva de
     QUALQUER nível, não só do último. Quem tem medo alto talvez
     pare no nível 3, e essa é justamente a pessoa mais
     informativa da amostra; se só respondesse quem termina, a
     amostra se inclinaria para quem tem menos medo.

     Sem cadastro, volta para a seleção. É o caso de quem está
     testando ajustes, que não deve ser obrigado a responder um
     questionário a cada saída. */
  function enderecoDeSaida(motivo) {
    if (!Armazenamento.participante()) {
      return 'selecao.html';
    }
    return `final.html?animal=${animal.id}&nivel=${nivel.numero}&motivo=${motivo}`;
  }

  btn3dSair.addEventListener('click', function () {
    fecharSessao('sair');
    window.location.href = enderecoDeSaida('saiu');
  });

  /* =========================================================
     13. REALIDADE VIRTUAL (WebXR)

     Três coisas mudam quando a pessoa entra no óculos:

     1. O HUD em HTML desaparece. Dentro do modo VR o navegador
        mostra apenas a cena 3D, então a informação essencial
        precisa virar objeto da cena.

     2. Não há teclado. O deslocamento por W A S D não funciona;
        quem usa se move andando de verdade no espaço físico.

     3. A seleção passa a ser pelo raio do controle de mão, ou
        pelo olhar demorado quando não há controle.
     ========================================================= */

  /* ---------- o que o console mostra ----------

     O console é a mesma informação do HUD, só que como objeto
     da cena: aparece no computador, no celular e dentro do
     óculos, sem tapar o cenário. */
  function atualizarConsole() {
    painelConsole.setAttribute('console-cena', {
      animal: animal.nome,
      fobia: animal.fobia,
      nivel: nivel.numero,
      total: NIVEIS.length,
      nivelNome: nivel.nome,
      instrucao: nivel.instrucao,
      tempo: tempoTexto,
      desconforto: desconfortoTexto,
      encontrados: escondidosNoTotal > 0
        ? encontrados + ' de ' + escondidosNoTotal
        : ''
    });
  }

  atualizarConsole();

  /* o aviso central repete o nível e a instrução, e some só */
  avisoAbertura.setAttribute('painel-texto', {
    titulo: `Nível ${nivel.numero} de ${NIVEIS.length} — ${nivel.nome}`,
    texto: nivel.instrucao,
    destacado: true
  });

  if (!proximoEndereco) {
    btn3dProximo.setAttribute('painel-texto', 'texto',
      Armazenamento.participante() ? 'Concluir' : 'Último nível');
  }

  /* ---------- destaque ao apontar ----------
     Sem isso, nada avisa que o retângulo é clicável. Vale para
     o raio do controle de VR, para a mira do celular e para o
     mouse: os três emitem os mesmos eventos. */
  botoes3d.forEach(function (botao) {
    botao.addEventListener('mouseenter', function () {
      botao.setAttribute('painel-texto', 'destacado', true);
    });
    botao.addEventListener('mouseleave', function () {
      botao.setAttribute('painel-texto', 'destacado', false);
    });
  });

  /* ---------- o que cada botão faz ----------
     Reaproveitamos os botões do HUD em HTML: um clique no
     objeto 3D dispara o mesmo código que já existe, em vez de
     duplicar a lógica em dois lugares. */
  /* ---------- traduzir o que o A-Frame escreve em inglês ----------

     O botão de VR e o de sair do VR são criados pelo próprio
     A-Frame, já com texto em inglês, e não têm como ser
     configurados. Traduzimos depois que ele os coloca na página.

     A mensagem de permissão dos sensores, essa sim, é
     configurável: está em experiencia.html, no <a-scene>. */
  function traduzirBotoesDoAFrame() {
    const vr = document.querySelector('.a-enter-vr-button');
    const ar = document.querySelector('.a-enter-ar-button');
    const sair = document.querySelector('.a-modal button');

    if (vr) {
      vr.setAttribute('title',
        'Entrar no modo de Realidade Virtual, com óculos ou em tela cheia');
    }
    if (ar) {
      ar.setAttribute('title', 'Entrar no modo de Realidade Aumentada');
    }
    if (sair && sair.textContent.trim() === 'Exit VR') {
      sair.textContent = 'Sair da Realidade Virtual';
    }
  }

  /* ---------- avisar se este navegador suporta VR ----------

     A informação entra no painel de ajuda, e não numa barra
     própria. Ela interessa sobretudo a quem está montando a
     sessão de testes: saber, antes de entregar o óculos, se
     aquele aparelho aceita Realidade Virtual. */
  function anunciarSuporteVR(aviso) {
    painelAjuda.setAttribute('painel-texto', 'texto',
      textoAjuda
      + '  Este é um protótipo acadêmico· não é tratamento nem '
      + 'diagnóstico.  ' + aviso);
  }

  function verificarSuporteVR() {
    if (!navigator.xr) {
      anunciarSuporteVR('Realidade Virtual não disponível neste navegador.');
      return;
    }

    navigator.xr.isSessionSupported('immersive-vr').then(function (suportado) {
      anunciarSuporteVR(suportado
        ? 'Realidade Virtual disponível· use o botão no canto da tela.'
        : 'Realidade Virtual não disponível neste aparelho.');
    }).catch(function () {
      anunciarSuporteVR('Realidade Virtual não disponível neste aparelho.');
    });
  }

  verificarSuporteVR();
  traduzirBotoesDoAFrame();

  /* ---------- entrar e sair do modo VR ---------- */
  cena.addEventListener('enter-vr', function () {
    /* O console não precisa ser ligado aqui: ele já é um objeto
       da cena e está visível o tempo todo, no computador, no
       celular e dentro do óculos. Antes, era só aqui que a
       interface aparecia em 3D. */

    /* Dentro do óculos o HTML deixa de existir, então o arranjo
       lateral volta — com os botões 3D, que passam a ser os
       únicos botões da experiência. */
    escolherLayout();

    /* No óculos não há mouse nem toque de tela: o ponteiro da
       interface fica sem serventia, e a mira precisa enxergar
       também os botões. Fora do óculos ela volta a enxergar só
       os animais — é o que impede a seleção por olhar de acionar
       um botão sozinha. */
    mira.setAttribute('raycaster', 'objects', '.clicavel, .alvo');

    /* Entrar em VR exigiu um clique, então o áudio pode voltar. */
    if (somLigado) {
      retomarAudio();
    }

    /* Sem controle de mão, a seleção é pelo olhar demorado.
       Se um controle aparecer, desligamos isso para a pessoa
       não acionar coisas sem querer só de olhar. */
    mira.setAttribute('fuse', true);

    console.log('Entrou no modo VR.');
  });

  cena.addEventListener('exit-vr', function () {
    escolherLayout();
    mira.setAttribute('raycaster', 'objects', '.clicavel');
    mira.setAttribute('fuse', ehMobile);
    console.log('Saiu do modo VR.');
  });

  cena.addEventListener('controllerconnected', function (evento) {
    mira.setAttribute('fuse', false);
    console.log('Controle conectado:', evento.detail.name);
  });

  /* =========================================================
     14. REGISTROS DE CARREGAMENTO
     ========================================================= */
  /* =========================================================
     15. MEDIR E FECHAR

     O medidor compara a câmera com o estímulo PRINCIPAL — a
     primeira cópia, a que está na distância que define o nível.
     As outras se espalham e se movem; medir distância até "o
     grupo" não teria significado.
     ========================================================= */
  /* O componente só existe depois de o A-Frame montar a cena, e
     este arquivo roda antes disso. Guardar a referência agora
     guardaria "undefined" para sempre — foi o que aconteceu na
     primeira tentativa, e o medidor nunca ligou. Por isso a
     busca acontece na hora de usar. */
  function oMedidor() {
    return rig && rig.components && rig.components.medidor;
  }

  function ligarMedidor() {
    const medidor = oMedidor();

    if (medidor && copias.length) {
      medidor.comecar(camera, copias[0].raiz);
      marcar('nivel-iniciado', {
        distancia: +distancia.toFixed(2),
        quantidade: copias.length,
        escondidos: escondidosNoTotal
      });
    }
  }

  /* ---------------------------------------------------------
     FECHAR A SESSÃO

     Grava o resumo das medidas. Acontece uma vez só, aconteça
     o que acontecer antes — trocar de nível, sair, fechar a
     aba ou trocar de aplicativo no celular.

     O "visibilitychange" é o gatilho principal, e não o
     "beforeunload": no celular, fechar a aba muitas vezes não
     dispara beforeunload nenhum. Como a gravação é local e
     síncrona, ela termina antes de a página sumir — que é a
     vantagem de não depender de rede neste momento.
     --------------------------------------------------------- */
  function fecharSessao(motivo) {
    const medidor = oMedidor();

    if (sessaoFechada || !medidor) {
      return;
    }
    sessaoFechada = true;
    medidor.parar();

    const resumo = medidor.resumo();
    resumo.encontrados = encontrados;
    resumo.tocou = tocouNoAnimal;
    resumo.desconforto = ultimoDesconforto;

    Armazenamento.fecharSessao(sessao, resumo, motivo === 'proximo');

    console.log('Sessão encerrada (' + motivo + '):', resumo);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      fecharSessao('saiu');
    }
  });

  window.addEventListener('pagehide', function () {
    fecharSessao('saiu');
  });

  /* Tenta enviar assim que a cena está de pé. Falha em
     silêncio: o que não for fica na fila para a próxima. */
  if (Armazenamento.configurado() && Armazenamento.pendentes() > 0) {
    Armazenamento.sincronizar();
  }

  cena.addEventListener('loaded', function () {
    inclinarCamera(INCLINACAO_GRAUS);
    ligarMedidor();

    console.log('Cena 3D carregada com sucesso.');
    console.log('Versão do A-Frame:', AFRAME.version);
    console.log('Animal:', animal.nome, '| tamanho real:', animal.tamanhoReal, 'm');
    console.log('Nível:', nivel.numero, '| distância:', distancia.toFixed(2), 'm');
    console.log('Dispositivo móvel:', ehMobile);
  });

}
