/* =========================================================
   MÉTRICAS — o que a pessoa fez durante a exposição
   ---------------------------------------------------------
   Esta é a segunda metade do que a orientação pediu. A
   primeira foi saber QUEM participou; esta é saber O QUE
   aconteceu enquanto a pessoa estava lá dentro.

   O professor descreveu assim, na reunião: "se ela se afastou
   muito, se ela se balançou muito, ficou olhando muito pro
   lado". Cada uma dessas frases vira um número aqui.

   COMO CADA FRASE VIRA MEDIDA

     "se afastou"        distância mínima alcançada, distância
                         média, e quantas vezes recuou
     "se balançou"       variação angular da cabeça por
                         segundo
     "ficou olhando      fração do tempo com o estímulo dentro
      pro lado"          de um cone de 30 graus à frente
     "superou o medo"    chegou ao nível 5? tocou o animal?
                         encontrou os escondidos?

   Tudo sai de grandezas que a cena já tem: a posição da
   câmera, a rotação dela e a posição do estímulo. Não há
   sensor nenhum acoplado à pessoa.

   POR QUE É UM COMPONENTE DO A-FRAME

   Porque precisa de um "tick" — ser chamado a cada quadro
   pelo próprio laço de desenho. Fosse um setInterval, a
   medição continuaria correndo com a aba em segundo plano,
   registrando movimento que não existiu. O tick só roda
   quando a cena está rodando, que é exatamente quando há o
   que medir.

   POR QUE DEZ VEZES POR SEGUNDO, E NÃO SESSENTA

   Medir a cada quadro não melhora o dado e multiplica o
   custo: comportamento humano não muda em dezesseis
   milissegundos. Dez amostras por segundo descrevem a mesma
   curva e deixam a taxa de quadros em paz.
   ========================================================= */

