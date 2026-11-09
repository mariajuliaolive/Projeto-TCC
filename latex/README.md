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

| Arquivo | Situacao |
|---|---|
| `capa.tex`, `folha-rosto.tex`, `folha-aprovacao.tex` | prontas (dados vem de `main.tex`) |
| `resumo.tex` | rascunho — escrever por ultimo, depois dos resultados |
| `introducao.tex` | a escrever — a estrutura sugerida esta em comentario no arquivo |
| `objetivos.tex` | rascunho pronto, revisar a redacao |
| `referencial.tex` | a escrever — depende dos artigos da revisao |
| `metodologia.tex` | **rascunho completo**, falta o numero de artigos e de participantes |
| `desenvolvimento.tex` | **rascunho completo**, numeros reais, faltam as capturas de tela |
| `resultados.tex` | a escrever — depende da coleta |
| `conclusao.tex` | a escrever — estrutura em tres camadas indicada no arquivo |
| `referencias.tex` | a preencher — modelos ABNT de cada tipo estao no arquivo |
| `apendices.tex` | **rascunho completo**: TCLE e os dois questionarios |

Cada arquivo a escrever traz, em comentario, o que vai dentro dele.

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
`setspace`, `indentfirst`, `titlesec`, `caption`, `booktabs`, `float` e
`hyperref`. Tambem as fontes Type 1 da familia URW Helvetic.

## Versionamento

O [`.gitignore`](.gitignore) ignora apenas artefatos de compilacao
(`*.aux`, `*.log`, `*.toc`, `*.out`, ...). Permanecem versionados os `.tex`,
`sections/`, `timbre/`, `figures/`, `tables/` e o `main.pdf` final.
