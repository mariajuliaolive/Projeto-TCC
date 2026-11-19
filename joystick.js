/* =========================================================
   JOYSTICK — ler a direção de qualquer controle
   ---------------------------------------------------------
   Usado por duas páginas: vrbox.html (para mostrar e calibrar
   o controle) e a experiência (para andar). Ficar num arquivo
   só garante que as duas leiam o controle do mesmo jeito — se
   a calibração entendesse o joystick de um jeito e a
   experiência de outro, calibrar não adiantaria nada.

   O PROBLEMA

   Cada controle barato entrega o joystick de um jeito:

   - num PAR DE EIXOS qualquer (0 e 1, 2 e 3, 6 e 7...);
   - como DIRECIONAL de 8 posições num eixo só (parado ele fica
     acima de 1, e cada direção é um valor entre -1 e 1);
   - como SETAS do teclado;
   - e muitas vezes GIRADO: o controle é feito para ser segurado
     de lado, então "para frente" chega como "para a direita".

   A CALIBRAÇÃO

   A pessoa empurra o joystick para a frente e depois para a
   direita. O que chegar em cada caso é guardado neste aparelho,
   e daí em diante toda leitura é girada (e, se preciso,
   espelhada) para que "frente" seja frente.
   ========================================================= */

const JOYSTICK = (function () {

  const CHAVE = 'vr-exposicao:vrbox-joystick';

  /* Estado de cada eixo, que só se conhece observando:
     - um eixo só vale depois de ter sido visto perto do centro
       (um eixo "preso" em -1 faria a pessoa andar sozinha);
     - um eixo cujo primeiro valor é maior que 1 é direcional. */
  function novoEstado() {
    return { util: {}, direcional: {} };
  }

  /* Recebe a lista de eixos e devolve { x, y }, com y negativo
     para a frente (a convenção dos navegadores). */
  function lerEixos(eixos, estado) {
    for (let i = 0; i < eixos.length; i++) {
      const v = eixos[i] || 0;
      if (estado.direcional[i] === undefined) {
        estado.direcional[i] = Math.abs(v) > 1.05;
      }
      if (!estado.direcional[i] && Math.abs(v) < 0.5) {
        estado.util[i] = true;
      }
    }

    const valor = function (i) {
      return estado.util[i] ? eixos[i] || 0 : 0;
    };

    /* o par mais empurrado */
    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < eixos.length; i += 2) {
      if (Math.hypot(valor(i), valor(i + 1)) > Math.hypot(x, y)) {
        x = valor(i);
        y = valor(i + 1);
      }
    }

    /* direcional num eixo só: -1 é para cima, e a cada 2/7
       gira-se 45 graus no sentido do relógio */
    for (let i = 0; i < eixos.length; i++) {
      const v = eixos[i];
      if (estado.direcional[i] && Math.abs(v) <= 1.0001) {
        const passo = Math.round((v + 1) * 3.5) % 8;
        const angulo = passo * Math.PI / 4;
        x = Math.sin(angulo);
        y = -Math.cos(angulo);
      }
    }

    return { x: x, y: y };
  }

  /* As setas do teclado como vetor, antes da calibração. */
  function vetorDaTecla(evento) {
    const mapa = {
      ArrowUp: [0, -1], KeyW: [0, -1],
      ArrowDown: [0, 1], KeyS: [0, 1],
      ArrowLeft: [-1, 0], KeyA: [-1, 0],
      ArrowRight: [1, 0], KeyD: [1, 0]
    };
    const v = mapa[evento.code] || mapa[evento.key];
    return v ? { x: v[0], y: v[1] } : null;
  }

  /* ---------------------------------------------------------
     CALIBRAÇÃO
     --------------------------------------------------------- */
  function lerCalibracao() {
    try {
      const guardada = JSON.parse(localStorage.getItem(CHAVE));
      if (guardada && typeof guardada.giro === 'number') {
        return guardada;
      }
    } catch (erro) { /* sem calibração */ }
    return { giro: 0, espelhado: false };
  }

  function girar(v, angulo) {
    const c = Math.cos(angulo);
    const s = Math.sin(angulo);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  }

  /* "frente" e "direita" são o que chegou quando a pessoa
     empurrou o joystick para cada lado. */
  function calcularCalibracao(frente, direita) {
    const angulo = Math.atan2(-1, 0) - Math.atan2(frente.y, frente.x);
    const direitaGirada = girar(direita, angulo);
    return {
      giro: angulo,
      espelhado: direitaGirada.x < 0,
      quando: new Date().toISOString()
    };
  }

  function guardarCalibracao(calibracao) {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(calibracao));
    } catch (erro) { /* navegação anônima */ }
  }

  function apagarCalibracao() {
    try {
      localStorage.removeItem(CHAVE);
    } catch (erro) { /* navegação anônima */ }
  }

  /* Aplica a calibração a uma leitura. */
  function corrigir(v, calibracao) {
    if (!v.x && !v.y) {
      return v;
    }
    const c = calibracao || lerCalibracao();
    const g = girar(v, c.giro || 0);
    if (c.espelhado) {
      g.x = -g.x;
    }
    return g;
  }

  return {
    novoEstado: novoEstado,
    lerEixos: lerEixos,
    vetorDaTecla: vetorDaTecla,
    lerCalibracao: lerCalibracao,
    calcularCalibracao: calcularCalibracao,
    guardarCalibracao: guardarCalibracao,
    apagarCalibracao: apagarCalibracao,
    corrigir: corrigir
  };
})();