AFRAME.registerComponent('medidor', {

  schema: {
    /* intervalo entre amostras, em milissegundos */
    intervalo: { type: 'number', default: 100 },

    /* meio-ângulo do cone que conta como "olhando para o
       estímulo". 30 graus é o campo em que uma pessoa
       reconhece uma forma sem mover os olhos. */
    coneGraus: { type: 'number', default: 30 },

    /* o quanto a distância precisa crescer para contar como
       recuo. Abaixo disso é oscilação do próprio andar, e
       contaria recuo onde não houve. */
    recuoMinimo: { type: 'number', default: 0.15 }
  },

  init: function () {
    this.ativo = false;
    this.desdeUltimaAmostra = 0;

    /* ---------- o que vamos acumular ---------- */
    this.amostras = 0;
    this.somaDistancia = 0;
    this.distanciaMinima = Infinity;
    this.recuos = 0;
    this.somaGiro = 0;
    this.amostrasOlhando = 0;
    this.deslocamento = 0;

    /* estado entre uma amostra e outra */
    this.aproximando = true;
    this.menorNaIda = Infinity;
    this.maiorNaVolta = -Infinity;
    this.rotacaoAnterior = null;
    this.posicaoAnterior = null;

    /* vetores reaproveitados: criar um Vector3 a cada quadro
       daria lixo para o coletor de memória limpar sessenta
       vezes por segundo */
    this.posCamera = new AFRAME.THREE.Vector3();
    this.posAlvo = new AFRAME.THREE.Vector3();
    this.frente = new AFRAME.THREE.Vector3();
    this.paraOAlvo = new AFRAME.THREE.Vector3();
    this.giroCamera = new AFRAME.THREE.Quaternion();
  },

  /* ---------------------------------------------------------
     Quem liga o medidor é experiencia.js, depois de a cena
     estar montada e o estímulo principal existir.
     --------------------------------------------------------- */
  comecar: function (camera, alvo) {
    this.camera = camera;
    this.alvo = alvo;
    this.ativo = true;
    this.inicio = performance.now();
  },

  parar: function () {
    this.ativo = false;
  },

  /* ---------------------------------------------------------
     A MEDIÇÃO
     --------------------------------------------------------- */
  tick: function (tempo, intervalo) {
    if (!this.ativo || !this.camera || !this.alvo) {
      return;
    }

    this.desdeUltimaAmostra = this.desdeUltimaAmostra + intervalo;
    if (this.desdeUltimaAmostra < this.data.intervalo) {
      return;
    }

    const decorrido = this.desdeUltimaAmostra;
    this.desdeUltimaAmostra = 0;

    const camera3D = this.camera.object3D;
    camera3D.getWorldPosition(this.posCamera);
    this.alvo.object3D.getWorldPosition(this.posAlvo);

    /* ---------- distância ----------
       No plano do chão: a altura dos olhos não é parte da
       distância que a pessoa percebe até um bicho no piso. */
    const distancia = Math.hypot(
      this.posCamera.x - this.posAlvo.x,
      this.posCamera.z - this.posAlvo.z
    );

    this.amostras = this.amostras + 1;
    this.somaDistancia = this.somaDistancia + distancia;

    if (distancia < this.distanciaMinima) {
      this.distanciaMinima = distancia;
    }

    /* ---------- recuos ----------
       Um recuo é um EPISÓDIO de afastamento, não cada amostra
       em que a distância cresceu. Quem anda 60 cm para trás de
       uma vez recuou uma vez, e não seis.

       Por isso há dois estados. Enquanto a pessoa se aproxima,
       guardamos o ponto mais próximo; passar do limite a partir
       dele conta um recuo e troca o estado. Enquanto ela recua,
       guardamos o ponto mais distante, e só voltamos ao primeiro
       estado quando ela se aproxima de novo.

       A primeira versão não tinha o segundo estado: contava um
       recuo a cada 15 cm do mesmo afastamento. Num teste com um
       recuo só, de 60 cm, ela registrou três. */
    if (this.aproximando) {
      if (distancia < this.menorNaIda) {
        this.menorNaIda = distancia;
      } else if (distancia - this.menorNaIda > this.data.recuoMinimo) {
        this.recuos = this.recuos + 1;
        this.aproximando = false;
        this.maiorNaVolta = distancia;
      }
    } else {
      if (distancia > this.maiorNaVolta) {
        this.maiorNaVolta = distancia;
      } else if (this.maiorNaVolta - distancia > this.data.recuoMinimo) {
        this.aproximando = true;
        this.menorNaIda = distancia;
      }
    }

    /* ---------- agitação da cabeça ----------
       Quanto a direção do olhar mudou desde a amostra
       anterior, em graus por segundo. Pessoa parada olhando
       o estímulo dá perto de zero; pessoa procurando em volta
       dá valores altos. */
    const giroAtual = {
      x: camera3D.rotation.x,
      y: camera3D.rotation.y
    };

    if (this.rotacaoAnterior) {
      const dx = giroAtual.x - this.rotacaoAnterior.x;
      const dy = giroAtual.y - this.rotacaoAnterior.y;
      const graus = AFRAME.THREE.MathUtils.radToDeg(Math.hypot(dx, dy));
      this.somaGiro = this.somaGiro + graus / (decorrido / 1000);
    }

    this.rotacaoAnterior = giroAtual;

    /* ---------- atenção ao estímulo ----------
       Ângulo entre para onde a câmera aponta e onde o
       estímulo está. Dentro do cone, conta como olhando. */
    camera3D.getWorldQuaternion(this.giroCamera);
    this.frente.set(0, 0, -1).applyQuaternion(this.giroCamera);
    this.paraOAlvo.subVectors(this.posAlvo, this.posCamera).normalize();

    const cosseno = this.frente.dot(this.paraOAlvo);
    const anguloGraus = AFRAME.THREE.MathUtils.radToDeg(
      Math.acos(Math.min(1, Math.max(-1, cosseno))));

    if (anguloGraus <= this.data.coneGraus) {
      this.amostrasOlhando = this.amostrasOlhando + 1;
    }

    /* ---------- deslocamento ----------
       Soma do caminho andado, e não a distância entre onde
       começou e onde parou: quem vai e volta andou os dois
       trechos. */
    if (this.posicaoAnterior) {
      this.deslocamento = this.deslocamento + Math.hypot(
        this.posCamera.x - this.posicaoAnterior.x,
        this.posCamera.z - this.posicaoAnterior.z
      );
    }

    this.posicaoAnterior = { x: this.posCamera.x, z: this.posCamera.z };
  },

  /* ---------------------------------------------------------
     O RESUMO

     Devolve os números prontos para irem ao banco. Arredonda
     na saída, e não durante: arredondar a cada amostra
     acumularia erro ao longo de milhares delas.
     --------------------------------------------------------- */
  resumo: function () {
    const duracao = this.inicio ? (performance.now() - this.inicio) / 1000 : 0;
    const n = this.amostras;

    return {
      distancia_minima: n ? +this.distanciaMinima.toFixed(3) : null,
      distancia_media: n ? +(this.somaDistancia / n).toFixed(3) : null,
      recuos: this.recuos,
      agitacao_media: n > 1 ? +(this.somaGiro / (n - 1)).toFixed(2) : null,
      tempo_olhando: n ? +(this.amostrasOlhando / n).toFixed(3) : null,
      deslocamento: +this.deslocamento.toFixed(2),
      duracao: +duracao.toFixed(1)
    };
  }

});
