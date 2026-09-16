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

## Resumo geral

Três ambientes, 25 combinações em cada: **75 execuções, nenhuma falha e
nenhum aviso**.

| Ambiente | Janela | Área renderizada | Quadros/s (média) | Falhas | Avisos |
|---|---|---|---|---|---|
| Desktop | 1280 x 900 | 908 x 298 | 53 | 0 | 0 |
| Tablet | 820 x 1180 | 752 x 298 | 57 | 0 | 0 |
| Celular | 390 x 844 | 322 x 298 | 60 | 0 | 0 |

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

| Animal | Tamanho declarado | Tamanho medido | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|---|---|
| Cobra | 0,50 m | 0,500 m | 7,00 | 4,39 | 4,39 | 2,36 | 1,20 |
| Rato | 0,25 m | 0,247–0,250 m | 5,50 | 3,57 | 3,57 | 2,06 | 1,20 |
| Barata | 0,05 m | 0,050 m | 3,00 | 2,19 | 2,19 | 1,56 | 1,20 |
| Aranha | 0,08 m | 0,080–0,082 m | 4,00 | 2,74 | 2,74 | 1,76 | 1,20 |
| Sapo | 0,10 m | 0,100–0,102 m | 4,50 | 3,01 | 3,01 | 1,86 | 1,20 |

Distâncias em metros. O nível 3 repete a distância do nível 2 por
definição: nele muda o movimento, não a proximidade.

---

## Quadros por segundo por combinação (desktop)

| Animal | N1 | N2 | N3 | N4 | N5 |
|---|---|---|---|---|---|
| Cobra | 54 | 52 | 53 | 53 | 52 |
| Rato | 57 | 55 | 58 | 55 | 56 |
| Barata | 56 | 55 | 55 | 55 | 56 |
| Aranha | 52 | 53 | 53 | 52 | 50 |
| Sapo | 48 | 49 | 49 | 47 | 48 |

O sapo é o modelo mais pesado do conjunto (4.920 triângulos) e aparece
consistentemente na faixa mais baixa, cerca de 15% abaixo do rato (776
triângulos). A diferença existe, mas é pequena demais para comprometer o
uso.

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
| Modelos 3D (5 arquivos) | 2,1 MB |
| Sons (6 arquivos) | 1,4 MB |
| Código do projeto | cerca de 90 KB |
| A-Frame (CDN) | cerca de 1,2 MB |

O modelo do rato foi otimizado: sua textura foi reduzida de 2048x2048
para 512x512 pixels, levando o arquivo de 5,03 MB para 0,31 MB, com cerca
de 16 MB a menos de memória de vídeo e sem diferença visível no tamanho em
que o animal aparece.

