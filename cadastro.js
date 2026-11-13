/* =========================================================
   CADASTRO — consentimento, dados e medo declarado
   ---------------------------------------------------------
   Monta os três passos a partir de pesquisa.js e grava o
   resultado pelo armazenamento.js.

   Nenhum texto desta tela está escrito aqui dentro: tudo vem
   de pesquisa.js. É de propósito. O texto do consentimento
   também vai no Apêndice A do TCC, e se existisse em dois
   lugares um dia os dois iam divergir — divergir o que a
   pessoa assinou do que o trabalho diz que ela assinou.

   Depende de: pesquisa.js, dados.js, configuracao.js e
   armazenamento.js, carregados antes.
   ========================================================= */

const trilha = document.querySelector('#trilha');
const passos = {
  1: document.querySelector('#passo1'),
  2: document.querySelector('#passo2'),
  3: document.querySelector('#passo3'),
  fim: document.querySelector('#passoFim')
};

/* ---------------------------------------------------------
   TROCAR DE PASSO
   --------------------------------------------------------- */
function mostrarPasso(qual) {
  Object.keys(passos).forEach(function (chave) {
    const secao = passos[chave];
    secao.hidden = String(chave) !== String(qual);
    secao.classList.toggle('passo--atual', String(chave) === String(qual));
  });

  trilha.querySelectorAll('.trilha__passo').forEach(function (passo) {
    const numero = Number(passo.dataset.passo);
    const atual = Number(qual) || 4;   // "fim" conta como depois do 3
    passo.classList.toggle('trilha__passo--atual', numero === atual);
    passo.classList.toggle('trilha__passo--feito', numero < atual);
  });

  /* Voltar ao topo: num celular, trocar de passo sem isso
     deixa a pessoa no meio da página seguinte. */
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================================================
   PASSO 1 — CONSENTIMENTO
   ========================================================= */
document.querySelector('#tituloPasso1').textContent = CONSENTIMENTO.titulo;
document.querySelector('#resumoPesquisa').textContent = CONSENTIMENTO.resumo;
document.querySelector('#textoConcordo').textContent = CONSENTIMENTO.confirmacao;

const blocos = document.querySelector('#blocosConsentimento');

CONSENTIMENTO.blocos.forEach(function (bloco) {
  const item = document.createElement('div');
  item.className = 'bloco' + (bloco.destaque ? ' bloco--destaque' : '');
  item.innerHTML = `
    <h2 class="bloco__titulo">${bloco.titulo}</h2>
    <p class="bloco__texto">${bloco.texto}</p>
  `;
  blocos.appendChild(item);
});

/* O botão de continuar só liga depois do visto. Marcar a
   caixa é o registro do consentimento — por isso o passo não
   avança sem ele, e por isso o momento em que foi marcado
   fica gravado. */
const concordo = document.querySelector('#concordo');
const irPasso2 = document.querySelector('#irPasso2');

concordo.addEventListener('change', function () {
  irPasso2.disabled = !concordo.checked;
  irPasso2.classList.toggle('botao--desativado', !concordo.checked);
});

irPasso2.addEventListener('click', function () {
  mostrarPasso(2);
});

/* =========================================================
   PASSO 2 — CADASTRO
   ========================================================= */
const campos = document.querySelector('#campos');
const erroCadastro = document.querySelector('#erroCadastro');

CAMPOS_CADASTRO.forEach(function (campo) {
  const grupo = document.createElement('div');
  grupo.className = 'campo';

  const marca = campo.obrigatorio
    ? '<span class="campo__obrigatorio" aria-hidden="true">*</span>'
    : '<span class="campo__opcional">opcional</span>';

  if (campo.tipo === 'opcoes') {
    /* Botões de escolha, e não lista suspensa: num celular,
       abrir uma lista para escolher entre quatro opções é um
       toque a mais do que ver as quatro. */
    grupo.innerHTML = `
      <fieldset class="campo__grupo">
        <legend class="campo__rotulo">${campo.rotulo} ${marca}</legend>
        <div class="escolhas">
          ${campo.opcoes.map(function (opcao) {
            return `
              <label class="escolha">
                <input type="radio" name="${campo.id}" value="${opcao.valor}" />
                <span>${opcao.rotulo}</span>
              </label>`;
          }).join('')}
        </div>
        ${campo.ajuda ? `<p class="campo__ajuda">${campo.ajuda}</p>` : ''}
      </fieldset>
    `;
  } else {
    grupo.innerHTML = `
      <label class="campo__rotulo" for="campo-${campo.id}">
        ${campo.rotulo} ${marca}
      </label>
      <input class="campo__entrada"
             id="campo-${campo.id}"
             name="${campo.id}"
             type="${campo.tipo}"
             ${campo.placeholder ? `placeholder="${campo.placeholder}"` : ''} />
      ${campo.ajuda ? `<p class="campo__ajuda">${campo.ajuda}</p>` : ''}
    `;
  }

  campos.appendChild(grupo);
});

/* A mensagem de erro some assim que a pessoa mexe em algum
   campo. Deixá-la na tela depois de corrigido faz parecer que
   o problema continua, e manda procurar o que já foi
   resolvido. */
campos.addEventListener('input', function () {
  erroCadastro.hidden = true;
});
campos.addEventListener('change', function () {
  erroCadastro.hidden = true;
});

/* Lê o que foi preenchido. Devolve um objeto simples, com uma
   chave por campo. */
function lerCadastro() {
  const dados = {};

  CAMPOS_CADASTRO.forEach(function (campo) {
    if (campo.tipo === 'opcoes') {
      const marcado = campos.querySelector(`input[name="${campo.id}"]:checked`);
      dados[campo.id] = marcado ? marcado.value : null;
    } else {
      const entrada = campos.querySelector(`#campo-${campo.id}`);
      dados[campo.id] = entrada.value.trim() || null;
    }
  });

  return dados;
}

/* Conferência feita aqui, e não pelo navegador, porque a
   mensagem do navegador vem em inglês em alguns aparelhos e
   some sozinha antes de ser lida. */
function conferirCadastro(dados) {
  const faltando = CAMPOS_CADASTRO
    .filter(function (campo) { return campo.obrigatorio && !dados[campo.id]; })
    .map(function (campo) { return campo.rotulo.toLowerCase(); });

  if (faltando.length) {
    return 'Falta preencher: ' + faltando.join(', ') + '.';
  }

  if (dados.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dados.email)) {
    return 'O e-mail não parece completo. Confira se está certo.';
  }

  if (dados.nascimento) {
    const idade = idadeEm(dados.nascimento);
    if (idade < 0 || idade > 120) {
      return 'A data de nascimento não parece certa.';
    }
    if (idade < 18) {
      return 'A participação é restrita a maiores de 18 anos.';
    }
  }

  return null;
}

