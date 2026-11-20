"""Prop actors: non-character things that live in the cast list like the dino (cat, mug, phone, germ, atom, sprout).

Each draw function takes (cv, x, y, scale, t, mood_name, st) with the feet/base at (x, y), y down, and reads extra
fields (expr, dir, torso, look, talk) from the actor state st. Same ink + flat-colour + mood grade look as characters.
"""
import math

import skia

from .paint import fill, ink, shade, path_smooth, rrect, ellipse, rad_grad, lin_grad, blurred, INK
from .light import grade_color, MOODS

W = 7.0


def _g(mood_name):
    m = MOODS[mood_name]
    return lambda c: grade_color(c, m)


def _blink(t, seed=0.0):
    return (t * 0.31 + seed) % 1.0 < 0.035


# ----------------------------------------------------------------------------- cat (sits, ~1000 units tall)
def draw_cat(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#e8913a')
    dark = shade(col, -0.25)
    expr = st.get('expr', 'curious')
    lk = st.get('look', (0, 0.4))
    br = math.sin(t * 2 * math.pi / 3.0)
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    # tail curling around
    sw = math.sin(t * 2 * math.pi / 2.2) * 40
    tail = path_smooth([(150, -40), (330, -80), (420, -260 + sw), (380, -420 + sw * 1.5), (350, -380 + sw * 1.4),
                        (370, -250 + sw), (300, -110), (140, -70)])
    cv.drawPath(tail, fill(g(col))); cv.drawPath(tail, ink(W))
    # body
    body = path_smooth([(-260, 0), (-300, -260), (-210, -520), (0, -580), (210, -520), (300, -260), (260, 0)])
    cv.drawPath(body, fill(g(col)))
    cv.save(); cv.clipPath(body, doAntiAlias=True)
    cv.drawPath(ellipse(0, -230, 150, 260), fill(g('#fbecd2')))
    for k in range(4):
        st_p = path_smooth([(-300, -420 + k * 90), (-200, -440 + k * 90), (-190, -410 + k * 90), (-300, -390 + k * 90)])
        cv.drawPath(st_p, fill(g(dark)))
        st_p = path_smooth([(300, -420 + k * 90), (200, -440 + k * 90), (190, -410 + k * 90), (300, -390 + k * 90)])
        cv.drawPath(st_p, fill(g(dark)))
    cv.drawPath(ellipse(-200, -150, 160, 300), fill(g('#3a2a5a'), 0.15))
    cv.restore()
    cv.drawPath(body, ink(W))
    # front paws
    for px in (-110, 110):
        p = ellipse(px, -30, 80, 45)
        cv.drawPath(p, fill(g('#fbecd2'))); cv.drawPath(p, ink(W))
        for k in (-30, 0, 30):
            cv.drawLine(px + k, -5, px + k, -30, ink(4))
    # head
    hy = -700 + br * 4
    cv.save(); cv.translate(0, hy)
    for sx in (-1, 1):                                            # ears
        ear = path_smooth([(sx * 120, -150), (sx * 210, -330), (sx * 260, -120)], tension=0.2)
        cv.drawPath(ear, fill(g(col))); cv.drawPath(ear, ink(W))
        inner = path_smooth([(sx * 145, -150), (sx * 205, -280), (sx * 235, -140)], tension=0.2)
        cv.drawPath(inner, fill(g('#f2a0a8')))
    head = path_smooth([(-270, -20), (-240, -170), (0, -230), (240, -170), (270, -20), (200, 140), (0, 180), (-200, 140)])
    cv.drawPath(head, fill(g(col)))
    cv.save(); cv.clipPath(head, doAntiAlias=True)
    for k in (-60, 0, 60):
        cv.drawPath(path_smooth([(k - 18, -240), (k + 18, -240), (k + 8, -150), (k - 8, -150)]), fill(g(dark)))
    cv.drawPath(ellipse(0, 90, 150, 95), fill(g('#fbecd2')))
    cv.restore()
    cv.drawPath(head, ink(W))
    # eyes
    for sx in (-1, 1):
        ex, ey = sx * 110, -30
        if _blink(t, 0.4):
            cv.drawLine(ex - 55, ey, ex + 55, ey, ink(8)); continue
        eye = ellipse(ex, ey, 62, 70)
        cv.drawPath(eye, fill(g('#c8e86a'))); cv.drawPath(eye, ink(6))
        px, py = ex + lk[0] * 18, ey + lk[1] * 18
        if expr == 'hungry':
            cv.drawPath(ellipse(px, py, 12, 56), fill(INK))
        else:
            cv.drawPath(ellipse(px, py, 40, 50), fill(INK))
            cv.drawCircle(px + 14, py - 20, 12, fill('#ffffff'))
        if expr == 'hungry':                                       # heavy lids = predator
            lid = path_smooth([(ex - 70, ey - 10), (ex, ey - 42 - sx * 6), (ex + 70, ey - 10), (ex + 70, ey - 90), (ex - 70, ey - 90)])
            cv.drawPath(lid, fill(g(col))); cv.drawLine(ex - 66, ey - 12, ex + 66, ey - 34 * sx * 0 - 20, ink(7))
    # nose + mouth
    nose = path_smooth([(-24, 40), (24, 40), (0, 66)], tension=0.2)
    cv.drawPath(nose, fill(g('#e86a80'))); cv.drawPath(nose, ink(4))
    m = skia.Path(); m.moveTo(-60, 92); m.quadTo(-30, 118, 0, 70); m.quadTo(30, 118, 60, 92)
    cv.drawPath(m, ink(5))
    if expr == 'hungry':
        lick = (t * 0.9) % 1.0
        if lick < 0.5:
            tg = path_smooth([(-12, 92), (12, 92), (34, 118 + 30 * math.sin(lick * math.pi)), (-4, 126 + 30 * math.sin(lick * math.pi))])
            cv.drawPath(tg, fill(g('#e8607a'))); cv.drawPath(tg, ink(4))
    for sx in (-1, 1):                                             # whiskers
        for k in (-1, 0, 1):
            cv.drawLine(sx * 110, 60 + k * 18, sx * 290, 40 + k * 40, ink(3.5, 0.8))
    cv.restore()
    cv.restore()


# ----------------------------------------------------------------------------- mug: back half (interior + coffee)
MUG_W, MUG_H, RIM_RY = 300, 520, 70


def draw_mug_back(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#d8483a')
    expr = st.get('expr', 'calm')
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    top = -MUG_H
    rim = ellipse(0, top, MUG_W, RIM_RY)
    cv.drawPath(rim, fill(g(shade(col, -0.35))))
    coffee = ellipse(0, top + 26, MUG_W - 22, RIM_RY - 18)
    cv.drawPath(coffee, fill(g('#b07a4a')))
    cv.save(); cv.clipPath(coffee, doAntiAlias=True)
    cv.drawPath(ellipse(0, top + 30, MUG_W - 60, RIM_RY - 30), fill(g('#e8c89a')))
    heart = path_smooth([(0, top + 52), (-90, top + 20), (-60, top - 4), (0, top + 14), (60, top - 4), (90, top + 20)], tension=0.4)
    cv.drawPath(heart, fill(g('#b07a4a')))
    if expr == 'splash':                                           # ripples
        for k in range(3):
            r = ((t * 1.2 + k / 3) % 1.0)
            cv.drawPath(ellipse(0, top + 26, 40 + r * 240, 10 + r * 40), ink(4, 0.6 * (1 - r)))
    cv.restore()
    cv.drawPath(rim, ink(W))
    if expr == 'splash':
        for k in range(9):
            a = -math.pi * (0.1 + 0.8 * k / 8)
            ph = (t * 1.6 + k * 0.13) % 1.0
            d = 60 + ph * 220
            dx, dy = math.cos(a) * d, top + math.sin(a) * d * 0.9 + ph * ph * 260
            cv.drawPath(ellipse(dx, dy, 18 * (1 - ph * 0.5), 24 * (1 - ph * 0.5)), fill(g('#c8946a')))
            cv.drawPath(ellipse(dx, dy, 18 * (1 - ph * 0.5), 24 * (1 - ph * 0.5)), ink(3.5))
    for k in range(3):                                             # steam
        ph = (t * 0.35 + k / 3) % 1.0
        sx = -110 + k * 110 + math.sin(t * 1.7 + k) * 25
        p = skia.Path(); p.moveTo(sx, top - 40 - ph * 300)
        p.cubicTo(sx + 50, top - 120 - ph * 300, sx - 50, top - 200 - ph * 300, sx + 10, top - 280 - ph * 300)
        pp = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=26, StrokeCap=skia.Paint.kRound_Cap)
        pp.setColor4f(skia.Color4f(1, 1, 1, 0.45 * math.sin(ph * math.pi)))
        blurred(pp, 8); cv.drawPath(p, pp)
    cv.restore()


def draw_mug(cv, x, y, s, t, mood, st):
    """Front half of the mug (body + handle); draw it nearer than the actor that falls in."""
    g = _g(mood)
    col = st.get('torso', '#d8483a')
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    top = -MUG_H
    handle = path_smooth([(MUG_W - 10, top + 120), (MUG_W + 170, top + 110), (MUG_W + 190, top + 330),
                          (MUG_W - 10, top + 400), (MUG_W - 10, top + 330), (MUG_W + 100, top + 290),
                          (MUG_W + 100, top + 180), (MUG_W - 10, top + 190)])
    cv.drawPath(handle, fill(g(shade(col, -0.1)))); cv.drawPath(handle, ink(W))
    body = skia.Path()
    body.moveTo(-MUG_W, top)
    body.arcTo(skia.Rect.MakeLTRB(-MUG_W, top - RIM_RY, MUG_W, top + RIM_RY), 180, -180, False)
    body.lineTo(MUG_W - 20, -40)
    body.quadTo(MUG_W - 30, 0, MUG_W - 90, 0)
    body.lineTo(-MUG_W + 90, 0)
    body.quadTo(-MUG_W + 30, 0, -MUG_W + 20, -40)
    body.close()
    cv.drawPath(body, fill(g(col)))
    cv.save(); cv.clipPath(body, doAntiAlias=True)
    cv.drawRect(skia.Rect.MakeLTRB(-MUG_W, top - 100, -MUG_W + 120, 0), fill(g('#3a2a5a'), 0.18))
    cv.drawRect(skia.Rect.MakeLTRB(MUG_W - 110, top - 100, MUG_W, 0), fill(g('#3a2a5a'), 0.28))
    cv.drawRect(skia.Rect.MakeLTRB(-MUG_W + 160, top + 60, -MUG_W + 200, -60), fill('#ffffff', 0.25))
    hp = path_smooth([(0, top + 330), (-90, top + 230), (-50, top + 190), (0, top + 230), (50, top + 190), (90, top + 230)], tension=0.4)
    cv.drawPath(hp, fill(g('#f4efe6'))); cv.drawPath(hp, ink(5))
    cv.restore()
    cv.drawPath(body, ink(W))
    cv.restore()


# ----------------------------------------------------------------------------- phone (upright, ~1500 tall)
def draw_phone(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    Wd, Hh = 820, 1560
    frame = rrect(-Wd / 2, -Hh, Wd, Hh, 110)
    cv.drawPath(frame, fill(g('#2c2838'))); cv.drawPath(frame, ink(W * 1.4))
    scr = rrect(-Wd / 2 + 34, -Hh + 34, Wd - 68, Hh - 68, 80)
    p = fill('#ffffff'); p.setShader(lin_grad((0, -Hh), (0, 0), ['#6ac8f0', '#7a7ae8', '#e07ac0']))
    cv.drawPath(scr, p)
    cv.save(); cv.clipPath(scr, doAntiAlias=True)
    cols = ['#f2c640', '#5ad08a', '#f2785a', '#ffffff', '#c890f0', '#58b0f0']
    for r in range(3):                                             # app icons (top part)
        for c in range(4):
            ix, iy = -Wd / 2 + 110 + c * 175, -Hh + 230 + r * 190
            ic = rrect(ix - 60, iy - 60, 120, 120, 34)
            cv.drawPath(ic, fill(cols[(r * 4 + c) % len(cols)], 0.9)); cv.drawPath(ic, ink(4, 0.6))
    for k in range(6):                                             # smudges / fingerprints
        cx, cy = -260 + (k * 197) % 520, -1200 + (k * 331) % 1000
        for rr in range(4):
            cv.drawPath(ellipse(cx, cy, 40 + rr * 16, 54 + rr * 18), ink(3, 0.12))
    cv.drawPath(ellipse(-200, -1300, 340, 120), fill('#ffffff', 0.12))
    cv.restore()
    cv.drawPath(rrect(-90, -Hh + 56, 180, 40, 20), fill(INK))
    cv.restore()


# ----------------------------------------------------------------------------- germ (~220 tall blob with cilia)
def draw_germ(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#7ad06a')
    expr = st.get('expr', 'smug')
    seed = (hash(st.get('id', '')) % 97) / 97.0
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    wob = t * 2 * math.pi / 1.4 + seed * 6
    pts = []
    for k in range(14):
        a = k / 14 * 2 * math.pi
        r = 105 + 10 * math.sin(a * 3 + wob) + (14 if k % 2 else 0)
        pts.append((math.cos(a) * r, -115 + math.sin(a) * r * 0.95))
    for k in range(14):                                            # cilia
        a = k / 14 * 2 * math.pi + 0.1
        x0, y0 = math.cos(a) * 112, -115 + math.sin(a) * 108
        x1 = math.cos(a) * 150 + 8 * math.sin(wob + k)
        y1 = -115 + math.sin(a) * 145 + 8 * math.cos(wob + k)
        cv.drawLine(x0, y0, x1, y1, ink(5))
    body = path_smooth(pts)
    cv.drawPath(body, fill(g(col)))
    cv.save(); cv.clipPath(body, doAntiAlias=True)
    cv.drawPath(ellipse(40, -60, 110, 80), fill(g(shade(col, -0.25)), 0.6))
    for k in range(4):
        cv.drawCircle(-50 + k * 35, -170 + (k % 2) * 30, 9, fill(g(shade(col, 0.3))))
    cv.restore()
    cv.drawPath(body, ink(W))
    # face
    ex = 34
    for sx in (-1, 1):
        if _blink(t, seed):
            cv.drawLine(sx * ex - 16, -130, sx * ex + 16, -130, ink(6)); continue
        cv.drawPath(ellipse(sx * ex, -130, 22, 26), fill('#ffffff')); cv.drawPath(ellipse(sx * ex, -130, 22, 26), ink(4.5))
        cv.drawCircle(sx * ex + 5, -126, 11, fill(INK))
        if expr in ('angry', 'smug'):
            ang = 1 if expr == 'angry' else -0.4
            cv.drawLine(sx * ex - 26, -166 - sx * 10 * ang, sx * ex + 26, -166 + sx * 10 * ang, ink(7))
    talk = st.get('talk') and (math.sin(t * 2 * math.pi * 4.2 + seed * 5) > -0.2)
    if talk or expr == 'shocked':
        cv.drawPath(ellipse(0, -78, 22, 18 if talk else 22), fill(g('#7a2a3a'))); cv.drawPath(ellipse(0, -78, 22, 18 if talk else 22), ink(4.5))
    else:
        m = skia.Path()
        if expr == 'angry':
            m.moveTo(-26, -70); m.quadTo(0, -92, 26, -70)
        else:
            m.moveTo(-28, -84); m.quadTo(4, -58, 30, -88)
        cv.drawPath(m, ink(5))
    cv.restore()


# ----------------------------------------------------------------------------- atom (you, atom-sized)
def draw_atom(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y - 200 * s); cv.scale(s, s)
    halo = fill('#ffffff'); halo.setShader(rad_grad((0, 0), 260, [skia.Color4f(1, 0.9, 0.6, 0.55).toColor(), skia.Color4f(1, 0.8, 0.6, 0).toColor()]))
    cv.drawCircle(0, 0, 260, halo)
    orbits = [(0,), (60,), (-60,)]
    for k, (rot,) in enumerate(orbits):
        cv.save(); cv.rotate(rot)
        cv.drawPath(ellipse(0, 0, 210, 70), ink(5, 0.8))
        a = t * (2.2 + k * 0.6) + k * 2
        ex, ey = math.cos(a) * 210, math.sin(a) * 70
        cv.drawCircle(ex, ey, 18, fill(g('#6ad0f8'))); cv.drawCircle(ex, ey, 18, ink(4))
        cv.restore()
    # nucleus = your head
    for k, (nx, ny, c) in enumerate(((-40, -30, '#f26a5a'), (38, -36, '#6a8af0'), (-30, 40, '#6a8af0'), (40, 34, '#f26a5a'))):
        cv.drawCircle(nx, ny, 46, fill(g(c))); cv.drawCircle(nx, ny, 46, ink(5))
    face = ellipse(0, 0, 62, 62)
    cv.drawPath(face, fill(g('#f6f1ea'))); cv.drawPath(face, ink(6))
    expr = st.get('expr', 'shocked')
    for sx in (-1, 1):
        if expr == 'deadpan':
            cv.drawLine(sx * 22 - 10, -8, sx * 22 + 10, -8, ink(5))
        else:
            cv.drawCircle(sx * 22, -8, 8, fill(INK))
    if expr == 'shocked':
        cv.drawPath(ellipse(0, 26, 10, 12), fill(g('#7a2a3a'))); cv.drawPath(ellipse(0, 26, 10, 12), ink(3.5))
    else:
        cv.drawLine(-14, 24, 14, 24, ink(4))
    cv.restore()


# ----------------------------------------------------------------------------- sprout in a pot
def draw_sprout(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    sw = math.sin(t * 2 * math.pi / 2.4) * 6
    stem = skia.Path(); stem.moveTo(0, -180); stem.quadTo(10 + sw, -320, sw * 2, -440)
    cv.drawPath(stem, ink(16)); cv.drawPath(stem, fill(g('#5ab84a')) if False else _st(g('#6ac85a'), 9))
    for sx, yy in ((-1, -380), (1, -430)):
        leaf = path_smooth([(sw * 2, yy), (sx * 70 + sw, yy - 70), (sx * 140 + sw, yy - 40), (sx * 80 + sw, yy + 10)])
        cv.drawPath(leaf, fill(g('#7ad86a'))); cv.drawPath(leaf, ink(5))
    pot = path_smooth([(-130, -200), (130, -200), (100, 0), (-100, 0)], tension=0.05)
    cv.drawPath(pot, fill(g('#d87a4a'))); cv.drawPath(pot, ink(W))
    lip = rrect(-150, -230, 300, 50, 14)
    cv.drawPath(lip, fill(g('#e88e5a'))); cv.drawPath(lip, ink(W))
    cv.restore()


def _st(c, w):
    p = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=w, StrokeCap=skia.Paint.kRound_Cap)
    from .paint import C
    p.setColor4f(C(c))
    return p


DRAW = {'cat': draw_cat, 'mug_back': draw_mug_back, 'mug': draw_mug, 'phone': draw_phone, 'germ': draw_germ,
        'atom': draw_atom, 'sprout': draw_sprout}
SHADOW = {'cat': 330, 'mug_back': 0, 'mug': 300, 'phone': 0, 'germ': 90, 'atom': 0, 'sprout': 130}
