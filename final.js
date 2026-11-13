/* =========================================================
   QUESTIONÁRIO FINAL — a percepção de quem usou
   ---------------------------------------------------------
   A última peça da coleta. As métricas dizem o que a pessoa
   fez; isto diz como foi para ela.

   As duas se completam, e nenhuma substitui a outra. A
   métrica registra que alguém chegou a 80 cm do animal; o
   questionário diz se essa pessoa se sentiu no controle
   enquanto chegava. Uma sem a outra conta meia história.

   QUANDO ESTA PÁGINA APARECE

   Quando a pessoa SAI da experiência, em qualquer nível — e
   não apenas ao terminar o nível 5.

   Isso é decisão de método, não de interface. Quem tem medo
   alto de cobra talvez pare no nível 3, e essa é justamente
   a pessoa mais informativa da amostra. Se só respondesse
   quem termina, a amostra se inclinaria para quem tem menos
   medo, e a conclusão sairia enviesada sem que o número
   deixasse ver.

   O nível alcançado vai junto com a resposta, para a análise
   saber até onde cada um foi.

   Depende de: pesquisa.js, dados.js, configuracao.js e
   armazenamento.js, carregados antes.
   ========================================================= */

/* ---------------------------------------------------------
   O QUE A PESSOA ACABOU DE FAZER

   Vem do endereço, posto pela própria experiência ao sair.
   Se alguém abrir esta página direto, sem ter passado pela
   cena, o resumo simplesmente não aparece — e o questionário
   continua respondível, porque interromper uma coleta por
   falta de um enfeite seria pior.
   --------------------------------------------------------- */
const parametros = new URLSearchParams(window.location.search);
const animalFeito = buscarAnimal(parametros.get('animal'));
const nivelFeito = Number(parametros.get('nivel')) || null;
const motivoSaida = parametros.get('motivo') || 'nao-informado';

const resumoPercurso = document.querySelector('#resumoPercurso');

if (animalFeito && nivelFeito) {
  const nivel = buscarNivel(nivelFeito);
  resumoPercurso.innerHTML =
    `Você esteve com <strong>${animalFeito.icone} ${animalFeito.nome}</strong>` +
    ` e chegou ao <strong>nível ${nivelFeito} de ${NIVEIS.length}</strong>` +
    (nivel ? ` — ${nivel.nome.toLowerCase()}` : '') + '.';
} else {
  resumoPercurso.hidden = true;
}

/* =========================================================
   AS PERGUNTAS DE ESCALA
   ========================================================= */
const escalas = document.querySelector('#escalasPercepcao');
const erroFinal = document.querySelector('#erroFinal');

QUESTIONARIO_FINAL.forEach(function (pergunta) {
  const linha = document.createElement('div');
  linha.className = 'escala';

  let botoes = '';
  for (let valor = ESCALA_PERCEPCAO.minimo; valor <= ESCALA_PERCEPCAO.maximo; valor++) {
    botoes += `
      <label class="nota">
        <input type="radio" name="p-${pergunta.id}" value="${valor}" />
        <span>${valor}</span>
      </label>`;
  }

  /* A pergunta de direção invertida recebe aviso na tela, além
     da marca nos dados. Quem responde precisa saber que ali
     nota alta é coisa ruim; quem analisa precisa saber que
     aquela coluna não entra na média junto com as outras. */
  const aviso = pergunta.ajuda
    ? `<p class="escala__ajuda">${pergunta.ajuda}</p>`
    : '';

  linha.innerHTML = `
    <div class="escala__animal">
      <span class="escala__nome">${pergunta.texto}</span>
    </div>
    ${aviso}
    <div class="notas" role="group" aria-label="${pergunta.texto}">
      ${botoes}
    </div>
    <div class="escala__legenda">
      <span>${ESCALA_PERCEPCAO.minimo} · ${ESCALA_PERCEPCAO.rotuloMinimo}</span>
      <span>${ESCALA_PERCEPCAO.maximo} · ${ESCALA_PERCEPCAO.rotuloMaximo}</span>
    </div>
  `;

  escalas.appendChild(linha);
});

escalas.addEventListener('change', function () {
  erroFinal.hidden = true;
});

/* =========================================================
   AS PERGUNTAS ABERTAS

   Vêm DEPOIS das de escala, de propósito: quem desistir de
   escrever já terá deixado as respostas numéricas, que são
   as que entram na análise quantitativa.

   São opcionais. Obrigar texto livre produz "nada" e "não
   sei" em vez de silêncio — e silêncio é um dado mais
   honesto do que preenchimento forçado.
   ========================================================= */
const abertas = document.querySelector('#abertas');

