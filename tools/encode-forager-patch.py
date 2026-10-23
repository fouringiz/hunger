"""Losslessly replace selected atlas rows, including exact transparent RGB storage.

Pillow is an offline bake dependency; the game and Node test runner do not need it.
"""
import json
import sys
from pathlib import Path
from PIL import Image

original, replacement, destination, selected = sys.argv[1:]
rows = json.loads(selected)
before = Image.open(original).convert("RGBA")
patch = Image.open(replacement).convert("RGBA")
assert before.size == patch.size == (1728, 3072)
out = before.copy()
for row in rows:
    box = (0, row * 192, 1728, (row + 1) * 192)
    out.paste(patch.crop(box), box)
temporary = Path(destination).with_suffix(".pending.webp")
out.save(temporary, "WEBP", lossless=True, exact=True, method=6)
check = Image.open(temporary).convert("RGBA")
for row in range(16):
    box = (0, row * 192, 1728, (row + 1) * 192)
    expected = out if row in rows else before
    assert check.crop(box).tobytes() == expected.crop(box).tobytes(), row
temporary.replace(destination)
print("Exact RGBA preservation verified for all untouched rows.")
