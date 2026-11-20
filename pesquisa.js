/* =========================================================
   PESQUISA — o que se pergunta e o que se explica
   ---------------------------------------------------------
   Fonte única de verdade da parte de pesquisa do sistema,
   assim como dados.js é a dos animais e dos níveis.

   Está aqui o texto do consentimento, os campos do cadastro
   e as perguntas dos dois questionários. Nenhum outro
   arquivo repete esses textos: as telas são montadas a
   partir daqui.

   A razão é a mesma de sempre, e aqui pesa mais: o texto do
   consentimento também vai no Apêndice A do TCC. Se ele
   existisse em dois lugares, um dia os dois iam divergir —
   e divergir o que a pessoa assinou do que o trabalho diz
   que ela assinou é problema sério.
   ========================================================= */

/* ---------------------------------------------------------
   1. O QUE SE EXPLICA ANTES DE COMEÇAR

   O professor pediu, na orientação, que a pessoa saiba que
   está entrando num projeto de pesquisa ANTES de se
   cadastrar. Não é formalidade: é a diferença entre coletar
   dado de alguém que consentiu e coletar dado de alguém que
   achou que era um joguinho.
   --------------------------------------------------------- */
const CONSENTIMENTO = {
  titulo: 'Antes de começar',

  resumo:
    'Você está sendo convidado a participar de uma pesquisa de Trabalho ' +
    'de Conclusão de Curso em Ciência da Computação.',

  blocos: [
    {
      titulo: 'Do que se trata',
      texto:
        'Esta pesquisa avalia um protótipo de Realidade Virtual que ' +
        'apresenta animais comumente associados a fobias — cobra, rato, ' +
        'barata, aranha e sapo — em ambientes virtuais, organizados em ' +
        'níveis crescentes de aproximação.'
    },
    {
      titulo: 'O que este sistema NÃO é',
      destaque: true,
      texto:
        'Este sistema não é tratamento psicológico ou médico, não realiza ' +
        'diagnóstico e não substitui acompanhamento profissional. A ' +
        'avaliação se restringe a usabilidade, imersão, interação e ' +
        'percepção.'
    },
    {
      titulo: 'O que você vai fazer',
      texto:
        'Preencher um cadastro curto e um questionário sobre medo de ' +
        'animais (cerca de 5 minutos), usar a aplicação pelo tempo que ' +
        'quiser, e responder a um questionário final.'
    },
    {
      titulo: 'Que dados são coletados',
      texto:
        'E-mail, sexo e data de nascimento; se você já teve experiência ' +
        'ruim com algum dos animais; o grau de medo que você declara para ' +
        'cada animal e como esse medo afeta sua atenção, suas reações e ' +
        'seu dia a dia; e medidas automáticas de uso, como a distância ' +
        'que você mantém do animal, sua movimentação pelo ambiente e os ' +
        'níveis percorridos.'
    },
    {
      titulo: 'Como seus dados são tratados',
      texto:
        'Seu e-mail serve apenas para identificar seu cadastro e não ' +
        'acompanha os dados de análise: nos resultados você aparece como ' +
        'um código (P01, P02, …). Nenhum dado que permita identificar ' +
        'você será publicado.'
    },
    {
      titulo: 'Riscos e desconforto',
      destaque: true,
      texto:
        'O contato com imagens de animais pode causar desconforto. Você ' +
        'pode interromper a qualquer momento, sem precisar justificar e ' +
        'sem prejuízo nenhum. O uso de óculos de Realidade Virtual pode ' +
        'provocar tontura passageira.'
    },
    {
      titulo: 'Participação voluntária',
      texto:
        'A participação é voluntária. Você pode desistir a qualquer ' +
        'momento e pedir a exclusão dos seus dados.'
    }
  ],

  confirmacao:
    'Li e compreendi as informações acima e concordo em participar.'
};

/* ---------------------------------------------------------
   2. CADASTRO

   Os três campos que a orientação pediu, e só eles. Cada
   campo a mais é um motivo a mais para alguém desistir antes
   de entrar — e, num estudo de exposição, quem desiste no
   formulário não gera dado nenhum.

   O e-mail é o único campo que identifica a pessoa. Ele
   existe para que ela possa, depois, pedir a exclusão dos
   próprios dados: sem alguma forma de reconhecê-la, essa
   promessa do consentimento não teria como ser cumprida.
   --------------------------------------------------------- */
