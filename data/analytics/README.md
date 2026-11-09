# Pipeline de analise

Scripts que transformam os dados coletados durante as sessoes nas figuras e
tabelas usadas no documento do TCC (`../../latex`).

Ainda nao implementado. Entra depois que a coleta de dados estiver de pe.

## Como vai funcionar

```
Supabase (Postgres)
      |
      v
  exportar.py        baixa os dados e ja substitui cada participante
      |              pelo seu codigo (P01, P02, ...)
      v
  dados-anonimos.csv     <- unico arquivo que entra no repositorio
      |
      +--> make_figures.py  -> ../../latex/figures/*.pdf
      +--> make_tables.py   -> ../../latex/tables/*.tex
```

## Por que anonimizar antes de gravar

O e-mail, a data de nascimento e o sexo dos participantes servem para
identificar o cadastro, nao para a analise. Eles ficam no banco e **nao entram
no repositorio**. O que o repositorio guarda e o arquivo ja anonimizado, com
cada pessoa reduzida a um codigo.

Isso resolve duas coisas de uma vez: respeita o que o termo de consentimento
promete aos participantes, e permite que qualquer pessoa recompile o documento
do TCC sem ter acesso a dado identificavel.

## Regra

Nenhum numero do documento e digitado a mao. Todo valor que aparece em figura
ou tabela sai destes scripts, para a analise poder ser refeita do zero.