document.querySelector('#voltarPasso1').addEventListener('click', function () {
  mostrarPasso(1);
});

document.querySelector('#irPasso3').addEventListener('click', function () {
  const problema = conferirCadastro(lerCadastro());

  if (problema) {
    erroCadastro.textContent = problema;
    erroCadastro.hidden = false;
    return;
  }

  erroCadastro.hidden = true;
  mostrarPasso(3);
});

/* =========================================================
   PASSO 3 — MEDO DECLARADO

   Uma escala de 0 a 10 por animal. É a linha de base do
   estudo: sem ela, as medidas de comportamento não têm com o
   que ser comparadas.
   ========================================================= */
document.querySelector('#tituloPasso3').textContent = ESCALA_MEDO.pergunta;

const escalas = document.querySelector('#escalas');
const erroEscala = document.querySelector('#erroEscala');

ANIMAIS.forEach(function (animal) {
  const linha = document.createElement('div');
  linha.className = 'escala';

  let botoes = '';
  for (let valor = ESCALA_MEDO.minimo; valor <= ESCALA_MEDO.maximo; valor++) {
    botoes += `
      <label class="nota">
        <input type="radio" name="medo-${animal.id}" value="${valor}" />
        <span>${valor}</span>
      </label>`;
  }

  linha.innerHTML = `
    <div class="escala__animal">
      <span class="escala__icone" aria-hidden="true">${animal.icone}</span>
      <span class="escala__nome">${animal.nome}</span>
    </div>
    <div class="notas" role="group" aria-label="Medo de ${animal.nome}">
      ${botoes}
    </div>
    <div class="escala__legenda">
      <span>${ESCALA_MEDO.minimo} · ${ESCALA_MEDO.rotuloMinimo}</span>
      <span>${ESCALA_MEDO.maximo} · ${ESCALA_MEDO.rotuloMaximo}</span>
    </div>
  `;

  escalas.appendChild(linha);
});