const CAMPOS_CADASTRO = [
  {
    id: 'email',
    rotulo: 'E-mail',
    tipo: 'email',
    obrigatorio: true,
    ajuda: 'Usado só para identificar seu cadastro. Não aparece nos resultados.',
    placeholder: 'voce@exemplo.com'
  },
  {
    id: 'sexo',
    rotulo: 'Sexo',
    tipo: 'opcoes',
    obrigatorio: true,
    opcoes: [
      { valor: 'feminino', rotulo: 'Feminino' },
      { valor: 'masculino', rotulo: 'Masculino' },
      { valor: 'outro', rotulo: 'Outro' },
      { valor: 'nao_informado', rotulo: 'Prefiro não informar' }
    ]
  },
  {
    id: 'nascimento',
    rotulo: 'Data de nascimento',
    tipo: 'date',
    obrigatorio: true,
    ajuda: 'Usada apenas para calcular a faixa etária da amostra.'
  },
  {
    id: 'curso',
    rotulo: 'Curso',
    tipo: 'opcoes',
    obrigatorio: false,
    opcoes: [
      { valor: 'computacao', rotulo: 'Ciência da Computação' },
      { valor: 'psicologia', rotulo: 'Psicologia' },
      { valor: 'outro', rotulo: 'Outro' }
    ]
  },
  {
    id: 'usouVR',
    rotulo: 'Já usou óculos de Realidade Virtual?',
    tipo: 'opcoes',
    obrigatorio: false,
    opcoes: [
      { valor: 'sim', rotulo: 'Sim' },
      { valor: 'nao', rotulo: 'Não' }
    ]
  },

  /* Os dois campos abaixo vêm da "Identificação do Participante"
     do Questionário de Rastreio. Ficam neste passo porque é
     onde o questionário os coloca, mas são gravados junto com
     o rastreio (tabela "rastreio"), e não no cadastro: são
     dado de análise, e o cadastro guarda o e-mail. */
  {
    id: 'trauma',
    rotulo: 'Já teve alguma experiência traumática ou muito desagradável com algum desses animais?',
    rotuloCurto: 'experiência com os animais',
    tipo: 'opcoes',
    obrigatorio: true,
    opcoes: [
      { valor: 'sim', rotulo: 'Sim' },
      { valor: 'nao', rotulo: 'Não' }
    ]
  },
  {
    id: 'traumaQual',
    rotulo: 'Qual?',
    tipo: 'text',
    obrigatorio: false,
    /* só aparece depois de a pessoa marcar "Sim" acima */
    mostrarSe: { campo: 'trauma', valor: 'sim' },
    ajuda: 'Se quiser, conte em poucas palavras: qual animal e o que aconteceu.'
  }
];

/* ---------------------------------------------------------
   3. QUESTIONÁRIO DE RASTREIO: MEDO, ATENÇÃO E AUTORREGULAÇÃO

   Aplicado no cadastro, ANTES de qualquer contato com o
   ambiente virtual, para que as respostas não sejam
   contaminadas pela experiência. Tem duas partes:

   PARTE 1 — MAPEAMENTO POR ANIMAL (escala de 0 a 5)
   Uma nota por animal. É a LINHA DE BASE do estudo: saber
   que alguém manteve dois metros de distância só diz alguma
   coisa quando se sabe o quanto essa pessoa declarou temer
   aquele animal. Vai para a tabela "respostas_perfil".

   PARTE 2 — IMPACTO (escala de 0 a 4)
   Dez frases sobre o animal que recebeu a MAIOR nota na
   parte 1 (o "animal-alvo"), em três dimensões. Vai para a
   tabela "rastreio", com a soma de cada dimensão.

   O QUE ESTE QUESTIONÁRIO NÃO É

   "Rastreio" aqui quer dizer mapear o medo declarado para
   escolher o animal e descrever a amostra. NÃO é instrumento
   clínico validado e NÃO produz diagnóstico — por isso a
   pessoa não vê pontuação nenhuma ao terminar.

   Os textos abaixo são os do documento
   "Questionario_Rastreio_de_Medos.docx", sem alteração de
   sentido. Se mudar aqui, mude também o Apêndice B do TCC.
   --------------------------------------------------------- */
