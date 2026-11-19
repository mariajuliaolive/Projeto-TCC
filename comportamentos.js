/* =========================================================
   COMPORTAMENTOS — os animais vivos
   ---------------------------------------------------------
   Até aqui, um animal "andarilho" ia e voltava em linha reta
   entre dois pontos, como num trilho. Este arquivo dá a cada
   espécie um jeito próprio de se mover:

   barata   corre em arrancadas curtas, para, muda de rumo, e
            sobe pelas paredes, pela frente dos armários e pela
            bancada
   aranha   anda devagar pelo chão, pelas paredes e pelo teto,
            e às vezes desce do teto por um fio
   rato     passeia, para para farejar, muda de direção, às
            vezes corre, e entra embaixo dos móveis para sair
            em outro lugar
   sapo     pula: ajeita o corpo, agacha, salta e pousa, em
            intervalos que não dá para prever
   cobra    rasteja devagar, serpenteando

   QUANDO ISSO VALE

   Só do nível 3 em diante, que é o nível em que a metodologia
   põe o animal em movimento ("Movimento do estímulo"). Nos
   níveis 1 e 2 os animais continuam como estavam: respiram e
   olham em volta, mas não saem do lugar. Mudar isso mudaria o
   que cada nível significa — e os níveis são a variável do
   estudo.

   O animal PRINCIPAL (o primeiro, na distância exata do nível)
   também se move, mas sobre um arco em volta de quem entra: muda
   de lugar sem mudar de distância, que é o que o nível promete.

   SUPERFÍCIES

   Para a barata andar na parede de verdade, e não ficar "colada"
   nela, cada cenário descreve suas superfícies — chão, paredes,
   teto, frente dos armários — como retângulos (ver cenarios.js).
   O animal anda em coordenadas do retângulo onde está e, ao
   chegar a uma borda ligada a outra superfície, passa para ela:
   do chão para a parede, da parede para o teto. O corpo gira
   suavemente na quina, de modo que a barriga fica sempre virada
   para a superfície.

   Depende de: A-Frame, animador.js.
   ========================================================= */

/* ---------------------------------------------------------
   COMO CADA ESPÉCIE SE MOVE

   anda          velocidade, em metros por segundo
   vira          quanto gira por segundo, em graus
   pausa         quanto fica parado entre um trecho e outro (s)
   trecho        distância de cada trecho, em metros
   zigue         quanto o rumo oscila enquanto anda
   paredes       se pode subir em outras superfícies
   outraSuperf.  chance de, no próximo trecho, ir para outra
                 superfície
   fio           (aranha) chance de descer do teto por um fio
   esconder      (rato) chance de ir para baixo de um móvel
   correr        (rato) chance de o trecho ser corrido

   Tudo devagar o bastante para não assustar: o objetivo é um
   animal vivo, não um animal que ataca.
   --------------------------------------------------------- */
const PERFIS_DE_VIDA = {
  barata: { anda: 0.5, vira: 320, pausa: [0.2, 1.4], trecho: [0.4, 1.8], zigue: 1.4,
            paredes: true, outraSuperficie: 0.5 },
  aranha: { anda: 0.3, vira: 140, pausa: [0.8, 3.5], trecho: [0.4, 2.0], zigue: 0.4,
            paredes: true, outraSuperficie: 0.45, fio: 0.5 },
  rato:   { anda: 0.5, vira: 220, pausa: [0.6, 3.5], trecho: [0.8, 3.0], zigue: 0.5,
            esconder: 0.25, correr: 0.2 },
  sapo:   { pulo: true, distanciaPulo: [0.35, 0.9], alturaPulo: 0.22, pausa: [1.0, 5.0] },
  cobra:  { anda: 0.16, vira: 40, pausa: [2.0, 6.0], trecho: [0.8, 2.5], zigue: 0.2,
            serpenteia: true }
};

/* ---------------------------------------------------------
   SUPERFÍCIES

   Cada uma é um retângulo: um ponto de origem, dois eixos (u e
   v) e os limites em cada eixo. A normal — para onde a "barriga"
   do animal aponta para longe — é u × v, e cenarios.js escolhe
   u e v para que ela aponte para dentro do cômodo.

   Os limites são encolhidos pela metade do corpo do animal,
   para ele não atravessar a parede antes de virar a quina.
   --------------------------------------------------------- */
function vetor(lista) {
  return new AFRAME.THREE.Vector3(lista[0], lista[1], lista[2]);
}

