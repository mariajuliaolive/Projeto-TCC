#!/usr/bin/env python3
"""
Reduz as texturas embutidas num arquivo .glb.

Por que existe: modelos bonitos costumam vir com texturas de
1024x1024 ou 2048x2048 pixels. Uma textura dessas ocupa, na
memoria de video, largura x altura x 4 bytes — uma de 1024
gasta 4 MB, e um modelo com cinco delas gasta 20 MB. Num
celular mais simples isso trava ou recarrega a aba.

No tamanho em que os animais aparecem na tela (dezenas a
poucas centenas de pixels), 512 ja e mais do que suficiente.

Uso:
    python3 ferramentas/reduzir-texturas.py assets/models/cobra.glb 512

Um .glb tem duas partes: um bloco JSON que descreve a cena e
diz onde cada dado comeca, e um bloco binario com os dados.
Trocar uma imagem significa recortar a antiga, colar a nova no
lugar e corrigir os enderecos de tudo que vinha depois.
"""

import io
import json
import os
import struct
import sys

from PIL import Image


def reduzir(caminho, lado_maximo):
    dados = open(caminho, 'rb').read()
    tamanho_antes = len(dados)

    magica, versao, total = struct.unpack('<III', dados[:12])
    if magica != 0x46546C67:
        raise SystemExit(f'{caminho} nao e um arquivo .glb')

    pos, blocos = 12, []
    while pos < total:
        tam, tipo = struct.unpack('<II', dados[pos:pos + 8])
        blocos.append({'tipo': tipo, 'inicio': pos + 8, 'tam': tam})
        pos += 8 + tam

    bloco_json = next(b for b in blocos if b['tipo'] == 0x4E4F534A)
    bloco_bin = next(b for b in blocos if b['tipo'] == 0x004E4942)

    g = json.loads(dados[bloco_json['inicio']:bloco_json['inicio'] + bloco_json['tam']])
    binario = bytearray(dados[bloco_bin['inicio']:bloco_bin['inicio'] + bloco_bin['tam']])

    imagens = [i for i in g.get('images', []) if 'bufferView' in i]
    if not imagens:
        print('  nenhuma textura embutida')
        return

    # de tras para frente: assim os deslocamentos ainda nao corrigidos
    # continuam validos enquanto trabalhamos
    imagens.sort(key=lambda i: g['bufferViews'][i['bufferView']].get('byteOffset', 0),
                 reverse=True)

    for imagem in imagens:
        bv = g['bufferViews'][imagem['bufferView']]
        inicio = bv.get('byteOffset', 0)
        tamanho = bv['byteLength']

        original = bytes(binario[inicio:inicio + tamanho])
        img = Image.open(io.BytesIO(original))
        largura, altura = img.size

        if max(largura, altura) <= lado_maximo:
            print(f'  {largura}x{altura} ja esta pequena, mantida')
            continue

        fator = lado_maximo / max(largura, altura)
        nova = img.convert('RGBA').resize(
            (max(1, int(largura * fator)), max(1, int(altura * fator))),
            Image.LANCZOS)

        saida = io.BytesIO()
        nova.save(saida, format='PNG', optimize=True)
        bytes_novos = saida.getvalue()

        # o formato exige que cada bloco comece num multiplo de 4
        resto = (4 - len(bytes_novos) % 4) % 4
        preenchido = bytes_novos + b'\x00' * resto
        diferenca = len(preenchido) - tamanho

        binario[inicio:inicio + tamanho] = preenchido
        bv['byteLength'] = len(bytes_novos)
        imagem['mimeType'] = 'image/png'

        for outro in g['bufferViews']:
            if outro is not bv and outro.get('byteOffset', 0) > inicio:
                outro['byteOffset'] = outro.get('byteOffset', 0) + diferenca

        print(f'  {largura}x{altura} -> {nova.size[0]}x{nova.size[1]}  '
              f'({tamanho // 1024} KB -> {len(bytes_novos) // 1024} KB)')

    g['buffers'][0]['byteLength'] = len(binario)

    novo_json = json.dumps(g, separators=(',', ':')).encode('utf-8')
    novo_json += b' ' * ((4 - len(novo_json) % 4) % 4)

    corpo = (struct.pack('<II', len(novo_json), 0x4E4F534A) + novo_json +
             struct.pack('<II', len(binario), 0x004E4942) + bytes(binario))
    arquivo = struct.pack('<III', 0x46546C67, 2, 12 + len(corpo)) + corpo

    open(caminho, 'wb').write(arquivo)
    print(f'  arquivo: {tamanho_antes / 1024 / 1024:.2f} MB -> '
          f'{len(arquivo) / 1024 / 1024:.2f} MB')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)

    caminho = sys.argv[1]
    lado = int(sys.argv[2]) if len(sys.argv) > 2 else 512

    print(f'{os.path.basename(caminho)} (maximo {lado} pixels)')
    reduzir(caminho, lado)
