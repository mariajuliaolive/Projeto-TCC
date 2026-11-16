"""
TRIAGEM — as decisões tomadas sobre cada trabalho recuperado
------------------------------------------------------------
buscar.py responde "o que as bases devolveram".
Este arquivo responde "o que foi feito com cada um, e por quê".

As decisões estão escritas aqui, uma por linha, e não numa planilha
editada à mão. Assim quem quiser discordar de uma exclusão sabe
exatamente qual foi o motivo — e quem repetir o processo chega ao
mesmo funil.

Como usar (não precisa de internet):

    python3 data/revisao/triar.py

Lê   resultados/candidatos.csv
Gera resultados/triagem.csv       todos os 97, com etapa e motivo
     resultados/selecionados.csv  só os que vão para leitura completa

ATENÇÃO: a triagem foi feita por TÍTULO e RESUMO. A leitura do texto
completo é a etapa seguinte e pode derrubar um selecionado — nesse
caso entra o primeiro da lista de reserva (ver RESERVA, abaixo).
"""

import csv
from pathlib import Path

PASTA = Path(__file__).parent / 'resultados'

# ---------------------------------------------------------------
# MOTIVOS
# I = critério de inclusão que não foi atendido
# E = critério de exclusão que foi atendido
# São os mesmos códigos da tabela de critérios da metodologia.
# ---------------------------------------------------------------
MOTIVOS = {
    'I2': 'não emprega ambiente virtual imersivo',
    'I3': 'não trata de fobia ou medo de animais',
    'I4': 'não relata avaliação com participantes expostos ao estímulo',
    'E1': 'trata de fobia não relacionada a animais',
    'E2': 'apenas proposta ou projeto, sem avaliação relatada',
    'E4': 'relato duplicado de estudo já incluído',
    'E5': 'não é estudo primário (revisão, editorial, capítulo, '
          'protocolo, conjunto de dados, software)',
    'E6': 'o objeto é predizer ou explicar o desfecho de um tratamento, '
          'e não a interação com o ambiente virtual',
    'E7': 'resumo indisponível na base, o que impede a triagem',
}

# ---------------------------------------------------------------
# ETAPA 2 — TÍTULO
# Sai aqui o que o título, sozinho, já mostra que não serve.
# ---------------------------------------------------------------
PELO_TITULO = {
    5: 'E5', 15: 'E5', 16: 'E5', 18: 'E5', 19: 'I3', 25: 'I3', 30: 'I3',
    32: 'I3', 47: 'E5', 49: 'E5', 50: 'E5', 52: 'E1', 60: 'E5', 65: 'E5',
    68: 'E5', 69: 'E5', 70: 'E5', 71: 'I3', 72: 'E1', 73: 'E5', 79: 'E5',
    80: 'I3', 81: 'E1', 83: 'E1', 86: 'I2', 89: 'I3', 90: 'I3', 91: 'E5',
    92: 'E5', 93: 'I3', 94: 'I3', 95: 'I3', 96: 'I3', 97: 'I3',
}

# ---------------------------------------------------------------
# ETAPA 3 — RESUMO
# Sai aqui o que passou pelo título mas, lido o resumo, não atende
# aos critérios.
# ---------------------------------------------------------------
PELO_RESUMO = {
    2: 'I2',    # realidade mista, estudo de caso único
    8: 'E6', 10: 'E6', 11: 'E6', 12: 'E6', 13: 'E6', 17: 'E6', 24: 'E6',
    26: 'E6', 33: 'E6', 34: 'E6', 37: 'E6', 38: 'E6', 39: 'E6', 40: 'E6',
    42: 'E6', 85: 'E6',
    23: 'I3',   # ansiedade infantil, estímulos mistos, três participantes
    28: 'I4',   # análise de conteúdo de aplicativos
    41: 'I2',   # vídeos exibidos em ressonância, não ambiente imersivo
    43: 'E4', 44: 'E4',     # mesmo estudo do nº 45
    46: 'E7', 48: 'E7',
    51: 'E2', 53: 'E2', 57: 'E2', 58: 'E2', 59: 'E2', 64: 'E2', 67: 'E2',
    76: 'E2', 78: 'E2', 82: 'E2', 87: 'E2',
    54: 'I4',   # compara algoritmos; participantes não descritos
    55: 'E1',   # fobias variadas, maioria não ligada a animais
    61: 'I4',   # participantes são terapeutas avaliando ferramenta
    75: 'I2',   # realidade aumentada
}

# ---------------------------------------------------------------
# ETAPA 4 — PRIORIZAÇÃO
#
# Passaram nos critérios 24 trabalhos; a leitura completa foi
# limitada a dez. Para a escolha não ser de gosto, cada elegível
# recebeu um ponto por pergunta respondida "sim" NO RESUMO. Cada
# pergunta corresponde a uma parte do protótipo deste TCC:
#
#   G  o estímulo é apresentado em níveis ou etapas progressivas?
#      (os cinco níveis do protótipo)
#   C  há medida de comportamento — aproximação, esquiva,
#      movimento, olhar?
#      (as métricas automáticas)
#   X  há medida de experiência — presença, imersão, usabilidade,
#      conforto, aceitação?
#      (o questionário final)
#   M  o medo declarado é relacionado ao que se observou no
#      ambiente?
#      (a comparação medo declarado × comportamento)
#
# Vão para leitura os de maior pontuação. No empate, entra o que
# trata de animal presente no protótipo e ainda não coberto.
# ---------------------------------------------------------------
PONTOS = {
    #     G  C  X  M
    62: (1, 1, 0, 1),
    21: (1, 1, 1, 0),
    9:  (1, 1, 0, 0),
    56: (1, 0, 1, 0),
    74: (1, 0, 1, 0),
    35: (0, 1, 0, 1),
    22: (0, 1, 0, 1),
    77: (0, 0, 1, 1),
    63: (0, 1, 0, 1),
    4:  (0, 0, 1, 0),
    20: (0, 0, 1, 0),
    1:  (0, 0, 1, 0),
    88: (0, 0, 1, 0),
    29: (0, 0, 1, 0),
    7:  (0, 1, 0, 0),
    45: (0, 1, 0, 0),
    36: (0, 1, 0, 0),
    6:  (1, 0, 0, 0),
    14: (1, 0, 0, 0),
    3:  (0, 0, 0, 0),
    27: (0, 0, 0, 0),
    31: (0, 0, 0, 0),
    66: (0, 0, 0, 0),
    84: (0, 0, 0, 0),
}