function prepararSuperficies(definicoes, margem, especie) {
  const mapa = {};
  (definicoes || []).forEach(function (d) {
    /* sem espécie (null), vale qualquer superfície: é o caso de
       quem só quer saber onde fica um ponto */
    if (especie && d.especies && d.especies.indexOf(especie) === -1) {
      return;
    }
    const s = {
      id: d.id,
      o: vetor(d.origem),
      u: vetor(d.u).normalize(),
      v: vetor(d.v).normalize(),
      U0: d.u0, U1: d.u1, V0: d.v0, V1: d.v1,
      ligacoes: d.ligacoes || {},
      chao: Boolean(d.chao)
    };
    s.n = new AFRAME.THREE.Vector3().crossVectors(s.u, s.v).normalize();
    s.u0 = d.u0 + margem;
    s.u1 = d.u1 - margem;
    s.v0 = d.v0 + (d.semMargemV0 ? 0 : margem);
    s.v1 = d.v1 - margem;
    if (s.u0 > s.u1) { s.u0 = s.u1 = (d.u0 + d.u1) / 2; }
    if (s.v0 > s.v1) { s.v0 = s.v1 = (d.v0 + d.v1) / 2; }
    mapa[d.id] = s;
  });
  return mapa;
}

function pontoDaSuperficie(s, U, V, destino) {
  const p = destino || new AFRAME.THREE.Vector3();
  return p.copy(s.o).addScaledVector(s.u, U).addScaledVector(s.v, V);
}

/* Usado por experiencia.js para pôr um animal escondido numa
   parede ou no teto antes de o componente começar. */
function pontoNaSuperficie(definicoes, id, U, V) {
  const d = (definicoes || []).find(function (s) { return s.id === id; });
  if (!d) {
    return null;
  }
  const s = prepararSuperficies([d], 0, null)[d.id];
  return pontoDaSuperficie(s, U, V);
}

