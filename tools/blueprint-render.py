#!/usr/bin/env python3
"""Render a parts scheme (assets/art/work/parts/schemes/<object>.json) to a blueprint SVG.

Usage: python3 tools/blueprint-render.py platform
Reads the registry for part shapes and sizes, draws the plan view with numbered
instances, the parts legend and the deploy phase strip. The SVG is a derived
file: edit the scheme, not the SVG.
"""
import json, math, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PARTS = ROOT / "assets" / "art" / "work" / "parts"
BG, LINE, DIM, GRID, OR, TEAL, WHITE = "#0F3A66", "#D7E8FA", "#8FA9C8", "#1C4A7A", "#F0A23B", "#5FD6CC", "#F4F8FF"
MONO = "IBM Plex Mono, Menlo, monospace"
S, C = 640, 350  # px per unit, plan centre inside the plan box


def P(u):
    return C + u * S


def octagon(cx, cy, af):
    r = (af / 2) / math.cos(math.radians(22.5))
    return " ".join(f"{cx + r * math.cos(math.radians(22.5 + 45 * k)):.1f},{cy + r * math.sin(math.radians(22.5 + 45 * k)):.1f}" for k in range(8))


def rect_points(cx, cy, w, h, rot):
    a = math.radians(rot)
    pts = []
    for dx, dy in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)):
        pts.append((cx + dx * math.cos(a) - dy * math.sin(a), cy + dx * math.sin(a) + dy * math.cos(a)))
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)


def shape_svg(part, cx, cy, rot, stroke=LINE, width=1.6):
    w, d, _h = part["size"]
    k = f'fill="{BG}" stroke="{stroke}" stroke-width="{width}"'
    s = part["shape"]
    if s == "octagon":
        out = f'<polygon points="{octagon(cx, cy, w * S)}" {k}/>'
        if "hole" in part:
            out += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{part["hole"] / 2 * S:.1f}" fill="none" stroke="{stroke}" stroke-width="0.9" stroke-dasharray="4 4"/>'
        return out
    if s == "rect":
        return f'<polygon points="{rect_points(cx, cy, w * S, d * S, rot)}" {k}/>'
    if s == "diamond":
        return f'<polygon points="{rect_points(cx, cy, w * S, d * S, rot)}" {k}/>'
    if s == "circle":
        out = f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{w / 2 * S:.1f}" fill="{BG}" stroke="{TEAL}" stroke-width="1.8"/>'
        if "socket" in part:
            out += f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{part["socket"] / 2 * S:.1f}" fill="none" stroke="{TEAL}" stroke-width="1.8"/>'
        return out
    raise SystemExit(f"unknown shape {s}")


def tag(n, x, y):
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="11" fill="{OR}"/>'
            f'<text x="{x:.1f}" y="{y + 4.5:.1f}" text-anchor="middle" fill="#1B1B1B" font-family="{MONO}" font-size="13" font-weight="600">{n}</text>')


