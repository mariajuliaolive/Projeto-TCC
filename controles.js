/* =========================================================
   COMPONENTE "andar-toque"
   ---------------------------------------------------------
   Permite andar pelo cenário no celular.

   No computador existe teclado, e o A-Frame já traz o
   wasd-controls. No celular não há teclado nenhum: girar o
   aparelho olha em volta, mas não move ninguém do lugar.

   Este componente desenha um controle circular no canto da
   tela. Arrastar o dedo a partir do centro anda naquela
   direção — o mesmo gesto dos jogos de celular.

   A direção é sempre RELATIVA AO OLHAR: empurrar para cima
   anda para onde a pessoa está olhando, não para o norte do
   mundo. É o que o corpo espera.
   ========================================================= */

AFRAME.registerComponent('andar-toque', {

  schema: {
    /* metros por segundo. O mesmo ritmo do teclado: velocidade
       alta em Realidade Virtual causa desconforto. */
    velocidade: { type: 'number', default: 1.4 },
    /* até onde o dedo precisa ir para ser velocidade máxima */
    alcance: { type: 'number', default: 55 },
    seletor: { type: 'string', default: '#controleAndar' }
  },

  init: function () {
    this.base = document.querySelector(this.data.seletor);
    if (!this.base) {
      return;
    }

    this.manete = this.base.querySelector('.controle-andar__manete');
    this.centro = { x: 0, y: 0 };
    this.direcao = { x: 0, y: 0 };
    this.ativo = false;
    this.toqueId = null;

    /* limites do cenário, para não atravessar parede.
       Quem os define é experiencia.js, depois de montar o lugar. */
    this.limites = null;

    this.aoComecar = this.aoComecar.bind(this);
    this.aoMover = this.aoMover.bind(this);
    this.aoSoltar = this.aoSoltar.bind(this);

    this.base.addEventListener('touchstart', this.aoComecar, { passive: false });
    this.base.addEventListener('touchmove', this.aoMover, { passive: false });
    this.base.addEventListener('touchend', this.aoSoltar);
    this.base.addEventListener('touchcancel', this.aoSoltar);

    /* mouse também, para conseguir testar no computador */
    this.base.addEventListener('mousedown', this.aoComecar);
    window.addEventListener('mousemove', this.aoMover);
    window.addEventListener('mouseup', this.aoSoltar);

    this.auxiliar = new AFRAME.THREE.Vector3();
  },

  definirLimites: function (limites) {
    this.limites = limites;
  },

  /* Pega o ponto do toque, seja de dedo ou de mouse. */
  ponto: function (evento) {
    if (evento.touches && evento.touches.length) {
      return { x: evento.touches[0].clientX, y: evento.touches[0].clientY };
    }
    return { x: evento.clientX, y: evento.clientY };
  },

  aoComecar: function (evento) {
    evento.preventDefault();
    const area = this.base.getBoundingClientRect();
    this.centro = { x: area.left + area.width / 2, y: area.top + area.height / 2 };
    this.ativo = true;
    this.base.classList.add('controle-andar--ativo');
    this.aoMover(evento);
  },

  aoMover: function (evento) {
    if (!this.ativo) {
      return;
    }
    if (evento.cancelable) {
      evento.preventDefault();
    }

    const p = this.ponto(evento);
    let dx = p.x - this.centro.x;
    let dy = p.y - this.centro.y;

    /* limita ao alcance: mais longe que isso não anda mais rápido */
    const distancia = Math.hypot(dx, dy);
    if (distancia > this.data.alcance) {
      dx = dx / distancia * this.data.alcance;
      dy = dy / distancia * this.data.alcance;
    }

    this.manete.style.transform = `translate(${dx}px, ${dy}px)`;

    /* de pixels para uma fração de -1 a 1 */
    this.direcao.x = dx / this.data.alcance;
    this.direcao.y = dy / this.data.alcance;
  },

  aoSoltar: function () {
    if (!this.ativo) {
      return;
    }
    this.ativo = false;
    this.base.classList.remove('controle-andar--ativo');
    this.manete.style.transform = 'translate(0px, 0px)';
    this.direcao.x = 0;
    this.direcao.y = 0;
  },

  /* ---------------------------------------------------------
     tick roda a cada quadro. "delta" é quanto tempo passou
     desde o quadro anterior, em milissegundos — o mesmo
     princípio da animação: o movimento depende do TEMPO, não
     da contagem de quadros, senão anda mais rápido num
     aparelho veloz.
     --------------------------------------------------------- */
  tick: function (tempo, delta) {
    if (!this.direcao.x && !this.direcao.y) {
      return;
    }

    const rig = this.el;
    const camera = rig.querySelector('[camera]');
    if (!camera) {
      return;
    }

    const segundos = delta / 1000;
    const passo = this.data.velocidade * segundos;

    /* só o giro horizontal do olhar interessa: olhar para baixo
       não deve fazer a pessoa afundar no chão */
    const giro = camera.object3D.rotation.y;

    const frente = -this.direcao.y;   // dedo para cima = andar para frente
    const lado = this.direcao.x;

    const dx = (Math.sin(giro) * -frente + Math.cos(giro) * lado) * passo;
    const dz = (Math.cos(giro) * -frente - Math.sin(giro) * lado) * passo;

    const atual = rig.object3D.position;
    let x = atual.x + dx;
    let z = atual.z + dz;

    /* não atravessar as paredes do cenário */
    if (this.limites) {
      const margem = 0.45;
      x = Math.max(-this.limites.x + margem, Math.min(this.limites.x - margem, x));
      z = Math.max(this.limites.zMin + margem, Math.min(1.0, z));
    }

    rig.object3D.position.set(x, atual.y, z);
  },

  remove: function () {
    if (!this.base) {
      return;
    }
    this.base.removeEventListener('touchstart', this.aoComecar);
    this.base.removeEventListener('touchmove', this.aoMover);
    this.base.removeEventListener('touchend', this.aoSoltar);
    this.base.removeEventListener('mousedown', this.aoComecar);
    window.removeEventListener('mousemove', this.aoMover);
    window.removeEventListener('mouseup', this.aoSoltar);
  }

});
