# Protótipo VR - Exposição Gradual (TCC)

Protótipo acadêmico de Realidade Virtual para navegador, desenvolvido como
Trabalho de Conclusão de Curso em Ciência da Computação.

O sistema simula cenários com cinco animais (cobra, rato, barata, aranha e sapo)
em cinco níveis progressivos de aproximação, com o objetivo de estudar
usabilidade, imersão, interação e percepção do usuário.

**Aviso:** este é um protótipo acadêmico. Não constitui tratamento médico ou
psicológico e não realiza diagnóstico.

## Tecnologias

HTML, CSS, JavaScript, A-Frame, Three.js e WebXR.

## Como executar

É necessário um servidor local (arquivos 3D não carregam abrindo o HTML
diretamente pelo sistema de arquivos).

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000 no navegador.

## Estrutura atual

```
index.html         pagina inicial
selecao.html       escolha do estimulo e do nivel
experiencia.html   cena 3D em A-Frame

base.css           estilos compartilhados por todas as paginas
base.js            menu do celular e animacao de entrada (compartilhado)
dados.js           os 5 animais e os 5 niveis (fonte unica de verdade)

inicio.css         estilos da pagina inicial
selecao.css        estilos da selecao
selecao.js         monta as opcoes e gera o link da experiencia
experiencia.css    estilos da cena
experiencia.js     le a escolha na URL e prepara a cena

assets/
  models/          modelos 3D dos animais (.glb)
  textures/        imagens e texturas
  sounds/          audios
```

Arquivos `base.*` sao compartilhados. Os demais levam o nome da pagina a
que pertencem.

## Fluxo de navegacao

```
index.html  ->  selecao.html  ->  experiencia.html?animal=<id>&nivel=<n>
```

A escolha viaja pela URL, entao cada cenario pode ser aberto direto para
teste isolado. Exemplos:

```
experiencia.html?animal=cobra&nivel=1
experiencia.html?animal=aranha&nivel=4
```

Os identificadores validos estao em `dados.js`.

## Distancias dos niveis

Cada animal tem sua propria escala de distancias, porque os tamanhos
variam muito: a 7 metros, uma cobra de 1,2 m e visivel e uma barata de
5 cm ocupa menos de 2 pixels na tela.

Em `dados.js`, cada animal declara `distanciaLonge` (nivel 1) e
`distanciaPerto` (nivel 5); cada nivel declara uma `proporcao` entre as
duas. A funcao `distanciaDoNivel(animal, nivel)` faz a conta.

| animal | n1     | n2     | n3     | n4     | n5     |
|--------|--------|--------|--------|--------|--------|
| Cobra  | 7,00 m | 4,39 m | 4,39 m | 2,36 m | 1,20 m |
| Rato   | 5,50 m | 3,57 m | 3,57 m | 2,06 m | 1,20 m |
| Sapo   | 4,50 m | 3,01 m | 3,01 m | 1,86 m | 1,20 m |
| Aranha | 4,00 m | 2,74 m | 2,74 m | 1,76 m | 1,20 m |
| Barata | 3,00 m | 2,19 m | 2,19 m | 1,56 m | 1,20 m |

O minimo de 1,20 m e a camera inclinada 24 graus para baixo garantem que
o animal fique dentro do campo de visao em todas as combinacoes.

## Modelos 3D

Os modelos vao em `assets/models/`, no formato `.glb`, com o nome do `id`
do animal definido em `dados.js`:

```
assets/models/cobra.glb
assets/models/rato.glb
assets/models/barata.glb
assets/models/aranha.glb
assets/models/sapo.glb
```

Enquanto um arquivo nao existir, a cena mostra uma caixa provisoria com as
dimensoes reais do animal, e o console avisa qual arquivo falta.

Nao e preciso ajustar a escala do arquivo antes de usar: o codigo mede o
modelo e o redimensiona para o `tamanhoReal` (em metros) informado em
`dados.js`, alem de apoiar a base dele no chao. Se o animal aparecer de
costas ou de lado, ajuste o campo `rotacao` do mesmo arquivo.

