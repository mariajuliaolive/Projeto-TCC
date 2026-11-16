#!/usr/bin/env python3
# =========================================================
# BUSCA DA REVISAO DE LITERATURA
# ---------------------------------------------------------
# Roda a expressao de busca do TCC em duas bases abertas e
# guarda tudo o que elas devolverem, sem filtrar nada:
#
#   PubMed    base biomedica, forte em Psicologia clinica
#   OpenAlex  indice multidisciplinar aberto, que cobre
#             periodicos e eventos de Computacao
#
# POR QUE UM SCRIPT, E NAO A TELA DAS BASES
#
# Porque busca feita na tela nao deixa rastro. Aqui ficam
# registradas a expressao exata enviada a cada base, a data
# e a hora, e quantos trabalhos cada uma devolveu. Quem
# quiser conferir a revisao roda este arquivo de novo.
#
# Os numeros do funil de selecao do TCC saem do arquivo
# resultados/busca.json que este script escreve. Nenhum e
# digitado a mao.
#
# So usa a biblioteca padrao do Python. Para rodar:
#
#     python3 data/revisao/buscar.py
# =========================================================

import csv
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

PASTA = Path(__file__).resolve().parent / 'resultados'

ANO_INICIAL = 2021
ANO_FINAL = 2026

# ---------------------------------------------------------
# OS QUATRO BLOCOS DA EXPRESSAO
#
# Dentro de cada bloco os termos sao alternativas (OR);
# entre blocos, o trabalho precisa tratar de todos (AND).
#
# O asterisco e truncamento: spider* casa com "spider" e
# com "spiders". Sem ele, a PubMed procuraria a palavra
# exata e deixaria passar os plurais.
# ---------------------------------------------------------
BLOCOS = {
    'tecnologia': ['"virtual reality"', '"immersive environment"', 'WebXR'],
    'condicao': ['phobia*', '"specific phobia"', 'fear', 'anxiety'],
    'estimulo': ['spider*', 'snake*', 'cockroach*', 'insect*', 'animal*',
                 'arachnophobia', 'ophidiophobia', 'entomophobia'],
    'procedimento': ['exposure', '"exposure therapy"', 'desensitization',
                     'habituation'],
}

AGENTE = 'Projeto-TCC-revisao/1.0 (busca academica; biblioteca padrao do Python)'


def baixar(endereco, tentativas=4):
    """Busca um endereco e devolve os bytes. Insiste em caso de falha
    passageira, esperando cada vez mais entre uma tentativa e outra."""
    ultimo_erro = None
    for n in range(tentativas):
        try:
            pedido = urllib.request.Request(endereco, headers={'User-Agent': AGENTE})
            with urllib.request.urlopen(pedido, timeout=60) as resposta:
                return resposta.read()
        except Exception as erro:          # rede instavel, limite de taxa etc.
            ultimo_erro = erro
            time.sleep(2 * (n + 1))
    raise RuntimeError(f'Falha ao buscar {endereco[:120]}: {ultimo_erro}')


# =========================================================
# PUBMED
# =========================================================
def expressao_pubmed():
    """Cada termo e procurado em titulo e resumo ([tiab])."""
    partes = []
    for termos in BLOCOS.values():
        partes.append('(' + ' OR '.join(f'{t}[tiab]' for t in termos) + ')')
    return ' AND '.join(partes)


def texto_de(no):
    """Texto de um no XML, incluindo o que estiver dentro de italico,
    sobrescrito e afins."""
    return ''.join(no.itertext()).strip() if no is not None else ''


