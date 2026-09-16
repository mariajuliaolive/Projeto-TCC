/* =========================================================
   COMPONENTE "animador"
   ---------------------------------------------------------
   Toca as animações que já vêm dentro de um arquivo .glb.

   O A-Frame carrega o modelo e as animações, mas não as
   reproduz sozinho. Quem faz isso é o Three.js, através de
   um objeto chamado AnimationMixer. Este componente é a
   ponte entre os dois.

   Como usar no HTML:
     <a-entity gltf-model="url(cobra.glb)"
               animador="clipe: Idle"></a-entity>

   O "clipe" é só um pedaço do nome. O modelo pode chamar a
   animação de "SnakeArmature|Snake_Idle" — procurar por
   "Idle" já encontra. Isso evita depender do nome exato,
   que muda de modelo para modelo.
   ========================================================= */

AFRAME.registerComponent('animador', {

  /* O schema declara as propriedades que o componente aceita
     e o tipo de cada uma. O A-Frame converte o texto do HTML
     para esses tipos automaticamente. */
  schema: {
    clipe: { type: 'string', default: '' },
    velocidade: { type: 'number', default: 1 },
    transicao: { type: 'number', default: 0.4 }   // segundos de troca suave
  },

  /* init roda uma vez, quando o componente é criado. */
  init: function () {
    this.mixer = null;
    this.acaoAtual = null;

    // O modelo demora a chegar; esperamos o aviso do A-Frame.
    this.el.addEventListener('model-loaded', this.prepararMixer.bind(this));
  },

  /* Chamado quando o arquivo .glb termina de carregar. */
  prepararMixer: function () {
    const malha = this.el.getObject3D('mesh');

    if (!malha || !malha.animations || malha.animations.length === 0) {
      console.log('animador: este modelo não traz animações.');
      return;
    }

    this.mixer = new AFRAME.THREE.AnimationMixer(malha);

    console.log(
      'animador: animações disponíveis —',
      malha.animations.map(function (a) { return a.name; }).join(', ')
    );

    this.tocar(this.data.clipe);
  },

  /* update roda sempre que uma propriedade muda.
     É isso que permite trocar de animação só com
     el.setAttribute('animador', 'clipe', 'Walk'). */
  update: function () {
    if (this.mixer) {
      this.tocar(this.data.clipe);
    }
  },

  /* ---------------------------------------------------------
     Procura uma animação cujo nome CONTENHA o pedaço pedido.
     Devolve undefined se não achar.
     --------------------------------------------------------- */
  procurarClipe: function (pedaco) {
    const malha = this.el.getObject3D('mesh');
    if (!malha || !pedaco) {
      return undefined;
    }

    const procurado = pedaco.toLowerCase();

    return malha.animations.find(function (clipe) {
      return clipe.name.toLowerCase().includes(procurado);
    });
  },

  /* ---------------------------------------------------------
     Troca para uma animação, em laço contínuo.
     A troca é suave: a anterior some enquanto a nova aparece.
     --------------------------------------------------------- */
  tocar: function (pedaco) {
    const clipe = this.procurarClipe(pedaco);

    if (!clipe) {
      console.warn('animador: animação não encontrada:', pedaco);
      return;
    }

    const nova = this.mixer.clipAction(clipe);
    nova.setEffectiveTimeScale(this.data.velocidade);

    if (this.acaoAtual === nova) {
      return;   // já está tocando essa
    }

    nova.reset().play();

    if (this.acaoAtual) {
      this.acaoAtual.crossFadeTo(nova, this.data.transicao, false);
    }

    this.acaoAtual = nova;
  },

  /* ---------------------------------------------------------
     Toca uma animação UMA VEZ e volta para a anterior.
     Usado na reação ao toque do usuário (Nível 5).
     --------------------------------------------------------- */
  tocarUmaVez: function (pedaco) {
    const clipe = this.procurarClipe(pedaco);

    if (!clipe || !this.mixer) {
      return;
    }

    const base = this.data.clipe;
    const acao = this.mixer.clipAction(clipe);

    acao.setLoop(AFRAME.THREE.LoopOnce, 1);
    acao.clampWhenFinished = true;
    acao.reset().play();

    if (this.acaoAtual) {
      this.acaoAtual.crossFadeTo(acao, 0.15, false);
    }
    this.acaoAtual = acao;

    // Quando terminar, volta ao clipe normal.
    const componente = this;
    const aoTerminar = function (evento) {
      if (evento.action !== acao) {
        return;
      }
      componente.mixer.removeEventListener('finished', aoTerminar);
      componente.acaoAtual = null;
      componente.tocar(base);
    };

    this.mixer.addEventListener('finished', aoTerminar);
  },

  /* ---------------------------------------------------------
     tick roda a cada quadro. "delta" é quanto tempo passou
     desde o quadro anterior, em milissegundos.

     O mixer precisa saber quanto tempo passou para avançar a
     animação. Dividimos por 1000 porque ele trabalha em
     segundos.
     --------------------------------------------------------- */
  tick: function (tempo, delta) {
    if (this.mixer && delta) {
      this.mixer.update(delta / 1000);
    }
  },

  /* Limpa tudo se o componente for removido. */
  remove: function () {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
  }

});
