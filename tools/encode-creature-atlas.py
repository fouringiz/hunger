"""Lossless RGBA atlas encoding; offline Pillow dependency only."""
import sys
from PIL import Image
source, destination = sys.argv[1:]
image = Image.open(source).convert('RGBA')
image.save(destination, 'WEBP', lossless=True, exact=True, method=6)
assert Image.open(destination).convert('RGBA').tobytes() == image.tobytes()
