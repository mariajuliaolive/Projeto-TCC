#!/usr/bin/env python3
"""
Gera os arquivos de som PROVISÓRIOS do projeto.

Por que existem: os sons definitivos devem vir de um banco com
licença adequada (Freesound.org, por exemplo). Enquanto eles não
chegam, estes arquivos sintetizados permitem avaliar o sistema de
áudio — volume, espacialização, ritmo — sem depender de download.

É a mesma ideia da caixa provisória que aparece quando o modelo 3D
ainda não existe: primeiro o comportamento, depois o conteúdo.

Para substituir por sons reais, basta trocar o arquivo .wav
mantendo o nome. Nenhum código precisa mudar.

Uso:  python3 ferramentas/gerar-sons.py
"""

import math
import random
import struct
import wave
import os

random.seed(7)   # mesma semente = mesmo resultado toda vez

PASTA = os.path.join(os.path.dirname(__file__), '..', 'assets', 'sounds')


# ---------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------

def salvar(nome, amostras, taxa):
    """Grava uma lista de números entre -1 e 1 como arquivo WAV."""
    caminho = os.path.join(PASTA, nome)
    with wave.open(caminho, 'w') as arquivo:
        arquivo.setnchannels(1)       # mono
        arquivo.setsampwidth(2)       # 16 bits por amostra
        arquivo.setframerate(taxa)
        dados = b''.join(
            struct.pack('<h', int(max(-1.0, min(1.0, v)) * 32767))
            for v in amostras
        )
        arquivo.writeframes(dados)
    print(f'{nome:16} {len(amostras)/taxa:5.1f}s  {os.path.getsize(caminho)//1024:4} KB')


def passa_baixa(amostras, corte, taxa):
    """Suaviza o som, tirando as frequências agudas.
    Filtro de um polo: cada amostra é uma mistura da anterior
    com a atual. Quanto maior o peso da anterior, mais suave."""
    peso = math.exp(-2 * math.pi * corte / taxa)
    saida, anterior = [], 0.0
    for v in amostras:
        anterior = v * (1 - peso) + anterior * peso
        saida.append(anterior)
    return saida


def passa_alta(amostras, corte, taxa):
    """O contrário: tira os graves, deixa os agudos."""
    baixas = passa_baixa(amostras, corte, taxa)
    return [v - b for v, b in zip(amostras, baixas)]


def envelope(amostras, subida, descida, taxa):
    """Faz o som nascer e morrer suavemente, em vez de estalar.
    Um som que começa de repente produz um clique audível."""
    n = len(amostras)
    n_sub = max(1, int(subida * taxa))
    n_des = max(1, int(descida * taxa))
    saida = []
    for i, v in enumerate(amostras):
        if i < n_sub:
            ganho = i / n_sub
        elif i > n - n_des:
            ganho = (n - i) / n_des
        else:
            ganho = 1.0
        saida.append(v * ganho)
    return saida


def silencio(segundos, taxa):
    return [0.0] * int(segundos * taxa)


def ruido(segundos, taxa):
    return [random.uniform(-1, 1) for _ in range(int(segundos * taxa))]


def normalizar(amostras, pico=0.9):
    maior = max(abs(v) for v in amostras) or 1.0
    return [v / maior * pico for v in amostras]


# ---------------------------------------------------------------
# AMBIENTE — o "silêncio" de um quarto fechado
#
# Nenhum ambiente real é mudo. Há sempre um rumor de fundo: ar,
# rua distante, a própria casa. Sem isso a cena soa morta, e a
# ausência de som chama mais atenção que um som discreto.
# ---------------------------------------------------------------

def gerar_ambiente(taxa=11025, duracao=8.0):
    base = ruido(duracao, taxa)
    base = passa_baixa(base, 320, taxa)      # só o rumor grave
    base = passa_baixa(base, 320, taxa)      # duas vezes = mais abafado
    base = normalizar(base, 0.5)

    # um zumbido muito leve, como o de um aparelho ligado longe
    n = len(base)
    saida = []
    for i in range(n):
        t = i / taxa
        zumbido = 0.05 * math.sin(2 * math.pi * 84 * t)
        # variação lenta de intensidade, para não soar mecânico
        respiracao = 0.85 + 0.15 * math.sin(2 * math.pi * 0.08 * t)
        saida.append((base[i] * 0.5 + zumbido) * respiracao)

    # as pontas se encontram na repetição: suaviza para não estalar
    return envelope(saida, 0.6, 0.6, taxa)


