"""Draws purple, past, and saved paw map icons at 1x/2x/3x with coordinated dark outlines.

React Native picks paw.png / paw@2x.png / paw@3x.png by screen density, and MapLibre reads that
scale, so the paw is the same physical size on every phone and stays sharp.
Run: python scripts/make_paw_icons.py
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

LOGICAL = 34            # on-screen size in dp
SUPER = 8               # supersampling factor for smooth edges
OUTLINE = 4.5           # dark outline width, in 100-unit design space
PURPLE = (126, 34, 206, 255)
PAST_PURPLE = (183, 148, 255, 255)
SAVED_GREEN = (45, 170, 92, 255)
DARK_PURPLE = (58, 18, 91, 255)
DARK_GREEN = (18, 82, 43, 255)

# Shapes in a 100x100 design space: (cx, cy, rx, ry, rotation_degrees)
PAD = (50, 67, 25, 19, 0)
TOES = [(22, 45, 9, 12.5, -24), (40, 28, 9.5, 13.5, -8), (60, 28, 9.5, 13.5, 8), (78, 45, 9, 12.5, 24)]


def ellipse_points(cx, cy, rx, ry, rot, grow=0.0, steps=90):
    a = math.radians(rot)
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        x, y = (rx + grow) * math.cos(t), (ry + grow) * math.sin(t)
        pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts


def draw(color, outline_color, px):
    big = px * SUPER
    k = big / 100.0
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    shapes = [PAD] + TOES
    for grow, fill in ((OUTLINE, outline_color), (0.0, color)):
        for cx, cy, rx, ry, rot in shapes:
            d.polygon([(x * k, y * k) for x, y in ellipse_points(cx, cy, rx, ry, rot, grow)], fill=fill)
    return img.resize((px, px), Image.LANCZOS)


out = Path("assets")
out.mkdir(exist_ok=True)
for name, color, outline in (
    ("paw", PURPLE, DARK_PURPLE),
    ("paw-past", PAST_PURPLE, DARK_PURPLE),
    ("paw-saved", SAVED_GREEN, DARK_GREEN),
):
    for scale, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        draw(color, outline, LOGICAL * scale).save(out / f"{name}{suffix}.png")
print("wrote", sorted(p.name for p in out.glob("paw*.png")))
