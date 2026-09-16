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
   ambiente    → cenário onde o animal vai aparecer (Etapa 3)
   icone       → emoji exibido nos cards
   modelo      → caminho do arquivo 3D dentro de assets/models/
   tamanhoReal → maior dimensão do animal, EM METROS. O código usa
                 este número para redimensionar qualquer modelo 3D
                 ao tamanho correto, seja qual for a escala do arquivo
   rotacao     → giro aplicado ao modelo para ele ficar de frente
                 para quem observa. Ajuste depois de ver o modelo
   --------------------------------------------------------- */
const ANIMAIS = [
  {
    id: 'cobra',
    nome: 'Cobra',
    fobia: 'Ofidiofobia',
    ambiente: 'Jardim',
    icone: '🐍',
    inicial: 'C',
    modelo: 'assets/models/cobra.glb',
    tamanhoReal: 1.2,
    rotacao: '0 0 0'
  },
  {
    id: 'rato',
    nome: 'Rato',
    fobia: 'Musofobia',
    ambiente: 'Porão',
    icone: '🐀',
    inicial: 'R',
    modelo: 'assets/models/rato.glb',
    tamanhoReal: 0.25,
    rotacao: '0 0 0'
  },
  {
    id: 'barata',
    nome: 'Barata',
    fobia: 'Katsaridafobia',
    ambiente: 'Cozinha',
    icone: '🪳',
    inicial: 'B',
    modelo: 'assets/models/barata.glb',
    tamanhoReal: 0.05,
    rotacao: '0 0 0'
  },
  {
    id: 'aranha',
    nome: 'Aranha',
    fobia: 'Aracnofobia',
    ambiente: 'Sótão',
    icone: '🕷️',
    inicial: 'A',
    modelo: 'assets/models/aranha.glb',
    tamanhoReal: 0.08,
    rotacao: '0 0 0'
  },
  {
    id: 'sapo',
    nome: 'Sapo',
    fobia: 'Ranidafobia',
    ambiente: 'Lago',
    icone: '🐸',
    inicial: 'S',
    modelo: 'assets/models/sapo.glb',
    tamanhoReal: 0.10,
    rotacao: '0 0 0'
  }
];

/* ---------------------------------------------------------
   OS CINCO NÍVEIS DE EXPOSIÇÃO

   Além do texto, cada nível guarda os valores que a cena 3D
   vai usar de verdade nas etapas 5 a 9:

   distancia → em metros, o quanto o animal fica do usuário
   movimento → o animal se move? (Etapa 7)
   interacao → o usuário pode interagir? (Etapa 9)
   --------------------------------------------------------- */
const NIVEIS = [
  {
    numero: 1,
    nome: 'Visualização distante',
    descricao: 'O animal aparece ao longe. Você apenas observa, sem se aproximar.',
    distancia: 15,
    movimento: false,
    interacao: false
  },
  {
    numero: 2,
    nome: 'Aproximação moderada',
    descricao: 'O animal aparece mais próximo, ainda a uma distância confortável.',
    distancia: 8,
    movimento: false,
    interacao: false
  },
  {
    numero: 3,
    nome: 'Movimento do estímulo',
    descricao: 'Na mesma distância do nível anterior, o animal passa a realizar movimentos simples.',
    distancia: 8,
    movimento: true,
    interacao: false
  },
  {
    numero: 4,
    nome: 'Proximidade elevada',
    descricao: 'O animal se posiciona perto de você, mantendo o movimento.',
    distancia: 3,
    movimento: true,
    interacao: false
  },
  {
    numero: 5,
    nome: 'Interação direta',
    descricao: 'O animal fica ao alcance e você pode se aproximar ou interagir com ele.',
    distancia: 1.5,
    movimento: true,
    interacao: true
  }
];

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
