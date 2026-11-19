"""
Builds every app logo/icon asset from the one source logo (assets/brand/logo-source.webp).

    python scripts/brand-assets.py            # writes into assets/images/
    python scripts/brand-assets.py --preview  # writes into ./brand-preview/ instead

Outputs
- logo.png / logo.webp         full badge with the "FivehunCig" wordmark (tagline removed: it is
                               English-only and illegible at in-app sizes); in-app + splash.
- icon.png                     1024 app icon: the artwork only, full-bleed and opaque (stores
                               mask the corners themselves; no text, as Apple/Google advise).
- android-icon-foreground.png  adaptive-icon foreground: artwork inside the 66% safe zone.
- android-icon-background.png  adaptive-icon background: the badge's own gradient.
- android-icon-monochrome.png  themed-icon (Android 13+) silhouette.
- favicon.png                  48 px web favicon.

Requires Pillow (pip install pillow).
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets' / 'brand' / 'logo-source.webp'
OUT = ROOT / ('brand-preview' if '--preview' in sys.argv else 'assets/images')

# Measured on the 1254 px source.
BADGE = (126, 103, 1128, 1133)  # rounded-square badge, transparent outside
ART_BOTTOM = 838  # last row of artwork; the wordmark starts just below
TAGLINE = (986, 1033)  # rows of "Not ready to quit? Start anyway."
TAGLINE_X = (270, 1040)  # its columns (with margin), clear of the badge's anti-aliased edge

# The badge's inside background, sampled from the source (its bright top/right rim is part of the
# badge shape and is left out): a bilinear blend of these four corners, in source coordinates.
GRADIENT = {
    (126, 103): (26, 32, 40),  # top left: dark slate
    (1128, 103): (26, 80, 106),  # top right: deep teal
    (126, 1133): (17, 21, 27),  # bottom left
    (1128, 1133): (16, 36, 47),  # bottom right
}


def lum(p):
    return p[0] + p[1] + p[2]


def without_tagline(src: Image.Image) -> Image.Image:
    """Blend each tagline column between clean background just above and below it.

    The "g" of the wordmark dips into the tagline rows on the right, so in each column the repair
    starts below the wordmark: the full "g" stays, only the tagline goes.
    """
    im = src.copy()
    px = im.load()
    top, bottom = TAGLINE
    for x in range(*TAGLINE_X):
        start = top
        # Wordmark still present at the band's top edge: walk down to the first dark row after it.
        while start < bottom and lum(px[x, start - 1]) > 150:
            start += 1
        if start > top:
            start += 3  # skip the wordmark's soft anti-aliased edge
        above, below = px[x, start - 1], px[x, bottom + 1]
        for y in range(start, bottom + 1):
            t = (y - start + 1) / (bottom - start + 2)
            px[x, y] = tuple(round(a + (b - a) * t) for a, b in zip(above, below))
    return im


def background(size: int, origin=(0, 0), scale=1.0) -> Image.Image:
    """The badge gradient, extended to any canvas. `origin`/`scale` map canvas px to source px."""
    (x0, y0), (x1, y1) = (BADGE[0], BADGE[1]), (BADGE[2], BADGE[3])
    tl, tr, bl, br = GRADIENT[(x0, y0)], GRADIENT[(x1, y0)], GRADIENT[(x0, y1)], GRADIENT[(x1, y1)]
    small = 128  # compute coarse, then upscale: smooth and fast
    bg = Image.new('RGB', (small, small))
    p = bg.load()
    for j in range(small):
        for i in range(small):
            sx = origin[0] + (i + 0.5) / small * size / scale
            sy = origin[1] + (j + 0.5) / small * size / scale
            u = min(1.0, max(0.0, (sx - x0) / (x1 - x0)))
            v = min(1.0, max(0.0, (sy - y0) / (y1 - y0)))
            p[i, j] = tuple(round((tl[k] * (1 - u) + tr[k] * u) * (1 - v) + (bl[k] * (1 - u) + br[k] * u) * v) for k in range(3))
    return bg.resize((size, size), Image.BICUBIC).filter(ImageFilter.GaussianBlur(size / 100))


# Artwork bounds in the source (smoke, cigarette, the "5" path, leaves), clear of the badge rim.
ART_BOX = (180, 150, 1070, ART_BOTTOM)
# The small leaf over the "i" of the wordmark reaches up into the artwork rows: masked out.
WORDMARK_LEAF = (890, 770, 1020, 860)
FEATHER = 46


def art_layer(src: Image.Image) -> Image.Image:
    """The badge's artwork only: a soft-edged box clear of the badge rim, the wordmark and its leaf."""
    mask = Image.new('L', src.size, 0)
    d = ImageDraw.Draw(mask)
    x0, y0, x1, y1 = ART_BOX
    # Inset by the feather so the fade completes inside the box.
    d.rounded_rectangle((x0 + FEATHER, y0 + FEATHER, x1 - FEATHER, y1 - FEATHER), radius=120, fill=255)
    d.rectangle(WORDMARK_LEAF, fill=0)
    mask = mask.filter(ImageFilter.GaussianBlur(FEATHER / 1.6))
    out = src.copy()
    out.putalpha(ImageChops.multiply(src.getchannel('A'), mask))
    return out


