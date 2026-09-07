"""Prepara os quadros do banner. Roda LOCAL e à mão, nunca no CI (spec §1.1).

As fotos são 1024x1024 e entram inteiras — o conteúdo dos três quadros é para
ser preservado, então há reamostragem, não recorte.
"""
from PIL import Image
import sys, os

FONTES = [
 "/mnt/c/Users/augus/OneDrive/Imagens/Poses/pose_01/davinci_reference___image1_4_are_facial_references___image.png",
 "/mnt/c/Users/augus/OneDrive/Imagens/Poses/pose_02/davinci_reference_images___image1__image2__image3__image4_.png",
 "/mnt/c/Users/augus/Downloads/davinci_reference_images___image1__image2__image3__image4_ (1).png",
]
# Os caminhos acima são da máquina onde a montagem foi feita e ficam como
# registro da origem. Passe outros por argumento para refazer com outras fotos.
LADO = int(sys.argv[1]) if len(sys.argv) > 1 else 390   # 1.5x dos 260 exibidos
Q = int(sys.argv[2]) if len(sys.argv) > 2 else 85
SAIDA = "assets/src"

total = 0
for i, src in enumerate(FONTES, 1):
    im = Image.open(src).convert("RGB")
    if im.size != (im.size[0], im.size[0]):
        raise SystemExit(f"! {src} não é quadrada: {im.size}")
    im = im.resize((LADO, LADO), Image.Resampling.LANCZOS)
    dst = f"{SAIDA}/frame-{i:02d}.jpg"
    im.save(dst, "JPEG", quality=Q, optimize=True, progressive=True)
    n = os.path.getsize(dst)
    total += n
    print(f"  frame-{i:02d}.jpg  {LADO}x{LADO}  {n/1024:6.1f} KB")
print(f"  total {total/1024:.1f} KB  -> base64 ~{total*4/3/1024:.0f} KB")