# Os dez que vão para leitura completa: os nove com 2 ou 3 pontos e,
# entre os de 1 ponto, o nº 4 — único trabalho elegível com cobras.
SELECIONADOS = [62, 21, 9, 56, 74, 35, 22, 77, 63, 4]

# Se a leitura completa derrubar um selecionado, ou se o texto não
# estiver disponível (critério E3), entra o próximo desta fila.
RESERVA = [20, 1, 88, 7, 45]

# Excluídos da síntese, mas úteis como contexto no referencial.
CONTEXTO = {
    47: 'revisão sistemática sobre RV e fobias de animais',
    79: 'revisão sistemática sobre realidade estendida e fobias',
    41: 'mostra efeito de número e proximidade dos estímulos',
}


def decidir(n):
    """Devolve (etapa em que a decisão foi tomada, decisão, motivo)."""
    if n in PELO_TITULO:
        return 'titulo', 'excluido', PELO_TITULO[n]
    if n in PELO_RESUMO:
        return 'resumo', 'excluido', PELO_RESUMO[n]
    if n in SELECIONADOS:
        return 'priorizacao', 'selecionado', ''
    if n in RESERVA:
        return 'priorizacao', 'reserva', ''
    return 'priorizacao', 'elegivel', ''


def main():
    with open(PASTA / 'candidatos.csv', encoding='utf-8') as arquivo:
        candidatos = list(csv.DictReader(arquivo))

    linhas = []
    for registro in candidatos:
        n = int(registro['n'])
        etapa, decisao, motivo = decidir(n)
        g, c, x, m = PONTOS.get(n, ('', '', '', ''))
        linhas.append({
            'n': n,
            'ano': registro['ano'],
            'titulo': registro['titulo'],
            'doi': registro['doi'],
            'etapa': etapa,
            'decisao': decisao,
            'motivo': motivo,
            'motivo_texto': MOTIVOS.get(motivo, ''),
            'niveis': g,
            'comportamento': c,
            'experiencia': x,
            'medo_x_resposta': m,
            'pontos': sum(PONTOS[n]) if n in PONTOS else '',
            'contexto': CONTEXTO.get(n, ''),
        })

    # Conferência: todo registro tem de cair em exatamente um lugar.
    todos = {int(r['n']) for r in candidatos}
    elegiveis = todos - set(PELO_TITULO) - set(PELO_RESUMO)
    assert not set(PELO_TITULO) & set(PELO_RESUMO), 'registro em duas etapas'
    assert elegiveis == set(PONTOS), 'elegível sem pontuação (ou o contrário)'
    assert set(SELECIONADOS) | set(RESERVA) <= elegiveis

    with open(PASTA / 'triagem.csv', 'w', encoding='utf-8', newline='') as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=list(linhas[0]))
        escritor.writeheader()
        escritor.writerows(linhas)

    por_numero = {int(r['n']): r for r in candidatos}
    colunas = ['ordem', 'n', 'pontos', 'ano', 'autores', 'titulo', 'veiculo',
               'doi', 'endereco']
    with open(PASTA / 'selecionados.csv', 'w', encoding='utf-8', newline='') as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=colunas)
        escritor.writeheader()
        for ordem, n in enumerate(SELECIONADOS, start=1):
            r = por_numero[n]
            escritor.writerow({
                'ordem': ordem, 'n': n, 'pontos': sum(PONTOS[n]),
                'ano': r['ano'], 'autores': r['autores'],
                'titulo': r['titulo'], 'veiculo': r['veiculo'],
                'doi': r['doi'],
                'endereco': 'https://doi.org/' + r['doi'] if r['doi'] else '',
            })

    print('FUNIL')
    print(f'  candidatos (sem duplicatas) ... {len(todos)}')
    print(f'  excluídos pelo título ......... {len(PELO_TITULO)}')
    print(f'  restaram para o resumo ........ {len(todos) - len(PELO_TITULO)}')
    print(f'  excluídos pelo resumo ......... {len(PELO_RESUMO)}')
    print(f'  elegíveis ..................... {len(elegiveis)}')
    print(f'  selecionados para leitura ..... {len(SELECIONADOS)}')

    print('\nMOTIVOS DE EXCLUSÃO')
    contagem = {}
    for motivo in list(PELO_TITULO.values()) + list(PELO_RESUMO.values()):
        contagem[motivo] = contagem.get(motivo, 0) + 1
    for motivo in sorted(contagem):
        print(f'  {motivo}  {contagem[motivo]:>2}  {MOTIVOS[motivo]}')


if __name__ == '__main__':
    main()