function anguloEntre(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/* =========================================================
   O COMPONENTE "vida-animal"

   Fica na entidade .animal (a raiz) e controla, a cada quadro,
   a posição e a orientação dela. A configuração vem em
   el.__vida, preparada por experiencia.js, porque são objetos
   (superfícies, obstáculos) que não cabem num atributo de HTML.
   ========================================================= */
AFRAME.registerComponent('vida-animal', {

  init: function () {
    const c = this.el.__vida || {};
    this.c = c;
    this.perfil = PERFIS_DE_VIDA[c.especie] || PERFIS_DE_VIDA.rato;
    this.sorteia = c.sorteia || function (a, b) { return a + Math.random() * (b - a); };
    this.margem = Math.max(c.tamanho * 0.5, 0.05);
    this.sups = prepararSuperficies(c.superficies, this.margem,
      this.perfil.paredes ? c.especie : '__so-chao__');

    /* sem descrição de superfícies, cria um chão com os limites
       antigos do cenário */
    if (!this.sups.chao) {
      const l = c.limites || { x: 2.4, zMin: -7.8 };
      this.sups = prepararSuperficies([{
        id: 'chao', chao: true, origem: [0, 0, 0], u: [1, 0, 0], v: [0, 0, -1],
        u0: -l.x, u1: l.x, v0: 0.6, v1: -l.zMin, semMargemV0: true
      }], this.margem, c.especie);
    }

    /* onde começa */
    let inicio = c.inicio;

    /* "comecarNaParede": numa parede ou no teto, num ponto
       qualquer. Dá à cena aranhas e baratas em lugares
       diferentes desde o primeiro instante, e não todas no
       chão esperando a vez de subir. */
    if (c.comecarNaParede) {
      const altas = Object.keys(this.sups).filter(function (id) {
        return !this.sups[id].chao;
      }, this);
      if (altas.length) {
        const s = this.sups[altas[Math.floor(this.sorteia(0, altas.length)) % altas.length]];
        inicio = { sup: s.id, u: this.sorteia(s.u0, s.u1), v: this.sorteia(s.v0, s.v1) };
      }
    }

    if (inicio && this.sups[inicio.sup]) {
      this.sup = this.sups[inicio.sup];
      this.U = inicio.u;
      this.V = inicio.v;
      this.h = this.sorteia(-Math.PI, Math.PI);
    } else {
      const p = this.el.object3D.position;
      this.sup = this.sups.chao;
      this.U = p.x;
      this.V = -p.z;
      /* de frente para quem entra, com alguma variação */
      this.h = -Math.PI / 2 + this.sorteia(-0.7, 0.7);
    }
    this.prenderNaSuperficie();

    this.ativo = c.ativo !== false;
    this.estado = 'parado';
    this.tempo = this.sorteia(0.3, 1.5);
    this.alvo = null;
    this.meta = null;
    this.fase = this.sorteia(0, 10);
    this.clipe = null;

    this.posicao = new AFRAME.THREE.Vector3();
    this.frente = new AFRAME.THREE.Vector3();
    this.lado = new AFRAME.THREE.Vector3();
    this.matriz = new AFRAME.THREE.Matrix4();
    this.qAlvo = new AFRAME.THREE.Quaternion();
    this.aux = new AFRAME.THREE.Vector3();

    this.aplicarPose(1, true);
    this.trocarClipe('parado');
  },

  /* chamado quando um animal escondido é encontrado */
  liberar: function () {
    this.ativo = true;
    this.estado = 'parado';
    this.tempo = this.sorteia(0.2, 0.8);
  },

  prenderNaSuperficie: function () {
    const s = this.sup;
    this.U = Math.max(s.u0, Math.min(s.u1, this.U));
    this.V = Math.max(s.v0, Math.min(s.v1, this.V));
  },

  /* ---------------------------------------------------------
     ANIMAÇÃO DO MODELO
     Só troca quando muda: trocar a cada quadro reiniciaria a
     animação o tempo todo.
     --------------------------------------------------------- */
  trocarClipe: function (qual) {
    const animador = this.c.modelo && this.c.modelo.components.animador;
    const clipes = this.c.clipes || {};
    const nome = clipes[qual] || clipes.parado;
    if (!animador || !nome || this.clipe === nome) {
      return;
    }
    this.clipe = nome;
    this.c.modelo.setAttribute('animador', 'clipe', nome);
  },

  /* =========================================================
     ESCOLHER PARA ONDE IR
     ========================================================= */
  dentroDeObstaculo: function (x, z) {
    const folga = this.c.tamanho * 0.3;
    return (this.c.obstaculos || []).some(function (o) {
      return Math.hypot(o.x - x, o.z - z) < o.raio + folga;
    });
  },

  escolherAlvo: function () {
    const p = this.perfil;
    const s = this.sup;
    this.meta = null;

    /* animal principal: um ponto do arco, na mesma distância */
    if (this.c.arco) {
      const a = this.sorteia(-this.c.arco.angulo, this.c.arco.angulo);
      const r = this.c.arco.raio;
      this.alvo = { u: Math.sin(a) * r, v: Math.cos(a) * r };
      return;
    }

    /* outra superfície: mira um ponto além da borda que leva a
       ela, para atravessar a quina andando */
    const ligacoes = Object.keys(s.ligacoes).filter(function (lado) {
      return this.sups[s.ligacoes[lado]];
    }, this);
    if (p.paredes && ligacoes.length && this.sorteia(0, 1) < p.outraSuperficie) {
      const lado = ligacoes[Math.floor(this.sorteia(0, ligacoes.length)) % ligacoes.length];
      const alem = 0.4;
      let u = this.sorteia(s.u0, s.u1);
      let v = this.sorteia(s.v0, s.v1);
      if (lado === 'u0') { u = s.u0 - alem; }
      if (lado === 'u1') { u = s.u1 + alem; }
      if (lado === 'v0') { v = s.v0 - alem; }
      if (lado === 'v1') { v = s.v1 + alem; }
      this.alvo = { u: u, v: v };
      return;
    }

    /* um ponto na superfície atual, longe de obstáculos */
    for (let tentativa = 0; tentativa < 12; tentativa++) {
      const angulo = this.sorteia(-Math.PI, Math.PI);
      const distancia = this.sorteia(p.trecho[0], p.trecho[1]);
      const u = Math.max(s.u0, Math.min(s.u1, this.U + Math.cos(angulo) * distancia));
      const v = Math.max(s.v0, Math.min(s.v1, this.V + Math.sin(angulo) * distancia));
      if (s.chao) {
        const w = pontoDaSuperficie(s, u, v, this.aux);
        if (this.dentroDeObstaculo(w.x, w.z)) {
          continue;
        }
      }
      this.alvo = { u: u, v: v };
      return;
    }
    this.alvo = { u: this.U, v: this.V };
  },

  /* =========================================================
     A CADA QUADRO
     ========================================================= */
  tick: function (tempo, intervalo) {
    if (!this.ativo) {
      return;
    }
    const dt = Math.min(intervalo || 16, 60) / 1000;

    switch (this.estado) {
      case 'parado':      this.ficarParado(dt); break;
      case 'andando':     this.andar(dt); break;
      case 'escondido':   this.ficarEscondido(dt); break;
      case 'descendo':
      case 'pendurada':
      case 'subindo':     this.pendurarNoFio(dt); break;
      case 'ajeitando':
      case 'agachando':
      case 'pulando':
      case 'pousando':    this.pular(dt); break;
    }

    if (this.estado !== 'descendo' && this.estado !== 'pendurada' && this.estado !== 'subindo') {
      this.aplicarPose(dt, false);
    }
  },

  ficarParado: function (dt) {
    this.tempo -= dt;
    if (this.tempo > 0) {
      return;
    }
    const p = this.perfil;

    if (p.pulo) {
      this.comecarPulo();
      return;
    }

    if (p.fio && this.sup.id === 'teto' && this.sorteia(0, 1) < p.fio) {
      this.comecarFio();
      return;
    }

    if (p.esconder && !this.c.arco && (this.c.pontos || []).length
        && this.sorteia(0, 1) < p.esconder) {
      const pontos = this.c.pontos;
      const ponto = pontos[Math.floor(this.sorteia(0, pontos.length)) % pontos.length];
      this.alvo = { u: ponto.x, v: -ponto.z };
      this.vaiSeEsconder = true;
    } else {
      this.vaiSeEsconder = false;
      this.escolherAlvo();
    }

    this.correndo = Boolean(p.correr) && this.sorteia(0, 1) < p.correr;
    this.estado = 'andando';
    this.trocarClipe(this.correndo ? 'correr' : 'movendo');
  },

  /* ---------------------------------------------------------
     ANDAR: vira na direção do alvo, no máximo "vira" graus por
     segundo, e avança mais devagar quando precisa virar muito —
     como um bicho de verdade, que não anda de lado.
     --------------------------------------------------------- */
  andar: function (dt) {
    const p = this.perfil;
    const du = this.alvo.u - this.U;
    const dv = this.alvo.v - this.V;
    const distancia = Math.hypot(du, dv);

    if (distancia < 0.04) {
      this.chegou();
      return;
    }

    const desejado = Math.atan2(dv, du);
    const diferenca = anguloEntre(desejado - this.h);
    const maxGiro = (p.vira * Math.PI / 180) * dt;
    this.h += Math.max(-maxGiro, Math.min(maxGiro, diferenca));

    /* o rumo oscila um pouco: ninguém anda em linha de régua */
    this.fase += dt;
    const zigue = p.serpenteia
      ? Math.sin(this.fase * 1.6) * 0.9
      : Math.sin(this.fase * 3.1) * Math.sin(this.fase * 1.3);
    this.h += zigue * (p.zigue || 0) * dt;

    let velocidade = p.anda * (this.correndo ? 2.0 : 1) * (this.c.arco ? 0.6 : 1);
    velocidade *= Math.max(0.15, Math.cos(diferenca));
    const passo = Math.min(distancia, velocidade * dt);

    const novoU = this.U + Math.cos(this.h) * passo;
    const novoV = this.V + Math.sin(this.h) * passo;

    /* esbarrou num móvel? para e escolhe outro rumo */
    if (this.sup.chao && !this.vaiSeEsconder) {
      const w = pontoDaSuperficie(this.sup, novoU, novoV, this.aux);
      if (this.dentroDeObstaculo(w.x, w.z)) {
        this.estado = 'parado';
        this.tempo = this.sorteia(0.2, 0.7);
        this.trocarClipe('parado');
        return;
      }
    }

    this.U = novoU;
    this.V = novoV;

    if (this.c.arco) {
      /* continua na mesma distância de quem entrou */
      const r = Math.hypot(this.U, this.V) || 1;
      this.U = this.U / r * this.c.arco.raio;
      this.V = this.V / r * this.c.arco.raio;
      return;
    }

    this.verificarBordas();
  },

  chegou: function () {
    if (this.vaiSeEsconder) {
      this.vaiSeEsconder = false;
      this.estado = 'escondido';
      this.tempo = this.sorteia(3, 8);
      this.el.object3D.visible = false;
      return;
    }
    this.estado = 'parado';
    const p = this.perfil;
    this.tempo = this.sorteia(p.pausa[0], p.pausa[1]);
    this.trocarClipe('parado');
  },

  /* ---------------------------------------------------------
     BORDAS: atravessa para a superfície ligada, ou para e
     volta, se a borda é uma parede sem passagem.
     --------------------------------------------------------- */
  verificarBordas: function () {
    const s = this.sup;
    let lado = null;
    if (this.U < s.u0) { lado = 'u0'; }
    else if (this.U > s.u1) { lado = 'u1'; }
    else if (this.V < s.v0) { lado = 'v0'; }
    else if (this.V > s.v1) { lado = 'v1'; }
    if (!lado) {
      return;
    }

    const destino = this.sups[s.ligacoes[lado]];
    if (this.perfil.paredes && destino) {
      this.atravessar(destino);
      return;
    }

    this.prenderNaSuperficie();
    this.estado = 'parado';
    this.tempo = this.sorteia(0.2, 0.8);
    this.trocarClipe('parado');
  },

  atravessar: function (destino) {
    const origem = this.sup;
    this.prenderNaSuperficie();
    const ponto = pontoDaSuperficie(origem, this.U, this.V, new AFRAME.THREE.Vector3());
    const frente = new AFRAME.THREE.Vector3()
      .addScaledVector(origem.u, Math.cos(this.h))
      .addScaledVector(origem.v, Math.sin(this.h));

    const relativo = ponto.sub(destino.o);
    let U = relativo.dot(destino.u);
    let V = relativo.dot(destino.v);

    /* por qual borda do destino se está entrando */
    const distancias = {
      u0: Math.abs(U - destino.U0), u1: Math.abs(U - destino.U1),
      v0: Math.abs(V - destino.V0), v1: Math.abs(V - destino.V1)
    };
    /* só valem as bordas do destino que levam de volta à origem;
       perto de uma ponta, a borda mais próxima pode ser outra */
    let candidatas = Object.keys(distancias).filter(function (e) {
      return destino.ligacoes[e] === origem.id;
    });
    if (!candidatas.length) {
      candidatas = Object.keys(distancias);
    }
    const borda = candidatas.reduce(function (a, b) {
      return distancias[a] <= distancias[b] ? a : b;
    });
    const paraDentro = {
      u0: destino.u.clone(), u1: destino.u.clone().negate(),
      v0: destino.v.clone(), v1: destino.v.clone().negate()
    }[borda];
    const aoLongo = (borda === 'u0' || borda === 'u1') ? destino.v : destino.u;

    const a = Math.max(-0.95, Math.min(0.95, frente.dot(aoLongo)));
    const novaFrente = aoLongo.clone().multiplyScalar(a)
      .addScaledVector(paraDentro, Math.sqrt(1 - a * a));

    this.sup = destino;
    this.U = U;
    this.V = V;
    this.prenderNaSuperficie();
    this.h = Math.atan2(novaFrente.dot(destino.v), novaFrente.dot(destino.u));

    /* segue andando um pouco na superfície nova */
    this.alvo = {
      u: Math.max(destino.u0, Math.min(destino.u1, this.U + Math.cos(this.h) * 0.6)),
      v: Math.max(destino.v0, Math.min(destino.v1, this.V + Math.sin(this.h) * 0.6))
    };
  },

  /* ---------------------------------------------------------
     RATO: embaixo do móvel
     --------------------------------------------------------- */
  ficarEscondido: function (dt) {
    this.tempo -= dt;
    if (this.tempo > 0) {
      return;
    }
    /* sai por outro esconderijo */
    const pontos = this.c.pontos || [];
    if (pontos.length) {
      const ponto = pontos[Math.floor(this.sorteia(0, pontos.length)) % pontos.length];
      this.U = ponto.x * 0.85;
      this.V = -ponto.z;
      this.prenderNaSuperficie();
      this.h = this.sorteia(-Math.PI, Math.PI);
      this.aplicarPose(1, true);
    }
    this.el.object3D.visible = true;
    this.estado = 'parado';
    this.tempo = this.sorteia(0.5, 1.5);
    this.trocarClipe('parado');
  },

  /* ---------------------------------------------------------
     ARANHA: desce do teto por um fio, fica balançando e sobe
     --------------------------------------------------------- */
  comecarFio: function () {
    const ponto = pontoDaSuperficie(this.sup, this.U, this.V, new AFRAME.THREE.Vector3());
    this.ancora = ponto;
    this.descida = 0;
    this.descidaMaxima = ponto.y - this.sorteia(1.1, 1.8);
    this.estado = 'descendo';
    this.trocarClipe('parado');

    if (!this.fio) {
      this.fio = document.createElement('a-cylinder');
      this.fio.setAttribute('radius', 0.0035);
      this.fio.setAttribute('segments-radial', 4);
      this.fio.setAttribute('material', 'color: #F2F2F2; opacity: 0.55; transparent: true; shader: flat');
      this.el.parentNode.appendChild(this.fio);
    }
    this.fio.object3D.visible = true;
  },

  pendurarNoFio: function (dt) {
    if (this.estado === 'descendo') {
      this.descida += 0.22 * dt;
      if (this.descida >= this.descidaMaxima) {
        this.descida = this.descidaMaxima;
        this.estado = 'pendurada';
        this.tempo = this.sorteia(2.5, 6);
      }
    } else if (this.estado === 'pendurada') {
      this.tempo -= dt;
      if (this.tempo <= 0) {
        this.estado = 'subindo';
      }
    } else {
      this.descida -= 0.18 * dt;
      if (this.descida <= 0) {
        this.descida = 0;
        this.fio.object3D.visible = false;
        this.estado = 'parado';
        this.tempo = this.sorteia(1, 3);
        this.aplicarPose(1, true);
        return;
      }
    }

    /* o corpo pende de cabeça para baixo, com as costas para
       quem observa, e balança de leve */
    this.fase += dt;
    const balanco = Math.sin(this.fase * 1.7) * 0.025 * this.descida;
    const p = this.posicao.copy(this.ancora);
    p.y -= this.descida;
    p.x += balanco;
    this.el.object3D.position.copy(p);

    const camera = this.el.sceneEl.camera;
    const olho = this.aux;
    if (camera) {
      camera.getWorldPosition(olho);
    } else {
      olho.set(0, 1.6, 0);
    }
    const costas = new AFRAME.THREE.Vector3(olho.x - p.x, 0, olho.z - p.z).normalize();
    const frente = this.frente.set(0, -1, 0);
    this.lado.crossVectors(costas, frente);
    this.matriz.makeBasis(this.lado, costas, frente);
    this.qAlvo.setFromRotationMatrix(this.matriz);
    this.el.object3D.quaternion.slerp(this.qAlvo, 1 - Math.exp(-dt * 6));

    /* o fio vai da âncora até as costas */
    const comprimento = Math.max(this.descida, 0.001);
    this.fio.object3D.position.set(this.ancora.x + balanco / 2, this.ancora.y - comprimento / 2, this.ancora.z);
    this.fio.object3D.scale.set(1, comprimento, 1);
  },

  /* ---------------------------------------------------------
     SAPO: ajeita, agacha, pula, pousa
     --------------------------------------------------------- */
  comecarPulo: function () {
    const p = this.perfil;
    const s = this.sup;
    const tamanho = this.c.tamanho;

    /* procura um rumo em que o pulo caiba */
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      let rumo = this.h + this.sorteia(-1.1, 1.1);
      let distancia = this.sorteia(p.distanciaPulo[0], p.distanciaPulo[1]) * (tamanho / 0.3);
      let u = this.U + Math.cos(rumo) * distancia;
      let v = this.V + Math.sin(rumo) * distancia;

      if (this.c.arco) {
        const a = Math.atan2(u, v);
        const limite = this.c.arco.angulo;
        const angulo = Math.max(-limite, Math.min(limite, a + this.sorteia(-0.25, 0.25)));
        u = Math.sin(angulo) * this.c.arco.raio;
        v = Math.cos(angulo) * this.c.arco.raio;
        rumo = Math.atan2(v - this.V, u - this.U);
        distancia = Math.hypot(u - this.U, v - this.V);
      }

      if (u < s.u0 || u > s.u1 || v < s.v0 || v > s.v1) {
        continue;
      }
      const w = pontoDaSuperficie(s, u, v, this.aux);
      if (this.dentroDeObstaculo(w.x, w.z)) {
        continue;
      }
      this.pulo = { de: { u: this.U, v: this.V }, para: { u: u, v: v }, rumo: rumo,
                    altura: p.alturaPulo * (tamanho / 0.3) * (0.7 + distancia) };
      this.rumoInicial = this.h;
      this.estado = 'ajeitando';
      this.tempo = 0;
      return;
    }

    /* nenhum pulo cabe: vira um pouco e espera */
    this.h += this.sorteia(-1.5, 1.5);
    this.tempo = this.sorteia(0.5, 1.5);
  },

  pular: function (dt) {
    const giro = this.c.giro && this.c.giro.object3D;
    this.tempo += dt;

    if (this.estado === 'ajeitando') {
      /* gira o corpo para o rumo do pulo, em pequenos ajustes */
      const t = Math.min(this.tempo / 0.45, 1);
      this.h = this.rumoInicial + anguloEntre(this.pulo.rumo - this.rumoInicial) * t;
      if (t >= 1) { this.estado = 'agachando'; this.tempo = 0; }
      return;
    }

    if (this.estado === 'agachando') {
      const t = Math.min(this.tempo / 0.2, 1);
      if (giro) { giro.scale.set(1 + 0.08 * t, 1 - 0.18 * t, 1 + 0.08 * t); }
      if (t >= 1) {
        this.estado = 'pulando';
        this.tempo = 0;
        const animador = this.c.modelo && this.c.modelo.components.animador;
        if (animador && this.c.clipes && this.c.clipes.pulo) {
          animador.tocarUmaVez(this.c.clipes.pulo);
        }
      }
      return;
    }

    if (this.estado === 'pulando') {
      const duracao = 0.42 + this.pulo.altura * 0.6;
      const t = Math.min(this.tempo / duracao, 1);
      this.U = this.pulo.de.u + (this.pulo.para.u - this.pulo.de.u) * t;
      this.V = this.pulo.de.v + (this.pulo.para.v - this.pulo.de.v) * t;
      this.elevacao = this.pulo.altura * 4 * t * (1 - t);
      if (giro) { giro.scale.set(0.96, 1.08, 0.96); }
      if (t >= 1) { this.estado = 'pousando'; this.tempo = 0; this.elevacao = 0; }
      return;
    }

    /* pousando */
    const t = Math.min(this.tempo / 0.16, 1);
    if (giro) { giro.scale.set(1 + 0.06 * (1 - t), 1 - 0.12 * (1 - t), 1 + 0.06 * (1 - t)); }
    if (t >= 1) {
      if (giro) { giro.scale.set(1, 1, 1); }
      this.estado = 'parado';
      /* às vezes emenda outro pulo logo em seguida */
      const p = this.perfil;
      this.tempo = this.sorteia(0, 1) < 0.25
        ? this.sorteia(0.25, 0.6)
        : this.sorteia(p.pausa[0], p.pausa[1]);
    }
  },

  /* ---------------------------------------------------------
     POSE: posição e orientação a partir da superfície
     --------------------------------------------------------- */
  aplicarPose: function (dt, imediato) {
    const s = this.sup;
    const p = pontoDaSuperficie(s, this.U, this.V, this.posicao);
    p.addScaledVector(s.n, 0.002 + (this.elevacao || 0));
    this.el.object3D.position.copy(p);

    const frente = this.frente.set(0, 0, 0)
      .addScaledVector(s.u, Math.cos(this.h))
      .addScaledVector(s.v, Math.sin(this.h));
    this.lado.crossVectors(s.n, frente);
    this.matriz.makeBasis(this.lado, s.n, frente);
    this.qAlvo.setFromRotationMatrix(this.matriz);

    if (imediato) {
      this.el.object3D.quaternion.copy(this.qAlvo);
    } else {
      this.el.object3D.quaternion.slerp(this.qAlvo, 1 - Math.exp(-dt * 12));
    }
  },

  remove: function () {
    if (this.fio && this.fio.parentNode) {
      this.fio.parentNode.removeChild(this.fio);
    }
  }
});