def square_art(src: Image.Image, size: int, fill: float) -> Image.Image:
    """Artwork centred on a `size` canvas, its larger side covering `fill` of the canvas, RGBA."""
    art = art_layer(src)
    w, h = ART_BOX[2] - ART_BOX[0], ART_BOX[3] - ART_BOX[1]
    scale = fill * size / max(w, h)
    # Source px that land on canvas (0, 0).
    cx, cy = (ART_BOX[0] + ART_BOX[2]) / 2, (ART_BOX[1] + ART_BOX[3]) / 2
    origin = (cx - size / 2 / scale, cy - size / 2 / scale)
    layer = art.resize((round(art.size[0] * scale), round(art.size[1] * scale)), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(layer, (round(-origin[0] * scale), round(-origin[1] * scale)))
    return canvas, origin, scale


def leaf(size: int, angle: float) -> Image.Image:
    """A leaf (two overlapping circles' lens), pointing up, rotated by `angle` degrees."""
    m = Image.new('L', (size, size), 0)
    a, b = Image.new('L', (size, size), 0), Image.new('L', (size, size), 0)
    r = size * 0.62
    ImageDraw.Draw(a).ellipse((size / 2 - r * 1.55, size / 2 - r, size / 2 + r * 0.45, size / 2 + r), fill=255)
    ImageDraw.Draw(b).ellipse((size / 2 - r * 0.45, size / 2 - r, size / 2 + r * 1.55, size / 2 + r), fill=255)
    m = ImageChops.multiply(a, b)
    return m.rotate(angle, resample=Image.BICUBIC)


def monochrome_mark() -> Image.Image:
    """Bold "5" plus two leaves, white on transparent, drawn at 4x and downsampled for smooth edges."""
    S = 4096  # 4x of 1024
    m = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(m)
    k = S / 1024
    stroke = 92 * k
    # "5": top bar, left stem, open bowl (all inside the central 66% safe zone: 172..852).
    d.rounded_rectangle((300 * k, 300 * k, 600 * k, 300 * k + stroke), radius=stroke / 2, fill=255)
    d.rounded_rectangle((300 * k, 300 * k, 300 * k + stroke, 520 * k), radius=stroke / 2, fill=255)
    d.arc((300 * k, 450 * k, 640 * k, 790 * k), start=205, end=145, fill=255, width=int(stroke))
    for cap_angle in (205, 145):  # round the bowl's two ends
        import math as _m
        cx, cy, rr = 470 * k, 620 * k, 170 * k - stroke / 2
        x, y = cx + rr * _m.cos(_m.radians(cap_angle)), cy + rr * _m.sin(_m.radians(cap_angle))
        d.ellipse((x - stroke / 2, y - stroke / 2, x + stroke / 2, y + stroke / 2), fill=255)
    # Two leaves to the right, like the logo.
    for (cx, cy, size, angle) in ((735, 470, 300, -35), (720, 680, 240, -60)):
        lf = leaf(int(size * k), angle)
        m.paste(255, (int(cx * k - lf.size[0] / 2), int(cy * k - lf.size[1] / 2)), lf)
    # Centre the drawn mark and fit it well inside the 66% safe zone (the circle a launcher shows).
    mark = m.crop(m.getbbox())
    fit = 0.50 * S / max(mark.size)
    mark = mark.resize((round(mark.size[0] * fit), round(mark.size[1] * fit)), Image.LANCZOS)
    m = Image.new('L', (S, S), 0)
    m.paste(mark, ((S - mark.size[0]) // 2, (S - mark.size[1]) // 2))
    m = m.resize((1024, 1024), Image.LANCZOS)
    out = Image.new('RGBA', (1024, 1024), (255, 255, 255, 0))
    out.putalpha(m)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    src = without_tagline(Image.open(SOURCE).convert('RGBA'))

    # In-app / splash logo: the badge with its wordmark, cropped to the badge.
    logo = src.crop(BADGE)
    logo = logo.resize((600, round(600 * logo.size[1] / logo.size[0])), Image.LANCZOS)
    logo.save(OUT / 'logo.png', optimize=True)  # splash screen (native splash needs PNG)
    logo.save(OUT / 'logo.webp', quality=88, method=6)  # in the app: same image, a fraction of the size

    # App icon: artwork on the extended gradient, opaque, full-bleed.
    art, origin, scale = square_art(src, 1024, 0.86)
    icon = background(1024, origin, scale).convert('RGBA')
    icon.alpha_composite(art)
    icon.convert('RGB').save(OUT / 'icon.png', optimize=True)

    # Android adaptive icon: content inside the central 66% safe zone.
    fg, origin_fg, scale_fg = square_art(src, 1024, 0.62)
    fg.save(OUT / 'android-icon-foreground.png', optimize=True)
    background(1024, origin_fg, scale_fg).save(OUT / 'android-icon-background.png', optimize=True)

    # Themed (monochrome) icon, Android 13+: one colour, so the painted artwork cannot be used.
    # A drawn mark echoing the logo instead: a bold "5" and two leaves, inside the safe zone.
    monochrome_mark().save(OUT / 'android-icon-monochrome.png', optimize=True)

    # Favicon.
    icon.convert('RGB').resize((48, 48), Image.LANCZOS).save(OUT / 'favicon.png', optimize=True)

    for f in ['logo.png', 'logo.webp', 'icon.png', 'android-icon-foreground.png', 'android-icon-background.png', 'android-icon-monochrome.png', 'favicon.png']:
        print(f, Image.open(OUT / f).size, f'{(OUT / f).stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
