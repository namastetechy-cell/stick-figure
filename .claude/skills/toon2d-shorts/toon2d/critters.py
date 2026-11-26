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


# ----------------------------------------------------------------------------- alarm clock (~420 tall); 'time': "2:00"
def draw_clock(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#d8483a')
    ring = st.get('expr') == 'ring'
    hh, mm = (int(v) for v in str(st.get('time', '3:00')).split(':'))
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    if ring:
        cv.rotate(math.sin(t * 2 * math.pi * 9) * 4)
    for sx in (-1, 1):                                            # legs + bells
        cv.drawLine(sx * 90, -60, sx * 130, 0, ink(16))
        bell = path_smooth([(sx * 60, -330), (sx * 120, -400), (sx * 190, -350), (sx * 150, -300)])
        cv.drawPath(bell, fill(g('#e8c050'))); cv.drawPath(bell, ink(W))
    cv.drawLine(0, -360, 0, -400, ink(10)); cv.drawCircle(0, -404, 16, fill(g('#e8c050'))); cv.drawCircle(0, -404, 16, ink(5))
    body = ellipse(0, -200, 170, 170)
    cv.drawPath(body, fill(g(col))); cv.drawPath(body, ink(W))
    face = ellipse(0, -200, 135, 135)
    cv.drawPath(face, fill(g('#f8f2e2'))); cv.drawPath(face, ink(5))
    for k in range(12):
        a = k / 12 * 2 * math.pi
        r0 = 112 if k % 3 else 100
        cv.drawLine(math.sin(a) * r0, -200 - math.cos(a) * r0, math.sin(a) * 124, -200 - math.cos(a) * 124, ink(6 if k % 3 == 0 else 4))
    ha = (hh % 12 + mm / 60) / 12 * 2 * math.pi
    ma = mm / 60 * 2 * math.pi
    cv.drawLine(0, -200, math.sin(ha) * 62, -200 - math.cos(ha) * 62, ink(13))
    cv.drawLine(0, -200, math.sin(ma) * 98, -200 - math.cos(ma) * 98, ink(8))
    cv.drawCircle(0, -200, 12, fill(INK))
    cv.drawPath(ellipse(-60, -270, 40, 22), fill('#ffffff', 0.35))
    if ring:
        for sx in (-1, 1):
            for k in range(3):
                r = 60 + k * 45
                p = skia.Path(); p.addArc(skia.Rect.MakeLTRB(sx * 250 - r, -420 - r, sx * 250 + r, -420 + r), -60 if sx > 0 else 120, 120)
                cv.drawPath(p, ink(6, 0.8))
    cv.restore()


# ----------------------------------------------------------------------------- ghost (hallucination, floats ~500 tall)
def draw_ghost(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#e8e0ff')
    seed = (hash(st.get('id', '')) % 97) / 97.0
    bob = math.sin(t * 2 * math.pi / 1.8 + seed * 6) * 30
    cv.save(); cv.translate(x, y + bob); cv.scale(s * st.get('dir', 1), s)
    glow = fill('#ffffff'); glow.setShader(rad_grad((0, -260), 330, [skia.Color4f(0.85, 0.7, 1, 0.45).toColor(), skia.Color4f(0.85, 0.7, 1, 0).toColor()]))
    cv.drawCircle(0, -260, 330, glow)
    wv = t * 2 * math.pi / 0.9 + seed * 4
    pts = [(-170, -260), (-150, -440), (0, -520), (150, -440), (170, -260), (160, -40)]
    for k in range(5):
        px = 160 - k * 80
        pts.append((px - 40, 10 + 30 * math.sin(wv + k)))
        pts.append((px - 80, -40 + 20 * math.sin(wv + k + 1)))
    pts.append((-170, -60))
    body = path_smooth(pts)
    p = fill(g(col), 0.88)
    cv.drawPath(body, p); cv.drawPath(body, ink(W))
    for sx in (-1, 1):                                            # arms
        arm = path_smooth([(sx * 150, -300), (sx * 250, -330 + 20 * math.sin(wv)), (sx * 260, -300 + 20 * math.sin(wv)), (sx * 150, -250)])
        cv.drawPath(arm, fill(g(col), 0.88)); cv.drawPath(arm, ink(W * 0.8))
    for sx in (-1, 1):
        cv.drawPath(ellipse(sx * 55, -360, 26, 38), fill(INK))
        cv.drawCircle(sx * 55 - 8, -374, 8, fill('#ffffff'))
    cv.drawPath(ellipse(0, -280, 34, 44), fill(g('#4a2a5a'))); cv.drawPath(ellipse(0, -280, 34, 44), ink(5))
    cv.restore()


# ----------------------------------------------------------------------------- floating Zzz
def draw_zzz(cv, x, y, s, t, mood, st):
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    for k in range(3):
        ph = (t * 0.55 + k / 3) % 1.0
        zx, zy = 40 * ph + 30 * math.sin(ph * 6 + k), -ph * 260
        zs = 0.6 + ph * 0.8
        a = math.sin(ph * math.pi)
        p = skia.Path()
        w = 60 * zs
        p.moveTo(zx - w / 2, zy - w / 2); p.lineTo(zx + w / 2, zy - w / 2); p.lineTo(zx - w / 2, zy + w / 2); p.lineTo(zx + w / 2, zy + w / 2)
        cv.drawPath(p, ink(22 * zs * 0.6 + 6, a))
        q = skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=11 * zs * 0.6 + 2,
                       StrokeCap=skia.Paint.kRound_Cap, StrokeJoin=skia.Paint.kRound_Join)
        q.setColor4f(skia.Color4f(1, 1, 1, a))
        cv.drawPath(p, q)
    cv.restore()


# ----------------------------------------------------------------------------- tear-off calendar: "DAY n" counting up
def draw_calendar(cv, x, y, s, t, mood, st):
    g = _g(mood)
    t0, t1 = st.get('t0', 0.0), st.get('t1', 1.0)
    d0, d1 = st.get('d0', 1), st.get('d1', 11)
    u = max(0.0, min(1.0, (t - t0) / max(0.01, t1 - t0)))
    day = int(round(d0 + (d1 - d0) * u))
    flip = ((d0 + (d1 - d0) * u) % 1.0) if 0 < u < 1 else 0
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    page = rrect(-170, -460, 340, 440, 22)
    cv.drawPath(page, fill(g('#f8f2e2'))); cv.drawPath(page, ink(W))
    head = rrect(-170, -460, 340, 110, 22)
    cv.drawPath(head, fill(g('#c8343c'))); cv.drawPath(head, ink(W))
    for k in (-90, 0, 90):
        cv.drawCircle(k, -460, 14, fill(INK))
    _txt(cv, str(st.get('label', 'DAY')), 0, -380, 62, '#f8f2e2')
    _txt(cv, str(day), 0, -120 - (0 if len(str(day)) < 3 else 30), 190 if len(str(day)) < 3 else 190 * 2.3 / len(str(day)), '#2a2030')
    if flip > 0.55:                                               # page flying off
        a = (flip - 0.55) / 0.45
        cv.save(); cv.translate(120 * a, -300 - 160 * a); cv.rotate(40 * a)
        fp = rrect(-170, -120, 340, 300, 18)
        cv.drawPath(fp, fill(g('#f8f2e2'), 1 - a)); cv.drawPath(fp, ink(W, 1 - a))
        cv.restore()
    cv.restore()


def _txt(cv, s, x, y, size, col):
    font = skia.Font(_typeface(), size)
    w = font.measureText(s)
    cv.drawString(s, x - w / 2, y, font, fill(col))


_TF = []


def _typeface():
    if not _TF:
        import os
        f = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fonts', 'Poppins-ExtraBold.ttf')
        _TF.append(skia.Typeface.MakeFromFile(f))
    return _TF[0]


# ----------------------------------------------------------------------------- lab rat (~240 tall, side view)
def draw_rat(cv, x, y, s, t, mood, st):
    g = _g(mood)
    expr = st.get('expr', 'awake')
    br = math.sin(t * 2 * math.pi / 1.1) * 2
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    if expr == 'ko':
        cv.rotate(180); cv.translate(0, 120)                     # legs up
    tail = path_smooth([(-120, -60), (-230, -40), (-320, -90 + 20 * math.sin(t * 3)), (-330, -84 + 20 * math.sin(t * 3)), (-230, -30), (-120, -48)])
    cv.drawPath(tail, fill(g('#f2a0b0'))); cv.drawPath(tail, ink(4))
    for lx in (-70, 60):
        cv.drawPath(ellipse(lx, -8, 26, 14), fill(g('#f2a0b0'))); cv.drawPath(ellipse(lx, -8, 26, 14), ink(4))
    body = ellipse(0, -90 + br, 150, 88)
    cv.drawPath(body, fill(g('#f4f0ec'))); cv.drawPath(body, ink(W))
    head = path_smooth([(90, -150), (160, -170), (250, -110), (260, -90), (170, -60), (100, -70)])
    cv.drawPath(head, fill(g('#f4f0ec'))); cv.drawPath(head, ink(W))
    cv.drawCircle(262, -98, 13, fill(g('#f27a90'))); cv.drawCircle(262, -98, 13, ink(4))
    ear = ellipse(140, -175, 42, 46)
    cv.drawPath(ear, fill(g('#f2a0b0'))); cv.drawPath(ear, ink(W * 0.8))
    if expr == 'ko':
        for d in (-1, 1):
            cv.drawLine(185 - 12, -128 - 12 * d, 185 + 12, -128 + 12 * d, ink(5))
    elif expr == 'tired':
        cv.drawPath(ellipse(188, -122, 16, 18), fill('#ffffff')); cv.drawPath(ellipse(188, -122, 16, 18), ink(4))
        cv.drawCircle(192, -118, 7, fill(INK))
        cv.drawLine(170, -126, 206, -126, ink(5))
        b = skia.Path(); b.moveTo(174, -98); b.quadTo(188, -90, 202, -98); cv.drawPath(b, stroke_c('#8a6a9a', 3.5))
    else:
        cv.drawPath(ellipse(188, -122, 16, 18), fill('#ffffff')); cv.drawPath(ellipse(188, -122, 16, 18), ink(4))
        cv.drawCircle(192, -120, 8, fill(INK))
    for k in (-1, 0, 1):
        cv.drawLine(240, -96 + k * 6, 300, -110 + k * 16, ink(2.5, 0.8))
    cv.restore()


def stroke_c(c, w):
    from .paint import stroke
    return stroke(c, w)


DRAW.update({'clock': draw_clock, 'ghost': draw_ghost, 'zzz': draw_zzz, 'calendar': draw_calendar, 'rat': draw_rat})
SHADOW.update({'clock': 150, 'ghost': 0, 'zzz': 0, 'calendar': 0, 'rat': 140})


# ----------------------------------------------------------------------------- car (side view, ~260 tall, 620 long)
def draw_car(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#d8483a')
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    body = path_smooth([(-310, -40), (-300, -150), (-160, -170), (-90, -260), (120, -260), (200, -170), (300, -150), (310, -40)], tension=0.25)
    cv.drawPath(body, fill(g(col)))
    cv.save(); cv.clipPath(body, doAntiAlias=True)
    cv.drawRect(skia.Rect.MakeLTRB(-320, -90, 320, -30), fill(g(shade(col, -0.25))))
    cv.restore()
    cv.drawPath(body, ink(W))
    for wx0, wx1 in ((-70, 10), (30, 110)):
        win = path_smooth([(wx0, -170), (wx0 + 15, -240), (wx1 - 10, -240), (wx1 + 20, -170)], tension=0.1)
        cv.drawPath(win, fill(g('#a8d8f0'))); cv.drawPath(win, ink(5))
    if mood in ('night', 'dream'):
        lp = fill('#fff2b0', 0.9); cv.drawPath(ellipse(295, -110, 16, 12), lp)
    cv.drawPath(ellipse(295, -110, 16, 12), ink(4))
    for wx in (-180, 180):
        cv.drawCircle(wx, -40, 62, fill(INK)); cv.drawCircle(wx, -40, 28, fill(g('#b8b8c8')))
    cv.restore()


# ----------------------------------------------------------------------------- falling debris (planks + plaster), loops
def draw_debris(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    for k in range(14):
        ph = (t * 0.9 + k * 0.137) % 1.0
        dx = ((k * 97) % 600) - 300 + math.sin(k) * 40 * ph
        dy = ph * ph * 1400
        cv.save(); cv.translate(dx, dy); cv.rotate(ph * 360 * (1 if k % 2 else -1) + k * 20)
        if k % 3 == 0:
            p = rrect(-60, -12, 120, 24, 4); c = '#a8743e'
        else:
            p = path_smooth([(-22, -18), (20, -24), (28, 10), (-6, 24), (-26, 6)], tension=0.1); c = '#e8dcc8'
        cv.drawPath(p, fill(g(c))); cv.drawPath(p, ink(4))
        cv.restore()
    cv.restore()


# ----------------------------------------------------------------------------- ice block (freeze a head), ~ 460 wide
def draw_ice(cv, x, y, s, t, mood, st):
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    blk = path_smooth([(-230, -40), (-220, -430), (-60, -470), (210, -440), (240, -60), (40, 0)], tension=0.08)
    p = fill('#bfe8ff', 0.55)
    cv.drawPath(blk, p); cv.drawPath(blk, stroke_c('#e8f8ff', 10)); cv.drawPath(blk, ink(5, 0.7))
    for k in range(4):
        cv.drawLine(-170 + k * 40, -400 + k * 20, -120 + k * 40, -300 + k * 20, stroke_c('#ffffff', 8))
    for k in range(7):                                             # icicles
        ix = -200 + k * 65
        ic = path_smooth([(ix - 18, -10), (ix + 18, -10), (ix, 50 + (k % 3) * 30)], tension=0.05)
        cv.drawPath(ic, fill('#d8f4ff', 0.85)); cv.drawPath(ic, ink(3.5, 0.7))
    tw = (t * 1.3) % 1.0
    sp = fill('#ffffff', math.sin(tw * math.pi))
    cv.drawCircle(150, -380, 10 + 8 * tw, sp)
    cv.restore()


# ----------------------------------------------------------------------------- jagged hole in a ceiling / roof
def draw_hole(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    pts = []
    for k in range(18):
        a = k / 18 * 2 * math.pi
        r = 230 + (60 if k % 2 else -20) + 25 * math.sin(k * 2.3)
        pts.append((math.cos(a) * r, math.sin(a) * r * 0.55))
    hole = path_smooth(pts, tension=0.05)
    sky = fill('#ffffff'); sky.setShader(lin_grad((0, -150), (0, 150), ['#7ac0f0', '#cbe8ff']))
    cv.drawPath(hole, sky)
    cv.save(); cv.clipPath(hole, doAntiAlias=True)
    cv.drawPath(ellipse(-60, -40, 120, 50), fill('#ffffff', 0.8))
    cv.restore()
    cv.drawPath(hole, ink(W * 1.2))
    for k in range(5):                                             # broken plank ends
        a = k / 5 * 2 * math.pi + 0.3
        bx, by = math.cos(a) * 250, math.sin(a) * 140
        pl = rrect(-50, -12, 100, 24, 3)
        cv.save(); cv.translate(bx, by); cv.rotate(math.degrees(a) + 20)
        cv.drawPath(pl, fill(g('#a8743e'))); cv.drawPath(pl, ink(4))
        cv.restore()
    cv.restore()


DRAW.update({'car': draw_car, 'debris': draw_debris, 'ice': draw_ice, 'hole': draw_hole})
SHADOW.update({'car': 300, 'debris': 0, 'ice': 0, 'hole': 0})


# ----------------------------------------------------------------------------- brain with a body map (~600 wide)
def draw_brain(cv, x, y, s, t, mood, st):
    """expr 'map': brain + glowing two-armed body map; 'nomap': plus 8 dashed arms with red question marks."""
    g = _g(mood)
    expr = st.get('expr', 'map')
    br = math.sin(t * 2 * math.pi / 1.6) * 0.012
    cv.save(); cv.translate(x, y - 300 * s); cv.scale(s * (1 + br), s * (1 - br))
    glow = fill('#ffffff'); glow.setShader(rad_grad((0, 0), 420, [skia.Color4f(1, 0.85, 0.9, 0.5).toColor(), skia.Color4f(1, 0.8, 0.9, 0).toColor()]))
    cv.drawCircle(0, 0, 420, glow)
    outline = path_smooth([(-300, 40), (-310, -80), (-230, -200), (-90, -250), (60, -255), (200, -210), (300, -100),
                           (310, 40), (240, 150), (80, 190), (-80, 195), (-230, 160)])
    cv.drawPath(outline, fill(g('#f2a6b8')))
    cv.save(); cv.clipPath(outline, doAntiAlias=True)
    for k in range(9):                                             # folds
        fx = -260 + k * 65
        f = skia.Path(); f.moveTo(fx, -230); f.cubicTo(fx + 60, -150, fx - 50, -60, fx + 30, 20)
        f.cubicTo(fx + 80, 80, fx - 20, 140, fx + 20, 200)
        cv.drawPath(f, stroke_c(shade(g('#f2a6b8'), -0.25), 7))
    cv.drawPath(ellipse(-120, 80, 200, 90), fill(g('#3a2a5a'), 0.12))
    cv.drawLine(0, -250, 0, 200, ink(6, 0.6))
    cv.restore()
    cv.drawPath(outline, ink(W * 1.2))
    # body map: a little glowing figure on the brain
    cv.save(); cv.translate(0, -10)
    mapc = '#fff6c8'
    glw = stroke_c(mapc, 26); blurred(glw, 10); glw.setAlphaf(0.6)
    lines = [((0, -110), (0, 10)), ((0, 10), (-40, 100)), ((0, 10), (40, 100)), ((0, -70), (-75, -10)), ((0, -70), (75, -10))]
    for a, b in lines:
        cv.drawLine(*a, *b, glw)
    for a, b in lines:
        cv.drawLine(*a, *b, stroke_c(mapc, 12))
        cv.drawLine(*a, *b, ink(3, 0.5))
    cv.drawCircle(0, -140, 34, fill(mapc)); cv.drawCircle(0, -140, 34, ink(4))
    if expr == 'nomap':
        for k in range(8):
            side = -1 if k % 2 == 0 else 1
            row = k // 2
            ang = math.radians(side * (60 + row * 22))
            x0, y0 = 0, -60 + row * 14
            x1, y1 = x0 + math.sin(ang) * 200, y0 + math.cos(ang) * 200
            p = skia.Path(); p.moveTo(x0, y0); p.lineTo(x1, y1)
            ds = stroke_c('#c83040', 7); ds.setPathEffect(skia.DashPathEffect.Make([16, 14], (t * 40) % 30))
            cv.drawPath(p, ds)
            pop = 1 + 0.15 * math.sin(t * 6 + k)
            _txt(cv, '?', x1, y1 + 22, 64 * pop, '#c83040')
    cv.restore()
    cv.restore()


# ----------------------------------------------------------------------------- robotic extra thumb (~360 tall)
def draw_robothumb(cv, x, y, s, t, mood, st):
    g = _g(mood)
    bend = 14 * math.sin(t * 2.4)
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    base = rrect(-120, -90, 240, 90, 24)
    cv.drawPath(base, fill(g('#5a6478'))); cv.drawPath(base, ink(W))
    cv.drawCircle(80, -45, 14, fill('#5ae0ff')); cv.drawCircle(80, -45, 14, ink(4))
    led = fill('#5ae0ff', 0.4 + 0.4 * math.sin(t * 5)); blurred(led, 10); cv.drawCircle(80, -45, 26, led)
    cv.save(); cv.translate(-20, -90)
    for k, (L, w) in enumerate(((120, 90), (100, 80), (80, 72))):
        cv.rotate(-bend if k else -bend * 0.4)
        seg = rrect(-w / 2, -L, w, L, 22 if k < 2 else 36)
        cv.drawPath(seg, fill(g('#c8d0dc'))); cv.drawPath(seg, ink(W))
        cv.drawLine(-w / 2 + 12, -L + 18, -w / 2 + 12, -18, stroke_c('#ffffff', 6))
        cv.drawCircle(0, 0, 20, fill(g('#7a8498'))); cv.drawCircle(0, 0, 20, ink(4))
        cv.translate(0, -L)
    nail = rrect(-24, 10, 48, 34, 12)
    cv.drawPath(nail, fill(g('#e8eef4'))); cv.drawPath(nail, ink(4))
    cv.restore()
    cv.restore()


# ----------------------------------------------------------------------------- comic impact burst (flashes)
def draw_burst(cv, x, y, s, t, mood, st):
    ph = (t * st.get('rate', 2.6)) % 1.0
    if ph > 0.55:
        return
    k = 0.7 + ph * 0.8
    cv.save(); cv.translate(x, y); cv.scale(s * k, s * k); cv.rotate(ph * 40)
    pts = []
    for i in range(20):
        a = i / 20 * 2 * math.pi
        r = 130 if i % 2 == 0 else 62
        pts.append((math.cos(a) * r, math.sin(a) * r))
    from .paint import path_poly
    p = path_poly(pts)
    cv.drawPath(p, fill('#ffd84a', 1 - ph)); cv.drawPath(p, ink(6, 1 - ph))
    cv.drawPath(path_poly([(q[0] * 0.5, q[1] * 0.5) for q in pts]), fill('#ffffff', 1 - ph))
    cv.restore()


DRAW.update({'brain': draw_brain, 'robothumb': draw_robothumb, 'burst': draw_burst})
SHADOW.update({'brain': 0, 'robothumb': 140, 'burst': 0})


# ----------------------------------------------------------------------------- shared little walking legs
def _legs(cv, t, moving, run=False, y0=0, w=34, L=70):
    ph = t * (2.8 if run else 1.9) * 2 * math.pi
    A = (40 if run else 24) if moving else 0
    for side, k in ((-1, 0), (1, math.pi)):
        a = math.radians(A * math.sin(ph + k))
        hx = side * w
        fx, fy = hx + math.sin(a) * L, y0 + math.cos(a) * L
        cv.drawLine(hx, y0 - 4, fx, fy - 8, ink(10))
        cv.drawPath(path_smooth([(fx - 12, fy - 14), (fx + 26, fy - 14), (fx + 28, fy), (fx - 14, fy)]), fill(INK))


# ----------------------------------------------------------------------------- photon: a walking ball of light (~330 tall)
def draw_photon(cv, x, y, s, t, mood, st):
    moving = st.get('pose') in ('walk', 'run')
    run = st.get('pose') == 'run'
    bob = -abs(math.sin(t * (2.8 if run else 1.9) * math.pi)) * (14 if moving else 4)
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    _legs(cv, t, moving, run, y0=-70)
    cv.translate(0, bob)
    halo = fill('#ffffff'); halo.setShader(rad_grad((0, -200), 260, [skia.Color4f(1, 0.95, 0.6, 0.8).toColor(), skia.Color4f(1, 0.9, 0.5, 0).toColor()]))
    cv.drawCircle(0, -200, 260, halo)
    for k in range(10):                                            # rays
        a = k / 10 * 2 * math.pi + t * 0.8
        cv.drawLine(math.cos(a) * 150, -200 + math.sin(a) * 150, math.cos(a) * 200, -200 + math.sin(a) * 200, stroke_c('#ffe27a', 9))
    body = ellipse(0, -200, 125, 125)
    p = fill('#ffffff'); p.setShader(rad_grad((-30, -240), 170, ['#fffbe0', '#ffd23a']))
    cv.drawPath(body, p); cv.drawPath(body, ink(W))
    expr = st.get('expr', 'happy')
    for sx in (-1, 1):
        if _blink(t, 0.3):
            cv.drawLine(sx * 40 - 14, -215, sx * 40 + 14, -215, ink(6)); continue
        cv.drawPath(ellipse(sx * 40, -215, 14, 19), fill(INK)); cv.drawCircle(sx * 40 - 4, -222, 5, fill('#ffffff'))
    m = skia.Path()
    if expr == 'tired':
        m.moveTo(-24, -160); m.quadTo(0, -170, 24, -160)
        for sx in (-1, 1):
            cv.drawLine(sx * 40 - 18, -230, sx * 40 + 18, -230, ink(6))
    else:
        m.moveTo(-30, -168); m.quadTo(0, -140, 30, -168)
    cv.drawPath(m, ink(6))
    cv.drawCircle(-70, -185, 16, fill('#f29a6a', 0.6)); cv.drawCircle(70, -185, 16, fill('#f29a6a', 0.6))
    if st.get('hold_smile'):                                       # carries a smile (friend's) on a little sign
        cv.drawLine(110, -210, 160, -300, ink(8))
        sm = skia.Path(); sm.moveTo(130, -330); sm.quadTo(175, -280, 220, -330)
        cv.drawPath(sm, ink(10))
    cv.restore()


# ----------------------------------------------------------------------------- the Sun with a face (~radius 260)
def draw_sun(cv, x, y, s, t, mood, st):
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    halo = fill('#ffffff'); halo.setShader(rad_grad((0, 0), 520, [skia.Color4f(1, 0.85, 0.4, 0.75).toColor(), skia.Color4f(1, 0.7, 0.3, 0).toColor()]))
    cv.drawCircle(0, 0, 520, halo)
    for k in range(16):
        a = k / 16 * 2 * math.pi + t * 0.25
        r0, r1 = 290, 370 + 25 * math.sin(t * 3 + k)
        tri = path_smooth([(math.cos(a - 0.08) * r0, math.sin(a - 0.08) * r0), (math.cos(a) * r1, math.sin(a) * r1),
                           (math.cos(a + 0.08) * r0, math.sin(a + 0.08) * r0)], tension=0.05)
        cv.drawPath(tri, fill('#ffc83a')); cv.drawPath(tri, ink(5))
    body = ellipse(0, 0, 260, 260)
    p = fill('#ffffff'); p.setShader(rad_grad((-70, -80), 340, ['#fff2a0', '#ffb02a']))
    cv.drawPath(body, p); cv.drawPath(body, ink(W * 1.2))
    expr = st.get('expr', 'happy')
    for sx in (-1, 1):
        ex, ey = sx * 85, -40
        if expr == 'old':
            cv.drawLine(ex - 30, ey, ex + 30, ey, ink(8))
            b = skia.Path(); b.moveTo(ex - 36, ey - 34); b.quadTo(ex, ey - 54, ex + 36, ey - 34); cv.drawPath(b, stroke_c('#ffffff', 12))
        else:
            cv.drawPath(ellipse(ex, ey, 22, 30), fill(INK)); cv.drawCircle(ex - 6, ey - 10, 8, fill('#ffffff'))
    if expr == 'old':                                              # white beard + wrinkles = very old light
        beard = path_smooth([(-150, 60), (0, 110), (150, 60), (110, 230), (0, 300), (-110, 230)])
        cv.drawPath(beard, fill('#f6f2ea')); cv.drawPath(beard, ink(6))
        for k in range(3):
            w = skia.Path(); w.moveTo(-60, -150 + k * 22); w.quadTo(0, -162 + k * 22, 60, -150 + k * 22); cv.drawPath(w, ink(4, 0.6))
    m = skia.Path(); m.moveTo(-70, 60); m.quadTo(0, 120, 70, 60); cv.drawPath(m, ink(8))
    cv.drawCircle(-150, 30, 30, fill('#f2785a', 0.5)); cv.drawCircle(150, 30, 30, fill('#f2785a', 0.5))
    cv.restore()


# ----------------------------------------------------------------------------- full-length standing mirror (~1000 tall)
def draw_mirror(cv, x, y, s, t, mood, st):
    """Draw it BEHIND the reflection actor (larger z); 'mirror_frame' draws the frame + sheen in front."""
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    for sx in (-1, 1):
        cv.drawLine(sx * 150, -40, sx * 210, 0, ink(16))
    glass = ellipse(0, -520, 230, 470)
    p = fill('#ffffff'); p.setShader(lin_grad((-230, -990), (230, -50), [g('#cfe6f2'), g('#9ec4dc')]))
    cv.drawPath(glass, p)
    cv.restore()


def draw_mirror_frame(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    glass = ellipse(0, -520, 230, 470)
    cv.save(); cv.clipPath(glass, doAntiAlias=True)
    for k in range(2):
        sh = skia.Path(); sh.moveTo(-200 + k * 90, -800); sh.lineTo(-120 + k * 90, -800); sh.lineTo(40 + k * 90, -200); sh.lineTo(-40 + k * 90, -200)
        cv.drawPath(sh, fill('#ffffff', 0.18))
    cv.restore()
    ring = skia.Path(); ring.addOval(skia.Rect.MakeLTRB(-262, -1022, 262, -18)); ring.addOval(skia.Rect.MakeLTRB(-230, -990, 230, -50))
    ring.setFillType(skia.PathFillType.kEvenOdd)
    cv.drawPath(ring, fill(g('#b8823e'))); cv.drawPath(ring, ink(W))
    cv.restore()


# ----------------------------------------------------------------------------- pyramid (~500 tall, 900 wide)
def draw_pyramid(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#e8c07a')
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    left = path_smooth([(-450, 0), (0, -520), (60, 0)], tension=0.0)
    right = path_smooth([(60, 0), (0, -520), (450, 0)], tension=0.0)
    cv.drawPath(left, fill(g(col))); cv.drawPath(right, fill(g(shade(col, -0.3))))
    for k in range(1, 9):                                          # stone courses
        yy = -k * 58
        hw = 450 * (1 - k * 58 / 520)
        cv.drawLine(-hw, yy, hw, yy, ink(3, 0.45))
    cv.drawPath(path_smooth([(-450, 0), (0, -520), (450, 0)], tension=0.0), ink(W))
    cv.drawLine(0, -520, 60, 0, ink(4, 0.6))
    cv.restore()


# ----------------------------------------------------------------------------- a walking SUBSCRIBE button (~420 wide)
def draw_subbutton(cv, x, y, s, t, mood, st):
    moving = st.get('pose') in ('walk', 'run')
    bob = -abs(math.sin(t * 1.9 * math.pi)) * (12 if moving else 0)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    _legs(cv, t, moving, False, y0=-70, w=70)
    cv.translate(0, bob)
    glow = fill('#ffffff'); glow.setShader(rad_grad((0, -170), 330, [skia.Color4f(1, 0.4, 0.4, 0.55).toColor(), skia.Color4f(1, 0.4, 0.4, 0).toColor()]))
    cv.drawCircle(0, -170, 330, glow)
    btn = rrect(-210, -250, 420, 170, 60)
    cv.drawPath(rrect(-202, -238, 420, 170, 60), fill(INK))
    p = fill('#ffffff'); p.setShader(lin_grad((0, -250), (0, -80), ['#ff5a4a', '#d8202a']))
    cv.drawPath(btn, p); cv.drawPath(btn, ink(W))
    _txt(cv, 'SUBSCRIBE', 0, -145, 58, '#ffffff')
    for sx in (-1, 1):                                             # tiny face on top edge
        cv.drawCircle(sx * 40, -205, 8, fill('#ffffff'))
    cv.restore()


DRAW.update({'photon': draw_photon, 'sun': draw_sun, 'mirror': draw_mirror, 'mirror_frame': draw_mirror_frame,
             'pyramid': draw_pyramid, 'subbutton': draw_subbutton})
SHADOW.update({'photon': 110, 'sun': 0, 'mirror': 220, 'mirror_frame': 0, 'pyramid': 0, 'subbutton': 150})


# ----------------------------------------------------------------------------- bed: back (headboard + mattress) and front (blanket)
def draw_bed_back(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    hb = path_smooth([(-330, -230), (-330, -560), (-180, -620), (180, -620), (330, -560), (330, -230)], tension=0.15)
    cv.drawPath(hb, fill(g('#8a5a3a'))); cv.drawPath(hb, ink(W))
    for k in (-160, 0, 160):
        cv.drawPath(rrect(k - 50, -560, 100, 280, 30), fill(g('#6a422a'))); cv.drawPath(rrect(k - 50, -560, 100, 280, 30), ink(4, 0.6))
    pil = path_smooth([(-260, -330), (-250, -420), (-40, -430), (-30, -330)], tension=0.3)
    cv.drawPath(pil, fill(g('#f4f0f6'))); cv.drawPath(pil, ink(5))
    mat = rrect(-330, -300, 660, 120, 30)
    cv.drawPath(mat, fill(g('#e8e4ee'))); cv.drawPath(mat, ink(W))
    cv.restore()


def draw_bed_front(cv, x, y, s, t, mood, st):
    g = _g(mood)
    col = st.get('torso', '#5a7ac8')
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    for sx in (-1, 1):
        cv.drawPath(rrect(sx * 330 - 22, -120, 44, 120, 8), fill(g('#6a422a'))); cv.drawPath(rrect(sx * 330 - 22, -120, 44, 120, 8), ink(5))
    bl = path_smooth([(-360, -300), (-120, -330), (200, -320), (360, -290), (370, -110), (0, -90), (-370, -110)], tension=0.25)
    cv.drawPath(bl, fill(g(col)))
    cv.save(); cv.clipPath(bl, doAntiAlias=True)
    for k in range(-4, 5):
        cv.drawLine(k * 90, -340, k * 90 + 40, -80, stroke_c(shade(g(col), 0.2), 18))
    cv.drawPath(ellipse(150, -120, 300, 90), fill(g('#3a2a5a'), 0.2))
    cv.restore()
    cv.drawPath(bl, ink(W))
    cv.drawPath(rrect(-360, -330, 720, 60, 26), fill(g('#f4f0f6'))); cv.drawPath(rrect(-360, -330, 720, 60, 26), ink(5))
    cv.restore()


# ----------------------------------------------------------------------------- upright piano (~520 tall, 700 wide)
def draw_piano(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    body = rrect(-350, -520, 700, 520, 24)
    cv.drawPath(body, fill(g('#3a2430'))); cv.drawPath(body, ink(W))
    cv.drawPath(rrect(-320, -490, 640, 180, 14), fill(g('#4a3040'))); cv.drawPath(rrect(-320, -490, 640, 180, 14), ink(4, 0.6))
    cv.drawPath(rrect(-380, -300, 760, 60, 10), fill(g('#4a3040'))); cv.drawPath(rrect(-380, -300, 760, 60, 10), ink(5))
    keys = rrect(-360, -250, 720, 60, 6)
    cv.drawPath(keys, fill(g('#f8f4ee'))); cv.drawPath(keys, ink(5))
    for k in range(1, 24):
        kx = -360 + k * 30
        cv.drawLine(kx, -250, kx, -190, ink(2.5, 0.7))
        if k % 7 not in (0, 3):
            cv.drawPath(rrect(kx - 9, -250, 18, 36, 3), fill(INK))
    for sx in (-1, 1):
        cv.drawPath(rrect(sx * 330 - 20, -190, 40, 190, 8), fill(g('#3a2430'))); cv.drawPath(rrect(sx * 330 - 20, -190, 40, 190, 8), ink(5))
    if st.get('expr') == 'play':                                    # floating notes
        for k in range(4):
            ph = (t * 0.7 + k / 4) % 1.0
            nx, ny = -150 + k * 90 + 30 * math.sin(ph * 6), -560 - ph * 320
            a = math.sin(ph * math.pi)
            cv.drawPath(ellipse(nx, ny, 22, 17), fill(INK, a))
            cv.drawLine(nx + 20, ny, nx + 20, ny - 80, ink(6, a))
            cv.drawLine(nx + 20, ny - 80, nx + 50, ny - 60, ink(6, a))
    cv.restore()


DRAW.update({'bed_back': draw_bed_back, 'bed_front': draw_bed_front, 'piano': draw_piano})
SHADOW.update({'bed_back': 0, 'bed_front': 340, 'piano': 360})


# ----------------------------------------------------------------------------- big glowing pause button (~400 wide)
def draw_pausebtn(cv, x, y, s, t, mood, st):
    expr = st.get('expr', 'on')
    pulse = 1 + 0.04 * math.sin(t * 6)
    cv.save(); cv.translate(x, y - 200 * s); cv.scale(s * pulse, s * pulse)
    col = '#e8404a' if expr == 'stuck' else '#4ab0ff'
    glow = fill('#ffffff'); glow.setShader(rad_grad((0, 0), 330, [C4(col, 0.6), C4(col, 0.0)]))
    cv.drawCircle(0, 0, 330, glow)
    cv.drawCircle(0, 0, 200, fill(col)); cv.drawCircle(0, 0, 200, ink(W * 1.3))
    cv.drawCircle(0, 0, 165, stroke_c('#ffffff', 8))
    for sx in (-1, 1):
        b = rrect(sx * 55 - 28, -90, 56, 180, 16)
        cv.drawPath(b, fill('#ffffff')); cv.drawPath(b, ink(5))
    if expr == 'stuck':                                            # cracked, won't unpress
        cr = skia.Path(); cr.moveTo(-150, -110); cr.lineTo(-60, -30); cr.lineTo(-90, 20); cr.lineTo(20, 90); cr.lineTo(10, 150)
        cv.drawPath(cr, ink(7))
    cv.restore()


def C4(c, a):
    from .paint import C
    return C(c, a).toColor()


# ----------------------------------------------------------------------------- blackout: dark everywhere, optional spotlight hole
def draw_blackout(cv, x, y, s, t, mood, st):
    if st.get('expr', 'on') == 'off':
        return
    a = st.get('alpha', 0.95)
    col = st.get('torso', '#07050c')
    sr = st.get('sr', 0)
    cv.save(); cv.translate(x, y)
    if sr <= 0:
        cv.drawRect(skia.Rect.MakeLTRB(-9000, -9000, 9000, 9000), fill(col, a))
    else:
        sx, sy = st.get('sx', 0), st.get('sy', 0)
        p = fill('#000000')
        p.setShader(rad_grad((sx, sy), sr * 1.25, [C4(col, 0.0), C4(col, 0.0), C4(col, a)], [0, 0.72, 1.0]))
        cv.drawRect(skia.Rect.MakeLTRB(-9000, -9000, 9000, 9000), p)
    cv.restore()


# ----------------------------------------------------------------------------- sound waves: flowing arcs, or frozen icy arcs
def draw_soundwave(cv, x, y, s, t, mood, st):
    frozen = st.get('expr') == 'frozen'
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    for k in range(4):
        ph = 0.15 + k * 0.22 if frozen else (t * 1.4 + k / 4) % 1.0
        r = 40 + ph * 300
        a = 1.0 if frozen else math.sin(ph * math.pi)
        arc = skia.Path(); arc.addArc(skia.Rect.MakeLTRB(-r, -r, r, r), -40, 80)
        if frozen:
            cv.drawPath(arc, stroke_c('#d8f4ff', 22)); cv.drawPath(arc, ink(5, 0.8))
            for j in range(3):                                     # little icicles hanging off each frozen ring
                aa = math.radians(-25 + j * 25)
                ix, iy = math.cos(aa) * r, math.sin(aa) * r
                ic = path_smooth([(ix - 8, iy), (ix + 8, iy), (ix, iy + 34)], tension=0.05)
                cv.drawPath(ic, fill('#d8f4ff')); cv.drawPath(ic, ink(3))
        else:
            cv.drawPath(arc, stroke_c('#ffffff', 14 * a + 2)); cv.drawPath(arc, ink(4, a))
    cv.restore()


# ----------------------------------------------------------------------------- breath: flowing puffs, or frozen cubes of air
def draw_breath(cv, x, y, s, t, mood, st):
    frozen = st.get('expr') == 'frozen'
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    for k in range(6):
        ph = 0.12 + k * 0.15 if frozen else (t * 0.9 + k / 6) % 1.0
        px, py = 30 + ph * 300, -20 * math.sin(ph * 5 + k) - ph * 60
        r = 26 + ph * 40
        if frozen:
            cube = rrect(px - r, py - r, 2 * r, 2 * r, 10)
            cv.drawPath(cube, fill('#cfeeff', 0.85)); cv.drawPath(cube, ink(4))
            cv.drawLine(px - r * 0.6, py - r * 0.5, px - r * 0.1, py - r * 0.5, stroke_c('#ffffff', 5))
        else:
            a = math.sin(ph * math.pi) * 0.8
            cv.drawPath(ellipse(px, py, r, r * 0.8), fill('#ffffff', a)); cv.drawPath(ellipse(px, py, r, r * 0.8), ink(3.5, a))
    cv.restore()


DRAW.update({'pausebtn': draw_pausebtn, 'blackout': draw_blackout, 'soundwave': draw_soundwave, 'breath': draw_breath})
SHADOW.update({'pausebtn': 0, 'blackout': 0, 'soundwave': 0, 'breath': 0})


# ----------------------------------------------------------------------------- flying saucer (~700 wide), hovers + beam
def draw_ufo(cv, x, y, s, t, mood, st):
    g = _g(mood)
    hov = math.sin(t * 2.2 + (hash(st.get('id', '')) % 7)) * 18
    cv.save(); cv.translate(x, y + hov); cv.scale(s * st.get('dir', 1), s)
    if st.get('expr') == 'beam':
        bm = path_smooth([(-90, -30), (90, -30), (260, 700), (-260, 700)], tension=0.0)
        p = fill('#ffffff'); p.setShader(lin_grad((0, -30), (0, 700), [C4('#b8ff8a', 0.55), C4('#b8ff8a', 0.0)]))
        cv.drawPath(bm, p)
    dome = ellipse(0, -90, 150, 110)
    cv.drawPath(dome, fill('#bfe8ff', 0.85)); cv.drawPath(dome, ink(W))
    cv.drawPath(ellipse(-50, -130, 40, 22), fill('#ffffff', 0.6))
    disc = ellipse(0, -30, 350, 90)
    cv.drawPath(disc, fill(g('#9aa4b8'))); cv.drawPath(disc, ink(W))
    cv.drawPath(ellipse(0, -10, 260, 45), fill(g('#6a7488'))); cv.drawPath(ellipse(0, -10, 260, 45), ink(5))
    for k in range(7):
        a = k / 7 * 2 * math.pi + t * 2
        lx, ly = math.cos(a) * 290, -30 + math.sin(a) * 60
        if math.sin(a) > -0.3:
            on = (k + int(t * 6)) % 2 == 0
            cv.drawCircle(lx, ly, 16, fill('#ffe27a' if on else '#f27a5a')); cv.drawCircle(lx, ly, 16, ink(4))
    cv.restore()


# ----------------------------------------------------------------------------- coin: 'flip' spins, 'heads' / 'tails' land
def draw_coin(cv, x, y, s, t, mood, st):
    expr = st.get('expr', 'flip')
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    if expr == 'flip':
        sx = abs(math.cos(t * 14)) * 0.95 + 0.05
        cv.translate(0, -60 * abs(math.sin(t * 3)))
    else:
        sx = 1.0
    cv.save(); cv.scale(sx, 1)
    glow = fill('#ffffff'); glow.setShader(rad_grad((0, 0), 300, [C4('#ffe27a', 0.5), C4('#ffe27a', 0.0)]))
    cv.drawCircle(0, 0, 300, glow)
    cv.drawCircle(0, 0, 200, fill('#e8b030')); cv.drawCircle(0, 0, 200, ink(W * 1.2))
    cv.drawCircle(0, 0, 160, fill('#f6cc4a')); cv.drawCircle(0, 0, 160, ink(4, 0.6))
    if expr == 'heads':                                            # a smiling round head = you stay
        cv.drawCircle(0, -10, 80, fill('#f6f1ea')); cv.drawCircle(0, -10, 80, ink(6))
        for k in (-1, 1):
            cv.drawCircle(k * 28, -20, 9, fill(INK))
        m = skia.Path(); m.moveTo(-30, 20); m.quadTo(0, 45, 30, 20); cv.drawPath(m, ink(6))
    elif expr == 'tails':                                          # a little dust swirl
        for k in range(14):
            a = k * 0.9
            cv.drawCircle(math.cos(a) * (20 + k * 7), math.sin(a) * (20 + k * 7), 12 - k * 0.5, fill('#8a6a4a'))
    cv.restore()
    cv.restore()


# ----------------------------------------------------------------------------- dust: a figure-sized cloud of drifting flakes
def draw_dust(cv, x, y, s, t, mood, st):
    t0 = st.get('t0', 0.0)
    u = max(0.0, t - t0)
    if u <= 0:
        return
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    for k in range(60):
        r = ((k * 73) % 100) / 100.0
        bx, by = (r - 0.5) * 200, -((k * 37) % 480)
        dx = u * (90 + 60 * r) + 25 * math.sin(u * 3 + k)
        dy = -u * (40 + 30 * ((k * 17) % 10) / 10.0)
        a = max(0.0, 1.0 - u / 2.2)
        if a <= 0:
            continue
        cv.drawCircle(bx + dx, by + dy, 7 + (k % 3) * 3, fill('#7a5a44', a))
    cv.restore()


DRAW.update({'ufo': draw_ufo, 'coin': draw_coin, 'dust': draw_dust})
SHADOW.update({'ufo': 0, 'coin': 0, 'dust': 0})


# ----------------------------------------------------------------------------- lightning bolt from (x, y) to (x+dx, y+dy); flickers
def draw_bolt(cv, x, y, s, t, mood, st):
    if st.get('expr', 'on') == 'off':
        return
    dx, dy = st.get('dx', 0), st.get('dy', 1200)
    rate = st.get('rate', 7.0)
    ph = int(t * rate)
    if (t * rate) % 1.0 > 0.75:
        return                                                     # flicker gap
    import random as _r
    rnd = _r.Random(ph * 31 + (hash(st.get('id', '')) % 97))
    n = 9
    pts = [(x, y)]
    L = math.hypot(dx, dy) or 1
    nx, ny = -dy / L, dx / L
    for k in range(1, n):
        u = k / n
        j = rnd.uniform(-1, 1) * L * 0.07
        pts.append((x + dx * u + nx * j, y + dy * u + ny * j))
    pts.append((x + dx, y + dy))
    p = skia.Path(); p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    w = 26 * s
    glow = stroke_c('#9ad8ff', w * 3.2); blurred(glow, 22 * s); glow.setAlphaf(0.75)
    cv.drawPath(p, glow)
    cv.drawPath(p, stroke_c('#e8f6ff', w))
    cv.drawPath(p, stroke_c('#ffffff', w * 0.45))
    for k in (3, 6):                                               # a couple of forks
        fx, fy = pts[k]
        q = skia.Path(); q.moveTo(fx, fy)
        q.lineTo(fx + nx * L * 0.12 + dx * 0.06, fy + ny * L * 0.12 + dy * 0.06)
        q.lineTo(fx + nx * L * 0.16 + dx * 0.12, fy + ny * L * 0.16 + dy * 0.12)
        cv.drawPath(q, stroke_c('#e8f6ff', w * 0.5))


# ----------------------------------------------------------------------------- empty stone pedestal (~420 tall)
def draw_pedestal(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    base = rrect(-200, -80, 400, 80, 10); col = rrect(-140, -330, 280, 260, 8); top = rrect(-210, -400, 420, 80, 12)
    for p, c in ((base, '#8a8aa0'), (col, '#a0a0b4'), (top, '#b4b4c8')):
        cv.drawPath(p, fill(g(c))); cv.drawPath(p, ink(W))
    for k in range(3):
        cv.drawLine(-140 + 70 * (k + 1), -320, -140 + 70 * (k + 1), -80, ink(3, 0.4))
    cv.drawLine(-120, -400, -60, -360, ink(4, 0.7)); cv.drawLine(-60, -360, -80, -330, ink(4, 0.7))   # crack
    cv.drawPath(ellipse(0, -410, 150, 22), fill('#3a2a4a', 0.35))  # dusty outline where something used to be
    _txt(cv, '?', 0, -470 + 10 * math.sin(t * 3), 150, '#f2c640')
    cv.restore()


# ----------------------------------------------------------------------------- city bus (side view, ~1100 long, 520 tall)
def draw_bus(cv, x, y, s, t, mood, st):
    g = _g(mood)
    cv.save(); cv.translate(x, y); cv.scale(s * st.get('dir', 1), s)
    body = rrect(-550, -520, 1100, 440, 50)
    cv.drawPath(body, fill(g('#f2b632'))); cv.drawPath(body, ink(W))
    cv.drawPath(rrect(-550, -200, 1100, 50, 0), fill(g('#d8343c')))
    for k in range(5):
        wx = -470 + k * 190
        cv.drawPath(rrect(wx, -470, 150, 150, 18), fill(g('#a8d8f0'))); cv.drawPath(rrect(wx, -470, 150, 150, 18), ink(5))
    cv.drawPath(rrect(400, -470, 110, 360, 12), fill(g('#a8d8f0'))); cv.drawPath(rrect(400, -470, 110, 360, 12), ink(5))
    cv.drawPath(rrect(-550, -560, 260, 50, 12), fill(g('#2a2232'))); _txt(cv, 'BUS 42', -420, -522, 34, '#f2c640')
    for wx in (-330, 330):
        cv.drawCircle(wx, -80, 78, fill(INK)); cv.drawCircle(wx, -80, 34, fill(g('#b8b8c8')))
    cv.restore()


# ----------------------------------------------------------------------------- laptop (~300 wide); expr 'fried' = dead screen
def draw_laptop(cv, x, y, s, t, mood, st):
    g = _g(mood)
    fried = st.get('expr') == 'fried'
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    cv.drawPath(rrect(-170, -24, 340, 24, 6), fill(g('#9aa4b8'))); cv.drawPath(rrect(-170, -24, 340, 24, 6), ink(5))
    scr = rrect(-140, -230, 280, 200, 14)
    cv.drawPath(scr, fill(g('#3a3e4a'))); cv.drawPath(scr, ink(W))
    inner = rrect(-122, -212, 244, 164, 8)
    if fried:
        cv.drawPath(inner, fill('#121018'))
        cv.drawLine(-100, -200, 40, -110, stroke_c('#ffffff', 4)); cv.drawLine(40, -110, 0, -60, stroke_c('#ffffff', 4))
    else:
        p = fill('#ffffff'); p.setShader(lin_grad((0, -212), (0, -48), ['#6ac8f0', '#7a7ae8'])); cv.drawPath(inner, p)
        for k in range(3):
            cv.drawLine(-90, -180 + k * 36, 60 - k * 30, -180 + k * 36, stroke_c('#ffffff', 10))
    cv.restore()


# ----------------------------------------------------------------------------- Wi-Fi sign; expr 'gone' = crossed out
def draw_wifi(cv, x, y, s, t, mood, st):
    gone = st.get('expr') == 'gone'
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    cv.drawCircle(0, -150, 170, fill('#ffffff', 0.9)); cv.drawCircle(0, -150, 170, ink(W))
    col = '#9a9aa8' if gone else '#3a8ad8'
    for k, r in enumerate((40, 80, 120)):
        arc = skia.Path(); arc.addArc(skia.Rect.MakeLTRB(-r, -90 - r, r, -90 + r), 225, 90)
        cv.drawPath(arc, stroke_c(col, 22))
    cv.drawCircle(0, -100, 18, fill(col))
    if gone:
        cv.drawLine(-120, -270, 120, -30, stroke_c('#d8343c', 26)); cv.drawLine(-120, -270, 120, -30, ink(4))
    cv.restore()


# ----------------------------------------------------------------------------- smoke + sparks rising (fried electronics)
def draw_smoke(cv, x, y, s, t, mood, st):
    cv.save(); cv.translate(x, y); cv.scale(s, s)
    for k in range(6):
        ph = (t * 0.6 + k / 6) % 1.0
        px, py = 30 * math.sin(ph * 5 + k), -ph * 320
        r = 30 + ph * 60
        a = math.sin(ph * math.pi) * 0.75
        cv.drawPath(ellipse(px, py, r, r * 0.85), fill('#a8a2b8', a)); cv.drawPath(ellipse(px, py, r, r * 0.85), ink(3, a * 0.6))
    for k in range(5):
        ph = (t * 1.7 + k / 5) % 1.0
        sx, sy = (k - 2) * 40 * ph * 2, -ph * 160
        cv.drawCircle(sx, sy, 7 * (1 - ph) + 2, fill('#ffd84a', 1 - ph))
    cv.restore()


DRAW.update({'bolt': draw_bolt, 'pedestal': draw_pedestal, 'bus': draw_bus, 'laptop': draw_laptop, 'wifi': draw_wifi, 'smoke': draw_smoke})
SHADOW.update({'bolt': 0, 'pedestal': 220, 'bus': 560, 'laptop': 170, 'wifi': 0, 'smoke': 0})