/* mesma razão do cadastro: o aviso some quando a pessoa responde */
escalas.addEventListener('change', function () {
  erroEscala.hidden = true;
});

function lerMedo() {
  const respostas = {};

  ANIMAIS.forEach(function (animal) {
    const marcado = escalas.querySelector(`input[name="medo-${animal.id}"]:checked`);
    if (marcado) {
      respostas[animal.id] = Number(marcado.value);
    }
  });

  return respostas;
}

document.querySelector('#voltarPasso2').addEventListener('click', function () {
  mostrarPasso(2);
});

/* =========================================================
   CONCLUIR

   A ordem importa: grava primeiro, tenta enviar depois. Se o
   envio falhar, o dado já existe no navegador e a pessoa
   entra na experiência do mesmo jeito.
   ========================================================= */
document.querySelector('#concluir').addEventListener('click', async function () {
  const medo = lerMedo();
  const faltam = ANIMAIS.filter(function (a) {
    return medo[a.id] === undefined;
  });

  if (faltam.length) {
    erroEscala.textContent = 'Falta responder sobre: '
      + faltam.map(function (a) { return a.nome.toLowerCase(); }).join(', ') + '.';
    erroEscala.hidden = false;
    return;
  }

  erroEscala.hidden = true;

  const quem = Armazenamento.registrar(lerCadastro());
  Armazenamento.gravarMedoDeclarado(medo);

  document.querySelector('#mensagemFim').textContent =
    'Obrigada por participar. A partir daqui, use a aplicação pelo tempo '
    + 'que quiser — e lembre que você pode parar a qualquer momento.';

  mostrarPasso('fim');

  /* O envio acontece depois de a tela já ter mudado: ninguém
     fica esperando a rede para avançar. */
  const situacao = document.querySelector('#situacaoEnvio');

  if (!Armazenamento.configurado()) {
    situacao.textContent =
      'Seus dados estão guardados neste navegador. O envio para o banco '
      + 'ainda não foi configurado.';
    situacao.className = 'situacao situacao--local';
    return;
  }

  situacao.textContent = 'Enviando…';

  const resultado = await Armazenamento.sincronizar();

  if (resultado.pendentes === 0) {
    situacao.textContent = 'Dados registrados.';
    situacao.className = 'situacao situacao--ok';
  } else {
    situacao.textContent =
      'Seus dados estão guardados neste navegador e serão enviados quando '
      + 'a conexão permitir.';
    situacao.className = 'situacao situacao--local';
  }

  console.log('Participante registrado:', quem.id);
});

/* =========================================================
   JÁ CADASTRADO?

   Quem volta à página com cadastro ativo não precisa refazer
   tudo. Mas a opção de recomeçar precisa existir: no dia da
   coleta, o mesmo computador atende vários participantes em
   sequência, e o segundo não pode herdar o cadastro do
   primeiro.
   ========================================================= */
const jaCadastrado = Armazenamento.participante();

if (jaCadastrado) {
  const aviso = document.createElement('div');
  aviso.className = 'ja-cadastrado';
  aviso.innerHTML = `
    <p>
      Já existe um cadastro ativo neste navegador.
      <strong>Se você é outra pessoa</strong>, recomece para que os dados
      não se misturem.
    </p>
    <div class="acoes acoes--linha">
      <a class="botao botao--principal" href="selecao.html">Continuar como estou</a>
      <button class="botao botao--neutro" id="recomecar" type="button">
        Sou outra pessoa
      </button>
    </div>
  `;

  passos[1].prepend(aviso);

  document.querySelector('#recomecar').addEventListener('click', async function () {
    /* Antes de soltar o cadastro, tenta enviar o que ficou
       pendente dele — senão o dado da pessoa anterior
       ficaria preso numa fila sem dono. */
    if (Armazenamento.configurado()) {
      await Armazenamento.sincronizar();
    }

    Armazenamento.encerrarParticipacao();
    window.location.reload();
  });
}
