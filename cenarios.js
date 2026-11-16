/* =========================================================
   CENÁRIOS
   ---------------------------------------------------------
   Cada estímulo aparece no ambiente onde ele seria encontrado
   na vida real. Isso importa para o protótipo: reconhecer o
   lugar ajuda a situar a cena, e uma barata numa cozinha é uma
   situação diferente de uma barata num quarto qualquer.

   Tudo é construído com primitivas do A-Frame — caixas,
   cilindros, esferas e planos. Nenhum arquivo externo, nenhum
   download, e mover um móvel é mudar um número.

   Para acrescentar um cenário: escreva a função e registre-a
   em CENARIOS, no fim do arquivo.
   ========================================================= */

/* ---------------------------------------------------------
   Auxiliar: cria um elemento com atributos e o pendura no pai.
   Evita repetir createElement / setAttribute / appendChild
   centenas de vezes.
   --------------------------------------------------------- */
function criar(tag, atributos, pai) {
  const elemento = document.createElement(tag);

  Object.entries(atributos).forEach(function ([nome, valor]) {
    elemento.setAttribute(nome, valor);
  });

  if (pai) {
    pai.appendChild(elemento);
  }

  return elemento;
}

/* Sorteio com semente: a mesma cena é montada igual toda vez.
   Sem isso, cada recarregamento mudaria a floresta de lugar e
   dois participantes veriam ambientes diferentes. */
function sorteador(semente) {
  let estado = semente;
  return function (minimo, maximo) {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return minimo + (estado / 2147483648) * (maximo - minimo);
  };
}

/* ---------------------------------------------------------
   Cor do céu.

   Usamos a cor de fundo da cena, e não um <a-sky>. O a-sky é uma
   esfera gigante de milhares de faces, desenhada a cada quadro só
   para mostrar uma cor lisa. A cor de fundo não tem geometria
   nenhuma e dá o mesmo resultado.

   (Se um dia o céu virar uma imagem 360°, aí sim o a-sky é o
   caminho — ele existe para isso.)
   --------------------------------------------------------- */
function definirCeu(cor) {
  const cena = document.querySelector('a-scene');
  if (cena) {
    cena.setAttribute('background', 'color', cor);
  }
}

/* ---------------------------------------------------------
   Peças reaproveitadas entre cenários
   --------------------------------------------------------- */

/* Uma esfera do A-Frame nasce com mais de mil triângulos. Para
   uma copa de arbusto vista a metros de distância, cem bastam —
   e a placa de vídeo do celular agradece. */
const POUCAS_FACES = { 'segments-width': 10, 'segments-height': 7 };

function piso(pai, opcoes) {
  return criar('a-plane', {
    position: `0 0 ${opcoes.z}`,
    rotation: '-90 0 0',
    width: opcoes.largura,
    height: opcoes.profundidade,
    color: opcoes.cor,
    roughness: 1,
    metalness: 0
  }, pai);
}

/* ---------------------------------------------------------
   Piso com padrão (ladrilhos).

   A primeira versão deste cenário desenhava 90 quadrados
   separados. Cada peça da cena é um desenho independente que a
   placa de vídeo precisa processar — noventa peças para um chão
   é desperdício.

   Aqui o padrão é pintado UMA vez num canvas e usado como
   textura de um único plano. Um desenho em vez de noventa.
   --------------------------------------------------------- */
function pisoPintado(pai, opcoes) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  opcoes.desenhar(canvas.getContext('2d'), 256);

  const plano = piso(pai, {
    z: opcoes.z, largura: opcoes.largura,
    profundidade: opcoes.profundidade, cor: '#FFFFFF'
  });

  plano.addEventListener('loaded', function () {
    const textura = new AFRAME.THREE.CanvasTexture(canvas);
    textura.wrapS = AFRAME.THREE.RepeatWrapping;
    textura.wrapT = AFRAME.THREE.RepeatWrapping;
    const passo = opcoes.metrosPorPadrao || 1;
    textura.repeat.set(opcoes.largura / passo, opcoes.profundidade / passo);
    textura.colorSpace = AFRAME.THREE.SRGBColorSpace;

    const malha = plano.getObject3D('mesh');
    if (malha) {
      malha.material.map = textura;
      malha.material.needsUpdate = true;
    }
  });

  return plano;
}

/* Dois padrões de piso, pintados uma vez e repetidos. */
function desenharLadrilho(corA, corB) {
  return function (ctx, lado) {
    const meio = lado / 2;
    ctx.fillStyle = corA;
    ctx.fillRect(0, 0, lado, lado);
    ctx.fillStyle = corB;
    ctx.fillRect(0, 0, meio, meio);
    ctx.fillRect(meio, meio, meio, meio);

    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 4;
    [[0, 0], [meio, 0], [0, meio], [meio, meio]].forEach(function (p) {
      ctx.strokeRect(p[0], p[1], meio, meio);
    });
  };
}