def ler_artigo_pubmed(artigo):
    citacao = artigo.find('MedlineCitation')
    dados = citacao.find('Article')

    resumo = []
    for trecho in dados.findall('Abstract/AbstractText'):
        rotulo = trecho.get('Label')
        texto = texto_de(trecho)
        resumo.append(f'{rotulo}: {texto}' if rotulo else texto)

    autores = []
    for autor in dados.findall('AuthorList/Author'):
        sobrenome = texto_de(autor.find('LastName'))
        iniciais = texto_de(autor.find('Initials'))
        if sobrenome:
            autores.append(f'{sobrenome} {iniciais}'.strip())

    ano = texto_de(dados.find('Journal/JournalIssue/PubDate/Year'))
    if not ano:
        data_livre = texto_de(dados.find('Journal/JournalIssue/PubDate/MedlineDate'))
        achado = re.search(r'(19|20)\d\d', data_livre)
        ano = achado.group(0) if achado else ''

    doi = ''
    for ident in artigo.findall('PubmedData/ArticleIdList/ArticleId'):
        if ident.get('IdType') == 'doi':
            doi = texto_de(ident)

    tipos = [texto_de(t) for t in dados.findall('PublicationTypeList/PublicationType')]

    return {
        'base': 'PubMed',
        'id_na_base': texto_de(citacao.find('PMID')),
        'doi': doi,
        'ano': ano,
        'titulo': texto_de(dados.find('ArticleTitle')),
        'autores': '; '.join(autores),
        'veiculo': texto_de(dados.find('Journal/Title')),
        'tipo': '; '.join(tipos),
        'idioma': texto_de(dados.find('Language')),
        'resumo': ' '.join(resumo),
    }


def buscar_pubmed():
    expressao = expressao_pubmed()
    base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/'

    consulta = urllib.parse.urlencode({
        'db': 'pubmed', 'term': expressao, 'retmode': 'json', 'retmax': 2000,
        'datetype': 'pdat', 'mindate': ANO_INICIAL, 'maxdate': ANO_FINAL,
    })
    resposta = json.loads(baixar(base + 'esearch.fcgi?' + consulta))
    resultado = resposta['esearchresult']
    total = int(resultado['count'])
    ids = resultado['idlist']

    registros = []
    for inicio in range(0, len(ids), 100):
        lote = ids[inicio:inicio + 100]
        consulta = urllib.parse.urlencode({
            'db': 'pubmed', 'id': ','.join(lote), 'retmode': 'xml'})
        arvore = ET.fromstring(baixar(base + 'efetch.fcgi?' + consulta))
        for artigo in arvore.findall('PubmedArticle'):
            registros.append(ler_artigo_pubmed(artigo))
        time.sleep(0.5)        # a PubMed pede no maximo 3 pedidos por segundo

    return expressao, total, registros


# =========================================================
# OPENALEX
# =========================================================
def expressao_openalex():
    """A OpenAlex ja reduz as palavras ao radical (spider casa com
    spiders), entao o asterisco sai."""
    partes = []
    for termos in BLOCOS.values():
        limpos = [t.replace('*', '') for t in termos]
        partes.append('(' + ' OR '.join(limpos) + ')')
    return ' AND '.join(partes)


def resumo_openalex(indice):
    """A OpenAlex entrega o resumo como indice invertido: para cada
    palavra, as posicoes em que ela aparece. Aqui o texto e remontado."""
    if not indice:
        return ''
    posicoes = []
    for palavra, onde in indice.items():
        for p in onde:
            posicoes.append((p, palavra))
    return ' '.join(palavra for _, palavra in sorted(posicoes))


def ler_trabalho_openalex(obra):
    local = obra.get('primary_location') or {}
    fonte = local.get('source') or {}
    autores = [(a.get('author') or {}).get('display_name', '')
               for a in obra.get('authorships') or []]

    return {
        'base': 'OpenAlex',
        'id_na_base': (obra.get('id') or '').rsplit('/', 1)[-1],
        'doi': (obra.get('doi') or '').replace('https://doi.org/', ''),
        'ano': str(obra.get('publication_year') or ''),
        'titulo': (obra.get('title') or '').strip(),
        'autores': '; '.join(a for a in autores if a),
        'veiculo': fonte.get('display_name') or '',
        'tipo': obra.get('type') or '',
        'idioma': obra.get('language') or '',
        'resumo': resumo_openalex(obra.get('abstract_inverted_index')),
    }


def buscar_openalex():
    expressao = expressao_openalex()
    filtro = (f'title_and_abstract.search:{expressao},'
              f'publication_year:{ANO_INICIAL}-{ANO_FINAL}')
    campos = ('id,doi,title,publication_year,authorships,primary_location,'
              'type,language,abstract_inverted_index')

    registros = []
    total = None
    cursor = '*'

    while cursor and len(registros) < 3000:
        consulta = urllib.parse.urlencode({
            'filter': filtro, 'per-page': 200, 'cursor': cursor, 'select': campos})
        pagina = json.loads(baixar('https://api.openalex.org/works?' + consulta))

        if total is None:
            total = int(pagina['meta']['count'])

        obras = pagina.get('results') or []
        if not obras:
            break

        registros.extend(ler_trabalho_openalex(o) for o in obras)
        cursor = pagina['meta'].get('next_cursor')
        time.sleep(0.3)

    return expressao, total or 0, registros


