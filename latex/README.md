# Documento do TCC (LaTeX)

Codigo-fonte do Trabalho de Conclusao de Curso. O documento mestre e
[`main.tex`](main.tex); o texto esta dividido por secoes em
[`sections/`](sections); as figuras e tabelas em [`figures/`](figures) e
[`tables/`](tables) sao geradas pelo pipeline de analise em
[`../data/analytics`](../data/analytics).

## Origem deste modelo

A formatacao (preambulo, timbre, capa, folha de rosto e folha de aprovacao)
veio do modelo fornecido pelo orientador, que e um TCC concluido de outro
aluno. **Nenhum texto daquele trabalho foi aproveitado** -- so a estrutura
visual, que e o padrao da instituicao. Todo o conteudo das secoes e proprio.

## Estrutura

```
latex/
├── main.tex          # documento mestre (preambulo, timbre, ordem das secoes)
├── sections/         # uma secao por arquivo
├── figures/          # figuras geradas (make_figures.py)  — versionadas
├── tables/           # tabelas .tex geradas (make_tables.py) — versionadas
├── timbre/           # imagens obrigatorias do papel timbrado da instituicao
└── main.pdf          # PDF final (entregavel) — versionado
```

## Situacao de cada secao

| Arquivo | Paginas | Situacao |
|---|---|---|
| `capa.tex`, `folha-rosto.tex`, `folha-aprovacao.tex` | 3 | prontas (dados vem de `main.tex`) |
| `resumo.tex` | 1 | **escrito**, faltam os dois trechos que dependem da coleta |
| `introducao.tex` | 2 | **escrita**, faltam as citacoes (marcadas com `[CITAR]`) |
| `objetivos.tex` | 1 | **escrita**, revisar a redacao |
| `referencial.tex` | 1 | esqueleto — depende dos artigos da revisao |
| `metodologia.tex` | 7 | **escrita**, inclui o protocolo de busca completo |
| `desenvolvimento.tex` | 11 | **escrita**, numeros reais e medidos |
| `resultados.tex` | 1 | esqueleto — depende da coleta |
| `conclusao.tex` | 1 | esqueleto — estrutura em tres camadas indicada |
| `referencias.tex` | 1 | a preencher — modelos ABNT no arquivo |
| `apendices.tex` | 3 | **escrito**: TCLE e os dois questionarios |

Sao 31 paginas compiladas. Cada arquivo a escrever traz, em comentario, o
que vai dentro dele e como estrutura-lo.

### De onde saiu o que ja esta escrito

A metodologia e o desenvolvimento foram escritos **a partir do codigo**.
Os numeros ali sao reais: as distancias e quantidades saem de `dados.js`,
as medidas de desempenho saem de `ferramentas/teste-sistema.html`, e as
decisoes de projeto estao documentadas nos comentarios dos proprios
arquivos. Nada foi estimado.

O que depende de dado que ainda nao existe esta marcado com
`[COMPLETAR]`; o que depende dos artigos da revisao, com `[CITAR]`.

## Como compilar

Precisa de uma distribuicao LaTeX instalada (TeX Live completo ou MiKTeX).
A partir desta pasta, rodar **duas vezes** (a segunda resolve o sumario):

```bash
pdflatex main.tex
pdflatex main.tex
```

Ou, em uma etapa: `latexmk -pdf main.tex`.

**Sem instalar nada:** subir esta pasta no [Overleaf](https://www.overleaf.com)
(*New Project -> Upload Project*), que compila online e nao exige instalacao.

## Pacotes necessarios

No MiKTeX os ausentes sao instalados no primeiro build. Sao eles:
`extsizes`, `babel` com hifenizacao portuguesa, `inputenc`, `fontenc`,
`helvet`, `graphicx`, `tikz` (bibliotecas `arrows.meta`, `positioning`,
`shapes.geometric`, `calc`, `fit`, `backgrounds`), `eso-pic`, `geometry`,
`setspace`, `indentfirst`, `titlesec`, `caption`, `array`, `booktabs`,
`float` e `hyperref`. Tambem as fontes Type 1 da familia URW Helvetic.

### Duas correcoes feitas no modelo

1. `array` foi acrescentado ao preambulo, para permitir colunas de tabela
   com alinhamento proprio.
2. `folha-rosto.tex` e `folha-aprovacao.tex` receberam `\noindent` antes
   do bloco recuado. Sem ele, o recuo de paragrafo de 1,5 cm somava com o
   `\hspace*{7cm}` e empurrava o bloco 1 cm para fora da margem direita.

## Versionamento

O [`.gitignore`](.gitignore) ignora apenas artefatos de compilacao
(`*.aux`, `*.log`, `*.toc`, `*.out`, ...). Permanecem versionados os `.tex`,
`sections/`, `timbre/`, `figures/`, `tables/` e o `main.pdf` final.
