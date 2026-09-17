# Relatório de testes técnicos

Resultados da verificação automatizada do protótipo, produzida pela
ferramenta `ferramentas/teste-sistema.html`.

Este documento cobre apenas os **testes técnicos**. A avaliação de
usabilidade, imersão, interação e percepção com participantes é conduzida
separadamente e não faz parte deste relatório.

---

## O que é verificado

Para cada uma das 25 combinações de animal e nível:

| Verificação | Critério |
|---|---|
| Carregamento da cena | o A-Frame reporta a cena pronta em até 25 s |
| Carregamento do modelo | o modelo 3D substitui a caixa provisória |
| Escala aplicada | a maior dimensão corresponde ao tamanho declarado |
| Apoio no chão | a base do modelo fica a menos de 2 cm do piso |
| Campo de visão | o animal cai dentro da área visível da tela |
| Carregamento do som | o arquivo de áudio do animal está disponível |
| Desempenho | quadros por segundo sustentados durante 2,2 s |
| Erros de execução | nenhuma exceção de JavaScript durante a medição |

Uma combinação é marcada como **falha** se o modelo não carrega, se o
animal fica fora do campo de visão ou se ocorre erro de execução; como
**aviso** se o modelo não apoia no chão, se o som não carrega, ou se o
desempenho fica abaixo de 30 quadros por segundo.

### Limitações da verificação

- Erros de console ocorridos **antes** do início da medição não são
  capturados pela ferramenta. O console do navegador deve ser consultado
  em paralelo.
- A cena é renderizada dentro de um quadro nesta página, menor que a tela
  cheia. Em tela cheia o desempenho tende a ser um pouco menor.
- A verificação não avalia aparência, conforto ou adequação do estímulo —
  apenas funcionamento.

---

> **Atenção à ordem.** As duas seções a seguir descrevem a rodada feita
> após a introdução dos cenários por animal. Os números mais recentes,
> já com os animais escondidos e o controle de andar no celular, estão em
> "Verificacao apos os ajustes de exploracao".

## Resumo geral

Três ambientes, 25 combinações em cada: **75 execuções, nenhuma falha e
nenhum aviso**.

| Ambiente | Janela | Área renderizada | Quadros/s (média) | Falhas | Avisos |
|---|---|---|---|---|---|
| Desktop | 1280 x 900 | 904 x 298 | 37 | 0 | 0 |

Medicao anterior, com um unico animal e um unico cenario, dava media 53.
A diferenca e o custo de ate quinze animais e de cenarios mais elaborados.
Nenhuma combinacao falha; dez ficam abaixo de 30 quadros por segundo em
renderizacao por software.

Os três foram executados em **renderização por software** (SwiftShader,
sem aceleração por placa de vídeo). É a condição mais desfavorável
possível: em qualquer aparelho com GPU o desempenho tende a atingir o
limite da tela, normalmente 60 Hz.

As áreas renderizadas diferem entre os ambientes, então os valores de
quadros por segundo **não são diretamente comparáveis entre si**. O que
eles indicam é que, em todos os casos, a cena se manteve acima de 45
quadros por segundo sem aceleração de hardware.

---

## Escala e distância por combinação (desktop)

O tamanho aplicado corresponde ao declarado em `dados.js` em todas as
combinações. As variações de 1 a 2 mm vêm das animações: o modelo muda de
pose durante a medição.

| Animal | Real | Escala | Mostrado | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|---|---|---|
| Cobra | 1,40 m | 1,0x | 1,28–1,55 m | 5,50 | 3,61 | 3,61 | 2,14 | 1,30 |
| Rato | 0,25 m | 1,8x | 0,46 m | 3,20 | 2,17 | 2,17 | 1,36 | 0,90 |
| Barata | 0,05 m | 4,5x | 0,24 m | 1,90 | 1,38 | 1,38 | 0,98 | 0,75 |
| Aranha | 0,08 m | 3,6x | 0,31 m | 2,60 | 1,81 | 1,81 | 1,20 | 0,85 |
| Sapo | 0,10 m | 3,0x | 0,34 m | 2,60 | 1,81 | 1,81 | 1,20 | 0,85 |

A cobra varia mais que os outros porque o clipe dela dura 40 segundos e a
percorre inteira: medida em poses diferentes, ela vai de 1,28 m a 1,55 m.
O valor declarado, 1,40 m, e o do meio.

Distâncias em metros. O nível 3 repete a distância do nível 2 por
definição: nele muda o movimento, não a proximidade.

---

## Quadros por segundo por combinação (desktop)

