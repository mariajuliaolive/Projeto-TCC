/* =========================================================
   COMPONENTE "console-cena"
   ---------------------------------------------------------
   O painel de informação da experiência, desenhado DENTRO do
   mundo 3D.

   POR QUE ISSO EXISTE

   Até aqui, toda a interface era HTML sobreposto ao canvas:
   uma camada plana por cima da cena. Isso trazia dois
   problemas, os dois apontados na orientação:

   1. Dentro do óculos de Realidade Virtual essa camada
      simplesmente não existe. O WebXR mostra só a cena 3D,
      então quem entrava no óculos ficava sem nível, sem
      instrução e sem botão nenhum.

   2. Mesmo no computador, os painéis tapavam o cenário. A
      informação ficava "por cima" do trabalho, em vez de
      fazer parte dele.

   A solução é a mesma dos dois casos: a interface vira um
   OBJETO da cena. Ela tem posição, tem profundidade, é
   iluminada pela mesma câmera e aparece no óculos.

   COMO O DESENHO É FEITO

   Desenhamos o painel inteiro num <canvas>, como se fosse um
   programa de pintura, e usamos essa imagem como textura de
   um plano. Um canvas só, com tudo dentro.

   Poderia ser um plano para cada pedaço de texto, mas aí
   seriam oito ou nove objetos para a placa de vídeo desenhar
   a cada quadro, em vez de um. Num protótipo que já carrega
   24 baratas animadas, isso importa.

   Este componente é parente do "painel-texto" (painel.js),
   que ficou responsável só pelos botões: ali cada botão
   precisa ser um objeto separado, porque cada um recebe o
   próprio clique.
   ========================================================= */