/* =========================================================
   O COMPONENTE "carinho" — passar a mão no animal

   Três jeitos, conforme o aparelho:

   ÓCULOS COM CONTROLES DE MÃO (Quest e afins): o controle É a
   mão. Encostar o controle no corpo do animal conta, e o
   controle vibra de leve.

   VR BOX, CELULAR E COMPUTADOR: não há mão rastreada. O gesto
   vira "apertar e deslizar": com o botão (ou o dedo, ou o
   mouse) apertado sobre o animal, o olhar desliza pelo corpo
   dele, e uma mão desenhada acompanha o ponto onde ele toca.

   O animal reage ao primeiro contato encolhendo-se um pouco, e
   depois relaxa: a animação fica mais lenta enquanto o carinho
   continua. Nada de bote — susto é o oposto de exposição
   gradual.

   Quem passa a mão fica registrado (início, fim e quanto tempo
   durou) por experiencia.js, através de el.__carinho.
   ========================================================= */
AFRAME.registerComponent('carinho', {

  init: function () {
    this.pressionando = false;
    this.contato = false;
    this.tempoContato = 0;
    this.ultimoPonto = null;
    this.caixa = new AFRAME.THREE.Box3();
    this.posMao = new AFRAME.THREE.Vector3();
    this.normal = new AFRAME.THREE.Vector3();
    this.frente = new AFRAME.THREE.Vector3();
    this.lado = new AFRAME.THREE.Vector3();
    this.matriz = new AFRAME.THREE.Matrix4();

    this.mira = document.querySelector('#mira');
    this.maos = [document.querySelector('#maoEsquerda'), document.querySelector('#maoDireita')];

    const apertar = function (evento) {
      this.pressionando = true;
      this.cursor = (evento.detail && (evento.detail.cursor || evento.detail.cursorEl)) || this.mira;
    }.bind(this);
    const soltar = function () {
      this.pressionando = false;
    }.bind(this);

    this.el.addEventListener('carinho-apertou', apertar);
    this.el.addEventListener('mousedown', apertar);
    this.el.addEventListener('carinho-soltou', soltar);
    this.el.addEventListener('mouseup', soltar);
    this.el.addEventListener('mouseleave', soltar);

    this.criarMao();
  },

  /* uma mão simples, feita de caixas: palma, quatro dedos e o
     polegar. É um sinal de "você está tocando aqui", não uma
     mão realista. */
  criarMao: function () {
    const mao = document.createElement('a-entity');
    const pele = 'color: #E9B99A; roughness: 0.9; opacity: 0.92; transparent: true';
    const palma = document.createElement('a-box');
    palma.setAttribute('width', 0.075);
    palma.setAttribute('height', 0.016);
    palma.setAttribute('depth', 0.08);
    palma.setAttribute('material', pele);
    mao.appendChild(palma);
    [-0.027, -0.009, 0.009, 0.027].forEach(function (x, i) {
      const dedo = document.createElement('a-box');
      dedo.setAttribute('width', 0.015);
      dedo.setAttribute('height', 0.013);
      dedo.setAttribute('depth', i === 0 ? 0.045 : 0.058);
      dedo.setAttribute('position', `${x} 0 ${-0.04 - (i === 0 ? 0.022 : 0.029)}`);
      dedo.setAttribute('material', pele);
      mao.appendChild(dedo);
    });
    const polegar = document.createElement('a-box');
    polegar.setAttribute('width', 0.04);
    polegar.setAttribute('height', 0.014);
    polegar.setAttribute('depth', 0.018);
    polegar.setAttribute('position', '0.05 0 0.005');
    polegar.setAttribute('rotation', '0 -35 0');
    polegar.setAttribute('material', pele);
    mao.appendChild(polegar);
    mao.object3D.visible = false;
    this.el.sceneEl.appendChild(mao);
    this.mao = mao;
  },

  /* Um controle de mão está encostado no animal? */
  maoEncostada: function () {
    const cena = this.el.sceneEl;
    if (!cena.is('vr-mode')) {
      return null;
    }
    this.caixa.setFromObject(this.el.object3D).expandByScalar(0.05);
    for (let i = 0; i < this.maos.length; i++) {
      const mao = this.maos[i];
      const controle = mao && mao.components['tracked-controls'];
      if (!controle || !controle.controller) {
        continue;
      }
      mao.object3D.getWorldPosition(this.posMao);
      if (this.caixa.containsPoint(this.posMao)) {
        return mao;
      }
    }
    return null;
  },

  vibrar: function (mao) {
    try {
      const controle = mao.components['tracked-controls'].controller;
      const atuador = controle.gamepad && controle.gamepad.hapticActuators
        && controle.gamepad.hapticActuators[0];
      if (atuador) {
        atuador.pulse(0.25, 40);
      }
    } catch (erro) { /* sem vibração neste controle */ }
  },

  tick: function (tempo, intervalo) {
    const dt = Math.min(intervalo || 16, 60) / 1000;
    let tocando = false;

    /* 1. a mão de verdade */
    const mao = this.maoEncostada();
    if (mao) {
      tocando = true;
      if (Math.floor(tempo / 120) !== this.ultimaVibracao) {
        this.ultimaVibracao = Math.floor(tempo / 120);
        this.vibrar(mao);
      }
    }

    /* 2. apertar e deslizar */
    let ponto = null;
    if (this.pressionando && this.cursor) {
      /* o A-Frame liga cada pedaço do modelo à entidade do
         MODELO, e não à raiz do animal: procura-se o toque em
         qualquer parte que esteja dentro dela */
      const raycaster = this.cursor.components.raycaster;
      const raiz = this.el;
      const toque = raycaster && raycaster.intersections.find(function (i) {
        return i.object.el && raiz.contains(i.object.el);
      });
      if (toque) {
        ponto = toque;
        const deslizou = !this.ultimoPonto || this.ultimoPonto.distanceTo(toque.point) > 0.003;
        this.ultimoPonto = toque.point.clone();
        tocando = tocando || deslizou || this.contato;
      }
    }

    this.mostrarMao(ponto);

    if (tocando && !this.contato) {
      this.contato = true;
      this.tempoContato = 0;
      this.reagir();
      const aviso = this.el.__carinho;
      if (aviso && aviso.aoComecar) { aviso.aoComecar(mao ? 'mao' : 'olhar'); }
    } else if (!tocando && this.contato) {
      this.contato = false;
      this.relaxar();
      const aviso = this.el.__carinho;
      if (aviso && aviso.aoTerminar) { aviso.aoTerminar(this.tempoContato); }
    }

    if (this.contato) {
      this.tempoContato += dt;
    }
  },

  mostrarMao: function (toque) {
    if (!toque) {
      this.mao.object3D.visible = false;
      return;
    }
    const n = this.normal.set(0, 1, 0);
    if (toque.face) {
      n.copy(toque.face.normal).transformDirection(toque.object.matrixWorld);
    }
    if (n.y < 0) { n.negate(); }

    /* os dedos apontam para onde a pessoa olha, rente ao corpo */
    const camera = this.el.sceneEl.camera;
    camera.getWorldDirection(this.frente);
    this.frente.addScaledVector(n, -this.frente.dot(n)).normalize();
    this.frente.negate();
    this.lado.crossVectors(n, this.frente);
    this.matriz.makeBasis(this.lado, n, this.frente);

    const objeto = this.mao.object3D;
    objeto.position.copy(toque.point).addScaledVector(n, 0.012);
    objeto.quaternion.setFromRotationMatrix(this.matriz);
    objeto.visible = true;
  },

  /* encolhe um pouco e volta, devagar */
  reagir: function () {
    const reacao = this.el.querySelector('.animalReacao');
    if (reacao) {
      reacao.setAttribute('animation__carinho', {
        property: 'scale', from: '1 1 1', to: '0.93 0.96 0.93',
        dir: 'alternate', loop: 1, dur: 350, easing: 'easeOutQuad'
      });
    }
    const modelo = this.el.querySelector('.animalModelo');
    if (modelo && modelo.components.animador) {
      modelo.setAttribute('animador', 'velocidade', 0.45);
    }
  },

  relaxar: function () {
    const modelo = this.el.querySelector('.animalModelo');
    if (modelo && modelo.components.animador) {
      modelo.setAttribute('animador', 'velocidade', 1);
    }
  },

  remove: function () {
    if (this.mao && this.mao.parentNode) {
      this.mao.parentNode.removeChild(this.mao);
    }
  }
});