# ---------------------------------------------------------------
# SONS DOS ANIMAIS
#
# Cada arquivo tem o som no começo e SILÊNCIO no resto. Como ele
# toca em laço contínuo, o resultado é um som intermitente, com
# pausas naturais — sem precisar de nenhuma linha de código para
# controlar o intervalo.
# ---------------------------------------------------------------

def gerar_cobra(taxa=22050):
    """Chiado: ruído filtrado, como ar escapando."""
    chiado = ruido(1.3, taxa)
    chiado = passa_alta(chiado, 1400, taxa)
    chiado = passa_baixa(chiado, 6500, taxa)
    chiado = envelope(chiado, 0.25, 0.45, taxa)
    chiado = normalizar(chiado, 0.75)
    return silencio(0.4, taxa) + chiado + silencio(4.3, taxa)


def gerar_sapo(taxa=22050):
    """Coaxar: tom grave com tremor rápido de intensidade."""
    def coaxada(duracao):
        saida = []
        for i in range(int(duracao * taxa)):
            t = i / taxa
            # onda quadrada suave dá o timbre áspero
            base = math.sin(2 * math.pi * 165 * t)
            base += 0.5 * math.sin(2 * math.pi * 330 * t)
            base += 0.25 * math.sin(2 * math.pi * 495 * t)
            tremor = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(2 * math.pi * 28 * t))
            saida.append(base * tremor)
        saida = passa_baixa(saida, 1800, taxa)
        return envelope(saida, 0.02, 0.08, taxa)

    uma = normalizar(coaxada(0.42), 0.8)
    return (silencio(0.3, taxa) + uma + silencio(0.25, taxa) +
            uma + silencio(4.2, taxa))


def gerar_rato(taxa=22050):
    """Guincho: apito agudo que sobe de tom."""
    def guincho(duracao, inicio, fim):
        saida, fase = [], 0.0
        n = int(duracao * taxa)
        for i in range(n):
            freq = inicio + (fim - inicio) * (i / n)
            fase += 2 * math.pi * freq / taxa
            saida.append(math.sin(fase) + 0.3 * math.sin(fase * 2))
        return envelope(saida, 0.01, 0.06, taxa)

    a = normalizar(guincho(0.16, 2100, 3400), 0.55)
    b = normalizar(guincho(0.12, 2600, 3900), 0.5)
    return (silencio(0.5, taxa) + a + silencio(0.14, taxa) +
            b + silencio(4.1, taxa))


def gerar_patas(taxa=22050, quantidade=14, agudo=True):
    """Passos miúdos: estalos curtos e secos, em ritmo irregular."""
    saida = list(silencio(0.4, taxa))
    for _ in range(quantidade):
        estalo = ruido(0.018, taxa)
        estalo = passa_alta(estalo, 2600 if agudo else 1600, taxa)
        estalo = envelope(estalo, 0.001, 0.016, taxa)
        estalo = normalizar(estalo, random.uniform(0.35, 0.6))
        saida += estalo
        saida += silencio(random.uniform(0.035, 0.11), taxa)
    saida += silencio(4.0, taxa)
    return saida


# ---------------------------------------------------------------

if __name__ == '__main__':
    os.makedirs(PASTA, exist_ok=True)
    print('Gerando sons provisórios em assets/sounds/\n')

    salvar('ambiente.wav', gerar_ambiente(), 11025)
    salvar('cobra.wav',    gerar_cobra(),    22050)
    salvar('sapo.wav',     gerar_sapo(),     22050)
    salvar('rato.wav',     gerar_rato(),     22050)
    salvar('aranha.wav',   gerar_patas(quantidade=12, agudo=True),  22050)
    salvar('barata.wav',   gerar_patas(quantidade=18, agudo=False), 22050)

    print('\nPara substituir por sons reais, troque o .wav mantendo o nome.')
