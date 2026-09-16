/* =========================================================
   DADOS DO SISTEMA
   ---------------------------------------------------------
   Fonte única de verdade sobre os animais e os níveis.
   Carregado por selecao.html e por experiencia.html.

   Para alterar um nome, uma distância ou acrescentar um
   animal, mude AQUI — e todas as páginas acompanham.
   ========================================================= */

/* ---------------------------------------------------------
   OS CINCO ESTÍMULOS

   id          → usado na URL (experiencia.html?animal=cobra)
   nome        → o que aparece na tela
   fobia       → nome técnico, para a documentação do TCC
   ambiente    → cenário onde o animal aparece. Por enquanto todos
                 usam o mesmo quarto; ambientes próprios (jardim, porão,
                 cozinha, sótão, lago) ficam para uma etapa posterior
   icone       → emoji exibido nos cards
   modelo      → caminho do arquivo 3D dentro de assets/models/
   tamanhoReal → tamanho do animal na cena, EM METROS. O código usa
                 este número para redimensionar qualquer modelo 3D,
                 seja qual for a escala do arquivo
   medida      → a qual dimensão do modelo o tamanhoReal se refere:
                 'maior' (o normal), 'altura', 'largura' ou
                 'profundidade'. Existe porque a pose do modelo nem
                 sempre acompanha a forma do animal: a cobra vem
                 empinada, então a maior dimensão dela é a altura
   rotacao     → giro aplicado ao modelo para ele ficar de frente
                 para quem observa. Ajuste depois de ver o modelo
   animacoes   → quais animações do arquivo usar em cada situação.
                 Basta um PEDAÇO do nome: o modelo pode chamar de
                 "SnakeArmature|Snake_Idle", e 'Idle' já encontra.
                 Vale null quando o modelo não traz animações —
                 nesse caso o código gera um movimento simples.

                 Deliberadamente NÃO usamos as animações de ataque
                 que alguns modelos trazem: um animal que ataca
                 produz susto, e susto é o oposto de exposição
                 gradual e controlada.
   distanciaLonge → distância do nível 1, em metros
   distanciaPerto → distância do nível 5, em metros

   As distâncias variam por animal porque os tamanhos variam muito:
   a 7 metros, uma cobra de 1,2 m é visível e uma barata de 5 cm
   ocupa menos de 2 pixels na tela. O mínimo de 1,2 m existe para o
   animal continuar dentro do campo de visão de quem está em pé.
   --------------------------------------------------------- */
const ANIMAIS = [
  {
    id: 'cobra',
    nome: 'Cobra',
    fobia: 'Ofidiofobia',
    ambiente: 'Quarto',
    icone: '🐍',
    inicial: 'C',
    modelo: 'assets/models/cobra.glb',
    animacoes: { parado: 'Idle', movendo: 'Walk', reagindo: 'Jump' },
    distanciaLonge: 7.0,
    distanciaPerto: 1.2,
    tamanhoReal: 0.5,
    medida: 'altura',
    rotacao: '0 0 0'
  },
  {
    id: 'rato',
    nome: 'Rato',
    fobia: 'Musofobia',
    ambiente: 'Quarto',
    icone: '🐀',
    inicial: 'R',
    modelo: 'assets/models/rato.glb',
    animacoes: null,
    distanciaLonge: 5.5,
    distanciaPerto: 1.2,
    tamanhoReal: 0.25,
    medida: 'maior',
    rotacao: '0 0 0'
  },
  {
    id: 'barata',
    nome: 'Barata',
    fobia: 'Katsaridafobia',
    ambiente: 'Quarto',
    icone: '🪳',
    inicial: 'B',
    modelo: 'assets/models/barata.glb',
    animacoes: { parado: 'Idle', movendo: 'Walk', reagindo: 'Jump' },
    distanciaLonge: 3.0,
    distanciaPerto: 1.2,
    tamanhoReal: 0.05,
    medida: 'maior',
    rotacao: '0 0 0'
  },
  {
    id: 'aranha',
    nome: 'Aranha',
    fobia: 'Aracnofobia',
    ambiente: 'Quarto',
    icone: '🕷️',
    inicial: 'A',
    modelo: 'assets/models/aranha.glb',
    animacoes: { parado: 'Idle', movendo: 'Walk', reagindo: 'Jump' },
    distanciaLonge: 4.0,
    distanciaPerto: 1.2,
    tamanhoReal: 0.08,
    medida: 'maior',
    rotacao: '0 0 0'
  },
  {
    id: 'sapo',
    nome: 'Sapo',
    fobia: 'Ranidafobia',
    ambiente: 'Quarto',
    icone: '🐸',
    inicial: 'S',
    modelo: 'assets/models/sapo.glb',
    animacoes: { parado: 'Idle', movendo: 'Jump', reagindo: 'Jump' },
    distanciaLonge: 4.5,
    distanciaPerto: 1.2,
    tamanhoReal: 0.10,
    medida: 'maior',
    rotacao: '0 0 0'
  }
];

