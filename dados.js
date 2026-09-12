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

   id        → usado na URL (experiencia.html?animal=cobra)
   nome      → o que aparece na tela
   fobia     → nome técnico, para a documentação do TCC
   ambiente  → cenário onde o animal vai aparecer (Etapa 3)
   modelo    → caminho do arquivo 3D (ainda não existe; Etapa 4)
   inicial   → letra exibida no marcador do card
   --------------------------------------------------------- */
const ANIMAIS = [
  {
    id: 'cobra',
    nome: 'Cobra',
    fobia: 'Ofidiofobia',
    ambiente: 'Jardim',
    modelo: 'assets/models/cobra.glb',
    inicial: 'C'
  },
  {
    id: 'rato',
    nome: 'Rato',
    fobia: 'Musofobia',
    ambiente: 'Porão',
    modelo: 'assets/models/rato.glb',
    inicial: 'R'
  },
  {
    id: 'barata',
    nome: 'Barata',
    fobia: 'Katsaridafobia',
    ambiente: 'Cozinha',
    modelo: 'assets/models/barata.glb',
    inicial: 'B'
  },
  {
    id: 'aranha',
    nome: 'Aranha',
    fobia: 'Aracnofobia',
    ambiente: 'Sótão',
    modelo: 'assets/models/aranha.glb',
    inicial: 'A'
  },
  {
    id: 'sapo',
    nome: 'Sapo',
    fobia: 'Ranidafobia',
    ambiente: 'Lago',
    modelo: 'assets/models/sapo.glb',
    inicial: 'S'
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