PERGUNTAS_ABERTAS.forEach(function (pergunta) {
  const campo = document.createElement('div');
  campo.className = 'campo';
  campo.innerHTML = `
    <label class="campo__rotulo" for="aberta-${pergunta.id}">
      ${pergunta.texto}
      <span class="campo__opcional">opcional</span>
    </label>
    <textarea class="campo__entrada campo__texto"
              id="aberta-${pergunta.id}"
              rows="3"
              placeholder="Escreva com suas palavras, se quiser."></textarea>
  `;
  abertas.appendChild(campo);
});

/* =========================================================
   LER E ENVIAR
   ========================================================= */
function lerRespostas() {
  const escalaRespondida = {};
  const faltando = [];

  QUESTIONARIO_FINAL.forEach(function (pergunta) {
    const marcado = escalas.querySelector(`input[name="p-${pergunta.id}"]:checked`);
    if (marcado) {
      escalaRespondida[pergunta.id] = Number(marcado.value);
    } else {
      faltando.push(pergunta);
    }
  });

  const texto = {};
  PERGUNTAS_ABERTAS.forEach(function (pergunta) {
    const valor = document.querySelector(`#aberta-${pergunta.id}`).value.trim();
    if (valor) {
      texto[pergunta.id] = valor;
    }
  });

  return { escala: escalaRespondida, texto: texto, faltando: faltando };
}

document.querySelector('#enviar').addEventListener('click', async function () {
  const lido = lerRespostas();

  if (lido.faltando.length) {
    erroFinal.textContent = lido.faltando.length === 1
      ? 'Falta uma pergunta sem resposta.'
      : `Faltam ${lido.faltando.length} perguntas sem resposta.`;
    erroFinal.hidden = false;

    /* Leva a pessoa até a primeira que falta, em vez de só
       avisar que falta alguma. */
    const primeira = escalas.querySelector(
      `input[name="p-${lido.faltando[0].id}"]`);
    if (primeira) {
      primeira.closest('.escala').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  erroFinal.hidden = true;
  this.disabled = true;
  this.textContent = 'Enviando…';

  /* O pacote leva as respostas E o contexto. Resposta de
     percepção sem saber qual animal e até que nível a pessoa
     foi não dá para interpretar.

     As marcas de direção invertida viajam junto, para quem
     for analisar não depender de lembrar quais eram. */
  Armazenamento.gravarQuestionarioFinal({
    animal: animalFeito ? animalFeito.id : null,
    nivel_alcancado: nivelFeito,
    motivo_saida: motivoSaida,
    escala: lido.escala,
    texto: lido.texto,
    invertidas: QUESTIONARIO_FINAL
      .filter(function (p) { return p.inverso; })
      .map(function (p) { return p.id; })
  });

  document.querySelector('#perguntas').hidden = true;
  document.querySelector('#agradecimento').hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  document.querySelector('#mensagemFim').textContent =
    'Suas respostas foram registradas. Elas ajudam a avaliar o protótipo '
    + 'e vão aparecer no trabalho apenas como um código, sem identificar você.';

  /* Envio depois de a tela já ter mudado: ninguém espera a
     rede para receber um obrigada. */
  const situacao = document.querySelector('#situacaoEnvio');

  if (!Armazenamento.configurado()) {
    situacao.textContent = 'Respostas guardadas neste navegador.';
    situacao.className = 'situacao situacao--local';
    return;
  }

  situacao.textContent = 'Enviando…';
  const resultado = await Armazenamento.sincronizar();

  if (resultado.pendentes === 0) {
    situacao.textContent = 'Respostas registradas.';
    situacao.className = 'situacao situacao--ok';
  } else {
    situacao.textContent =
      'Respostas guardadas neste navegador e serão enviadas quando a '
      + 'conexão permitir.';
    situacao.className = 'situacao situacao--local';
  }
});

/* =========================================================
   JÁ RESPONDEU?

   Um participante responde uma vez. Se voltar à página, o
   aviso evita gravar duas vezes a mesma percepção — o que
   contaria a mesma pessoa duas vezes na média.
   ========================================================= */
const CHAVE_RESPONDIDO = 'vr-exposicao:questionario-final';

try {
  if (localStorage.getItem(CHAVE_RESPONDIDO)) {
    const aviso = document.createElement('div');
    aviso.className = 'ja-cadastrado';
    aviso.innerHTML = `
      <p>
        Você já respondeu este questionário.
        <strong>Responder de novo contaria sua opinião duas vezes</strong>
        na análise. Se foi outra pessoa que usou agora, faça um novo
        cadastro antes.
      </p>
      <div class="acoes acoes--linha">
        <a class="botao botao--neutro" href="cadastro.html">Novo cadastro</a>
      </div>
    `;
    document.querySelector('#perguntas').prepend(aviso);
  }

  document.querySelector('#enviar').addEventListener('click', function () {
    localStorage.setItem(CHAVE_RESPONDIDO, new Date().toISOString());
  });
} catch (erro) {
  /* navegação anônima pode bloquear: segue sem o aviso */
}
