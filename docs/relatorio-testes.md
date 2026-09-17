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

> **Atualizado** após a introdução dos cenários por animal e da
> quantidade progressiva de estímulos. Os números abaixo já refletem
> essas mudanças.

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
| Cobra | 0,50 m | 1,9x | 0,950 m | 5,00 | 3,20 | 3,20 | 1,80 | 1,00 |
| Rato | 0,25 m | 2,8x | 0,679–0,700 m | 3,20 | 2,17 | 2,17 | 1,36 | 0,90 |
| Barata | 0,05 m | 4,5x | 0,225–0,235 m | 1,90 | 1,38 | 1,38 | 0,98 | 0,75 |
| Aranha | 0,08 m | 3,6x | 0,288–0,297 m | 2,60 | 1,81 | 1,81 | 1,20 | 0,85 |
| Sapo | 0,10 m | 3,0x | 0,300–0,326 m | 2,60 | 1,81 | 1,81 | 1,20 | 0,85 |

Distâncias em metros. O nível 3 repete a distância do nível 2 por
definição: nele muda o movimento, não a proximidade.

---

## Quadros por segundo por combinação (desktop)

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