O campo `medida` diz a qual dimensao o `tamanhoReal` se refere. O padrao
`'maior'` serve para a maioria dos modelos; use `'altura'`, `'largura'`
ou `'profundidade'` quando a pose do modelo nao acompanhar a forma do
animal (a cobra, por exemplo, vem empinada).

## Movimento

O componente `animador` (arquivo `animador.js`) toca as animacoes que ja
vem dentro do `.glb`. Basta um pedaco do nome: o modelo pode chamar de
`SnakeArmature|Snake_Idle`, e `Idle` encontra.

| nivel | movimento | animacao        |
|-------|-----------|-----------------|
| 1, 2  | nao       | `parado` (Idle) |
| 3, 4  | sim       | `movendo` (Walk, ou Jump no sapo) |
| 5     | sim       | `movendo`, e `reagindo` ao ser tocado |

As animacoes de ataque que alguns modelos trazem **nao sao usadas**: um
animal que ataca produz susto, e susto e o oposto de exposicao gradual e
controlada.

Modelos sem animacao (o rato) recebem um movimento gerado por codigo:
respiracao leve sempre, e um giro lento do corpo nos niveis de movimento.

### Modelos em uso

| arquivo    | tamanho | triangulos | textura     | animacoes                  |
|------------|---------|------------|-------------|----------------------------|
| cobra.glb  | 212 KB  | 1.618      | -           | Idle, Walk, Jump, Attack   |
| aranha.glb | 438 KB  | 2.712      | -           | Idle, Walk, Jump, Attack, Death |
| sapo.glb   | 574 KB  | 4.920      | -           | Idle, Jump, Attack, Death  |
| rato.glb   | 0,31 MB | 776        | 512x512     | nenhuma                    |
| barata.glb | ausente | -          | -           | -                          |

## Ferramentas de diagnostico

A pasta `ferramentas/` guarda paginas que ajudam no desenvolvimento, mas
nao fazem parte do sistema. Elas ficam separadas de proposito: o que o
participante usa e o que a pesquisadora usa tem publicos diferentes.

- `ferramentas/teste-sensor.html` — verifica se um aparelho Bluetooth
  publica o servico padrao de frequencia cardiaca (0x180D), que e o unico
  que a Web Bluetooth consegue ler. Cintas toracicas costumam publicar;
  relogios de entrada costumam usar protocolo proprio. Precisa de HTTPS
  (ou localhost) e de Chrome ou Edge; nao funciona em iPhone.

O sistema em si **nao coleta** frequencia cardiaca. A linha existe no HUD
mostrando a ausencia de sensor.

## Realidade Virtual (WebXR)

A pagina detecta o suporte a WebXR e informa na barra superior. Quando ha
suporte, o botao do A-Frame no canto inferior direito entra no modo VR.

Dentro do oculos o HUD em HTML desaparece: o navegador mostra apenas a
cena 3D. Por isso a informacao essencial (nivel, instrucao, avancar e
sair) e reconstruida como objetos 3D, no bloco `#uiVR`. Os paineis sao
desenhados em canvas pelo componente `painel-texto` (`painel.js`), sem
depender de arquivo de fonte externo.

Os paineis ficam a esquerda de quem usa e sao filhos do rig: acompanham a
pessoa se ela andar, mas nao giram junto com a cabeca. Interface presa ao
rosto causa desconforto e tampa a cena.

A selecao dentro do oculos usa o raio dos controles de mao
(`laser-controls`, do proprio A-Frame) ou, sem controle, o olhar demorado.

**Limitacao conhecida:** nao ha teleporte. Dentro do oculos o
deslocamento e apenas fisico, andando no espaco real. Isso nao impede o
uso: sao os niveis que aproximam o animal, nao o usuario que precisa se
deslocar.

## Controles da cena

| Dispositivo | Olhar          | Andar     | Selecionar            |
|-------------|----------------|-----------|-----------------------|
| Computador  | arrastar mouse | W A S D   | clique                |
| Celular     | girar aparelho | -         | manter a mira no alvo |
| Oculos VR   | mover a cabeca | andar no espaco fisico | raio do controle, ou olhar demorado |

A camera fica a 1,6 m do chao (altura media dos olhos) e a velocidade de
caminhada e de cerca de 1,8 m/s, proxima da caminhada humana. Valores mais
altos causam desconforto em Realidade Virtual.
