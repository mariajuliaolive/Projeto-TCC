/* =========================================================
   EXPERIÊNCIA — lê a escolha feita em selecao.html, monta a
   cena e controla o HUD.
   Depende de dados.js (ANIMAIS, NIVEIS), carregado antes.
   ========================================================= */

/* ---------- elementos da cena ---------- */
const cena = document.querySelector('#cena');
const camera = document.querySelector('#camera');
const mira = document.querySelector('#mira');
const animalEl = document.querySelector('#animal');
const modeloEl = document.querySelector('#animalModelo');
const apoioEl = document.querySelector('#animalApoio');

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

const btnSom = document.querySelector('#btnSom');
const btnAjuda = document.querySelector('#btnAjuda');
const btnReiniciar = document.querySelector('#btnReiniciar');
const btnProximo = document.querySelector('#btnProximo');
const btnProximoTexto = document.querySelector('#btnProximoTexto');

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
     3. POSICIONAR O ANIMAL
     A distância vem do nível, ajustada ao tamanho do animal.
     Z negativo = para a frente, longe de quem observa.
     ========================================================= */
  const distancia = distanciaDoNivel(animal, nivel);
  animalEl.setAttribute('position', '0 0 ' + (-distancia));

  /* =========================================================
     4. CAIXA PROVISÓRIA (enquanto não houver arquivo 3D)
     Tem as dimensões reais do animal, para já dar pra avaliar
     escala e distância.
     ========================================================= */
  function mostrarApoio(tamanho) {
    apoioEl.setAttribute('width', tamanho);
    apoioEl.setAttribute('height', tamanho * 0.4);
    apoioEl.setAttribute('depth', tamanho * 0.4);
    apoioEl.setAttribute('position', '0 ' + (tamanho * 0.2) + ' 0');
    apoioEl.setAttribute('visible', true);
  }

  /* =========================================================
     5. AJUSTAR O MODELO 3D CARREGADO

     a) Escala imprevisível: cada arquivo vem numa unidade
        diferente. Medimos o modelo e calculamos o fator que o
        leva ao tamanhoReal declarado em dados.js.

     b) Origem em lugar qualquer: medimos onde fica a base e
        deslocamos para ela encostar no chão.
     ========================================================= */
  function ajustarModelo(elemento, tamanhoReal) {
    const objeto = elemento.getObject3D('mesh');
    if (!objeto) {
      return;
    }

    const caixa = new AFRAME.THREE.Box3().setFromObject(objeto);
    const medidas = new AFRAME.THREE.Vector3();
    caixa.getSize(medidas);

    const maiorLado = Math.max(medidas.x, medidas.y, medidas.z);
    if (maiorLado === 0) {
      return;
    }

    const fator = tamanhoReal / maiorLado;
    elemento.setAttribute('scale', `${fator} ${fator} ${fator}`);

    const baseY = caixa.min.y * fator;
    elemento.setAttribute('position', '0 ' + (-baseY) + ' 0');

    console.log(
      `Modelo medido: ${medidas.x.toFixed(2)} x ${medidas.y.toFixed(2)} x ` +
      `${medidas.z.toFixed(2)} unidades. Fator aplicado: ${fator.toFixed(4)}`
    );
  }

  /* =========================================================
     6. CARREGAR O MODELO DO ANIMAL
     Se o arquivo não existir, "model-error" dispara e a caixa
     provisória continua no lugar.
     ========================================================= */
  mostrarApoio(animal.tamanhoReal);
  modeloEl.setAttribute('rotation', animal.rotacao);

  modeloEl.addEventListener('model-loaded', function () {
    ajustarModelo(modeloEl, animal.tamanhoReal);
    apoioEl.setAttribute('visible', false);
    console.log('Modelo carregado:', animal.modelo);
  });

  modeloEl.addEventListener('model-error', function () {
    console.warn(
      `Modelo não encontrado: ${animal.modelo}. ` +
      'Mostrando a caixa provisória. Coloque o arquivo .glb em assets/models/.'
    );
  });

  modeloEl.setAttribute('gltf-model', 'url(' + animal.modelo + ')');

  /* =========================================================
     7. INCLINAR A CÂMERA PARA BAIXO

     Quem está em pé olha para baixo quando há algo no chão.
     Sem essa inclinação, um animal pequeno a 2 metros fica
     abaixo do campo de visão e simplesmente não aparece.

     Escrever rotation="-18 0 0" no HTML NÃO funciona: o
     componente look-controls recalcula a rotação da câmera a
     cada quadro, a partir de dois objetos internos seus.
     Para inclinar de verdade, escrevemos no objeto que ele lê.
     ========================================================= */
  const INCLINACAO_GRAUS = -24;

  function inclinarCamera(graus) {
    const controles = camera.components['look-controls'];
    if (!controles) {
      return;
    }
    controles.pitchObject.rotation.x = AFRAME.THREE.MathUtils.degToRad(graus);
  }

  /* =========================================================
     8. CONTROLES CONFORME O DISPOSITIVO
     ========================================================= */
  const ehMobile = AFRAME.utils.device.isMobile();

  if (ehMobile) {
    mira.setAttribute('fuse', true);
    hudAjudaTexto.textContent =
      'Gire o aparelho para olhar em volta. Mire no animal e segure o '
      + 'olhar por um instante para selecionar. Use "Sair" para voltar '
      + 'à escolha de estímulo a qualquer momento.';
  } else {
    hudAjudaTexto.textContent =
      'Arraste o mouse para olhar em volta. Use as teclas W, A, S e D '
      + 'para andar pelo quarto. Clique para selecionar. Use "Sair" para '
      + 'voltar à escolha de estímulo a qualquer momento.';
  }

  /* =========================================================
     9. TEMPO DA SESSÃO
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
     10. ESCALA DE ANSIEDADE (autorrelato de 0 a 10)

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
     11. BOTÕES DE AÇÃO
     ========================================================= */

  /* ---------- Ajuda ---------- */
  btnAjuda.addEventListener('click', function () {
    const aberto = hudAjuda.hidden;
    hudAjuda.hidden = !aberto;
    btnAjuda.setAttribute('aria-expanded', String(aberto));
  });

  /* ---------- Som ----------
     Ainda não há áudio na cena; isso é a Etapa 13. O botão já
     guarda o estado para quando houver. */
  let somLigado = false;

  btnSom.addEventListener('click', function () {
    somLigado = !somLigado;
    btnSom.setAttribute('aria-pressed', String(somLigado));
    console.log('Som:', somLigado ? 'ligado' : 'desligado', '(sem áudio ainda)');
  });

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
     12. INTERAÇÃO COM O ANIMAL
     Semente do Nível 5.
     ========================================================= */
  animalEl.addEventListener('click', function () {
    if (!nivel.interacao) {
      console.log('Este nível não permite interação.');
      return;
    }
    console.log('Animal selecionado pela mira.');
  });

  /* =========================================================
     13. REGISTROS DE CARREGAMENTO
     ========================================================= */
  cena.addEventListener('loaded', function () {
    inclinarCamera(INCLINACAO_GRAUS);

    console.log('Cena 3D carregada com sucesso.');
    console.log('Versão do A-Frame:', AFRAME.version);
    console.log('Animal:', animal.nome, '| tamanho real:', animal.tamanhoReal, 'm');
    console.log('Nível:', nivel.numero, '| distância:', distancia.toFixed(2), 'm');
    console.log('Dispositivo móvel:', ehMobile);
  });

  cena.addEventListener('enter-vr', function () {
    console.log('Entrou no modo VR.');
  });

  cena.addEventListener('exit-vr', function () {
    console.log('Saiu do modo VR.');
  });

}
