/* =========================================================
   DESCOBERTA
   ---------------------------------------------------------
   Nem todo animal está à vista quando a pessoa entra. Alguns
   ficam escondidos — dentro de um armário, atrás de um móvel,
   sob um tronco — e aparecem quando ela explora o ambiente.

   Isso muda a natureza da exposição: em vez de encarar tudo
   de uma vez, quem usa avança no próprio ritmo e decide
   quando abrir a próxima porta. O controle continua sendo
   dela, que é o princípio do sistema.

   Dois componentes:

   porta-armario   uma porta que abre ao ser tocada
   revela-perto    um animal que aparece quando alguém chega
   ========================================================= */

/* ---------------------------------------------------------
   PORTA
   Gira em torno da dobradiça quando recebe um clique. Avisa
   com o evento "porta-aberta" para quem estiver esperando.
   --------------------------------------------------------- */
AFRAME.registerComponent('porta-armario', {

  schema: {
    /* Positivo abre PARA DENTRO DA SALA. A dobradiça está na
       quina do armário, então o sinal aqui decide se a porta
       varre o ambiente ou atravessa a parede. */
    abertura: { type: 'number', default: 95 },   // graus
    duracao: { type: 'number', default: 700 }
  },

  init: function () {
    this.aberta = false;

    this.el.addEventListener('click', this.abrir.bind(this));

    /* o retângulo que o raio da mira enxerga é a própria porta;
       a classe é posta por cenarios.js */
  },

  abrir: function () {
    if (this.aberta) {
      return;
    }
    this.aberta = true;

    this.el.setAttribute('animation__abrir', {
      property: 'rotation',
      to: '0 ' + this.data.abertura + ' 0',
      dur: this.data.duracao,
      easing: 'easeOutQuad'
    });

    this.el.emit('porta-aberta', null, false);
    console.log('Porta aberta.');
  }

});

/* ---------------------------------------------------------
   REVELAÇÃO POR APROXIMAÇÃO
   O animal fica invisível até alguém chegar perto. Aí ele
   aparece e sai do esconderijo.

   A verificação roda a cada quadro, mas é barata: é uma
   subtração de posições. Ainda assim, paramos de verificar
   assim que o animal aparece — não faz sentido continuar
   medindo depois.
   --------------------------------------------------------- */
AFRAME.registerComponent('revela-perto', {

  schema: {
    distancia: { type: 'number', default: 1.8 },
    saida: { type: 'vec3' },        // para onde ele corre ao aparecer
    duracaoSaida: { type: 'number', default: 1100 }
  },

  init: function () {
    this.revelado = false;
    this.el.setAttribute('visible', false);

    this.posicaoCamera = new AFRAME.THREE.Vector3();
    this.posicaoAnimal = new AFRAME.THREE.Vector3();

    /* quem abre a porta também revela: cenarios.js liga a porta
       a este animal, e experiencia.js repassa o evento */
    this.el.addEventListener('revelar', this.revelar.bind(this));
  },

  revelar: function () {
    if (this.revelado) {
      return;
    }
    this.revelado = true;

    this.el.setAttribute('visible', true);

    const saida = this.data.saida;
    if (saida && (saida.x || saida.z)) {
      this.el.setAttribute('animation__sair', {
        property: 'position',
        to: `${saida.x} ${saida.y} ${saida.z}`,
        dur: this.data.duracaoSaida,
        easing: 'easeOutQuad'
      });
    }

    this.el.emit('animal-descoberto', null, true);
  },

  tick: function () {
    if (this.revelado) {
      return;
    }

    const camera = this.el.sceneEl.camera;
    if (!camera) {
      return;
    }

    camera.getWorldPosition(this.posicaoCamera);
    this.el.object3D.getWorldPosition(this.posicaoAnimal);

    /* distância no plano do chão: chegar perto é andar até lá,
       não é a altura dos olhos */
    const dx = this.posicaoCamera.x - this.posicaoAnimal.x;
    const dz = this.posicaoCamera.z - this.posicaoAnimal.z;

    if (Math.hypot(dx, dz) < this.data.distancia) {
      this.revelar();
    }
  }

});
