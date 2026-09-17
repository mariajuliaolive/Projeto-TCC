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
  criar('a-cylinder', { position: '0 0.16 0', radius: 0.17, height: 0.32, color: '#B4785A' }, grupo);
  criar('a-sphere', { position: '0 0.62 0', radius: 0.32, color: '#4E7A4A' }, grupo);
  criar('a-sphere', { position: '0.18 0.45 0.1', radius: 0.2, color: '#5C8A52' }, grupo);
  return grupo;
}

function arvore(pai, position, altura, corCopa) {
  const grupo = criar('a-entity', { position }, pai);
  criar('a-cylinder', {
    position: `0 ${altura / 2} 0`, radius: altura * 0.045,
    height: altura, color: '#5A4330', roughness: 1
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
  criar('a-sphere', { position: `0 ${raio * 0.8} 0`, radius: raio, color: cor, roughness: 1 }, grupo);
  criar('a-sphere', { position: `${raio * 0.7} ${raio * 0.5} ${raio * 0.2}`, radius: raio * 0.65, color: cor, roughness: 1 }, grupo);
  return grupo;
}

/* =========================================================
   SALA — aranha e rato
   ========================================================= */
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
  /* puxadores */
  for (let i = -2; i <= 2; i++) {
    criar('a-box', { position: `0.31 0.6 ${i * 1.1}`, width: 0.03, height: 0.03, depth: 0.34, color: '#5A5F66' }, bancada);
    criar('a-box', { position: `0.3 0.5 ${i * 1.1}`, width: 0.01, height: 0.8, depth: 0.02, color: '#B3AB98' }, bancada);
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
    position: '-3.4 0.16 -5.5', rotation: '0 0 90', radius: 0.16, height: 2.6, color: '#5A4330'
  }, raiz);
  criar('a-cylinder', {
    position: '3.8 0.13 -8.2', rotation: '0 34 90', radius: 0.13, height: 2.0, color: '#4E3A2A'
  }, raiz);

  /* pedras */
  [[-1.9, -7.3, 0.28], [2.4, -6.1, 0.22], [-4.6, -9.4, 0.34]].forEach(function (p) {
    criar('a-sphere', { position: `${p[0]} ${p[2] * 0.6} ${p[1]}`, radius: p[2], color: '#7A7A72', roughness: 1 }, raiz);
  });

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
    position: '0 0.01 0.4', rotation: '-90 0 0', width: 12, height: 3.2,
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
  criar('a-cylinder', { position: '0 0.22 0', radius: 1.05, height: 0.44, color: '#8E8577' }, tanque);
  criar('a-cylinder', { position: '0 0.45 0', radius: 0.92, height: 0.04, color: '#3E6B7A', opacity: 0.85 }, tanque);

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

  montar(raiz);
  console.log('Cenário montado:', nome);

  return LIMITES[nome] || LIMITES.sala;
}