const ESCALA_MEDO = {
  pergunta: 'Quanto cada animal incomoda você?',
  instrucao:
    'Marque de 0 a 5 o nível de desconforto, medo ou repulsa que cada ' +
    'animal provoca em você (0 = nenhum desconforto; 5 = medo/repulsa ' +
    'extrema).',
  minimo: 0,
  maximo: 5,
  rotuloMinimo: 'nenhum desconforto',
  rotuloMaximo: 'medo/repulsa extrema'
};

const ESCALA_IMPACTO = {
  minimo: 0,
  maximo: 4,
  /* um rótulo por número, na ordem: 0, 1, 2, 3, 4 */
  rotulos: ['Nunca', 'Raramente', 'Às vezes', 'Quase sempre', 'Sempre']
};

const IMPACTO = {
  titulo: 'Como esse medo afeta você?',
  instrucao: 'Pense no animal em que você marcou a maior nota.',

  /* As três dimensões, cada uma com suas frases. O "id" de
     cada frase é o nome com que a resposta chega ao banco:
     não mude depois que a coleta começar, senão respostas
     da mesma pergunta ficam com nomes diferentes. */
  dimensoes: [
    {
      id: 'atencao',
      titulo: 'Atenção e bloqueio cognitivo (pensamento)',
      itens: [
        { id: 'atencao_1',
          texto: 'Quando vejo esse animal perto, longe ou em imagens/vídeos, ' +
                 'não consigo prestar atenção em mais nada ao meu redor.' },
        { id: 'atencao_2',
          texto: 'A simples possibilidade de esse animal aparecer no ambiente ' +
                 'me deixa em estado de alerta.' },
        { id: 'atencao_3',
          texto: 'Diante desse animal, paraliso ou tenho dificuldade para ' +
                 'pensar com clareza sobre o que fazer ou como vou agir.' }
      ]
    },
    {
      id: 'autorregulacao',
      titulo: 'Autorregulação emocional e fisiológica',
      itens: [
        { id: 'autorregulacao_1',
          texto: 'Ao me deparar com esse animal, sinto reações físicas ' +
                 'imediatas (coração acelerado, suor, arrepio, tensão ou ' +
                 'falta de ar).' },
        { id: 'autorregulacao_2',
          texto: 'Tenho dificuldade para me acalmar rapidamente mesmo depois ' +
                 'que o animal já saiu de perto.' },
        { id: 'autorregulacao_3',
          texto: 'Sinto repulsa, nojo intenso ou vontade de gritar/chorar ' +
                 'quando o animal se movimenta rápido.' }
      ]
    },
    {
      id: 'esquiva',
      titulo: 'Comportamento de esquiva e adaptação ao ambiente',
      itens: [
        { id: 'esquiva_1',
          texto: 'Meu primeiro impulso é fugir do local, fechar os olhos ou ' +
                 'pedir para outra pessoa resolver a situação.' },
        { id: 'esquiva_2',
          texto: 'Evito entrar em certos lugares (ambientes fechados, ' +
                 'quintais, áreas com mato ou locais com pouca luminosidade) ' +
                 'por medo de encontrar esse animal.' },
        { id: 'esquiva_3',
          texto: 'Sinto que esse medo limita minhas ações ou minha autonomia ' +
                 'em algumas situações do meu cotidiano.' },
        { id: 'esquiva_4',
          texto: 'Mesmo o animal estando em imagem e sabendo que é apenas uma ' +
                 'simulação, sinto insegurança em me aproximar desse animal.' }
      ]
    }
  ]
};

/* O animal-alvo: o de maior nota na parte 1.

   Recebe { cobra: 3, rato: 5, ... } e devolve a lista dos
   animais empatados na maior nota. Com um só, ele é o alvo;
   com vários, a pessoa escolhe em qual pensar — decidir por
   ela (o primeiro da lista, por exemplo) faria o alvo
   depender da ordem em que os animais aparecem na tela. */
function animaisDeMaiorNota(medo) {
  const notas = Object.keys(medo).map(function (id) { return medo[id]; });
  if (!notas.length) {
    return [];
  }
  const maior = Math.max.apply(null, notas);
  return Object.keys(medo).filter(function (id) { return medo[id] === maior; });
}

/* Soma de cada dimensão e o total. Recebe { atencao_1: 2, ... }.
   Devolve null numa dimensão com resposta faltando: somar o que
   existe daria um número menor que parece completo. */