/* ---------------------------------------------------------
   OS CINCO NÍVEIS DE EXPOSIÇÃO

   Além do texto, cada nível guarda os valores que a cena 3D
   usa de verdade:

   proporcao → onde o nível fica entre o longe e o perto do animal:
               1 = na distância mais longe, 0 = na mais próxima.
               Assim a mesma progressão vale para todos os animais,
               em distâncias adequadas ao tamanho de cada um
   movimento → o animal se move? (Etapa 7)
   interacao → o usuário pode interagir? (Etapa 9)
   instrucao → texto exibido no painel de instruções

   As distâncias cabem dentro do cenário fechado (um quarto de
   9 m de profundidade) e mantêm o animal no campo de visão.
   --------------------------------------------------------- */
const NIVEIS = [
  {
    numero: 1,
    nome: 'Visualização distante',
    descricao: 'O animal aparece ao longe. Você apenas observa, sem se aproximar.',
    instrucao: 'O estímulo está distante. Observe no seu tempo. '
             + 'Você pode sair a qualquer momento.',
    proporcao: 1.0,
    movimento: false,
    interacao: false
  },
  {
    numero: 2,
    nome: 'Aproximação moderada',
    descricao: 'O animal aparece mais próximo, ainda a uma distância confortável.',
    instrucao: 'O estímulo está mais próximo. Respire com calma e '
             + 'avance apenas quando se sentir pronta.',
    proporcao: 0.55,
    movimento: false,
    interacao: false
  },
  {
    numero: 3,
    nome: 'Movimento do estímulo',
    descricao: 'Na mesma distância do nível anterior, o animal passa a realizar movimentos simples.',
    instrucao: 'O estímulo começa a se mover, na mesma distância. '
             + 'Continue observando no seu ritmo.',
    proporcao: 0.55,
    movimento: true,
    interacao: false
  },
  {
    numero: 4,
    nome: 'Proximidade elevada',
    descricao: 'O animal se posiciona perto de você, mantendo o movimento.',
    instrucao: 'O estímulo está perto. Permaneça o tempo que precisar '
             + 'antes de seguir.',
    proporcao: 0.2,
    movimento: true,
    interacao: false
  },
  {
    numero: 5,
    nome: 'Interação direta',
    descricao: 'O animal fica ao alcance e você pode se aproximar ou interagir com ele.',
    instrucao: 'Você pode se aproximar e interagir. Avance somente '
             + 'se estiver confortável.',
    proporcao: 0.0,
    movimento: true,
    interacao: true
  }
];

/* ---------------------------------------------------------
   DISTÂNCIA FINAL DE UM NÍVEL PARA UM ANIMAL

   Cada animal tem sua distância mais longe e sua mais próxima.
   A proporção do nível diz onde parar entre as duas:

     proporcao 1   → distanciaLonge
     proporcao 0   → distanciaPerto
     proporcao 0.5 → exatamente no meio
   --------------------------------------------------------- */
function distanciaDoNivel(animal, nivel) {
  const intervalo = animal.distanciaLonge - animal.distanciaPerto;
  return animal.distanciaPerto + intervalo * nivel.proporcao;
}

/* ---------------------------------------------------------
   FUNÇÕES DE BUSCA
   Procuram um item pelo identificador e devolvem undefined
   se não encontrarem — quem chama decide o que fazer nesse caso.
   --------------------------------------------------------- */
function buscarAnimal(id) {
  return ANIMAIS.find(function (animal) {
    return animal.id === id;
  });
}

function buscarNivel(numero) {
  return NIVEIS.find(function (nivel) {
    return nivel.numero === Number(numero);
  });
}