AFRAME.registerComponent('console-cena', {

  schema: {
    /* identificação, na faixa de cima */
    animal: { type: 'string', default: '' },
    fobia: { type: 'string', default: '' },

    /* progressão */
    nivel: { type: 'number', default: 1 },
    total: { type: 'number', default: 5 },
    nivelNome: { type: 'string', default: '' },
    instrucao: { type: 'string', default: '' },

    /* rodapé, atualizado durante a sessão */
    tempo: { type: 'string', default: '00:00' },
    encontrados: { type: 'string', default: '' },
    desconforto: { type: 'string', default: '' },

    /* tamanho do plano, em metros */
    largura: { type: 'number', default: 0.74 },
    altura: { type: 'number', default: 0.46 }
  },

  /* Pixels de imagem por metro de painel. Mais pixels deixam
     o texto mais nítido e gastam mais memória de vídeo.
     760 foi o valor que ficou legível a 75 cm de distância
     sem serrilhar as letras. */
  PIXELS_POR_METRO: 760,

  /* As mesmas cores do HUD em HTML (experiencia.css), para o
     console não parecer de outro sistema. */
  COR: {
    fundo: 'rgba(14, 18, 25, 0.93)',
    borda: 'rgba(255, 255, 255, 0.16)',
    texto: '#ECF1F8',
    suave: '#9FADC0',
    ciano: '#3ED0C0',
    verde: '#4ADE80'
  },

  FONTE: '"Segoe UI", Roboto, Arial, sans-serif',

  init: function () {
    this.canvas = document.createElement('canvas');
    this.contexto = this.canvas.getContext('2d');

    this.textura = new AFRAME.THREE.CanvasTexture(this.canvas);
    this.textura.colorSpace = AFRAME.THREE.SRGBColorSpace;

    /* MeshBasicMaterial ignora a iluminação da cena. É o certo
       para interface: o texto precisa continuar legível numa
       floresta escura ou numa cozinha clara. */
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

  /* Roda sempre que qualquer propriedade muda — inclusive o
     tempo, que muda a cada segundo. */
  update: function (anterior) {
    const mudouTamanho = anterior &&
      (anterior.largura !== this.data.largura ||
       anterior.altura !== this.data.altura);

    if (mudouTamanho || !this.malha) {
      this.criarMalha();
    } else {
      this.desenhar();
    }
  },

  /* ---------------------------------------------------------
     Quebra um texto em linhas que cabem numa largura.
     O canvas não faz isso sozinho: é preciso medir palavra
     por palavra e decidir onde cortar.
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

  /* Retângulo de cantos arredondados. roundRect é recente;
     em navegador antigo desenhamos um retângulo comum em vez
     de deixar a página quebrar. */
  caixa: function (x, y, largura, altura, raio) {
    const ctx = this.contexto;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, largura, altura, raio);
    } else {
      ctx.rect(x, y, largura, altura);
    }
  },

  /* ---------------------------------------------------------
     O DESENHO

     Tudo em proporção da largura do canvas (L), nunca em
     pixels fixos. Assim o painel pode mudar de tamanho em
     metros sem que o texto saia do lugar.
     --------------------------------------------------------- */
  desenhar: function () {
    const ctx = this.contexto;
    const d = this.data;
    const L = this.canvas.width;
    const A = this.canvas.height;
    const margem = L * 0.055;

    ctx.clearRect(0, 0, L, A);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    /* ---------- fundo ---------- */
    ctx.fillStyle = this.COR.fundo;
    this.caixa(0, 0, L, A, L * 0.028);
    ctx.fill();
    ctx.strokeStyle = this.COR.borda;
    ctx.lineWidth = L * 0.005;
    ctx.stroke();

    let y = margem;

    /* ---------- faixa de cima: qual animal, qual fobia ---------- */
    if (d.animal) {
      const corpo = L * 0.030;
      ctx.font = '600 ' + corpo + 'px ' + this.FONTE;
      ctx.fillStyle = this.COR.suave;

      const etiqueta = d.fobia
        ? d.animal.toUpperCase() + '  ·  ' + d.fobia
        : d.animal.toUpperCase();

      ctx.fillText(etiqueta, margem, y);
      y += corpo * 1.9;
    }

    /* ---------- nível ---------- */
    const tamNivel = L * 0.058;
    ctx.font = '700 ' + tamNivel + 'px ' + this.FONTE;
    ctx.fillStyle = this.COR.ciano;
    ctx.fillText(`NÍVEL ${d.nivel} DE ${d.total}`, margem, y);
    y += tamNivel * 1.25;

    if (d.nivelNome) {
      const tamNome = L * 0.038;
      ctx.font = '400 ' + tamNome + 'px ' + this.FONTE;
      ctx.fillStyle = this.COR.texto;
      ctx.fillText(d.nivelNome, margem, y);
      y += tamNome * 1.6;
    }

    /* ---------- trilha: uma barra por nível ----------
       Barras, e não bolinhas: numa textura vista de lado, um
       retângulo continua legível e um círculo pequeno vira
       um borrão. */
    const vaoTrilha = L - margem * 2;
    const larguraBarra = (vaoTrilha - (d.total - 1) * L * 0.012) / d.total;
    const alturaBarra = L * 0.013;

    for (let i = 1; i <= d.total; i++) {
      const x = margem + (i - 1) * (larguraBarra + L * 0.012);
      ctx.fillStyle = i <= d.nivel ? this.COR.verde : 'rgba(255, 255, 255, 0.14)';
      this.caixa(x, y, larguraBarra, alturaBarra, alturaBarra / 2);
      ctx.fill();
    }

    y += alturaBarra + L * 0.045;

    /* ---------- instrução do nível ---------- */
    if (d.instrucao) {
      const tamTexto = L * 0.036;
      ctx.font = '400 ' + tamTexto + 'px ' + this.FONTE;
      ctx.fillStyle = this.COR.texto;

      const linhas = this.quebrarEmLinhas(d.instrucao, L - margem * 2);
      const alturaLinha = tamTexto * 1.4;

      linhas.forEach((linha) => {
        ctx.fillText(linha, margem, y);
        y += alturaLinha;
      });
    }

    /* ---------- rodapé ----------
       Fica ancorado embaixo, e não depois do texto: assim ele
       não dança quando a instrução tem uma linha a mais.

       São até três medidas, distribuídas no vão. As que não se
       aplicam ao nível simplesmente não aparecem — campo vazio
       em painel pequeno só ocupa espaço. */
    const tamRodape = L * 0.030;
    const tamRotulo = L * 0.024;
    const yRodape = A - margem - tamRodape;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = L * 0.003;
    ctx.beginPath();
    ctx.moveTo(margem, yRodape - L * 0.034);
    ctx.lineTo(L - margem, yRodape - L * 0.034);
    ctx.stroke();

    const medidas = [{ rotulo: 'TEMPO', valor: d.tempo, cor: this.COR.texto }];

    if (d.encontrados) {
      medidas.push({
        rotulo: 'ENCONTRADOS', valor: d.encontrados, cor: this.COR.verde
      });
    }

    if (d.desconforto) {
      medidas.push({
        rotulo: 'DESCONFORTO', valor: d.desconforto, cor: this.COR.ciano
      });
    }

    const vao = L - margem * 2;

    medidas.forEach((medida, i) => {
      /* a primeira alinha à esquerda, a última à direita, e a do
         meio fica no centro: assim o rodapé ocupa a largura toda
         com uma, duas ou três medidas, sem reposicionar nada */
      let x;
      if (i === 0) {
        ctx.textAlign = 'left';
        x = margem;
      } else if (i === medidas.length - 1) {
        ctx.textAlign = 'right';
        x = L - margem;
      } else {
        ctx.textAlign = 'center';
        x = margem + vao / 2;
      }

      ctx.font = '400 ' + tamRotulo + 'px ' + this.FONTE;
      ctx.fillStyle = this.COR.suave;
      ctx.fillText(medida.rotulo, x, yRodape - tamRotulo * 1.15);

      ctx.font = '700 ' + tamRodape + 'px ' + this.FONTE;
      ctx.fillStyle = medida.cor;
      ctx.fillText(medida.valor, x, yRodape);
    });

    ctx.textAlign = 'left';

    /* avisa o Three.js que a imagem mudou e precisa ser
       reenviada para a placa de vídeo */
    this.textura.needsUpdate = true;
  },

  remove: function () {
    this.el.removeObject3D('mesh');
    this.textura.dispose();
    this.material.dispose();
  }

});