> **Superado.** Esta medição é anterior aos ajustes de setembro. Os
> números atuais estão em "Verificacao apos os ajustes de exploracao",
> mais abaixo.

Quantidade de animais entre parênteses.

| Animal | Cenário | N1 (1) | N2 (3) | N3 (6) | N4 (10) | N5 (15) |
|---|---|---|---|---|---|---|
| Rato | Sala | 60 | 59 | 54 | 49 | 44 |
| Aranha | Sala | 58 | 48 | 37 | 31 | 24 |
| Barata | Cozinha | 47 | 47 | 44 | 41 | 38 |
| Sapo | Quintal | 34 | 28 | 23 | 18 | 14 |
| Cobra | Floresta | 28 | 26 | 25 | 23 | 20 |

Dois fatores explicam a variação:

- **O peso do modelo.** O sapo tem 4.920 triângulos contra 776 do rato.
  Na sala, quinze ratos sustentam 44 quadros por segundo; no quintal,
  quinze sapos ficam em 14.
- **O peso do cenário.** A floresta é o ambiente com mais peças, e já
  começa em 28 com um único animal, enquanto a sala começa em 60.

**Estes números são de renderização por software**, sem placa de vídeo.
Um aparelho com GPU desenha esta cena com folga; a medição que importa é
a feita no aparelho onde os testes com participantes vão acontecer,
usando `ferramentas/teste-sistema.html`.

Se algum aparelho apresentar desconforto, a quantidade por nível é uma
linha em `dados.js`.

---

## Verificacao apos os ajustes de exploracao

Esta secao substitui os numeros das secoes anteriores. Ela cobre os
ajustes de setembro: andar no celular, animais escondidos, portas de
armario, comportamento por copia, quantidade por animal e correcao da
escala da cobra.

Duas medicoes, na mesma maquina:

- **desempenho** com `ferramentas/teste-sistema.html`, area renderizada
  de 904 x 298, para poder comparar antes e depois pelo mesmo criterio;
- **comportamento** com Playwright sobre o Chromium, janela de 1280 x 800
  em tela inteira.

As duas em renderizacao por software (SwiftShader, sem placa de video) —
a condicao mais desfavoravel possivel.

### As 25 combinacoes

| Verificacao | Resultado |
|---|---|
| Cena carrega e modelo substitui a caixa provisoria | 25 de 25 |
| Animal principal dentro do campo de visao | 25 de 25 |
| Base do modelo apoiada no chao (< 6 cm) | 25 de 25 |
| Toda copia visivel com algum movimento | 25 de 25 |
| Erros de execucao | nenhum |

**Combinacoes com problema: 0 de 25.**

### Quadros por segundo, antes e depois dos ajustes

Mesma maquina, mesma ferramenta (`ferramentas/teste-sistema.html`), mesma
area renderizada (904 x 298), renderizacao por software. "Antes" e o
commit anterior a estes ajustes.

| Animal | Cenario | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|---|
| Cobra antes | Floresta | 16 (1) | 11 (3) | 8 (6) | 6 (10) | 4 (15) |
| **Cobra depois** | Floresta | **21** (1) | **20** (2) | **19** (3) | **18** (5) | **16** (8) |
| Rato antes | Sala | 43 (1) | 35 (3) | 26 (6) | 20 (10) | 15 (15) |
| **Rato depois** | Sala | **46** (1) | **40** (3) | **31** (6) | **30** (10) | **21** (15) |
| Barata antes | Cozinha | 37 (1) | 35 (3) | 34 (6) | 32 (10) | 29 (15) |
| **Barata depois** | Cozinha | 37 (1) | 36 (5) | 34 (10) | 32 (16) | 29 (**24**) |
| Aranha antes | Sala | 44 (1) | 37 (3) | 29 (6) | 24 (10) | 19 (15) |
| **Aranha depois** | Sala | **47** (1) | **41** (3) | **35** (6) | **32** (10) | **25** (15) |
| Sapo antes | Quintal | 26 (1) | 22 (3) | 18 (6) | 14 (10) | 11 (15) |
| **Sapo depois** | Quintal | 26 (1) | **24** (3) | **21** (6) | **19** (10) | **14** (15) |

Quantidade de animais entre parenteses.

| | Antes | Depois |
|---|---|---|
| Media das 25 combinacoes | 24 quadros/s | **29 quadros/s** |
| Combinacoes sem aviso | 8 | **12** |
| Combinacoes com falha | 0 | 0 |

Tres leituras:

