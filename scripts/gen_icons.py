#!/usr/bin/env python3
"""Genera los iconos PWA de AssetShrink (PNG RGBA) sin dependencias externas.

Diseña un cuadrado redondeado con degradado indigo→violeta y una marca blanca
de "compresión" (flecha hacia una bandeja). Renderiza con supersampling 2x para
suavizar bordes. Reproducible: `python3 scripts/gen_icons.py`.
"""
import math
import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "web")
SIZES = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180}

C1 = (99, 102, 241)   # #6366f1
C2 = (167, 139, 250)  # #a78bfa


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def inside_rounded(x, y, size, radius):
    cx = min(max(x, radius), size - radius)
    cy = min(max(y, radius), size - radius)
    dx, dy = x - cx, y - cy
    return dx * dx + dy * dy <= radius * radius


def arrow_alpha(x, y, size):
    """Marca blanca: flecha descendente + bandeja. x,y en píxeles del render."""
    cx = size / 2
    shaft_hw = size * 0.085
    shaft_top, shaft_bot = size * 0.28, size * 0.50
    head_bot = size * 0.68
    head_hw = size * 0.20
    tray_top, tray_bot = size * 0.76, size * 0.84
    tray_hw = size * 0.24
    # Bandeja (rect con esquinas redondeadas suaves)
    if abs(x - cx) <= tray_hw and tray_top <= y <= tray_bot:
        return 1.0
    # Mango
    if abs(x - cx) <= shaft_hw and shaft_top <= y <= shaft_bot:
        return 1.0
    # Cabeza triangular
    if shaft_bot <= y <= head_bot:
        t = (y - shaft_bot) / (head_bot - shaft_bot)
        if abs(x - cx) <= head_hw * (1 - t):
            return 1.0
    return 0.0


def render(size, ss=2):
    R = size * ss
    radius = R * 0.22
    rows = []
    for j in range(R):
        row = bytearray()
        for i in range(R):
            px, py = i + 0.5, j + 0.5
            if not inside_rounded(px, py, R, radius):
                row += bytes((0, 0, 0, 0))
                continue
            t = (px + py) / (2 * R)
            base = lerp(C1, C2, t)
            a = arrow_alpha(px, py, R)
            col = lerp(base, (255, 255, 255), a) if a else base
            row += bytes((col[0], col[1], col[2], 255))
        rows.append(bytes(row))
    # Downsample ss x ss -> size
    out = bytearray()
    for j in range(size):
        out.append(0)
        for i in range(size):
            r = g = b = a = 0
            for dj in range(ss):
                src = rows[j * ss + dj]
                for di in range(ss):
                    o = (i * ss + di) * 4
                    r += src[o]
                    g += src[o + 1]
                    b += src[o + 2]
                    a += src[o + 3]
            n = ss * ss
            out += bytes((r // n, g // n, b // n, a // n))
    return bytes(out)


def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def write_png(path, size, raw):
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


for name, size in SIZES.items():
    write_png(os.path.join(OUT_DIR, name), size, render(size))
    print("wrote", name)