/* =========================================================
   COMPONENTE "aviso-abertura"
   ---------------------------------------------------------
   O painel que aparece à frente de quem entra, mostra o nível
   e a instrução, e some sozinho depois de alguns segundos.

   POR QUE ELE EXISTE

   O console fica à esquerda, fora do caminho do cenário. Isso
   resolve a sobreposição, mas cria outro risco: alguém pode
   entrar, olhar só para a frente e nunca descobrir que existe
   um painel ao lado.

   Este aviso cobre esse buraco. Ele aparece no centro, garante
   que a instrução seja lida, e então se afasta — devolvendo a
   cena inteira para a pessoa. Dura o suficiente para ler duas
   linhas sem pressa, e não exige clique nenhum: exigir uma
   ação para começar atrapalharia quem está de óculos.
   ========================================================= */

AFRAME.registerComponent('aviso-abertura', {

  schema: {
    duracao: { type: 'number', default: 6500 },   // milissegundos
    sumir: { type: 'number', default: 900 }
  },

  init: function () {
    this.encerrado = false;
    this.encerrar = this.encerrar.bind(this);

    /* O relógio só começa quando a cena está pronta. Se
       começasse antes, parte do tempo de leitura seria gasta
       carregando os modelos 3D. */
    const comecar = () => {
      this.relogio = setTimeout(this.encerrar, this.data.duracao);
    };

    if (this.el.sceneEl.hasLoaded) {
      comecar();
    } else {
      this.el.sceneEl.addEventListener('loaded', comecar);
    }
  },

  encerrar: function () {
    if (this.encerrado) {
      return;
    }
    this.encerrado = true;

    /* O desaparecimento é feito à mão, quadro a quadro, e não
       com o componente "animation" do A-Frame.

       Motivo: "animation" mexe em propriedades de componentes,
       e a transparência deste painel não é de um componente —
       ele cria o próprio material (MeshBasicMaterial) e o
       entrega pronto ao Three.js. Não existe
       "components.material" aqui para animar.

       Subir enquanto some lê-se como "saindo da frente"; só
       sumir, parado, parece falha de carregamento. */
    this.saindoDesde = 0;
    this.alturaInicial = this.el.object3D.position.y;
  },

  tick: function (tempo, intervalo) {
    if (!this.encerrado || this.sumiu) {
      return;
    }

    this.saindoDesde = this.saindoDesde + intervalo;
    const andamento = Math.min(this.saindoDesde / this.data.sumir, 1);

    const malha = this.el.getObject3D('mesh');
    if (malha && malha.material) {
      malha.material.opacity = 1 - andamento;
    }

    this.el.object3D.position.y = this.alturaInicial + andamento * 0.12;

    if (andamento === 1) {
      this.sumiu = true;
      this.el.setAttribute('visible', false);
      this.el.emit('aviso-encerrado', null, false);
    }
  },

  remove: function () {
    clearTimeout(this.relogio);
  }

});