function desenharChaoOrganico(corBase, manchas) {
  return function (ctx, lado) {
    ctx.fillStyle = corBase;
    ctx.fillRect(0, 0, lado, lado);

    const sorteia = sorteador(918273);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = manchas[i % manchas.length];
      ctx.globalAlpha = sorteia(0.25, 0.75);
      ctx.beginPath();
      ctx.ellipse(sorteia(0, lado), sorteia(0, lado),
                  sorteia(6, 26), sorteia(4, 18),
                  sorteia(0, 3.14), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
}

function parede(pai, opcoes) {
  return criar('a-plane', {
    position: opcoes.position,
    rotation: opcoes.rotation || '0 0 0',
    width: opcoes.largura,
    height: opcoes.altura,
    color: opcoes.cor,
    roughness: 1,
    metalness: 0
  }, pai);
}

function janela(pai, position, rotation) {
  const grupo = criar('a-entity', { position, rotation: rotation || '0 0 0' }, pai);
  criar('a-plane', { width: 1.5, height: 1.2, color: '#8FBF7F' }, grupo);
  criar('a-plane', { position: '0 0.35 0.01', width: 1.5, height: 0.5, color: '#BBD9EA' }, grupo);
  criar('a-box', { position: '0 0.65 0.03', width: 1.62, height: 0.08, depth: 0.06, color: '#FFFFFF' }, grupo);
  criar('a-box', { position: '0 -0.65 0.03', width: 1.62, height: 0.08, depth: 0.06, color: '#FFFFFF' }, grupo);
  criar('a-box', { position: '-0.79 0 0.03', width: 0.08, height: 1.38, depth: 0.06, color: '#FFFFFF' }, grupo);
  criar('a-box', { position: '0.79 0 0.03', width: 0.08, height: 1.38, depth: 0.06, color: '#FFFFFF' }, grupo);
  criar('a-box', { position: '0 0 0.03', width: 0.05, height: 1.2, depth: 0.05, color: '#FFFFFF' }, grupo);
  criar('a-box', { position: '0 -0.72 0.09', width: 1.7, height: 0.06, depth: 0.18, color: '#FFFFFF' }, grupo);
  return grupo;
}

function vaso(pai, position, escala) {
  const e = escala || 1;
  const grupo = criar('a-entity', { position, scale: `${e} ${e} ${e}` }, pai);
  criar('a-cylinder', { position: '0 0.16 0', radius: 0.17, height: 0.32, color: '#B4785A', 'segments-radial': 12 }, grupo);
  criar('a-sphere', { position: '0 0.62 0', radius: 0.32, color: '#4E7A4A', ...POUCAS_FACES }, grupo);
  criar('a-sphere', { position: '0.18 0.45 0.1', radius: 0.2, color: '#5C8A52', ...POUCAS_FACES }, grupo);
  return grupo;
}

function arvore(pai, position, altura, corCopa) {
  const grupo = criar('a-entity', { position }, pai);
  criar('a-cylinder', {
    position: `0 ${altura / 2} 0`, radius: altura * 0.045,
    height: altura, color: '#5A4330', roughness: 1, 'segments-radial': 7
  }, grupo);
  criar('a-cone', {
    position: `0 ${altura * 0.78} 0`, 'radius-bottom': altura * 0.34,
    'radius-top': 0, height: altura * 0.82, color: corCopa, roughness: 1,
    'segments-radial': 8
  }, grupo);
  return grupo;
}

function arbusto(pai, position, raio, cor) {
  const grupo = criar('a-entity', { position }, pai);
  criar('a-sphere', { position: `0 ${raio * 0.8} 0`, radius: raio, color: cor, roughness: 1, ...POUCAS_FACES }, grupo);
  criar('a-sphere', { position: `${raio * 0.7} ${raio * 0.5} ${raio * 0.2}`, radius: raio * 0.65, color: cor, roughness: 1, ...POUCAS_FACES }, grupo);
  return grupo;
}

/* ---------------------------------------------------------
   PEÇAS DE DETALHE

   São os objetos pequenos que fazem um lugar parecer usado:
   uma pedra, um tufo de capim, um quadro na parede. Cada uma
   é uma função, para o cenário dizer só ONDE a peça fica, e
   não repetir COMO ela é feita.

   Duas regras valem para todas:

   1. Poucas peças por objeto. Cada primitiva do A-Frame é um
      desenho a mais por quadro. Um banco feito de 4 caixas
      custa 4 desenhos; feito de 12, custaria 12 — e num
      celular isso se soma rápido.

   2. Fora do caminho. Os animais andam pelo meio do ambiente
      e não desviam de nada. Então o que é grande fica
      encostado nas paredes, além do limite que eles alcançam
      (ver LIMITES, no fim do arquivo); no meio só entra o que
      é rasteiro, como capim e pedra pequena.
   --------------------------------------------------------- */

/* Pedra: uma esfera de poucas faces, achatada e com as faces
   à mostra (flatShading). Lisa, pareceria uma bola. */
function pedra(pai, x, z, raio, cor) {
  return criar('a-sphere', {
    position: `${x} ${raio * 0.45} ${z}`,
    radius: raio,
    scale: '1.25 0.7 1',
    rotation: `0 ${Math.round(x * 97 + z * 41) % 180} 0`,
    'segments-width': 7, 'segments-height': 5,
    material: `color: ${cor || '#7A7A72'}; roughness: 1; flatShading: true`
  }, pai);
}

/* Tufo de capim: três folhas finas, abertas em leque. Uma só
   pareceria um espeto; um cone largo, uma pirâmide. */
function capim(pai, x, z, altura, cor) {
  const grupo = criar('a-entity', { position: `${x} 0 ${z}` }, pai);
  [[0, 0, 1], [-16, 40, 0.8], [15, 200, 0.9]].forEach(function (folha) {
    const h = altura * folha[2];
    criar('a-cone', {
      position: `0 ${h * 0.48} 0`,
      rotation: `${folha[0]} ${folha[1]} ${folha[0] * 0.6}`,
      'radius-bottom': altura * 0.11, 'radius-top': 0, height: h,
      'segments-radial': 4, 'segments-height': 1,
      color: cor, roughness: 1
    }, grupo);
  });
  return grupo;
}

/* Cogumelo: haste e chapéu. */
function cogumelo(pai, x, z, escala) {
  const e = escala || 1;
  const grupo = criar('a-entity', { position: `${x} 0 ${z}`, scale: `${e} ${e} ${e}` }, pai);
  criar('a-cylinder', { position: '0 0.05 0', radius: 0.018, height: 0.1, color: '#E8E0CC', 'segments-radial': 6 }, grupo);
  criar('a-cone', { position: '0 0.115 0', 'radius-bottom': 0.07, 'radius-top': 0.01, height: 0.05, color: '#B5523C', 'segments-radial': 8 }, grupo);
  return grupo;
}

/* Árvore de copa redonda, para a mata não ser só de pinheiros. */
function arvoreFrondosa(pai, position, altura, corCopa) {
  const grupo = criar('a-entity', { position }, pai);
  criar('a-cylinder', {
    position: `0 ${altura * 0.28} 0`, radius: altura * 0.05,
    height: altura * 0.56, color: '#4E3A2A', roughness: 1, 'segments-radial': 7
  }, grupo);
  criar('a-sphere', {
    position: `0 ${altura * 0.68} 0`, radius: altura * 0.34, scale: '1 0.82 1',
    'segments-width': 8, 'segments-height': 6,
    material: `color: ${corCopa}; roughness: 1; flatShading: true`
  }, grupo);
  return grupo;
}

/* Quadro de parede: moldura e tela. */
function quadroDeParede(pai, position, rotation, largura, altura, corTela) {
  const grupo = criar('a-entity', { position, rotation }, pai);
  criar('a-plane', { width: largura, height: altura, color: '#2E2A26' }, grupo);
  criar('a-plane', { position: '0 0 0.01', width: largura - 0.1, height: altura - 0.1, color: corTela }, grupo);
  return grupo;
}

/* Porta fechada numa parede: batente, folha e maçaneta.
   "rotation" vira a porta para dentro do ambiente. */
function portaDeParede(pai, position, rotation, corFolha) {
  const grupo = criar('a-entity', { position, rotation }, pai);
  criar('a-box', { position: '0 1.07 0', width: 1.0, height: 2.14, depth: 0.03, color: '#F2EFE9' }, grupo);
  criar('a-box', { position: '0 1.03 0.02', width: 0.86, height: 2.04, depth: 0.04, color: corFolha }, grupo);
  criar('a-sphere', { position: '0.33 1.0 0.07', radius: 0.035, color: '#C9B37A', ...POUCAS_FACES }, grupo);
  return grupo;
}

/* Luz de teto: um disco claro que não depende da iluminação
   (shader flat), para parecer aceso. */
function plafon(pai, position) {
  return criar('a-cylinder', {
    position, radius: 0.22, height: 0.05, 'segments-radial': 16,
    material: 'shader: flat; color: #FFF3D6'
  }, pai);
}

/* =========================================================
   SALA — aranha e rato
   ========================================================= */
/* Lista preenchida por cada cenário: onde um animal pode estar
   escondido, e a porta que o revela (quando houver). */
let esconderijos = [];

/* Um esconderijo guarda três coisas·

   posicao   onde o animal espera, invisível
   saida     para onde ele corre quando é descoberto
   porta     a porta que o revela, quando existe uma

   A saída não é escolhida à mão em cada chamada. Todo
   esconderijo fica encostado em alguma coisa — um armário,
   a geladeira, um tronco — e todos esses estão nas beiradas
   do ambiente. Então a saída é sempre "para o meio da sala e
   um passo à frente"· multiplicar x por 0,72 puxa o animal em
   direção à linha do centro, e somar em z o traz para perto
   de quem olha.

   O único cuidado é com os esconderijos que ficam ao lado de
   quem entra (z próximo de zero)· dar o passo à frente ali
   colocaria o animal em cima da pessoa, o que é susto, não
   exposição. Nesses, ele só sai de lado. */
function esconderijo(x, z, porta) {
  const passoAFrente = z + 0.5;

  /* quem sai de um armário precisa afastar-se um pouco mais:
     a porta aberta ocupa justamente o espaço ao lado dele */
  const puxada = porta ? 0.55 : 0.72;

  esconderijos.push({
    posicao: { x: x, z: z },
    saida: {
      x: x * puxada,
      z: passoAFrente > -0.5 ? z : passoAFrente
    },
    porta: porta || null
  });
}

function montarSala(raiz) {
  definirCeu('#8FA8BD');

  piso(raiz, { z: -3.5, largura: 6, profundidade: 10, cor: '#7A5637' });
  criar('a-plane', { position: '0 2.8 -3.5', rotation: '90 0 0', width: 6, height: 10, color: '#E9E6DF' }, raiz);

  parede(raiz, { position: '0 1.4 -8.5', largura: 6, altura: 2.8, cor: '#DAD6CD' });
  parede(raiz, { position: '0 1.4 1.5', rotation: '0 180 0', largura: 6, altura: 2.8, cor: '#DAD6CD' });
  parede(raiz, { position: '-3 1.4 -3.5', rotation: '0 90 0', largura: 10, altura: 2.8, cor: '#D2CEC4' });
  parede(raiz, { position: '3 1.4 -3.5', rotation: '0 -90 0', largura: 10, altura: 2.8, cor: '#D2CEC4' });
  criar('a-box', { position: '0 0.06 -8.46', width: 6, height: 0.12, depth: 0.04, color: '#F2EFE9' }, raiz);

  janela(raiz, '0 1.55 -8.45');

  /* ---------- sofá ---------- */
  const sofa = criar('a-entity', { position: '-2.15 0 -4.2', rotation: '0 90 0' }, raiz);
  criar('a-box', { position: '0 0.22 0', width: 2.1, height: 0.44, depth: 0.85, color: '#4A5568' }, sofa);
  criar('a-box', { position: '0 0.5 -0.02', width: 2.0, height: 0.18, depth: 0.78, color: '#5A6880' }, sofa);
  criar('a-box', { position: '0 0.72 -0.36', width: 2.1, height: 0.62, depth: 0.16, color: '#4A5568' }, sofa);
  criar('a-box', { position: '-1.0 0.62 0', width: 0.16, height: 0.42, depth: 0.85, color: '#414D5E' }, sofa);
  criar('a-box', { position: '1.0 0.62 0', width: 0.16, height: 0.42, depth: 0.85, color: '#414D5E' }, sofa);
  criar('a-box', { position: '-0.55 0.66 -0.2', width: 0.38, height: 0.38, depth: 0.14, rotation: '0 0 8', color: '#8B9BB4' }, sofa);
  criar('a-box', { position: '0.6 0.66 -0.2', width: 0.38, height: 0.38, depth: 0.14, rotation: '0 0 -6', color: '#8B9BB4' }, sofa);

  /* ---------- mesa de centro ---------- */
  const mesa = criar('a-entity', { position: '-0.35 0 -4.3' }, raiz);
  criar('a-box', { position: '0 0.42 0', width: 1.1, height: 0.06, depth: 0.6, color: '#8A5A34' }, mesa);
  ['-0.48 0.21 -0.22', '0.48 0.21 -0.22', '-0.48 0.21 0.22', '0.48 0.21 0.22'].forEach(function (p) {
    criar('a-box', { position: p, width: 0.06, height: 0.42, depth: 0.06, color: '#4B3522' }, mesa);
  });
  criar('a-box', { position: '0.18 0.46 0.04', width: 0.26, height: 0.03, depth: 0.2, rotation: '0 14 0', color: '#E4DED2' }, mesa);

  /* ---------- estante com televisão ---------- */
  const estante = criar('a-entity', { position: '2.55 0 -4.6' }, raiz);
  criar('a-box', { position: '0 0.3 0', width: 0.45, height: 0.6, depth: 1.9, color: '#9A7247' }, estante);
  criar('a-box', { position: '-0.02 1.15 0', width: 0.08, height: 1.05, depth: 1.5, color: '#22262B' }, estante);
  criar('a-plane', { position: '-0.07 1.15 0', rotation: '0 -90 0', width: 1.44, height: 0.98, color: '#0E1420' }, estante);

  /* ---------- tapete ---------- */
  criar('a-plane', {
    position: '-0.5 0.01 -4.3', rotation: '-90 0 0',
    width: 2.6, height: 3.4, color: '#5B5046', roughness: 1
  }, raiz);

  /* ---------- luminária de chão ---------- */
  const luminaria = criar('a-entity', { position: '-2.6 0 -6.4' }, raiz);
  criar('a-cylinder', { position: '0 0.02 0', radius: 0.18, height: 0.04, color: '#22262B' }, luminaria);
  criar('a-cylinder', { position: '0 0.7 0', radius: 0.02, height: 1.4, color: '#22262B' }, luminaria);
  criar('a-cone', { position: '0 1.5 0', 'radius-bottom': 0.22, 'radius-top': 0.14, height: 0.26, color: '#E8DCC0' }, luminaria);

  /* ---------- quadro ---------- */
  const quadro = criar('a-entity', { position: '-2.96 1.75 -3', rotation: '0 90 0' }, raiz);
  criar('a-plane', { width: 1.0, height: 0.7, color: '#2E2A26' }, quadro);
  criar('a-plane', { position: '0 0 0.01', width: 0.9, height: 0.6, color: '#5C7C6B' }, quadro);

  vaso(raiz, '2.5 0 -7.4');

  /* ======================================================
     DETALHES — o que faz a sala parecer habitada
     Tudo aqui fica nas paredes, sobre os móveis ou colado
     ao fundo: nada no caminho dos animais.
     ====================================================== */

  /* rodapé nas paredes laterais (o do fundo já existia) */
  criar('a-box', { position: '-2.97 0.06 -3.5', width: 0.04, height: 0.12, depth: 10, color: '#F2EFE9' }, raiz);
  criar('a-box', { position: '2.97 0.06 -3.5', width: 0.04, height: 0.12, depth: 10, color: '#F2EFE9' }, raiz);

  /* ---------- cortinas ---------- */
  criar('a-box', { position: '-1.02 1.52 -8.42', width: 0.36, height: 1.62, depth: 0.05, color: '#B9A88F' }, raiz);
  criar('a-box', { position: '1.02 1.52 -8.42', width: 0.36, height: 1.62, depth: 0.05, color: '#B9A88F' }, raiz);
  criar('a-cylinder', { position: '0 2.35 -8.42', rotation: '0 0 90', radius: 0.015, height: 2.6, color: '#3A3530', 'segments-radial': 6 }, raiz);

  /* ---------- estante de livros, no fundo à esquerda ----------
     Um corpo escuro, quatro tábuas e os livros como blocos
     coloridos entre elas. Seis blocos bastam para o olho ler
     "estante cheia"; cinquenta livros separados custariam
     cinquenta desenhos para o mesmo efeito. */
  const livros = criar('a-entity', { position: '-2.1 0 -8.33' }, raiz);
  criar('a-box', { position: '0 0.95 0', width: 1.3, height: 1.9, depth: 0.3, color: '#5E4328' }, livros);
  [0.05, 0.65, 1.25, 1.87].forEach(function (y) {
    criar('a-box', { position: `0 ${y} 0.02`, width: 1.34, height: 0.04, depth: 0.34, color: '#8A6540' }, livros);
  });
  [
    [-0.3, 0.07, 0.6, 0.40, '#7C3A32'], [0.34, 0.07, 0.5, 0.30, '#2F5D6B'],
    [-0.36, 0.67, 0.44, 0.34, '#C9A54B'], [0.2, 0.67, 0.62, 0.42, '#3F4E66'],
    [-0.2, 1.27, 0.7, 0.36, '#4E6B4A'], [0.42, 1.27, 0.3, 0.26, '#A0522D']
  ].forEach(function (b) {
    criar('a-box', {
      position: `${b[0]} ${b[1] + b[3] / 2} 0.09`,
      width: b[2], height: b[3], depth: 0.2, color: b[4]
    }, livros);
  });

  /* ---------- porta, na parede direita, perto de quem entra ---------- */
  portaDeParede(raiz, '2.98 0 -0.3', '0 -90 0', '#B58A5A');

  /* ---------- segundo quadro e relógio ---------- */
  quadroDeParede(raiz, '-2.96 1.8 -4.7', '0 90 0', 0.6, 0.8, '#B8794E');

  const relogio = criar('a-entity', { position: '1.95 2.0 -8.47' }, raiz);
  criar('a-cylinder', { rotation: '90 0 0', radius: 0.2, height: 0.03, color: '#F4F1EA', 'segments-radial': 20 }, relogio);
  criar('a-box', { position: '0 0.045 0.02', width: 0.018, height: 0.1, depth: 0.01, color: '#22262B' }, relogio);
  criar('a-box', { position: '0.055 0 0.02', width: 0.13, height: 0.014, depth: 0.01, color: '#22262B' }, relogio);

  /* ---------- mesinha com abajur, ao lado do sofá ---------- */
  const mesinha = criar('a-entity', { position: '-2.62 0 -2.75' }, raiz);
  criar('a-cylinder', { position: '0 0.25 0', radius: 0.03, height: 0.5, color: '#4B3522', 'segments-radial': 6 }, mesinha);
  criar('a-cylinder', { position: '0 0.51 0', radius: 0.24, height: 0.04, color: '#8A5A34', 'segments-radial': 16 }, mesinha);
  criar('a-cylinder', { position: '0 0.63 0', radius: 0.045, height: 0.2, color: '#5C6B7A', 'segments-radial': 8 }, mesinha);
  criar('a-cone', { position: '0 0.81 0', 'radius-bottom': 0.15, 'radius-top': 0.09, height: 0.18, color: '#F1E3C4', 'segments-radial': 12 }, mesinha);

  /* ---------- sobre a mesa de centro: caneca e controle ---------- */
  criar('a-cylinder', { position: '-0.3 0.495 -0.1', radius: 0.04, height: 0.09, color: '#C0584A', 'segments-radial': 10 }, mesa);
  criar('a-box', { position: '-0.1 0.46 0.16', rotation: '0 -20 0', width: 0.05, height: 0.02, depth: 0.16, color: '#22262B' }, mesa);

  /* ---------- sobre o móvel da televisão ---------- */
  criar('a-box', { position: '0.02 0.71 0.86', width: 0.14, height: 0.22, depth: 0.12, color: '#2B2F35' }, estante);
  criar('a-box', { position: '0 0.64 -0.86', rotation: '0 12 0', width: 0.2, height: 0.08, depth: 0.15, color: '#7C3A32' }, estante);

  /* ---------- luz de teto ---------- */
  plafon(raiz, '0 2.775 -4');

  /* onde um bicho se esconderia numa sala */
  esconderijo(-2.1, -4.2);    // sob o sofá
  esconderijo(-0.35, -4.3);   // sob a mesa de centro
  esconderijo(2.3, -4.6);     // atrás da estante
  esconderijo(-2.5, -6.4);    // atrás da luminária
  esconderijo(2.4, -7.4);     // atrás do vaso

  /* ---------- iluminação ---------- */
  criar('a-light', { type: 'ambient', color: '#8C99AB', intensity: 0.55 }, raiz);
  criar('a-light', { type: 'directional', color: '#DCE8F2', intensity: 0.5, position: '0 3 -6' }, raiz);
  criar('a-light', { type: 'point', color: '#FFD9A0', intensity: 1.2, distance: 7, position: '-2.5 1.6 -6.3' }, raiz);
}

/* =========================================================
   COZINHA — barata
   ========================================================= */
function montarCozinha(raiz) {
  definirCeu('#8FA8BD');

  pisoPintado(raiz, {
    z: -3, largura: 5, profundidade: 9, metrosPorPadrao: 1,
    desenhar: desenharLadrilho('#D8D4CC', '#9FA6A8')
  });

  criar('a-plane', { position: '0 2.7 -3', rotation: '90 0 0', width: 5, height: 9, color: '#F0EEE8' }, raiz);

  parede(raiz, { position: '0 1.35 -7.5', largura: 5, altura: 2.7, cor: '#E6E2D8' });
  parede(raiz, { position: '0 1.35 1.5', rotation: '0 180 0', largura: 5, altura: 2.7, cor: '#E6E2D8' });
  parede(raiz, { position: '-2.5 1.35 -3', rotation: '0 90 0', largura: 9, altura: 2.7, cor: '#DFDBD1' });
  parede(raiz, { position: '2.5 1.35 -3', rotation: '0 -90 0', largura: 9, altura: 2.7, cor: '#DFDBD1' });

  /* azulejo entre a bancada e os armários de cima */
  criar('a-plane', { position: '-2.49 1.35 -3.5', rotation: '0 90 0', width: 6, height: 0.72, color: '#BFD3DA' }, raiz);

  janela(raiz, '0 1.5 -7.45');

  /* ---------- bancada com armários inferiores ---------- */
  const bancada = criar('a-entity', { position: '-2.2 0 -3.5' }, raiz);
  criar('a-box', { position: '0 0.44 0', width: 0.6, height: 0.88, depth: 6, color: '#C9BFA8' }, bancada);
  criar('a-box', { position: '0.01 0.9 0', width: 0.66, height: 0.06, depth: 6.1, color: '#3E4146' }, bancada);
  criar('a-box', { position: '0 0.08 0', width: 0.62, height: 0.12, depth: 6, color: '#8A8073' }, bancada);
  /* ---------- portas dos armários ----------
     Cada porta gira em torno de uma dobradiça. Por isso ela é
     filha de uma entidade posicionada NA dobradiça, e o painel
     fica deslocado meia largura para o lado: girar o pai faz a
     porta abrir como uma porta de verdade, e não em torno do
     próprio meio. */
  for (let i = -2; i <= 2; i++) {
    const z = -3.5 + i * 1.12;

    const dobradica = criar('a-entity', {
      position: `-1.89 0.5 ${z - 0.5}`,
      class: 'porta clicavel',
      'porta-armario': ''
    }, raiz);

    criar('a-box', {
      position: '0 0 0.5',
      width: 0.03, height: 0.78, depth: 1.0,
      color: '#DCD3BC'
    }, dobradica);

    criar('a-box', {
      position: '0.03 0 0.92',
      width: 0.02, height: 0.03, depth: 0.28,
      color: '#5A5F66'
    }, dobradica);

    /* dentro do armário, atrás da porta */
    esconderijo(-2.05, z, dobradica);
  }

  /* ---------- pia ---------- */
  const pia = criar('a-entity', { position: '-2.2 0.9 -2.2' }, raiz);
  criar('a-box', { position: '0 0.01 0', width: 0.5, height: 0.06, depth: 0.8, color: '#AEB4BA' }, pia);
  criar('a-box', { position: '0 -0.02 0', width: 0.42, height: 0.1, depth: 0.7, color: '#8C9299' }, pia);
  criar('a-cylinder', { position: '-0.2 0.16 0', radius: 0.022, height: 0.3, color: '#C4CAD0' }, pia);
  criar('a-box', { position: '-0.12 0.3 0', width: 0.18, height: 0.03, depth: 0.03, color: '#C4CAD0' }, pia);

  /* ---------- armários superiores ---------- */
  const superiores = criar('a-entity', { position: '-2.28 1.98 -4.2' }, raiz);
  criar('a-box', { position: '0 0 0', width: 0.42, height: 0.72, depth: 4.4, color: '#D2C8B2' }, superiores);
  for (let i = -1; i <= 1; i++) {
    criar('a-box', { position: `0.22 -0.1 ${i * 1.3}`, width: 0.02, height: 0.03, depth: 0.3, color: '#5A5F66' }, superiores);
  }

  /* ---------- geladeira ---------- */
  const geladeira = criar('a-entity', { position: '2.1 0 -6.2' }, raiz);
  criar('a-box', { position: '0 0.88 0', width: 0.72, height: 1.76, depth: 0.7, color: '#C6CBD1' }, geladeira);
  criar('a-box', { position: '-0.37 0.88 0', width: 0.02, height: 1.7, depth: 0.66, color: '#AAB0B7' }, geladeira);
  criar('a-box', { position: '-0.38 1.3 0.2', width: 0.03, height: 0.5, depth: 0.03, color: '#6B7178' }, geladeira);
  criar('a-box', { position: '-0.38 0.6 0.2', width: 0.03, height: 0.4, depth: 0.03, color: '#6B7178' }, geladeira);

  /* ---------- fogão ---------- */
  const fogao = criar('a-entity', { position: '2.15 0 -4.3' }, raiz);
  criar('a-box', { position: '0 0.44 0', width: 0.64, height: 0.88, depth: 0.76, color: '#3E4146' }, fogao);
  criar('a-box', { position: '0 0.9 0', width: 0.68, height: 0.05, depth: 0.8, color: '#222528' }, fogao);
  [[-0.14, -0.18], [-0.14, 0.18], [0.14, -0.18], [0.14, 0.18]].forEach(function (p) {
    criar('a-cylinder', { position: `${p[0]} 0.93 ${p[1]}`, radius: 0.1, height: 0.02, color: '#4A4E54' }, fogao);
  });
  criar('a-box', { position: '-0.33 0.5 0', width: 0.02, height: 0.5, depth: 0.6, color: '#1A1D20' }, fogao);

  /* ---------- lixeira, onde a barata faz sentido ---------- */
  const lixeira = criar('a-entity', { position: '1.9 0 -2.6' }, raiz);
  criar('a-cylinder', { position: '0 0.28 0', radius: 0.19, height: 0.56, color: '#6E747B' }, lixeira);
  criar('a-cylinder', { position: '0 0.58 0', radius: 0.2, height: 0.04, color: '#565C63' }, lixeira);

  /* ======================================================
     DETALHES — o que faz a cozinha parecer usada
     ====================================================== */

  /* ---------- sobre a bancada (o tampo fica a 0,93 m) ---------- */
  /* micro-ondas */
  criar('a-box', { position: '-2.22 1.07 -5.7', width: 0.36, height: 0.28, depth: 0.5, color: '#D9DCE0' }, raiz);
  criar('a-box', { position: '-2.035 1.07 -5.76', width: 0.01, height: 0.2, depth: 0.32, color: '#1E2226' }, raiz);

  /* fruteira */
  criar('a-cone', { position: '-2.2 0.97 -4.4', 'radius-bottom': 0.09, 'radius-top': 0.17, height: 0.08, color: '#E4DED2', 'segments-radial': 12 }, raiz);
  criar('a-sphere', { position: '-2.24 1.03 -4.37', radius: 0.055, color: '#E08A2E', ...POUCAS_FACES }, raiz);
  criar('a-sphere', { position: '-2.15 1.03 -4.44', radius: 0.05, color: '#B93A32', ...POUCAS_FACES }, raiz);

  /* tábua de cortar e garrafa */
  criar('a-box', { position: '-2.18 0.94 -3.25', rotation: '0 8 0', width: 0.26, height: 0.02, depth: 0.36, color: '#B98A55' }, raiz);
  criar('a-cylinder', { position: '-2.36 1.06 -2.95', radius: 0.035, height: 0.26, color: '#3F6B4A', 'segments-radial': 8 }, raiz);

  /* escorredor com pratos, do outro lado da pia */
  criar('a-box', { position: '-2.2 0.945 -1.3', width: 0.32, height: 0.03, depth: 0.42, color: '#8C9299' }, raiz);
  criar('a-cylinder', { position: '-2.2 1.06 -1.38', rotation: '90 0 0', radius: 0.11, height: 0.012, color: '#F4F1EA', 'segments-radial': 16 }, raiz);
  criar('a-cylinder', { position: '-2.2 1.06 -1.26', rotation: '90 0 0', radius: 0.11, height: 0.012, color: '#F4F1EA', 'segments-radial': 16 }, raiz);

  /* ---------- fogão: coifa, panela e pano de prato ---------- */
  criar('a-box', { position: '2.2 1.85 -4.3', width: 0.56, height: 0.14, depth: 0.8, color: '#9AA0A6' }, raiz);
  criar('a-box', { position: '2.36 2.31 -4.3', width: 0.24, height: 0.78, depth: 0.3, color: '#8A9096' }, raiz);
  criar('a-cylinder', { position: '2.01 1.0 -4.12', radius: 0.1, height: 0.13, color: '#B8BEC4', 'segments-radial': 12 }, raiz);
  criar('a-box', { position: '1.86 1.03 -4.12', width: 0.12, height: 0.02, depth: 0.03, color: '#22262B' }, raiz);
  criar('a-box', { position: '1.812 0.6 -4.3', width: 0.012, height: 0.3, depth: 0.2, color: '#C24A3A' }, raiz);

  /* ---------- ímãs na geladeira ---------- */
  criar('a-box', { position: '1.715 1.3 -6.38', width: 0.006, height: 0.12, depth: 0.09, color: '#E8C84A' }, raiz);
  criar('a-box', { position: '1.715 1.12 -6.3', width: 0.006, height: 0.08, depth: 0.08, color: '#C0584A' }, raiz);

  /* ---------- prateleira com potes, acima da lixeira ---------- */
  criar('a-box', { position: '2.4 1.45 -2.6', width: 0.2, height: 0.03, depth: 0.9, color: '#8A6540' }, raiz);
  [[-2.9, '#C9A54B'], [-2.6, '#7C3A32'], [-2.3, '#4E6B4A']].forEach(function (pote) {
    criar('a-cylinder', { position: `2.4 1.54 ${pote[0]}`, radius: 0.055, height: 0.15, color: pote[1], 'segments-radial': 10 }, raiz);
  });

  /* ---------- mesa sob a janela, com dois bancos ----------
     Fica colada à parede do fundo, depois do ponto até onde
     as baratas chegam (zMin, em LIMITES). */
  const mesaCozinha = criar('a-entity', { position: '0.3 0 -7.14' }, raiz);
  criar('a-box', { position: '0 0.74 0', width: 1.2, height: 0.04, depth: 0.6, color: '#C9B48E' }, mesaCozinha);
  criar('a-box', { position: '-0.52 0.36 0', width: 0.05, height: 0.72, depth: 0.5, color: '#8A6540' }, mesaCozinha);
  criar('a-box', { position: '0.52 0.36 0', width: 0.05, height: 0.72, depth: 0.5, color: '#8A6540' }, mesaCozinha);
  [-0.92, 0.92].forEach(function (x) {
    criar('a-cylinder', { position: `${x} 0.23 0.05`, radius: 0.03, height: 0.46, color: '#5A5F66', 'segments-radial': 6 }, mesaCozinha);
    criar('a-cylinder', { position: `${x} 0.47 0.05`, radius: 0.17, height: 0.04, color: '#8A6540', 'segments-radial': 14 }, mesaCozinha);
  });
  /* vasinho sobre a mesa */
  criar('a-cylinder', { position: '0.25 0.81 -0.05', radius: 0.06, height: 0.1, color: '#B4785A', 'segments-radial': 10 }, mesaCozinha);
  criar('a-sphere', { position: '0.25 0.93 -0.05', radius: 0.1, color: '#4E7A4A', ...POUCAS_FACES }, mesaCozinha);

  /* ---------- quadro na parede direita, perto de quem entra ---------- */
  quadroDeParede(raiz, '2.49 1.6 -0.9', '0 -90 0', 0.55, 0.7, '#D9C9A8');

  /* ---------- tapete em frente à pia e luz de teto ---------- */
  criar('a-plane', { position: '-1.45 0.01 -2.2', rotation: '-90 0 0', width: 0.6, height: 1.3, color: '#7A4A3C', roughness: 1 }, raiz);
  plafon(raiz, '0 2.675 -3.5');

  /* outros cantos onde uma barata se esconderia */
  esconderijo(1.9, -2.6);      // atrás da lixeira
  esconderijo(2.05, -6.2);     // sob a geladeira
  esconderijo(2.1, -4.3);      // atrás do fogão
  esconderijo(-1.7, -7.0);     // canto do fundo

  criar('a-light', { type: 'ambient', color: '#AEB9C6', intensity: 0.7 }, raiz);
  criar('a-light', { type: 'directional', color: '#FFFFFF', intensity: 0.45, position: '1 3 -5' }, raiz);
  criar('a-light', { type: 'point', color: '#FFF3DC', intensity: 1.1, distance: 8, position: '0 2.5 -3.5' }, raiz);
}

/* =========================================================
   FLORESTA — cobra
   ========================================================= */
function montarFloresta(raiz) {
  definirCeu('#A8C4D4');

  /* chão de terra com folhas, e manchas de mato por cima */
  /* o mato e as folhas ficam pintados no próprio chão, num
     desenho só, em vez de dezenas de manchas separadas */
  pisoPintado(raiz, {
    z: -11, largura: 40, profundidade: 40, metrosPorPadrao: 6,
    desenhar: desenharChaoOrganico('#59452F',
      ['#4C6138', '#3F5530', '#6B5334', '#7A6242'])
  });

  const sorteia = sorteador(20240915);

  /* árvores: mais densas ao fundo, abertas perto de quem observa,
     para o animal do nível 1 continuar visível a 7 metros */
  const arvores = criar('a-entity', {}, raiz);
  const copas = ['#31552C', '#3B6334', '#28472480'.slice(0, 7), '#446E3A'];
  for (let i = 0; i < 16; i++) {
    const x = sorteia(-14, 14);
    const z = sorteia(-22, 2);
    /* deixa livre o corredor por onde os animais aparecem */
    if (Math.abs(x) < 2.6 && z > -9) { continue; }
    arvore(arvores, `${x} 0 ${z}`, sorteia(3.5, 7.5), copas[i % copas.length]);
  }

  const arbustos = criar('a-entity', {}, raiz);
  for (let i = 0; i < 9; i++) {
    const x = sorteia(-11, 11);
    const z = sorteia(-18, 1);
    if (Math.abs(x) < 2.2 && z > -8) { continue; }
    arbusto(arbustos, `${x} 0 ${z}`, sorteia(0.3, 0.7), ['#3E5E30', '#4A6E38'][i % 2]);
  }

  /* troncos caídos, onde uma cobra se abrigaria */
  criar('a-cylinder', {
    position: '-3.4 0.16 -5.5', rotation: '0 0 90', radius: 0.16, height: 2.6, color: '#5A4330', 'segments-radial': 9
  }, raiz);
  criar('a-cylinder', {
    position: '3.8 0.13 -8.2', rotation: '0 34 90', radius: 0.13, height: 2.0, color: '#4E3A2A', 'segments-radial': 9
  }, raiz);

  /* pedras */
  [[-1.9, -7.3, 0.28], [2.4, -6.1, 0.22], [-4.6, -9.4, 0.34]].forEach(function (p) {
    pedra(raiz, p[0], p[1], p[2]);
  });

  /* ======================================================
     DETALHES — a mata fechando em volta
     ====================================================== */

  /* Mais árvores, só nas bordas: além de onde a cobra chega
     (5 m para os lados, 14 m para o fundo). Elas fecham o
     horizonte sem tapar o animal. Alterna pinheiro e copa
     redonda para a mata não parecer plantada em série. */
  const borda = criar('a-entity', {}, raiz);
  for (let i = 0; i < 12; i++) {
    const noFundo = i % 3 === 0;
    const lado = i % 2 === 0 ? -1 : 1;
    const x = noFundo ? sorteia(-12, 12) : lado * sorteia(6.5, 15);
    const z = noFundo ? sorteia(-24, -16) : sorteia(-15, 3);
    const altura = sorteia(4, 7.5);
    if (i % 2 === 0) {
      arvoreFrondosa(borda, `${x} 0 ${z}`, altura, ['#3E6332', '#4A7038'][i % 4 === 0 ? 0 : 1]);
    } else {
      arvore(borda, `${x} 0 ${z}`, altura, copas[i % copas.length]);
    }
  }

  /* Capim: rasteiro, então pode ficar perto. Só não entra na
     faixa do meio, por onde o animal é apresentado. */
  const mato = criar('a-entity', {}, raiz);
  for (let i = 0; i < 8; i++) {
    const lado = i % 2 === 0 ? -1 : 1;
    capim(mato, lado * sorteia(1.8, 6.5), sorteia(-12, -1),
          sorteia(0.35, 0.6), ['#5C7A3A', '#6B8A42', '#4C6A32'][i % 3]);
  }

  /* mais pedras, de tamanhos diferentes */
  pedra(raiz, 5.6, -3.2, 0.42, '#6E6E66');
  pedra(raiz, -6.2, -2.4, 0.5, '#82827A');
  pedra(raiz, 1.9, -11.5, 0.3);
  pedra(raiz, -3.0, -12.4, 0.36, '#6E6E66');

  /* tocos */
  criar('a-cylinder', { position: '5.9 0.2 -7.0', radius: 0.26, height: 0.4, color: '#6B5236', roughness: 1, 'segments-radial': 9 }, raiz);
  criar('a-cylinder', { position: '-6.0 0.15 -8.6', radius: 0.2, height: 0.3, color: '#5A4330', roughness: 1, 'segments-radial': 9 }, raiz);

  /* cogumelos ao pé do tronco caído */
  cogumelo(raiz, -2.9, -5.15, 1.6);
  cogumelo(raiz, -3.25, -5.05, 1.1);

  /* sob os troncos e entre as pedras */
  esconderijo(-3.4, -5.5);
  esconderijo(3.8, -8.2);
  esconderijo(-1.9, -7.3);
  esconderijo(2.4, -6.1);
  esconderijo(-4.6, -9.4);

  criar('a-light', { type: 'ambient', color: '#9FB49B', intensity: 0.75 }, raiz);
  criar('a-light', { type: 'directional', color: '#FFF6DC', intensity: 0.85, position: '5 8 -3' }, raiz);
}

/* =========================================================
   QUINTAL — sapo
   ========================================================= */
function montarQuintal(raiz) {
  definirCeu('#9FC4DE');

  /* gramado */
  pisoPintado(raiz, {
    z: -7, largura: 22, profundidade: 22, metrosPorPadrao: 4,
    desenhar: desenharChaoOrganico('#4E7A3C', ['#457036', '#588846', '#3E6830'])
  });

  /* faixa de cimento junto à casa */
  criar('a-plane', {
    position: '0 0.01 0.5', rotation: '-90 0 0', width: 12, height: 3.4,
    color: '#A8A49B', roughness: 1
  }, raiz);

  /* parede da casa, atrás de quem observa */
  parede(raiz, { position: '0 1.5 2.2', rotation: '0 180 0', largura: 12, altura: 3, cor: '#E0D6C4' });
  criar('a-box', { position: '0 0.08 2.16', width: 12, height: 0.16, depth: 0.05, color: '#C4B9A4' }, raiz);

  /* muro em volta */
  const muro = criar('a-entity', {}, raiz);
  criar('a-box', { position: '0 0.9 -11', width: 24, height: 1.8, depth: 0.2, color: '#C2A882' }, muro);
  criar('a-box', { position: '-11.9 0.9 -4.5', width: 0.2, height: 1.8, depth: 13, color: '#B89E78' }, muro);
  criar('a-box', { position: '11.9 0.9 -4.5', width: 0.2, height: 1.8, depth: 13, color: '#B89E78' }, muro);
  criar('a-box', { position: '0 1.84 -11', width: 24, height: 0.1, depth: 0.32, color: '#9E8663' }, muro);

  /* canteiro de plantas junto ao muro */
  const canteiro = criar('a-entity', {}, raiz);
  criar('a-box', { position: '0 0.16 -10.2', width: 20, height: 0.32, depth: 1.1, color: '#6B5236' }, canteiro);
  const sorteia = sorteador(773311);
  for (let i = 0; i < 8; i++) {
    arbusto(canteiro, `${sorteia(-9, 9)} 0.32 ${-10.2 + sorteia(-0.3, 0.3)}`,
            sorteia(0.28, 0.5), ['#3E7A3A', '#4C8C42'][i % 2]);
  }

  /* vasos na varanda */
  vaso(raiz, '-3.4 0 0.2', 1.1);
  vaso(raiz, '3.2 0 0.4', 0.9);

  /* tanque de água — motivo de o sapo estar ali */
  const tanque = criar('a-entity', { position: '-4.2 0 -5.5' }, raiz);
  criar('a-cylinder', { position: '0 0.22 0', radius: 1.05, height: 0.44, color: '#8E8577', 'segments-radial': 20 }, tanque);
  criar('a-cylinder', { position: '0 0.45 0', radius: 0.92, height: 0.04, color: '#3E6B7A', opacity: 0.85, 'segments-radial': 20 }, tanque);

  /* varal */
  const varal = criar('a-entity', { position: '4.5 0 -4' }, raiz);
  criar('a-cylinder', { position: '-1.4 0.85 0', radius: 0.04, height: 1.7, color: '#8A8F96' }, varal);
  criar('a-cylinder', { position: '1.4 0.85 0', radius: 0.04, height: 1.7, color: '#8A8F96' }, varal);
  criar('a-cylinder', { position: '0 1.66 0', rotation: '0 0 90', radius: 0.012, height: 2.8, color: '#C9C4B8' }, varal);
  criar('a-box', { position: '-0.6 1.35 0', width: 0.5, height: 0.6, depth: 0.02, color: '#D9E2EC' }, varal);
  criar('a-box', { position: '0.45 1.4 0', width: 0.45, height: 0.5, depth: 0.02, color: '#E8D9C4' }, varal);

  /* árvore ao fundo, fazendo sombra */
  arvore(raiz, '-7.5 0 -9', 5.2, '#3B6334');
  arvore(raiz, '7.8 0 -9.6', 4.4, '#44703A');

  /* ======================================================
     DETALHES — o que faz o quintal parecer de uma casa
     ====================================================== */

  /* ---------- na parede da casa: porta, luz e janela ---------- */
  portaDeParede(raiz, '1.6 0 2.17', '0 180 0', '#7A5637');
  janela(raiz, '-1.9 1.5 2.15', '0 180 0');
  criar('a-box', { position: '1.6 2.32 2.13', width: 0.34, height: 0.09, depth: 0.1, material: 'shader: flat; color: #FFF3D6' }, raiz);

  /* ---------- mangueira enrolada e torneira ---------- */
  criar('a-torus', {
    position: '4.8 0.05 1.45', rotation: '90 0 0', radius: 0.28, 'radius-tubular': 0.035,
    'segments-tubular': 18, 'segments-radial': 6, color: '#3E7A3A'
  }, raiz);
  criar('a-box', { position: '4.8 0.62 2.14', width: 0.06, height: 0.06, depth: 0.12, color: '#8A8F96' }, raiz);

  /* ---------- nenúfares na água do tanque ---------- */
  [[-0.35, -0.2, 0.2], [0.3, 0.25, 0.16], [0.1, -0.45, 0.13]].forEach(function (n) {
    criar('a-cylinder', { position: `${n[0]} 0.475 ${n[1]}`, radius: n[2], height: 0.01, color: '#4C8C42', 'segments-radial': 10 }, tanque);
  });

  /* ---------- pedras em volta do tanque e balde ---------- */
  pedra(raiz, -3.0, -5.0, 0.2, '#8E8E86');
  pedra(raiz, -3.3, -6.4, 0.26);
  pedra(raiz, -5.1, -4.3, 0.22, '#8E8E86');
  pedra(raiz, -4.6, -6.8, 0.18);
  criar('a-cone', { position: '-2.75 0.13 -5.9', 'radius-bottom': 0.12, 'radius-top': 0.16, height: 0.26, color: '#3C6FB0', 'segments-radial': 12 }, raiz);

  /* ---------- pedras de caminho, da varanda até o tanque ----------
     São rasteiras (2 cm), então não atrapalham ninguém. */
  [[-0.9, -1.9], [-1.7, -2.8], [-2.4, -3.7], [-3.0, -4.4]].forEach(function (c) {
    criar('a-cylinder', { position: `${c[0]} 0.012 ${c[1]}`, radius: 0.3, height: 0.02, color: '#9C988E', roughness: 1, 'segments-radial': 9 }, raiz);
  });

  /* ---------- banco de jardim, à esquerda ---------- */
  const banco = criar('a-entity', { position: '-6.8 0 -2.0', rotation: '0 90 0' }, raiz);
  criar('a-box', { position: '0 0.44 0', width: 1.5, height: 0.06, depth: 0.42, color: '#8A5A34' }, banco);
  criar('a-box', { position: '0 0.76 -0.2', width: 1.5, height: 0.34, depth: 0.05, color: '#8A5A34' }, banco);
  criar('a-box', { position: '-0.68 0.36 -0.02', width: 0.07, height: 0.72, depth: 0.44, color: '#3A3530' }, banco);
  criar('a-box', { position: '0.68 0.36 -0.02', width: 0.07, height: 0.72, depth: 0.44, color: '#3A3530' }, banco);

  /* ---------- casinha de cachorro, ao fundo à direita ----------
     O telhado é um cone de quatro lados girado 45°: vira uma
     pirâmide alinhada com as paredes. */
  const casinha = criar('a-entity', { position: '7.4 0 -7.4', rotation: '0 -25 0' }, raiz);
  criar('a-box', { position: '0 0.35 0', width: 0.9, height: 0.7, depth: 1.0, color: '#B5523C' }, casinha);
  criar('a-cone', { position: '0 0.92 0', rotation: '0 45 0', 'radius-bottom': 0.82, 'radius-top': 0, height: 0.45, 'segments-radial': 4, color: '#5A4330' }, casinha);
  criar('a-plane', { position: '0 0.26 0.505', width: 0.36, height: 0.46, color: '#1E1A16' }, casinha);

  /* ---------- flores no canteiro ---------- */
  for (let i = 0; i < 8; i++) {
    criar('a-sphere', {
      position: `${sorteia(-9, 9)} ${sorteia(0.42, 0.6)} ${-9.85 + sorteia(-0.1, 0.1)}`,
      radius: 0.07, 'segments-width': 6, 'segments-height': 4,
      color: ['#E8C84A', '#D9534F', '#E6E0F0', '#D97AA6'][i % 4]
    }, canteiro);
  }

  /* ---------- mais uma árvore, de copa redonda ---------- */
  arvoreFrondosa(raiz, '9.2 0 -3.2', 4.6, '#4A7038');

  /* junto da água, do canteiro e dos vasos */
  esconderijo(-4.2, -5.5);
  esconderijo(-3.4, 0.2);
  esconderijo(3.2, 0.4);
  esconderijo(-2.0, -9.6);
  esconderijo(2.5, -9.6);

  criar('a-light', { type: 'ambient', color: '#BCCBD6', intensity: 0.8 }, raiz);
  criar('a-light', { type: 'directional', color: '#FFF4D8', intensity: 0.9, position: '-4 7 -2' }, raiz);
}

/* =========================================================
   REGISTRO E MONTAGEM
   ========================================================= */
const CENARIOS = {
  sala: montarSala,
  cozinha: montarCozinha,
  floresta: montarFloresta,
  quintal: montarQuintal
};

/* Quanto espaço cada cenário tem, para os animais não
   atravessarem paredes nem sumirem atrás do muro. */
const LIMITES = {
  sala:     { x: 2.4, zMin: -7.8 },
  cozinha:  { x: 1.6, zMin: -6.8 },
  floresta: { x: 5.0, zMin: -14.0 },
  quintal:  { x: 5.0, zMin: -9.5 }
};

function montarCenario(nome, raiz) {
  const montar = CENARIOS[nome] || CENARIOS.sala;

  /* limpa o que estiver lá: permite trocar de cenário sem recarregar */
  while (raiz.firstChild) {
    raiz.removeChild(raiz.firstChild);
  }

  esconderijos = [];
  montar(raiz);

  console.log(`Cenário montado: ${nome} — ${esconderijos.length} esconderijos.`);

  return {
    limites: LIMITES[nome] || LIMITES.sala,
    esconderijos: esconderijos
  };
}