function somarImpacto(respostas) {
  const somas = {};
  let total = 0;
  let completo = true;

  IMPACTO.dimensoes.forEach(function (dimensao) {
    let soma = 0;
    dimensao.itens.forEach(function (item) {
      const valor = respostas[item.id];
      if (typeof valor !== 'number') {
        soma = null;
      } else if (soma !== null) {
        soma += valor;
      }
    });
    somas[dimensao.id] = soma;
    if (soma === null) {
      completo = false;
    } else {
      total += soma;
    }
  });

  somas.total = completo ? total : null;
  return somas;
}

/* ---------------------------------------------------------
   4. QUESTIONÁRIO FINAL — percepção

   Aplicado depois da experiência. Mede o que a métrica
   automática não alcança: como a pessoa se sentiu.

   As duas coisas se completam. A métrica diz que ela chegou
   a 80 cm do animal; o questionário diz se ela se sentiu no
   controle enquanto fazia isso. Uma sem a outra conta meia
   história.
   --------------------------------------------------------- */
/* A escala é a mesma do desconforto registrado durante a
   experiência: 0 a 10. (O questionário de rastreio, aplicado
   antes, usa 0 a 5 e 0 a 4 porque assim veio o instrumento.)
   Não é a convenção de 1 a 5 que muitos questionários usam, e a
   escolha é deliberada — trocar de escala no meio do estudo faz
   a pessoa parar para reaprender o que o número significa, e o
   erro disso custa mais do que seguir a convenção.

   ATENÇÃO AO CAMPO "inverso"

   Em seis das sete perguntas, nota alta é coisa boa. Numa delas
   — desconforto físico — nota alta é coisa ruim. Tirar a média
   das sete sem levar isso em conta produz um número errado que
   parece certo, que é o pior tipo de erro de análise.

   Marcar aqui faz a informação viajar junto com a resposta até o
   banco, em vez de depender de alguém lembrar na hora de
   analisar.

   AVISO PARA O TCC

   Estas perguntas foram redigidas para este trabalho e NÃO
   constituem instrumento validado. Se a revisão da literatura
   apontar um questionário de presença ou de usabilidade já
   validado, trocar por ele fortalece o trabalho — e é por isso
   que as perguntas vivem aqui, como dado, e não espalhadas pela
   tela. Até lá, isso é uma limitação a declarar. */
const ESCALA_PERCEPCAO = {
  minimo: 0,
  maximo: 10,
  rotuloMinimo: 'nada',
  rotuloMaximo: 'totalmente'
};

const QUESTIONARIO_FINAL = [
  { id: 'presenca',
    texto: 'O quanto você se sentiu presente dentro do ambiente virtual?',
    dimensao: 'imersão' },

  { id: 'realismo',
    texto: 'O quanto o animal pareceu real para você?',
    dimensao: 'imersão' },

  { id: 'facilidade',
    texto: 'O quanto foi fácil aprender a usar o sistema?',
    dimensao: 'usabilidade' },

  { id: 'deslocar',
    texto: 'O quanto foi fácil se deslocar pelo ambiente?',
    dimensao: 'usabilidade' },

  { id: 'instrucoes',
    texto: 'As instruções estavam claras?',
    dimensao: 'usabilidade' },

  { id: 'desconforto',
    texto: 'Você sentiu desconforto físico (tontura, enjoo)?',
    dimensao: 'conforto',
    inverso: true,
    ajuda: 'Aqui, nota alta quer dizer MAIS desconforto.' },

  { id: 'controle',
    texto: 'O quanto você se sentiu no controle do próprio ritmo?',
    dimensao: 'controle' }
];

/* As perguntas abertas vêm depois das de escala: quem
   desistir de escrever já terá deixado as respostas
   numéricas, que são as que entram na análise. */
const PERGUNTAS_ABERTAS = [
  { id: 'interromperia',
    texto: 'Você interromperia a experiência em algum momento? Por quê?' },
  { id: 'mudaria',
    texto: 'O que você mudaria no sistema?' }
];

/* ---------------------------------------------------------
   5. AJUDA

   Idade a partir da data de nascimento. Fica aqui, e não na
   tela, porque é a análise que precisa dela — a tela só
   guarda a data.
   --------------------------------------------------------- */
function idadeEm(nascimento, referencia) {
  const nasceu = new Date(nascimento);
  const hoje = referencia ? new Date(referencia) : new Date();

  let idade = hoje.getFullYear() - nasceu.getFullYear();
  const mes = hoje.getMonth() - nasceu.getMonth();

  /* ainda não fez aniversário este ano */
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasceu.getDate())) {
    idade = idade - 1;
  }

  return idade;
}