def main(obj):
    scheme = json.loads((PARTS / "schemes" / f"{obj}.json").read_text())
    registry = json.loads((PARTS / "registry.json").read_text())["parts"]
    order = []
    for inst in scheme["instances"]:
        if inst["part"] not in order:
            order.append(inst["part"])
    number = {pid: i + 1 for i, pid in enumerate(order)}
    W, H = 1400, 1080
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="{MONO}">',
         f'<rect width="{W}" height="{H}" fill="{BG}"/>',
         f'<text x="60" y="64" fill="{WHITE}" font-size="26" font-weight="600" letter-spacing="1">{scheme["title"].upper()} — СХЕМА СБОРКИ</text>',
         f'<text x="60" y="90" fill="{DIM}" font-size="12">schemes/{obj}.json · единица = габарит платформы 1.00 · вид сверху · рендер tools/blueprint-render.py</text>',
         f'<g transform="translate(60,120)">']
    for i in range(0, 701, 25):
        o.append(f'<line x1="{i}" y1="0" x2="{i}" y2="700" stroke="{GRID}"/><line x1="0" y1="{i}" x2="700" y2="{i}" stroke="{GRID}"/>')
    o.append(f'<line x1="{C}" y1="10" x2="{C}" y2="690" stroke="{LINE}" stroke-width="0.9" stroke-dasharray="4 4" stroke-opacity="0.7"/>')
    o.append(f'<line x1="10" y1="{C}" x2="690" y2="{C}" stroke="{LINE}" stroke-width="0.9" stroke-dasharray="4 4" stroke-opacity="0.7"/>')
    # paint order: by height, then deploy phase, then area descending, so later and smaller parts sit on top
    insts = sorted(scheme["instances"], key=lambda i: (i["z"], i["phase"], -registry[i["part"]]["size"][0] * registry[i["part"]]["size"][1]))
    for inst in insts:
        part = registry[inst["part"]]
        o.append(shape_svg(part, P(inst["pos"][0]), P(-inst["pos"][1]), inst["rot"]))
    seen = set()
    for inst in insts:
        if inst["part"] in seen:
            continue
        seen.add(inst["part"])
        part = registry[inst["part"]]
        cx, cy = P(inst["pos"][0]), P(-inst["pos"][1])
        off = 0 if part["shape"] == "circle" else min(part["size"][0], part["size"][1]) * S * 0.25
        o.append(tag(number[inst["part"]], cx + off, cy - off))
    y = 18
    o.append(f'<line x1="{P(-0.5):.1f}" y1="{y}" x2="{P(0.5):.1f}" y2="{y}" stroke="{LINE}"/><line x1="{P(-0.5):.1f}" y1="{y-5}" x2="{P(-0.5):.1f}" y2="{y+5}" stroke="{LINE}"/><line x1="{P(0.5):.1f}" y1="{y-5}" x2="{P(0.5):.1f}" y2="{y+5}" stroke="{LINE}"/>')
    o.append(f'<text x="{C}" y="{y-6}" text-anchor="middle" fill="{LINE}" font-size="12">1.00</text>')
    o.append('</g>')
    # legend
    lx, ly = 820, 130
    o.append(f'<text x="{lx}" y="{ly}" fill="{LINE}" font-size="13" font-weight="600" letter-spacing="1">ДЕТАЛИ</text>')
    counts = {}
    for inst in scheme["instances"]:
        counts[inst["part"]] = counts.get(inst["part"], 0) + 1
    for pid in order:
        part = registry[pid]
        ly += 34
        w, d, h = part["size"]
        o.append(tag(number[pid], lx + 11, ly - 4))
        o.append(f'<text x="{lx + 32}" y="{ly}" fill="{WHITE}" font-size="13">{pid}</text>')
        o.append(f'<text x="{lx + 32}" y="{ly + 16}" fill="{LINE}" font-size="12">{part["name"]} ×{counts[pid]} · {w:.2f} × {d:.2f} × {h:.2f}</text>')
        o.append(f'<text x="{lx + 32}" y="{ly + 32}" fill="{DIM}" font-size="12">стык: {part["mate"]} · {part["source"]}</text>')
        ly += 34
        o.append(f'<line x1="{lx}" y1="{ly + 8}" x2="{W - 60}" y2="{ly + 8}" stroke="{LINE}" stroke-opacity="0.18"/>')
    # phases
    ly += 48
    o.append(f'<text x="{lx}" y="{ly}" fill="{LINE}" font-size="13" font-weight="600" letter-spacing="1">ДЕПЛОЙ ≈ {scheme["deploy_s"]:.2f} s</text>')
    bw = 300
    for ph in scheme["phases"]:
        ly += 26
        t0, t1 = ph["t"]
        o.append(f'<text x="{lx}" y="{ly + 4}" fill="{OR}" font-size="12">{ph["n"]}</text>')
        o.append(f'<text x="{lx + 22}" y="{ly + 4}" fill="{LINE}" font-size="13">{ph["name"]}</text>')
        o.append(f'<rect x="{lx + 190}" y="{ly - 6}" width="{bw}" height="12" fill="{LINE}" fill-opacity="0.12"/>')
        o.append(f'<rect x="{lx + 190 + t0 / scheme["deploy_s"] * bw:.0f}" y="{ly - 6}" width="{(t1 - t0) / scheme["deploy_s"] * bw:.0f}" height="12" fill="{OR}"/>')
        o.append(f'<text x="{lx + 190 + bw + 10}" y="{ly + 4}" fill="{DIM}" font-size="12">{t0:.2f}–{t1:.2f} s</text>')
    ly += 40
    for n in scheme.get("notes", []):
        ly += 18
        o.append(f'<text x="{lx}" y="{ly}" fill="{DIM}" font-size="12">· {n}</text>')
    o.append('</svg>')
    out = PARTS / "blueprints" / f"{obj}.svg"
    out.write_text("\n".join(o))
    print(out.relative_to(ROOT))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "platform")
