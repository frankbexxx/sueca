#!/usr/bin/env python3
"""Generate Suecão card back v1 — cool navy contrast vs teal felt (UX-P3.2)."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 533, 764
OUT = Path(__file__).resolve().parents[1] / "frontend" / "public" / "assets" / "cards2" / "card_back.png"

# Cool night blue — clearly cooler/darker than felt #173C3B
BASE = (14, 28, 62)  # #0E1C3E
BASE_EDGE = (8, 16, 36)
PATTERN = (110, 138, 178)  # brighter steel for small-size read
PATTERN_SOFT = (70, 96, 132)
BRASS = (210, 180, 110)
IVORY = (236, 230, 216)
MEDALLION = (220, 200, 150)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def main() -> None:
    img = Image.new("RGB", (W, H), BASE)
    px = img.load()

    # Subtle vertical value wash (not green).
    for y in range(H):
        t = y / max(1, H - 1)
        row = lerp(BASE_EDGE, BASE, 0.35 + 0.45 * math.sin(t * math.pi))
        for x in range(W):
            edge = min(x, W - 1 - x, y, H - 1 - y) / 40.0
            shade = max(0.0, 1.0 - max(0.0, 1.0 - edge) * 0.18)
            px[x, y] = tuple(int(c * shade) for c in row)

    draw = ImageDraw.Draw(img)
    margin = 28
    inner = 38

    # Outer ivory hairline + brass frame
    draw.rounded_rectangle(
        [margin - 2, margin - 2, W - margin + 1, H - margin + 1],
        radius=18,
        outline=IVORY,
        width=2,
    )
    draw.rounded_rectangle(
        [margin + 4, margin + 4, W - margin - 5, H - margin - 5],
        radius=14,
        outline=BRASS,
        width=3,
    )
    draw.rounded_rectangle(
        [inner, inner, W - inner - 1, H - inner - 1],
        radius=10,
        outline=lerp(BRASS, IVORY, 0.35),
        width=1,
    )

    # Geometric diamond field (coarse — avoid moiré at small sizes)
    field = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fd = ImageDraw.Draw(field)
    step = 28
    cx0, cy0 = W // 2, H // 2
    for y in range(inner + 8, H - inner - 8, step):
        for x in range(inner + 8, W - inner - 8, step):
            ox = step // 2 if ((y - inner) // step) % 2 else 0
            px_ = x + ox
            if px_ < inner + 10 or px_ > W - inner - 10:
                continue
            s = 9
            diamond = [
                (px_, y - s),
                (px_ + s, y),
                (px_, y + s),
                (px_ - s, y),
            ]
            fd.polygon(diamond, outline=(*PATTERN, 110))
            if abs(px_ - cx0) + abs(y - cy0) > 95:
                fd.line([diamond[0], diamond[2]], fill=(*PATTERN_SOFT, 70), width=1)
                fd.line([diamond[1], diamond[3]], fill=(*PATTERN_SOFT, 70), width=1)

    img = Image.alpha_composite(img.convert("RGBA"), field).convert("RGB")
    draw = ImageDraw.Draw(img)

    # Central medallion — proprietary stepped diamond (no text)
    cx, cy = W // 2, H // 2

    def diamond(size: int, outline, width: int = 2, fill=None):
        pts = [(cx, cy - size), (cx + size, cy), (cx, cy + size), (cx - size, cy)]
        draw.polygon(pts, outline=outline, fill=fill, width=width)

    diamond(78, BRASS, 3, fill=(*BASE_EDGE, ))
    # Pillow RGB fill only — redraw cleanly
    diamond(78, BRASS, 3)
    draw.polygon(
        [(cx, cy - 72), (cx + 72, cy), (cx, cy + 72), (cx - 72, cy)],
        fill=BASE_EDGE,
        outline=BRASS,
    )
    diamond(58, MEDALLION, 2)
    diamond(42, IVORY, 2)
    diamond(26, BRASS, 2)
    # Inner solid night blue plate
    draw.polygon(
        [(cx, cy - 18), (cx + 18, cy), (cx, cy + 18), (cx - 18, cy)],
        fill=(14, 26, 48),
        outline=MEDALLION,
    )
    # Tiny proprietary motif — four ticks (not a logo wordmark)
    for ang in (0, 90, 180, 270):
        rad = math.radians(ang)
        x0 = cx + int(math.cos(rad) * 8)
        y0 = cy + int(math.sin(rad) * 8)
        x1 = cx + int(math.cos(rad) * 14)
        y1 = cy + int(math.sin(rad) * 14)
        draw.line([(x0, y0), (x1, y1)], fill=BRASS, width=2)

    # Soft outer contact edge (helps small-size separation on felt)
    edge = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edge)
    ed.rounded_rectangle([0, 0, W - 1, H - 1], radius=22, outline=(0, 0, 0, 90), width=3)
    edge = edge.filter(ImageFilter.GaussianBlur(1.2))
    img = Image.alpha_composite(img.convert("RGBA"), edge).convert("RGB")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"Wrote {OUT} ({W}x{H})")


if __name__ == "__main__":
    main()
