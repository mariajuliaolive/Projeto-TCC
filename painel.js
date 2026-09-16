/* =========================================================
   COMPONENTE "painel-texto"
   ---------------------------------------------------------
   Desenha um painel de texto para ser lido DENTRO do óculos
   de Realidade Virtual.

   Por que isso é necessário: a camada de HTML que fica sobre
   a cena (o HUD) desaparece quando o navegador entra em modo
   VR. Lá dentro só existe o mundo 3D — então qualquer texto
   precisa ser um objeto 3D.

   Como funciona: desenhamos o painel num <canvas>, do mesmo
   jeito que se desenha num programa de pintura, e usamos essa
   imagem como textura de um plano.

   A alternativa seria o componente <a-text> do A-Frame, mas
   ele baixa um arquivo de fonte de um servidor externo, e não
   permite controlar o desenho. Com canvas, o painel tem a
   mesma aparência do HUD e não depende de nada.
   ========================================================= */

AFRAME.registerComponent('painel-texto', {

  schema: {
    titulo:     { type: 'string', default: '' },
    texto:      { type: 'string', default: '' },
    largura:    { type: 'number', default: 0.6 },   // em metros
    altura:     { type: 'number', default: 0.3 },   // em metros
    centralizar:{ type: 'boolean', default: false },
    destacado:  { type: 'boolean', default: false }
  },

  /* Quantos pixels de imagem usamos por metro do painel.
     Mais pixels = texto mais nítido e mais memória gasta. */
  PIXELS_POR_METRO: 760,

  init: function () {
    this.canvas = document.createElement('canvas');
    this.contexto = this.canvas.getContext('2d');

    this.textura = new AFRAME.THREE.CanvasTexture(this.canvas);
    this.textura.colorSpace = AFRAME.THREE.SRGBColorSpace;

    /* MeshBasicMaterial ignora a iluminação da cena.
       É o certo para interface: o texto precisa ser legível
       mesmo num ambiente escuro. */
    this.material = new AFRAME.THREE.MeshBasicMaterial({
      map: this.textura,
      transparent: true
    });

    this.criarMalha();
  },

  criarMalha: function () {
    const d = this.data;

    this.canvas.width = Math.round(d.largura * this.PIXELS_POR_METRO);
    this.canvas.height = Math.round(d.altura * this.PIXELS_POR_METRO);

    const geometria = new AFRAME.THREE.PlaneGeometry(d.largura, d.altura);

    if (this.malha) {
      this.malha.geometry.dispose();
      this.malha.geometry = geometria;
    } else {
      this.malha = new AFRAME.THREE.Mesh(geometria, this.material);
      this.el.setObject3D('mesh', this.malha);
    }

    this.desenhar();
  },

  /* Roda sempre que uma propriedade muda. */
  update: function (anterior) {
    const mudouTamanho = anterior &&
      (anterior.largura !== this.data.largura || anterior.altura !== this.data.altura);

    if (mudouTamanho || !this.malha) {
      this.criarMalha();
    } else {
      this.desenhar();
    }
  },

  /* ---------------------------------------------------------
     Quebra um texto longo em linhas que cabem na largura dada.
     O canvas não faz isso sozinho: mede-se palavra por palavra.
     --------------------------------------------------------- */
  quebrarEmLinhas: function (texto, larguraMaxima) {
    const palavras = texto.split(' ');
    const linhas = [];
    let linha = '';

    palavras.forEach((palavra) => {
      const tentativa = linha ? linha + ' ' + palavra : palavra;

      if (this.contexto.measureText(tentativa).width > larguraMaxima && linha) {
        linhas.push(linha);
        linha = palavra;
      } else {
        linha = tentativa;
      }
    });

    if (linha) {
      linhas.push(linha);
    }

    return linhas;
  },

  /* ---------------------------------------------------------
     Desenha o painel inteiro no canvas.
     --------------------------------------------------------- */
  desenhar: function () {
    const ctx = this.contexto;
    const d = this.data;
    const L = this.canvas.width;
    const A = this.canvas.height;
    const margem = L * 0.07;
    const raio = L * 0.035;

    ctx.clearRect(0, 0, L, A);

    /* fundo arredondado */
    ctx.fillStyle = d.destacado ? 'rgba(30, 62, 60, 0.96)' : 'rgba(14, 18, 25, 0.93)';
    ctx.beginPath();

    /* roundRect é recente; em navegador antigo desenhamos um
       retângulo comum em vez de deixar a página quebrar. */
    if (ctx.roundRect) {
      ctx.roundRect(0, 0, L, A, raio);
    } else {
      ctx.rect(0, 0, L, A);
    }

    ctx.fill();

    /* borda */
    ctx.strokeStyle = d.destacado ? '#3ED0C0' : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = d.destacado ? L * 0.012 : L * 0.006;
    ctx.stroke();

    const fonte = '"Segoe UI", Roboto, Arial, sans-serif';
    ctx.textBaseline = 'top';
    ctx.textAlign = d.centralizar ? 'center' : 'left';
    const x = d.centralizar ? L / 2 : margem;

    let y = margem;

    /* título */
    if (d.titulo) {
      const tamanhoTitulo = A * 0.13;
      ctx.font = '600 ' + tamanhoTitulo + 'px ' + fonte;
      ctx.fillStyle = '#3ED0C0';
      ctx.fillText(d.titulo, x, y);
      y += tamanhoTitulo * 1.5;
    }

    /* corpo */
    if (d.texto) {
      const tamanhoTexto = d.titulo ? A * 0.105 : A * 0.2;
      ctx.font = '400 ' + tamanhoTexto + 'px ' + fonte;
      ctx.fillStyle = '#ECF1F8';

      const linhas = this.quebrarEmLinhas(d.texto, L - margem * 2);
      const alturaLinha = tamanhoTexto * 1.35;

      /* sem título, o texto fica centralizado na vertical
         (é o caso dos botões) */
      if (!d.titulo) {
        y = (A - linhas.length * alturaLinha) / 2;
      }

      linhas.forEach((linha) => {
        ctx.fillText(linha, x, y);
        y += alturaLinha;
      });
    }

    /* avisa o Three.js que a imagem mudou e precisa ser reenviada
       para a placa de vídeo */
    this.textura.needsUpdate = true;
  },

  remove: function () {
    this.el.removeObject3D('mesh');
    this.textura.dispose();
    this.material.dispose();
  }

});
