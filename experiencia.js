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

/* ---------- interface dentro do óculos ---------- */
const uiVR = document.querySelector('#uiVR');
const painelInfoVR = document.querySelector('#painelInfoVR');
const btnVRProximo = document.querySelector('#btnVRProximo');
const btnVRSair = document.querySelector('#btnVRSair');

/* ---------- elementos do HUD ---------- */
const hudFobia = document.querySelector('#hudFobia');
const hudIcone = document.querySelector('#hudIcone');
const hudNivel = document.querySelector('#hudNivel');
const hudTrilha = document.querySelector('#hudTrilha');
const hudTempo = document.querySelector('#hudTempo');
const hudInstrucao = document.querySelector('#hudInstrucao');
const hudConcluido = document.querySelector('#hudConcluido');
const hudAnsiedade = document.querySelector('#hudAnsiedade');
const hudEscala = document.querySelector('#hudEscala');
const hudEscalaBotoes = document.querySelector('#hudEscalaBotoes');
const hudAjuda = document.querySelector('#hudAjuda');
const hudAjudaTexto = document.querySelector('#hudAjudaTexto');
const hudEncontrados = document.querySelector('#hudEncontrados');
const hudEncontradosLinha = document.querySelector('#hudEncontradosLinha');

const btnSom = document.querySelector('#btnSom');
const btnAjuda = document.querySelector('#btnAjuda');
const btnReiniciar = document.querySelector('#btnReiniciar');
const btnProximo = document.querySelector('#btnProximo');
const btnProximoTexto = document.querySelector('#btnProximoTexto');
const hudVR = document.querySelector('#hudVR');
const btnSomTexto = document.querySelector('#btnSomTexto');

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
     2. PREENCHER O HUD
     ========================================================= */
  hudFobia.textContent = animal.fobia;
  hudIcone.textContent = animal.icone;
  hudNivel.textContent = `Nível ${nivel.numero} — ${nivel.nome}`;
  hudInstrucao.textContent = nivel.instrucao;

  /* ---------- trilha de bolinhas, uma por nível ---------- */
  NIVEIS.forEach(function (n) {
    const passo = document.createElement('li');
    passo.className = 'hud-trilha__passo';
    if (n.numero <= nivel.numero) {
      passo.classList.add('hud-trilha__passo--feito');
    }
    passo.title = `Nível ${n.numero}: ${n.nome}`;
    hudTrilha.appendChild(passo);
  });

  /* ---------- quanto da progressão já foi percorrido ---------- */
  hudConcluido.textContent = Math.round(nivel.numero / NIVEIS.length * 100) + '%';

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
    if (!hudEncontrados || escondidosNoTotal === 0) {
      return;
    }
    hudEncontradosLinha.hidden = false;
    hudEncontrados.textContent = encontrados + ' de ' + escondidosNoTotal;
    hudEncontrados.classList.toggle(
      'hud-medida__valor--vazio', encontrados === 0);
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
        });
      }

      escondidosNoTotal = escondidosNoTotal + 1;

      raiz.addEventListener('animal-descoberto', function () {
        encontrados = encontrados + 1;
        mostrarEncontrados();

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

  /* O cenário só existe depois de montado, então é agora que
     o controle fica sabendo até onde pode andar. Sem isso,
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

  if (temToque && controleAndar) {
    controleAndar.hidden = false;
  }

  const comoAndar = temToque
    ? 'Arraste o dedo no círculo "andar", no canto da tela, para caminhar '
      + 'pelo ambiente. '
    : 'Use as teclas W, A, S e D para andar pelo ambiente. ';

  const comoProcurar = escondidosNoTotal > 0
    ? 'Nem todos os animais estão à vista: alguns aparecem quando você '
      + 'chega perto, e outros só quando você abre a porta do armário. '
    : '';

  if (ehMobile) {
    mira.setAttribute('fuse', true);
    hudAjudaTexto.textContent =
      'Gire o aparelho para olhar em volta. ' + comoAndar
      + 'Mire e segure o olhar por um instante para selecionar. '
      + comoProcurar
      + 'Use "Sair" para voltar à escolha de estímulo a qualquer momento.';
  } else {
    hudAjudaTexto.textContent =
      'Arraste o mouse para olhar em volta. ' + comoAndar
      + 'Clique para selecionar. ' + comoProcurar
      + 'Use "Sair" para voltar à escolha de estímulo a qualquer momento.';
  }

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
    hudTempo.textContent = doisDigitos(min) + ':' + doisDigitos(seg);
  }, 1000);

  /* =========================================================
     11. ESCALA DE ANSIEDADE (autorrelato de 0 a 10)

     Nenhum sensor mede ansiedade. Quem informa é a própria
     pessoa — é assim que a pesquisa de exposição trabalha.
     O valor fica só nesta página: não é enviado nem gravado.
     ========================================================= */
  for (let valor = 0; valor <= 10; valor++) {
    const botao = document.createElement('button');
    botao.className = 'hud-escala__botao';
    botao.textContent = valor;
    botao.setAttribute('aria-pressed', 'false');
    botao.dataset.valor = valor;
    hudEscalaBotoes.appendChild(botao);
  }

  hudEscalaBotoes.addEventListener('click', function (evento) {
    const botao = evento.target.closest('.hud-escala__botao');
    if (!botao) {
      return;
    }

    // desmarca todos e marca o escolhido
    hudEscalaBotoes.querySelectorAll('.hud-escala__botao').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === botao));
    });

    hudAnsiedade.textContent = botao.dataset.valor + '/10';
    console.log(
      `Autorrelato — nível ${nivel.numero}, ${animal.nome}, ` +
      `${segundos}s: ${botao.dataset.valor}/10`
    );
  });

  hudAnsiedade.addEventListener('click', function () {
    const aberto = hudEscala.hidden;
    hudEscala.hidden = !aberto;
    hudAnsiedade.setAttribute('aria-expanded', String(aberto));
  });

  /* =========================================================
     12. BOTÕES DE AÇÃO
     ========================================================= */

  /* ---------- Ajuda ---------- */
  btnAjuda.addEventListener('click', function () {
    const aberto = hudAjuda.hidden;
    hudAjuda.hidden = !aberto;
    btnAjuda.setAttribute('aria-expanded', String(aberto));
  });

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
    btnSom.setAttribute('aria-pressed', String(somLigado));
    btnSomTexto.textContent = somLigado ? 'Som ligado' : 'Ativar som';

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

  btnSom.addEventListener('click', function () {
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
  btnReiniciar.addEventListener('click', function () {
    window.location.reload();
  });

  /* ---------- Próximo nível ---------- */
  const proximoNumero = nivel.numero + 1;

  if (buscarNivel(proximoNumero)) {
    btnProximo.href = `experiencia.html?animal=${animal.id}&nivel=${proximoNumero}`;
  } else {
    // já está no último nível
    btnProximoTexto.textContent = 'Último nível';
    btnProximo.classList.add('hud-proximo--fim');
  }

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

  /* ---------- o que os painéis do óculos mostram ---------- */
  painelInfoVR.setAttribute('painel-texto', {
    titulo: `Nível ${nivel.numero} de ${NIVEIS.length}`,
    texto: nivel.instrucao
  });

  if (!buscarNivel(nivel.numero + 1)) {
    btnVRProximo.setAttribute('painel-texto', 'texto', 'Último nível');
  }

  /* ---------- destaque ao apontar ---------- */
  [btnVRProximo, btnVRSair].forEach(function (botao) {
    botao.addEventListener('mouseenter', function () {
      botao.setAttribute('painel-texto', 'destacado', true);
    });
    botao.addEventListener('mouseleave', function () {
      botao.setAttribute('painel-texto', 'destacado', false);
    });
  });

  btnVRProximo.addEventListener('click', function () {
    if (btnProximo.href) {
      window.location.href = btnProximo.href;
    }
  });

  btnVRSair.addEventListener('click', function () {
    window.location.href = 'selecao.html';
  });

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

  /* ---------- avisar se este navegador suporta VR ---------- */
  function verificarSuporteVR() {
    if (!navigator.xr) {
      hudVR.textContent = 'VR não disponível neste navegador';
      hudVR.hidden = false;
      return;
    }

    navigator.xr.isSessionSupported('immersive-vr').then(function (suportado) {
      hudVR.textContent = suportado
        ? 'VR disponível — use o botão no canto'
        : 'VR não disponível neste aparelho';
      hudVR.classList.toggle('hud-vr--ok', suportado);
      hudVR.hidden = false;
    }).catch(function () {
      hudVR.textContent = 'VR não disponível neste aparelho';
      hudVR.hidden = false;
    });
  }

  verificarSuporteVR();
  traduzirBotoesDoAFrame();

  /* ---------- entrar e sair do modo VR ---------- */
  cena.addEventListener('enter-vr', function () {
    uiVR.setAttribute('visible', true);

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
    uiVR.setAttribute('visible', false);
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
  cena.addEventListener('loaded', function () {
    inclinarCamera(INCLINACAO_GRAUS);

    console.log('Cena 3D carregada com sucesso.');
    console.log('Versão do A-Frame:', AFRAME.version);
    console.log('Animal:', animal.nome, '| tamanho real:', animal.tamanhoReal, 'm');
    console.log('Nível:', nivel.numero, '| distância:', distancia.toFixed(2), 'm');
    console.log('Dispositivo móvel:', ehMobile);
  });

}
