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

## Publicacao

O projeto e estatico: HTML, CSS, JavaScript e arquivos de midia, sem
servidor e sem etapa de build. Qualquer hospedagem de site estatico serve
(GitHub Pages, Vercel, Netlify, Cloudflare Pages).

Todos os caminhos do codigo sao **relativos**, entao o sistema funciona
tanto na raiz de um dominio quanto dentro de uma subpasta.

**HTTPS e obrigatorio** para o WebXR e para os sensores do celular. Todas
as opcoes acima fornecem HTTPS automaticamente; abrir por `http://` ou por
`file://` desliga o modo VR.

O arquivo `.nojekyll` existe para o GitHub Pages servir os arquivos como
estao, sem passar pelo Jekyll.

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

animador.js        toca as animacoes que vem dentro do .glb
painel.js          paineis de texto desenhados num canvas (usados no VR)
cenarios.js        monta os quatro ambientes e lista os esconderijos
descoberta.js      portas de armario e animais que aparecem ao serem achados
controles.js       controle de andar no celular (joystick de toque)

assets/
  models/          modelos 3D dos animais (.glb)
  textures/        imagens e texturas
  sounds/          audios
```

Arquivos `base.*` sao compartilhados. Os demais levam o nome da pagina a
que pertencem. `cenarios.js`, `animador.js`, `painel.js`, `descoberta.js`
e `controles.js` sao componentes e construtores usados pela cena 3D.

## Cenarios

Cada estimulo aparece no ambiente onde seria encontrado de verdade:

| animal | cenario  | o que tem |
|--------|----------|-----------|
| Cobra  | Floresta | arvores, arbustos, troncos caidos, chao de terra e folhas |
| Barata | Cozinha  | piso ladrilhado, bancada, pia, armarios, geladeira, fogao, lixeira |
| Aranha | Sala     | sofa, mesa de centro, estante com televisao, tapete, luminaria |
| Rato   | Sala     | o mesmo cenario da aranha |
| Sapo   | Quintal  | gramado, muro, canteiro, tanque de agua, varal, arvores |

Todos sao construidos com primitivas do A-Frame em `cenarios.js`, sem
nenhum arquivo externo. Para acrescentar um cenario, escreva a funcao e
registre-a em `CENARIOS`, no fim do arquivo.

Dois padroes de chao (o ladrilho da cozinha e o solo organico da floresta
e do quintal) sao **pintados num canvas** e usados como textura repetida.
A primeira versao desenhava dezenas de pecas separadas para o mesmo
efeito; pintar uma vez e repetir custa um desenho em vez de noventa.

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
| Cobra  | 5,50 m | 3,61 m | 3,61 m | 2,14 m | 1,30 m |
| Rato   | 3,20 m | 2,17 m | 2,17 m | 1,36 m | 0,90 m |
| Aranha | 2,60 m | 1,81 m | 1,81 m | 1,20 m | 0,85 m |
| Sapo   | 2,60 m | 1,81 m | 1,81 m | 1,20 m | 0,85 m |
| Barata | 1,90 m | 1,38 m | 1,38 m | 0,98 m | 0,75 m |

A camera inclinada 28 graus para baixo garante que o animal fique dentro
do campo de visao em todas as 25 combinacoes.

## Quantidade por nivel

O nivel diz a quantidade base; o animal ajusta com o campo
`fatorQuantidade` (`dados.js`). "Muitos" nao quer dizer a mesma coisa
para todo bicho: uma cozinha com 24 baratas e uma cena reconhecivel, uma
mata com 15 cobras de 1,4 m nao e. O nivel 1 ignora o fator — o primeiro
contato e sempre com UM animal, para todos os participantes.

| animal | fator | n1 | n2 | n3 | n4 | n5 |
|--------|-------|----|----|----|----|----|
| Barata | 1,6   | 1  | 5  | 10 | 16 | 24 |
| Rato   | 1     | 1  | 3  | 6  | 10 | 15 |
| Aranha | 1     | 1  | 3  | 6  | 10 | 15 |
| Sapo   | 1     | 1  | 3  | 6  | 10 | 15 |
| Cobra  | 0,5   | 1  | 2  | 3  | 5  | 8  |

## Animais escondidos

Do nivel 2 em diante, parte dos animais comeca **invisivel**, dentro de
um armario ou atras de um movel, e so aparece quando a pessoa o encontra.
Sao 35% das copias nos niveis 2 e 3, e 45% nos niveis 4 e 5.

Cada cenario declara seus esconderijos com a funcao `esconderijo(x, z,
porta)`, em `cenarios.js`. Sao 21 no total: 5 na sala, 9 na cozinha
(5 deles dentro dos armarios, com porta), 5 na floresta e 5 no quintal.

Dois modos de aparecer, no componente `revela-perto` (`descoberta.js`):

| esconderijo | como aparece |
|-------------|--------------|
| com porta   | so quando a pessoa **abre a porta do armario** (clique ou mira) |
| sem porta   | quando a pessoa **chega a menos de 1,6 m** dele |

Ao aparecer, o animal corre para fora do esconderijo, em direcao ao meio
do ambiente. O HUD mostra "Animais encontrados: X de Y" — sem isso, quem
explora desiste achando que ja viu tudo.

A exposicao passa a acontecer no ritmo de quem explora: e a pessoa que
decide quando abrir a proxima porta, e o controle continua com ela.

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

As animacoes de ataque que alguns modelos trazem **nao sao usadas**: um
animal que ataca produz susto, e susto e o oposto de exposicao gradual e
controlada. Modelos sem animacao recebem um movimento gerado por codigo.

### Comportamento de cada copia

Um grupo em que todos se mexem igual nao parece um grupo, parece um
enfeite. Cada copia recebe um comportamento sorteado **com semente**, o
que significa que o mesmo nivel monta sempre igual — sem isso, dois
participantes veriam cenas diferentes e a comparacao entre eles perderia
sentido.

| comportamento | o que faz | custo |
|---------------|-----------|-------|
| `quieto`    | so respira (balanco vertical lento) | barato: nao recebe o tocador de animacao |
| `inquieto`  | toca a animacao `parado` e gira o corpo, olhando em volta | medio |
| `andarilho` | toca a animacao `movendo`, gira e ainda caminha devagar entre dois pontos proximos | maior |

Sorteio: nos niveis 1 e 2, 65% ficam quietos; do nivel 3 em diante, 25%
quietos, 40% inquietos e 35% andarilhos.

Tres regras fixas:

1. **Nenhuma copia fica totalmente imovel.** Quem nao toca animacao
   recebe pelo menos a respiracao. Sempre ha movimento na cena.
2. **Sempre ha alguma copia parada.** Sem contraste, o grupo inteiro vira
   um borrao de movimento e nada chama atencao.
3. **O animal principal (o primeiro) nunca passeia.** Ele esta na
   distancia exata que define o nivel, e sair do lugar desmancharia a
   progressao que estamos medindo. Mas tambem nunca fica parado: toca a
   animacao e olha em volta.

No maximo 8 copias tocam a animacao do arquivo ao mesmo tempo
(`LIMITE_ANIMADOS`, em `experiencia.js`). Cada modelo animado recalcula a
posicao de cada osso a cada quadro; a nona copia em diante custa caro e
ninguem acompanha 24 bichos ao mesmo tempo. As demais continuam
respirando e girando, que e barato.

### Modelos em uso

| arquivo    | tamanho | triangulos | texturas | animacoes usadas | animacoes no arquivo |
|------------|---------|------------|----------|------------------|----------------------|
| cobra.glb  | 3,82 MB | 4.380      | 5 x 512  | Animation        | Animation |
| aranha.glb | 0,43 MB | 2.712      | -        | Idle, Walk, Jump | + Attack, Death |
| sapo.glb   | 0,56 MB | 4.920      | -        | Idle, Jump       | + Attack, Death |
| rato.glb   | 0,53 MB | 4.004      | -        | Idle, Walk, Jump | + Run, Attack, Death |
| barata.glb | 0,52 MB | 576        | 1 x 512  | idle, walking    | + Attack, death, flying x2 |

Os cinco animais estao implementados.

A cobra teve as cinco texturas reduzidas de 1024x1024 para 512x512 com
`ferramentas/reduzir-texturas.py`: o arquivo caiu de 6,13 MB para 3,82 MB
e a memoria de video ocupada por ela caiu de cerca de 20 MB para 5 MB.

```bash
python3 ferramentas/reduzir-texturas.py assets/models/cobra.glb 512
```

Os arquivos `cobra1.glb` e `rato1.glb` sao os modelos anteriores, guardados
como reserva. Nao sao carregados por nenhuma pagina.

## Ferramentas de diagnostico

A pasta `ferramentas/` guarda paginas que ajudam no desenvolvimento, mas
nao fazem parte do sistema. Elas ficam separadas de proposito: o que o
participante usa e o que a pesquisadora usa tem publicos diferentes.

- `ferramentas/teste-sistema.html` — percorre as 25 combinacoes de animal
  e nivel, verifica se cada uma carrega, se o modelo foi dimensionado e
  apoiado corretamente, se o animal fica dentro do campo de visao, e mede
  os quadros por segundo. Gera um relatorio em texto pronto para o TCC.
  Vale rodar em cada aparelho que for usado nos testes com usuarios: os
  numeros de desempenho sao do aparelho, nao do sistema.
- `ferramentas/gerar-sons.py` — gera os sons provisorios.
- `ferramentas/teste-sensor.html` — verifica se um aparelho Bluetooth
  publica o servico padrao de frequencia cardiaca (0x180D), que e o unico
  que a Web Bluetooth consegue ler. Cintas toracicas costumam publicar;
  relogios de entrada costumam usar protocolo proprio. Precisa de HTTPS
  (ou localhost) e de Chrome ou Edge; nao funciona em iPhone.

### Resultado do teste com sensores

| Aparelho testado | Publica o servico 0x180D? | Legivel pelo navegador? |
|------------------|---------------------------|-------------------------|
| Relogio X-WATCH  | nao                       | nao                     |

O relogio conecta por Bluetooth normalmente e mede a frequencia cardiaca,
mas nao publica o servico padrao: transmite por protocolo proprio, legivel
apenas pelo aplicativo do fabricante. O mesmo vale para a maioria dos
relogios de entrada e para Apple Watch e Galaxy Watch.

Cintas toracicas (Polar H9/H10, Wahoo TICKR, Garmin HRM-Dual, Coospo,
Magene) implementam o perfil padrao e seriam legiveis diretamente.

O sistema em si **nao coleta** frequencia cardiaca. A linha existe no HUD
mostrando a ausencia de sensor. A coleta efetiva demandaria, alem do
hardware adequado, aprovacao em Comite de Etica em Pesquisa.

## Audio

Dois sons, com papeis diferentes:

- **ambiente** (`assets/sounds/ambiente.wav`) — o rumor de fundo do
  comodo. Nao tem posicao: vem de todos os lados. Volume baixo.
- **animal** (`assets/sounds/<id>.wav`) — posicional, preso a camada da
  distancia. O navegador calcula o volume pela posicao, entao a
  progressao dos niveis aparece tambem no som, sem conta nenhuma no
  codigo:

  | nivel | cobra    | ganho | barata   | ganho |
  |-------|----------|-------|----------|-------|
  | 1     | 7,00 m   | 0,14  | 3,00 m   | 0,33  |
  | 2     | 4,39 m   | 0,23  | 2,19 m   | 0,46  |
  | 4     | 2,36 m   | 0,42  | 1,56 m   | 0,64  |
  | 5     | 1,20 m   | 0,83  | 1,20 m   | 0,83  |

Cada arquivo tem o som no comeco e silencio no resto. Tocando em laco, o
resultado e um som intermitente com pausas naturais, sem codigo para
controlar o intervalo.

### O botao "Som" e obrigatorio

Navegadores proibem tocar audio antes de a pessoa interagir com a pagina.
Quem chega a experiencia veio de outra pagina, e o clique anterior nao
conta. Por isso o som comeca desligado e o botao e a permissao. A escolha
fica em `sessionStorage`, entao trocar de nivel nao exige reativar; a
preferencia some ao fechar a aba.

### Sons provisorios

Os arquivos atuais foram **sintetizados** por `ferramentas/gerar-sons.py`,
para permitir avaliar volume, espacializacao e ritmo antes de existirem os
sons definitivos. Para trocar por sons reais (Freesound.org, por exemplo,
atento a licenca), basta substituir o `.wav` mantendo o nome. Nenhum
codigo muda.

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
| Celular     | girar aparelho | controle circular no canto da tela | manter a mira no alvo |
| Oculos VR   | mover a cabeca | andar no espaco fisico | raio do controle, ou olhar demorado |

A camera fica a 1,6 m do chao (altura media dos olhos) e a velocidade de
caminhada e de cerca de 1,4 m/s, proxima da caminhada humana. Valores mais
altos causam desconforto em Realidade Virtual.

### Andar no celular

No computador existe teclado, e o A-Frame ja traz o `wasd-controls`. No
celular nao ha teclado nenhum: girar o aparelho olha em volta, mas nao
move ninguem do lugar — e sem andar nao da para explorar o ambiente nem
encontrar os animais escondidos.

O componente `andar-toque` (`controles.js`) desenha um controle circular
no canto de baixo. Arrastar o dedo a partir do centro anda naquela
direcao, como nos jogos de celular. Dois cuidados:

- a direcao e **relativa ao olhar**: empurrar para cima anda para onde a
  pessoa esta olhando, nao para o norte do mundo;
- o deslocamento e **aparado pelos limites do cenario** (declarados em
  `LIMITES`, no fim de `cenarios.js`), com 45 cm de folga, para ninguem
  atravessar parede.

O controle so aparece em aparelhos com tela sensivel ao toque.