# =========================================================
# JUNTAR E TIRAR DUPLICATAS
# =========================================================
def chave_titulo(titulo):
    return re.sub(r'[^a-z0-9]', '', titulo.lower())


def juntar(listas):
    """O mesmo trabalho costuma aparecer nas duas bases. A identidade e
    o DOI; sem DOI, o titulo reduzido a letras e numeros. Quando ha
    duplicata, fica um registro so, com as bases somadas e o resumo
    mais completo dos dois."""
    por_chave = {}
    ordem = []

    for registro in (r for lista in listas for r in lista):
        doi = registro['doi'].lower().strip()
        chaves = [c for c in (('doi:' + doi) if doi else '',
                              'tit:' + chave_titulo(registro['titulo'])) if c[4:]]

        existente = next((por_chave[c] for c in chaves if c in por_chave), None)

        if existente is None:
            novo = dict(registro)
            ordem.append(novo)
            for c in chaves:
                por_chave[c] = novo
            continue

        if registro['base'] not in existente['base']:
            existente['base'] += ' + ' + registro['base']
        for campo in ('doi', 'resumo', 'autores', 'veiculo', 'ano'):
            if len(registro[campo]) > len(existente[campo]):
                existente[campo] = registro[campo]
        for c in chaves:
            por_chave[c] = existente

    return ordem


COLUNAS = ['n', 'base', 'id_na_base', 'doi', 'ano', 'titulo', 'autores',
           'veiculo', 'tipo', 'idioma', 'resumo']


def gravar_csv(nome, registros):
    with open(PASTA / nome, 'w', newline='', encoding='utf-8') as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=COLUNAS)
        escritor.writeheader()
        for n, registro in enumerate(registros, start=1):
            escritor.writerow(dict(registro, n=n))


def main():
    PASTA.mkdir(parents=True, exist_ok=True)

    print('PubMed...')
    exp_pubmed, total_pubmed, reg_pubmed = buscar_pubmed()
    print(f'  {total_pubmed} trabalhos; {len(reg_pubmed)} baixados')

    print('OpenAlex...')
    exp_openalex, total_openalex, reg_openalex = buscar_openalex()
    print(f'  {total_openalex} trabalhos; {len(reg_openalex)} baixados')

    candidatos = juntar([reg_pubmed, reg_openalex])
    somados = len(reg_pubmed) + len(reg_openalex)

    gravar_csv('pubmed.csv', reg_pubmed)
    gravar_csv('openalex.csv', reg_openalex)
    gravar_csv('candidatos.csv', candidatos)

    registro = {
        'executado_em': datetime.now(timezone.utc).isoformat(timespec='seconds'),
        'periodo': f'{ANO_INICIAL}-{ANO_FINAL}',
        'blocos': BLOCOS,
        'bases': {
            'PubMed': {'expressao': exp_pubmed, 'campo': 'titulo e resumo [tiab]',
                       'encontrados': total_pubmed, 'baixados': len(reg_pubmed)},
            'OpenAlex': {'expressao': exp_openalex,
                         'campo': 'titulo e resumo (title_and_abstract.search)',
                         'encontrados': total_openalex,
                         'baixados': len(reg_openalex)},
        },
        'soma_das_bases': somados,
        'duplicatas_removidas': somados - len(candidatos),
        'candidatos_para_triagem': len(candidatos),
    }

    with open(PASTA / 'busca.json', 'w', encoding='utf-8') as arquivo:
        json.dump(registro, arquivo, ensure_ascii=False, indent=2)

    print(f'Soma: {somados} | duplicatas: {somados - len(candidatos)} | '
          f'para triagem: {len(candidatos)}')
    print(f'Arquivos em {PASTA}')


if __name__ == '__main__':
    try:
        main()
    except Exception as erro:
        print('ERRO:', erro, file=sys.stderr)
        sys.exit(1)
