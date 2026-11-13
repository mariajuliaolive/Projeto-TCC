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
        'animais, usar a aplicação pelo tempo que quiser, e responder a ' +
        'um questionário final.'
    },
    {
      titulo: 'Que dados são coletados',
      texto:
        'E-mail, sexo e data de nascimento; o grau de medo que você ' +
        'declara para cada animal; e medidas automáticas de uso, como a ' +
        'distância que você mantém do animal, sua movimentação pelo ' +
        'ambiente e os níveis percorridos.'
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
  }
];

/* ---------------------------------------------------------
   3. QUESTIONÁRIO DE PERFIL — medo declarado

   Uma pergunta por animal, em escala de 0 a 10. É curto de
   propósito: a pessoa está curiosa para entrar, e um
   questionário longo aqui gasta a paciência que ela deveria
   gastar na experiência.

   Este é o dado mais importante da coleta, porque é a LINHA
   DE BASE. Sem ele, as medidas de comportamento não têm com
   o que ser comparadas: saber que alguém manteve dois metros
   de distância só diz alguma coisa quando se sabe o quanto
   essa pessoa declarou temer aquele animal.

   Por isso ele é respondido ANTES de qualquer contato com o
   ambiente virtual — para que a declaração não seja
   contaminada pela experiência.
   --------------------------------------------------------- */
const ESCALA_MEDO = {
  pergunta: 'De 0 a 10, quanto medo você sente de cada animal?',
  minimo: 0,
  maximo: 10,
  rotuloMinimo: 'nenhum medo',
  rotuloMaximo: 'medo extremo'
};

/* ---------------------------------------------------------
   4. QUESTIONÁRIO FINAL — percepção

   Aplicado depois da experiência. Mede o que a métrica
   automática não alcança: como a pessoa se sentiu.

   As duas coisas se completam. A métrica diz que ela chegou
   a 80 cm do animal; o questionário diz se ela se sentiu no
   controle enquanto fazia isso. Uma sem a outra conta meia
   história.
   --------------------------------------------------------- */
const QUESTIONARIO_FINAL = [
  { id: 'presenca',    texto: 'O quanto você se sentiu presente dentro do ambiente virtual?' },
  { id: 'realismo',    texto: 'O quanto o animal pareceu real para você?' },
  { id: 'facilidade',  texto: 'O quanto foi fácil aprender a usar o sistema?' },
  { id: 'deslocar',    texto: 'O quanto foi fácil se deslocar pelo ambiente?' },
  { id: 'instrucoes',  texto: 'As instruções estavam claras?' },
  { id: 'desconforto', texto: 'Você sentiu desconforto físico (tontura, enjoo)?' },
  { id: 'controle',    texto: 'O quanto você se sentiu no controle do próprio ritmo?' }
];

/* As perguntas abertas vêm depois das de escala: quem
   desistir de escrever já terá deixado as respostas
   numéricas, que são as que entram na análise. */
const PERGUNTAS_ABERTAS = [
  { id: 'interromperia', texto: 'Você interromperia a experiência em algum momento? Por quê?' },
  { id: 'mudaria',       texto: 'O que você mudaria no sistema?' }
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