- **A cozinha passou de 15 para 24 baratas sem perder nada** (29 quadros
  por segundo nos dois casos, no nivel 5). O que paga por isso e o
  comportamento `quieto`, que dispensa o tocador de animacao, somado ao
  limite de 8 copias animadas.
- **A floresta saiu de 4 para 16 quadros por segundo no nivel 5.** Duas
  causas somadas: as texturas da cobra reduzidas para 512x512 e a
  quantidade de cobras pela metade.
- **A mesma quantidade ficou mais barata.** Com 15 ratos, 15 -> 21
  quadros por segundo; com 15 aranhas, 19 -> 25. Nada mudou no modelo nem
  no cenario: a diferenca e so o comportamento `quieto`.

Este tambem foi o teste que registrou o **erro de escala da cobra**: na
coluna TAMANHO, o modelo aparecia com 13 a 16 metros. Depois do ajuste (`medida: 'maior'`, `tamanhoReal: 1.4`), a
coluna mostra de 1,46 m a 1,51 m — a variacao vem da propria animacao.

### Exploracao e descoberta

| Verificacao | Resultado |
|---|---|
| Portas de armario na cozinha | 5, todas clicaveis |
| Abrir uma porta revela um animal | sim; 9 escondidos -> 8 |
| Abrir as cinco portas | 9 escondidos -> 4; HUD "5 de 9" |
| Sentido de abertura da porta | para dentro da sala (95 graus), sem atravessar a parede |
| Animal sai do esconderijo ao ser revelado | sim, 1,1 s ate a posicao de saida |
| Revelacao por aproximacao (sem porta) | dispara a menos de 1,6 m |
| Animal atras de porta **nao** aparece por aproximacao | correto (distancia 0) |
| Linha "Animais encontrados" no HUD | escondida no nivel 1, visivel do nivel 2 em diante |

### Controle de andar no celular

Emulacao de Pixel 7 (390 x 844, com toque).

| Verificacao | Resultado |
|---|---|
| Controle aparece no celular | sim |
| Controle escondido no computador | sim |
| Arrastar o dedo desloca a camera | 1,4 m/s, na direcao do olhar |
| Soltar o dedo para o deslocamento | imediato |
| Limite da parede da frente (zMin -6,8 + 0,45) | parou em z = -6,35 |
| Limite lateral (x 1,6 - 0,45) | parou em x = -1,15 |
| Limite de tras | parou em z = 1,00 |
| Sobreposicao com a caixa de instrucoes ou com os botoes | ausente |

---

## Outras verificações

| Verificação | Resultado |
|---|---|
| Rolagem horizontal em 390, 820 e 1280 px | ausente nos três |
| Navegação início → seleção → experiência | funcional |
| URL inválida ou sem parâmetros | redireciona para a seleção |
| Animação por nível (25 combinações) | clipe correto em todas |
| Reação ao toque (nível 5) | presente nos cinco animais |
| Reação ao toque (níveis 1 a 4) | corretamente ausente |
| Interface em modo VR | exibida ao entrar, escondida ao sair |
| Áudio: bloqueio de reprodução automática | respeitado; ativado pelo botão |
| Áudio: preferência entre níveis | mantida na mesma aba |
| Espacialização do som | ganho de 0,14 a 0,83 do nível 1 ao 5 (cobra) |

---

## Como reproduzir

1. Rodar o servidor local: `python3 -m http.server 8000`
2. Abrir `ferramentas/teste-sistema.html`
3. Clicar em **Executar testes** e aguardar
4. Clicar em **Gerar relatório** e copiar o texto

Vale executar em cada aparelho que for usado nos testes com participantes:
os números de desempenho descrevem o aparelho, não o sistema.

---

## Peso dos recursos

| Recurso | Tamanho |
|---|---|
| Modelos 3D em uso (5 arquivos) | 5,8 MB |
| Modelos de reserva (cobra1, rato1) | 0,53 MB |
| Sons (6 arquivos) | 1,4 MB |
| Código do projeto | cerca de 110 KB |
| A-Frame (CDN) | cerca de 1,2 MB |

Duas otimizações de textura foram feitas com
`ferramentas/reduzir-texturas.py`:

| Modelo | Textura | Antes | Depois | Memória de vídeo |
|---|---|---|---|---|
| rato (versão antiga) | 2048x2048 -> 512x512 | 5,03 MB | 0,31 MB | −16 MB |
| cobra (versão atual) | 5 x 1024x1024 -> 512x512 | 6,13 MB | 3,82 MB | −15 MB |

Em nenhum dos dois casos há diferença visível no tamanho em que o animal
aparece na cena.

