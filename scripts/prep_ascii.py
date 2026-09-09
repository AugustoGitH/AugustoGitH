"""Converte os quadros do banner em montagem de caracteres.

Roda LOCAL e à mão, nunca no CI (spec §1.1): decodificar JPEG e reamostrar é
justamente o terreno onde o Node puro não tem equivalente maduro. A saída é
`data/ascii-frames.json`, commitada — o CI só desenha o que já está lá.

    python3 scripts/prep_ascii.py [colunas] [gama]

O que cada parâmetro decide, e por que estes valores:

  COLUNAS  87 por quadro. Três quadros mais duas calhas dão 265 colunas, que é
           o que cabe em 796px com a fonte de 5px. Abaixo disso o rosto some;
           acima, o glifo fica menor que o traço e a arte vira ruído.

  GAMA     1.6. As fotos têm parede clara e roupa preta, e "claro = glifo
           denso" desenha o FUNDO, deixando o corpo como vazio. A gama abre os
           meios-tons: a parede recua, sobra a silhueta e o asterisco nas mãos.

  RAMPA    ASCII puro. `░▒▓` dependem do bloco U+2591–2593; um glifo ausente
           cai para outra família com avanço diferente e desalinha a linha
           (§0.4). Nesta rampa não existe caractere que uma fonte monoespaçada
           possa não ter.

Claro vira glifo denso porque o terminal é escuro: mais tinta, mais luz.
"""
from PIL import Image, ImageOps
import json
import os
import sys

RAMP = " .:-=+*#%@"
COLS = int(sys.argv[1]) if len(sys.argv) > 1 else 87
GAMMA = float(sys.argv[2]) if len(sys.argv) > 2 else 1.6

# Recorte de histograma antes de mapear: as três fotos são da mesma sessão mas
# não têm o mesmo preto, e sem isto cada quadro assentaria num tom diferente.
CUTOFF = 1

# Largura/altura da célula de caractere. A rampa assume célula em pé; sem isto
# o retrato sai achatado.
CELL_ASPECT = 0.6

SRC = "assets/src"
OUT = "data/ascii-frames.json"


def to_ascii(path):
    im = ImageOps.autocontrast(Image.open(path).convert("L"), cutoff=CUTOFF)
    w, h = im.size
    rows = max(1, round(COLS * CELL_ASPECT * h / w))
    im = im.resize((COLS, rows), Image.Resampling.LANCZOS)
    px = im.load()
    n = len(RAMP) - 1
    return ["".join(RAMP[round((px[x, y] / 255) ** GAMMA * n)] for x in range(COLS))
            for y in range(rows)]


def main():
    frames = {}
    for nome in sorted(os.listdir(SRC)):
        if not nome.endswith(".jpg"):
            continue
        arte = to_ascii(f"{SRC}/{nome}")
        frames[os.path.splitext(nome)[0]] = arte
        print(f"  {nome}  {COLS}x{len(arte)}")

    if not frames:
        raise SystemExit(f"! nenhum .jpg em {SRC}")

    alturas = {len(a) for a in frames.values()}
    if len(alturas) != 1:
        raise SystemExit(f"! quadros com alturas diferentes: {sorted(alturas)}")

    # A ordem de exibição e o texto alternativo de cada quadro são decisão de
    # desenho e vivem em scripts/lib/constants/about.mjs. Aqui só a medida.
    dados = {
        "generated": "scripts/prep_ascii.py",
        "ramp": RAMP,
        "cols": COLS,
        "rows": alturas.pop(),
        "gamma": GAMMA,
        "cutoff": CUTOFF,
        "frames": frames,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"  -> {OUT}  {os.path.getsize(OUT) / 1024:.1f} KB")


main()
