/*
 * Cozy game — character sprite system (v2).
 *
 * Every human in the game is one of these: the player, their partner, their
 * children, and every neighbour. No image files — a character is a plain
 * record, and this module draws it as pixels at any scale, facing any of four
 * directions, with a four-frame walk cycle.
 *
 * The figure is roughly 18x45 inside a 26x54 grid (margin for hair, hats and
 * the outline pass). Five head-heights tall with narrow shoulders, which is
 * what keeps it from reading as a cartoon.
 *
 * Colour: palettes store one base colour each; shades, highlights and the
 * outline are derived from it, so the outline is a dark version of whatever
 * it borders rather than one flat ink line. That single change does most of
 * the work of making pixel art look painted instead of drawn.
 */
(function (root) {
  "use strict";

  var W = 26, H = 54;

  /* ------------------------------------------------------------- colour ---- */

  var DARK = [36, 27, 38];      /* what shading mixes toward */
  var LIGHT = [255, 246, 232];  /* what highlights mix toward */

  function parse(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  function toHex(c) {
    return "#" + c.map(function (v) {
      var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return s.length < 2 ? "0" + s : s;
    }).join("");
  }
  function mix(hex, target, t) {
    var c = parse(hex);
    return toHex([c[0] + (target[0] - c[0]) * t, c[1] + (target[1] - c[1]) * t, c[2] + (target[2] - c[2]) * t]);
  }
  function shade(hex, t) { return mix(hex, DARK, t); }
  function tint(hex, t) { return mix(hex, LIGHT, t); }

  function luma(hex) { var c = parse(hex); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]; }

  /** A colour guaranteed to read against its own base — shadow on light tones,
   *  rim light on dark ones. Without this, near-black skin and hair lose both
   *  their outline and their features. */
  function contrastOf(hex, strength) {
    return luma(hex) < 66 ? tint(hex, strength * 1.15) : shade(hex, strength * 1.9);
  }

  var toneCache = {};
  /** Expand one base colour into the five tones the renderer draws with. */
  function tone(hex) {
    if (toneCache[hex]) return toneCache[hex];
    var t = {
      b: hex,
      s: shade(hex, 0.18),   /* soft shadow */
      d: shade(hex, 0.34),   /* deep shadow / seams */
      h: tint(hex, 0.20),    /* highlight */
      o: luma(hex) < 66 ? tint(hex, 0.34) : shade(hex, 0.58),  /* its own outline */
      f: contrastOf(hex, 0.30),   /* readable feature line at any lightness */
      ff: contrastOf(hex, 0.18)   /* the softer version of the same */
    };
    toneCache[hex] = t;
    return t;
  }

  function P(name, hex) { return { n: name, b: hex }; }

  var SKINS = [
    P("Porcelain", "#ffe4cb"), P("Shell", "#f9d5b4"), P("Oat", "#f2c49c"),
    P("Sand", "#e9b183"), P("Honey", "#dd9d6d"), P("Amber", "#cd8a58"),
    P("Clay", "#ba7546"), P("Chestnut", "#a4623a"), P("Cedar", "#8d5130"),
    P("Walnut", "#764128"), P("Cocoa", "#5f3420"), P("Espresso", "#4a2818"),
    P("Onyx", "#3a1f13"), P("Ink", "#2c1810")
  ];

  var HAIRS = [
    P("Black", "#1a1620"), P("Soot", "#2e2833"), P("Dark brown", "#3a2a1e"),
    P("Coffee", "#4e3524"), P("Brown", "#62402a"), P("Chestnut", "#7a4f2f"),
    P("Auburn", "#8e4526"), P("Copper", "#a9501f"), P("Ginger", "#c2601c"),
    P("Apricot", "#d98f57"), P("Honey", "#e0b25c"), P("Wheat", "#eccf8e"),
    P("Platinum", "#f0e4c0"), P("Ash", "#bdb3a3"), P("Silver", "#948f89"),
    P("Snow", "#e8e8e0"), P("Seafoam", "#3f7f74"), P("Cornflower", "#43629e"),
    P("Peony", "#c96f95"), P("Plum", "#7a539e")
  ];

  var EYE_COLORS = [
    P("Coffee", "#3b2a1c"), P("Ink", "#241b21"), P("Hazel", "#6b4f2a"),
    P("Amber", "#9a6a22"), P("Moss", "#3f7a45"), P("Sea", "#2f6b7d"),
    P("Sky", "#4f86bd"), P("Slate", "#6b7780"), P("Violet", "#7a5aa0"),
    P("Russet", "#8a4a3a")
  ];

  var CLOTH = [
    P("Chalk", "#f2efe6"), P("Cream", "#e6dcc4"), P("Sand", "#d8c49f"),
    P("Camel", "#c9a87c"), P("Rose", "#dc93a6"), P("Poppy", "#c4483f"),
    P("Brick", "#9c4436"), P("Rust", "#a8552c"), P("Marigold", "#d9992b"),
    P("Butter", "#ecd06a"), P("Olive", "#8a8f45"), P("Meadow", "#5f8a4e"),
    P("Fern", "#35705e"), P("Lagoon", "#2e7d78"), P("Sky", "#6fa8d4"),
    P("Denim", "#3f5f9e"), P("Navy", "#34477a"), P("Iris", "#6f4f96"),
    P("Cocoa", "#6b4a33"), P("Charcoal", "#3c3a44")
  ];

  /* -------------------------------------------------------------- styles ---- */

  /* Hair is parameterised rather than hand-drawn per style, which keeps
   * eighteen cuts consistent with each other instead of eighteen accidents.
   *   vol    how far the hair stands off the skull (0-2)
   *   fringe none | straight | side | swept | curly
   *   side   how far down the sides it falls, in pixels
   *   back   none | fall | ponytail | bun | lowbun | braids | locs      */
  var HAIR_STYLES = [
    { n: "Cropped",    vol: 0, fringe: "none",     side: 2,  back: "none" },
    { n: "Buzzed",     vol: 0, fringe: "none",     side: 1,  back: "none", thin: true },
    { n: "Shaved",     vol: 0, fringe: "none",     side: 0,  back: "none", bald: true },
    { n: "Fringe",     vol: 1, fringe: "straight", side: 4,  back: "none" },
    { n: "Side part",  vol: 1, fringe: "side",     side: 3,  back: "none" },
    { n: "Swept",      vol: 1, fringe: "swept",    side: 3,  back: "none" },
    { n: "Tousled",    vol: 2, fringe: "swept",    side: 2,  back: "none", messy: true },
    { n: "Undercut",   vol: 2, fringe: "swept",    side: 0,  back: "none" },
    { n: "Bob",        vol: 1, fringe: "straight", side: 9,  back: "none" },
    { n: "Waves",      vol: 2, fringe: "side",     side: 9,  back: "fall", wavy: true },
    { n: "Long",       vol: 1, fringe: "straight", side: 14, back: "fall" },
    { n: "Curls",      vol: 2, fringe: "curly",    side: 6,  back: "none", curly: true },
    { n: "Afro",       vol: 3, fringe: "curly",    side: 5,  back: "none", curly: true },
    { n: "Locs",       vol: 1, fringe: "none",     side: 4,  back: "locs" },
    { n: "Ponytail",   vol: 1, fringe: "side",     side: 3,  back: "ponytail" },
    { n: "High bun",   vol: 1, fringe: "swept",    side: 2,  back: "bun" },
    { n: "Low bun",    vol: 1, fringe: "side",     side: 4,  back: "lowbun" },
    { n: "Braids",     vol: 1, fringe: "straight", side: 3,  back: "braids" }
  ];

  var EYE_SHAPES = ["Round", "Soft", "Almond", "Sleepy", "Wide", "Keen", "Downturned", "Bright"];

  var OUTFITS = [
    "T-shirt", "Long sleeves", "Knit jumper", "Fisherman's knit", "Dungarees",
    "Sundress", "Work apron", "Raincoat", "Striped tee", "Cardigan",
    "Overshirt", "Waistcoat"
  ];

  var ACCESSORIES = ["Glasses", "Round glasses", "Sun hat", "Cap", "Beanie",
    "Scarf", "Neckerchief", "Earrings", "Satchel"];

  var DETAILS = ["None", "Freckles", "Blush", "Freckles & blush"];

  var FACIAL_HAIR = ["Clean-shaven", "Stubble", "Moustache", "Goatee", "Beard", "Full beard"];

  var SIGNS = [
    ["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20], ["Aries", 4, 19],
    ["Taurus", 5, 20], ["Gemini", 6, 20], ["Cancer", 7, 22], ["Leo", 8, 22],
    ["Virgo", 9, 22], ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21],
    ["Capricorn", 12, 31]
  ];
  function starSign(month, day) {
    for (var i = 0; i < SIGNS.length; i++) {
      if (month < SIGNS[i][1] || (month === SIGNS[i][1] && day <= SIGNS[i][2])) return SIGNS[i][0];
    }
    return "Capricorn";
  }

  /* ---------------------------------------------------------------- grid ---- */

  function Grid() {
    this.px = new Array(W * H);
    for (var i = 0; i < W * H; i++) this.px[i] = null;
  }
  Grid.prototype.set = function (x, y, c) {
    if (!c) return;
    x = x | 0; y = y | 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    this.px[y * W + x] = c;
  };
  Grid.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return this.px[y * W + x];
  };
  Grid.prototype.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c);
  };
  Grid.prototype.row = function (x, y, w, c) { this.rect(x, y, w, 1, c); };
  Grid.prototype.col = function (x, y, h, c) { this.rect(x, y, 1, h, c); };
  /* Recolour only where something is already drawn — for shading a garment. */
  Grid.prototype.over = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (this.get(x + i, y + j)) this.set(x + i, y + j, c);
    }
  };
  Grid.prototype.clear = function (x, y, w, h) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (x + i >= 0 && y + j >= 0 && x + i < W && y + j < H) this.px[(y + j) * W + (x + i)] = null;
    }
  };
  /** Outline in a darkened version of the colour each edge pixel borders. */
  Grid.prototype.outline = function () {
    var src = this.px.slice();
    var off = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (src[y * W + x]) continue;
        var found = null;
        for (var k = 0; k < off.length; k++) {
          var nx = x + off[k][0], ny = y + off[k][1];
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          var c = src[ny * W + nx];
          if (c) { found = c; break; }
        }
        if (found) this.px[y * W + x] = tone(found).o;
      }
    }
  };

  /* ------------------------------------------------------------ geometry ---- */

  var HEAD = { x: 9, y: 5, w: 8, h: 10 };
  var NECK = { x: 12, y: 15, w: 2, h: 2 };
  var TORSO = { x: 7, y: 17, w: 12, h: 12 };
  var ARM = { lx: 4, rx: 19, w: 3, y: 17, h: 14 };
  var HIPS = { x: 8, y: 29, w: 10, h: 4 };
  var LEG = { y: 33, h: 15, lx: 8, rx: 14, w: 4 };
  var SHOE = { y: 48, h: 2, lx: 7, rx: 14, w: 5 };

  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }
  function styleOf(ch) { return HAIR_STYLES[((ch.hairStyle | 0) % HAIR_STYLES.length + HAIR_STYLES.length) % HAIR_STYLES.length]; }

  /* ---------------------------------------------------------------- hair ---- */

  function hairBack(g, c, st, dir, lift) {
    var x = HEAD.x, y = HEAD.y - lift, w = HEAD.w, v = st.vol;
    if (st.bald) return;

    if (st.back === "fall") {
      var len = st.side + 4;
      g.rect(x - v - 1, y + 3, w + 2 * v + 2, len, c.b);
      g.col(x - v - 1, y + 3, len, c.s);
      g.col(x + w + v, y + 3, len, c.s);
      if (st.wavy) {
        g.row(x - v - 1, y + 3 + len, 3, c.b);
        g.row(x + w + v - 2, y + 3 + len, 3, c.b);
        g.row(x + 1, y + 3 + len, 4, c.s);
      }
    } else if (st.back === "ponytail") {
      g.rect(x + w + v, y + 4, 2, 9, c.b);
      g.col(x + w + v + 1, y + 4, 9, c.s);
      g.rect(x + w + v - 1, y + 12, 2, 2, c.s);
      if (dir === "up") g.rect(x + 3, y + 6, 3, 10, c.b);
    } else if (st.back === "bun") {
      g.rect(x + 2, y - 3, 4, 3, c.b);
      g.row(x + 3, y - 4, 2, c.b);
      g.row(x + 3, y - 3, 2, c.h);
      g.col(x + 5, y - 3, 3, c.s);
    } else if (st.back === "lowbun") {
      g.rect(x + w - 1, y + 8, 3, 3, c.b);
      g.col(x + w + 1, y + 8, 3, c.s);
      if (dir === "up") { g.rect(x + 2, y + 8, 4, 4, c.b); g.row(x + 3, y + 8, 2, c.h); }
    } else if (st.back === "braids") {
      [x - v - 2, x + w + v].forEach(function (bx) {
        g.rect(bx, y + 5, 2, 11, c.b);
        g.row(bx, y + 8, 2, c.s);
        g.row(bx, y + 12, 2, c.s);
        g.row(bx, y + 16, 2, c.d);
      });
    } else if (st.back === "locs") {
      g.rect(x - v - 1, y + 3, w + 2 * v + 2, 9, c.b);
      for (var i = 0; i < w + 2 * v + 2; i += 2) {
        g.col(x - v - 1 + i, y + 5, 9, c.s);
        g.set(x - v - 1 + i, y + 12, c.d);
      }
    }
  }

  function hairFront(g, c, st, dir, lift) {
    if (st.bald) return;
    var x = HEAD.x, y = HEAD.y - lift, w = HEAD.w, v = st.vol;

    /* skull cap */
    var capH = st.thin ? 2 : 3 + v;
    g.rect(x - v, y - v, w + 2 * v, capH, c.b);
    g.row(x - v + 1, y - v - 1, w + 2 * v - 2, c.b);
    g.clear(x - v, y - v, 1, 1); g.clear(x + w + v - 1, y - v, 1, 1);
    g.row(x + 1, y - v, 3, c.h);
    g.set(x + 1, y - v + 1, c.h);

    /* sides */
    if (st.side > 0) {
      g.rect(x - v, y + 1, 1 + v, st.side, c.b);
      g.rect(x + w - 1, y + 1, 1 + v, st.side, c.b);
      g.col(x - v, y + 1, st.side, c.s);
      g.col(x + w + v - 1, y + 1, st.side, c.s);
    }

    /* fringe — stops above the eyes at y+4 */
    var fy = y + capH - v;
    if (st.fringe === "straight") {
      g.rect(x, fy, w, 1, c.b);
      g.row(x, fy + 1, 2, c.b); g.row(x + w - 2, fy + 1, 2, c.b);
    } else if (st.fringe === "side") {
      g.rect(x, fy, w - 2, 1, c.b);
      g.row(x, fy + 1, 3, c.b);
      g.set(x + w - 1, fy, c.s);
    } else if (st.fringe === "swept") {
      g.rect(x, fy, w, 1, c.b);
      g.row(x + w - 3, fy + 1, 3, c.b);
      g.set(x, fy, c.h);
    } else if (st.fringe === "curly") {
      g.rect(x - v, fy - 1, w + 2 * v, 2, c.b);
      for (var i = 0; i < w + 2 * v; i += 2) g.set(x - v + i, fy + 1, c.b);
      g.set(x - v - 1, y + 2, c.b); g.set(x + w + v, y + 2, c.b);
    }

    if (st.curly) {
      g.set(x - v - 1, y - v + 1, c.b); g.set(x + w + v, y - v + 1, c.b);
      g.set(x + 1, y - v - 2, c.b); g.set(x + 4, y - v - 2, c.b); g.set(x + 6, y - v - 2, c.b);
      g.set(x - v - 1, y + 3, c.s); g.set(x + w + v, y + 3, c.s);
    }
    if (st.messy) {
      g.set(x - v - 1, y - v, c.b); g.set(x + w + v, y - v + 1, c.b);
      g.set(x + 2, y - v - 2, c.b); g.set(x + 5, y - v - 2, c.b);
    }

    /* the back of the head is all hair */
    if (dir === "up") {
      g.rect(x - v, y - v, w + 2 * v, 9 + v, c.b);
      g.clear(x - v, y - v, 1, 1); g.clear(x + w + v - 1, y - v, 1, 1);
      g.col(x - v, y + 1, 8, c.s); g.col(x + w + v - 1, y + 1, 8, c.s);
      g.row(x + 2, y - v + 1, 3, c.h);
      if (st.back === "bun") { g.rect(x + 2, y - 3, 4, 3, c.b); g.row(x + 3, y - 3, 2, c.h); }
    }
  }

  /* ---------------------------------------------------------------- face ---- */

  function face(g, ch, dir, lift) {
    if (dir === "up") return;
    var sk = tone(pick(SKINS, ch.skin).b);
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var eye = tone(pick(EYE_COLORS, ch.eyeColor).b);
    var shape = ((ch.eyeShape | 0) % EYE_SHAPES.length + EYE_SHAPES.length) % EYE_SHAPES.length;
    var det = ((ch.details | 0) % DETAILS.length + DETAILS.length) % DETAILS.length;
    var x = HEAD.x, y = HEAD.y - lift;
    var SCLERA = "#f7f3ea";

    var eyes = dir === "down" ? [x + 1, x + 5] : dir === "right" ? [x + 4] : [x + 2];
    var ey = y + 4;

    eyes.forEach(function (ex) {
      /* A white column beside a dark iris column — this is what makes the eye
       * read at 2x2 against any skin tone, light or dark. */
      g.rect(ex, ey, 2, 2, SCLERA);
      var ix = dir === "left" ? ex : ex + 1;
      var sx = ix === ex ? ex + 1 : ex;
      g.col(ix, ey, 2, eye.b);
      g.set(ix, ey, eye.d);

      if (shape === 1) { g.set(sx, ey, tint(sk.b, 0.3)); }          /* Soft */
      else if (shape === 2) { g.row(ex, ey, 2, hair.d); }            /* Almond */
      else if (shape === 3) { g.row(ex, ey, 2, hair.d); g.set(ix, ey + 1, eye.b); }  /* Sleepy */
      else if (shape === 4) { g.rect(ex, ey + 2, 2, 1, SCLERA); g.set(ix, ey + 2, eye.b); } /* Wide */
      else if (shape === 5) { g.set(sx, ey + 1, eye.d); }            /* Keen */
      else if (shape === 6) { g.set(sx, ey, hair.d); }               /* Downturned */
      else if (shape === 7) { g.set(sx, ey, "#ffffff"); }            /* Bright */

      g.row(ex, ey - 1, 2, hair.s);                                  /* eyebrow */
    });

    var blush = mix(sk.b, [214, 118, 118], 0.34);
    var front = dir === "right";
    if (dir === "down") {
      g.set(x + 3, y + 6, sk.ff); g.set(x + 3, y + 7, sk.f);         /* nose */
      g.row(x + 3, y + 8, 2, sk.f);                                  /* mouth */
      g.col(x + HEAD.w - 1, y + 2, 7, sk.ff);                        /* one side in shadow */
      g.row(x + 1, y + HEAD.h - 1, HEAD.w - 2, sk.s);                /* jaw */
      if (det === 1 || det === 3) {
        g.set(x + 1, y + 7, sk.f); g.set(x + 2, y + 8, sk.f);
        g.set(x + 6, y + 7, sk.f); g.set(x + 5, y + 8, sk.f);
      }
      if (det === 2 || det === 3) { g.rect(x, y + 7, 2, 1, blush); g.rect(x + 6, y + 7, 2, 1, blush); }
    } else {
      var nx = front ? x + HEAD.w - 1 : x;
      g.set(nx, y + 5, sk.ff); g.set(nx, y + 6, sk.f);
      g.row(front ? x + 4 : x + 2, y + 8, 2, sk.f);
      g.col(front ? x : x + HEAD.w - 1, y + 2, 7, sk.ff);
      g.row(x + 1, y + HEAD.h - 1, HEAD.w - 2, sk.s);
      if (det === 2 || det === 3) g.rect(front ? x + 4 : x + 2, y + 7, 2, 1, blush);
      if (det === 1 || det === 3) { g.set(front ? x + 5 : x + 2, y + 7, sk.d); g.set(front ? x + 6 : x + 1, y + 8, sk.d); }
    }

    facialHair(g, ch, dir, lift, hair, sk);
  }

  function facialHair(g, ch, dir, lift, hair, sk) {
    var f = ((ch.beard | 0) % FACIAL_HAIR.length + FACIAL_HAIR.length) % FACIAL_HAIR.length;
    if (!f) return;
    var x = HEAD.x, y = HEAD.y - lift, w = HEAD.w;
    var lo = y + HEAD.h - 1;

    if (f === 1) {                                   /* Stubble */
      for (var i = 0; i < w; i += 2) { g.set(x + i, lo - 1, sk.d); g.set(x + i + 1, lo, sk.d); }
      g.row(x + 2, lo, w - 4, mix(sk.b, parse(hair.b), 0.3));
    } else if (f === 2) {                            /* Moustache */
      g.row(x + 2, y + 7, w - 4, hair.b);
      g.set(x + 1, y + 7, hair.s); g.set(x + w - 2, y + 7, hair.s);
    } else if (f === 3) {                            /* Goatee */
      g.row(x + 2, y + 7, w - 4, hair.b);
      g.rect(x + 3, y + 8, 2, 2, hair.b);
      g.set(x + 3, lo, hair.s);
    } else if (f === 4) {                            /* Beard */
      g.row(x + 2, y + 7, w - 4, hair.b);
      g.rect(x + 1, y + 8, w - 2, 2, hair.b);
      g.row(x + 1, lo, w - 2, hair.s);
      g.col(x + 1, y + 6, 3, hair.s); g.col(x + w - 2, y + 6, 3, hair.s);
    } else if (f === 5) {                            /* Full beard */
      g.rect(x, y + 6, w, 4, hair.b);
      g.row(x + 3, y + 7, 2, hair.s);                /* mouth gap */
      g.col(x, y + 5, 5, hair.s); g.col(x + w - 1, y + 5, 5, hair.s);
      g.row(x + 1, lo + 1, w - 2, hair.b);
      g.row(x + 2, y + 6, w - 4, hair.h);
    }
  }

  /* ---------------------------------------------------------------- body ---- */

  function body(g, ch, dir, frame) {
    var sk = tone(pick(SKINS, ch.skin).b);
    var top = tone(pick(CLOTH, ch.topColor).b);
    var bot = tone(pick(CLOTH, ch.bottomColor).b);
    var shoe = tone(pick(CLOTH, ch.shoeColor).b);
    var fit = ((ch.outfit | 0) % OUTFITS.length + OUTFITS.length) % OUTFITS.length;

    var lift = (frame === 1 || frame === 3) ? 1 : 0;
    var swing = frame === 1 ? 2 : frame === 3 ? -2 : 0;

    /* ---- head ---- */
    var hx = HEAD.x, hy = HEAD.y - lift;
    g.rect(hx, hy, HEAD.w, HEAD.h, sk.b);
    g.clear(hx, hy, 1, 1); g.clear(hx + HEAD.w - 1, hy, 1, 1);
    g.clear(hx, hy + HEAD.h - 1, 1, 1); g.clear(hx + HEAD.w - 1, hy + HEAD.h - 1, 1, 1);
    if (dir === "down" || dir === "up") {
      g.rect(hx - 1, hy + 4, 1, 2, sk.b); g.rect(hx + HEAD.w, hy + 4, 1, 2, sk.b);
      g.set(hx + HEAD.w, hy + 5, sk.s);
    } else {
      g.rect(dir === "right" ? hx + 1 : hx + HEAD.w - 2, hy + 4, 1, 2, sk.s);
    }

    /* ---- neck ---- */
    g.rect(NECK.x, NECK.y - lift, NECK.w, NECK.h, sk.b);
    g.row(NECK.x, NECK.y - lift, NECK.w, sk.d);

    var ty = TORSO.y - lift;
    var isDress = fit === 5;
    var longSleeve = (fit === 1 || fit === 2 || fit === 3 || fit === 7 || fit === 9);
    var sleeve = longSleeve ? ARM.h - 3 : 6;

    /* ---- torso ---- */
    g.rect(TORSO.x, ty, TORSO.w, TORSO.h, top.b);
    g.row(TORSO.x + 1, ty, TORSO.w - 2, top.h);
    g.col(TORSO.x, ty, TORSO.h, top.s);
    g.col(TORSO.x + TORSO.w - 1, ty, TORSO.h, top.s);
    g.row(TORSO.x, ty + TORSO.h - 1, TORSO.w, top.s);

    /* ---- arms ---- */
    var arms = [];
    if (dir !== "right") arms.push({ x: ARM.lx, side: -1, dy: swing });
    if (dir !== "left") arms.push({ x: ARM.rx, side: 1, dy: -swing });
    arms.forEach(function (a) {
      var ax = a.x, ay = ty + a.dy;
      var edge = a.side < 0 ? ax : ax + ARM.w - 1;
      g.rect(ax, ay, ARM.w, sleeve, longSleeve ? top.b : top.b);
      g.col(edge, ay, sleeve, top.s);
      if (!longSleeve) {
        g.rect(ax, ay + sleeve, ARM.w, ARM.h - sleeve, sk.b);
        g.col(edge, ay + sleeve, ARM.h - sleeve, sk.s);
        g.row(ax, ay + sleeve, ARM.w, top.d);             /* sleeve hem */
      } else {
        g.row(ax, ay + sleeve - 1, ARM.w, top.d);         /* cuff */
      }
      g.rect(ax, ay + ARM.h, ARM.w, 3, sk.b);             /* hand */
      g.col(edge, ay + ARM.h, 3, sk.s);
      g.row(ax, ay + ARM.h + 2, ARM.w, sk.d);
    });

    /* ---- hips, legs, shoes ---- */
    var hipY = HIPS.y - lift;
    var stepL = frame === 1 ? 2 : 0;
    var stepR = frame === 3 ? 2 : 0;

    if (isDress) {
      g.rect(TORSO.x, hipY, TORSO.w, 5, top.b);
      g.rect(TORSO.x - 1, hipY + 5, TORSO.w + 2, 3, top.b);
      g.row(TORSO.x - 1, hipY + 7, TORSO.w + 2, top.d);
      g.col(TORSO.x - 1, hipY + 5, 3, top.s);
      g.col(TORSO.x + TORSO.w, hipY + 5, 3, top.s);
      for (var fold = TORSO.x + 2; fold < TORSO.x + TORSO.w - 1; fold += 4) g.col(fold, hipY + 1, 6, top.s);
      var sash = tone(pick(CLOTH, ch.accColor).b);
      g.row(TORSO.x, hipY - 1, TORSO.w, sash.b);
      g.row(TORSO.x, hipY, TORSO.w, sash.s);
      [[LEG.lx + 1, stepL], [LEG.rx, stepR]].forEach(function (L, i) {
        g.rect(L[0], hipY + 8, 3, 9 - L[1], sk.b);
        g.col(i === 0 ? L[0] : L[0] + 2, hipY + 8, 9 - L[1], sk.s);
      });
    } else {
      g.rect(HIPS.x, hipY, HIPS.w, HIPS.h, bot.b);
      g.row(HIPS.x + 1, hipY, HIPS.w - 2, bot.h);
      [[LEG.lx, stepL, -1], [LEG.rx, stepR, 1]].forEach(function (L) {
        var lx = L[0], up = L[1];
        g.rect(lx, LEG.y - lift, LEG.w, LEG.h - up, bot.b);
        g.col(L[2] < 0 ? lx : lx + LEG.w - 1, LEG.y - lift, LEG.h - up, bot.s);
        g.row(lx, LEG.y - lift + LEG.h - up - 1, LEG.w, bot.d);
      });
    }

    [[SHOE.lx, stepL], [SHOE.rx, stepR]].forEach(function (S) {
      var sx = S[0], up = S[1];
      g.rect(sx, SHOE.y - lift - up, SHOE.w, SHOE.h, shoe.b);
      g.row(sx, SHOE.y - lift - up, SHOE.w, shoe.h);
      g.row(sx, SHOE.y - lift - up + 1, SHOE.w, shoe.d);
    });

    outfitDetail(g, fit, top, bot, tone(pick(CLOTH, ch.accColor).b), sk, dir, ty, lift);
  }

  function outfitDetail(g, fit, top, bot, acc, sk, dir, ty, lift) {
    var X = TORSO.x, TW = TORSO.w, TH = TORSO.h, mid = X + Math.floor(TW / 2);
    if (fit === 0 || fit === 1) {
      if (dir !== "up") { g.set(mid - 1, ty, sk.s); g.set(mid, ty, sk.s); g.row(mid - 2, ty + 1, 4, top.h); }
    } else if (fit === 2) {                                    /* Knit jumper */
      g.row(X, ty + TH - 2, TW, top.s); g.row(X, ty + TH - 1, TW, top.d);
      for (var i = X + 2; i < X + TW - 1; i += 3) g.col(i, ty + 2, TH - 4, top.s);
      if (dir !== "up") g.rect(mid - 2, ty, 4, 1, top.d);
    } else if (fit === 3) {                                    /* Fisherman's knit */
      g.row(X, ty + TH - 1, TW, top.d);
      g.rect(mid - 3, ty, 6, 2, top.h);
      g.row(X, ty + 4, TW, top.s); g.row(X, ty + 8, TW, top.s);
    } else if (fit === 4) {                                    /* Dungarees */
      g.rect(X, ty + 3, TW, TH - 3, acc.b);
      g.row(X, ty + 3, TW, acc.h);
      g.rect(X + 2, ty, 2, 4, acc.b); g.rect(X + TW - 4, ty, 2, 4, acc.b);
      g.rect(mid - 2, ty + 5, 4, 4, acc.s);
      g.set(X + 2, ty + 3, acc.d); g.set(X + TW - 3, ty + 3, acc.d);
    } else if (fit === 6) {                                    /* Work apron */
      g.rect(X + 3, ty + 2, TW - 6, TH - 2, acc.b);
      g.row(X + 3, ty + 2, TW - 6, acc.h);
      g.row(X + 1, ty + TH - 5, TW - 2, acc.d);
      g.rect(mid - 2, ty + TH - 4, 4, 3, acc.s);
      g.col(X + 3, ty + 2, TH - 2, acc.s);
    } else if (fit === 7) {                                    /* Raincoat */
      g.col(mid - 1, ty, TH, top.d);
      g.row(X, ty + TH - 1, TW, top.d);
      for (var b = ty + 2; b < ty + TH - 1; b += 3) g.set(mid, b, top.h);
      if (dir === "up") g.rect(HEAD.x - 1, HEAD.y - lift + 5, HEAD.w + 2, 4, top.b);
    } else if (fit === 8) {                                    /* Striped tee */
      for (var st = ty + 2; st < ty + TH - 1; st += 3) g.row(X, st, TW, top.s);
    } else if (fit === 9) {                                    /* Cardigan */
      g.rect(X + 4, ty, TW - 8, TH, top.h);
      g.col(X + 4, ty, TH, top.d); g.col(X + TW - 5, ty, TH, top.d);
      g.row(X, ty + TH - 1, TW, top.s);
    } else if (fit === 10) {                                   /* Overshirt */
      g.rect(X + 4, ty, TW - 8, TH, top.h);
      g.col(X + 4, ty, TH, top.d); g.col(X + TW - 5, ty, TH, top.d);
      g.row(X + 1, ty + 6, 3, top.d); g.row(X + TW - 4, ty + 6, 3, top.d);
    } else if (fit === 11) {                                   /* Waistcoat */
      g.rect(X + 2, ty, TW - 4, TH, acc.b);
      g.col(mid - 1, ty, TH, acc.d); g.col(mid, ty, TH, acc.h);
      g.rect(X + 3, ty, 2, 2, top.h); g.rect(X + TW - 5, ty, 2, 2, top.h);
      g.set(mid + 1, ty + 4, acc.h); g.set(mid + 1, ty + 8, acc.h);
    }
  }

  /* --------------------------------------------------------- accessories ---- */

  function accessories(g, ch, dir, frame) {
    var list = ch.accessories || [];
    var lift = (frame === 1 || frame === 3) ? 1 : 0;
    var acc = tone(pick(CLOTH, ch.accColor).b);
    var eye = tone(pick(EYE_COLORS, ch.eyeColor).b);
    var hx = HEAD.x, hy = HEAD.y - lift;
    var has = function (n) { return list.indexOf(n) >= 0; };

    if (has("Earrings") && dir !== "up") {
      if (dir === "down") { g.set(hx - 1, hy + 6, acc.b); g.set(hx + HEAD.w, hy + 6, acc.b); }
      else if (dir === "right") g.set(hx + 1, hy + 6, acc.b);
      else g.set(hx + HEAD.w - 2, hy + 6, acc.b);
    }
    if ((has("Glasses") || has("Round glasses")) && dir !== "up") {
      var round = has("Round glasses");
      var gy = HEAD.y - lift + 4;
      var fc = round ? acc.b : tone("#4a4652").b;
      var glint = tint(fc, 0.5);
      if (dir === "down") {
        g.row(hx, gy - 1, HEAD.w, fc);                 /* brow bar */
        g.col(hx, gy, 2, fc); g.col(hx + HEAD.w - 1, gy, 2, fc);
        g.set(hx + 3, gy, fc); g.set(hx + 4, gy, fc);  /* bridge */
        g.row(hx + 1, gy + 2, 2, fc); g.row(hx + 5, gy + 2, 2, fc);
        g.set(hx + 1, gy - 1, glint);
      } else {
        var ox = dir === "right" ? hx + 2 : hx + 2;
        g.row(ox, gy - 1, 4, fc);
        g.row(ox, gy + 2, 4, fc);
        g.set(dir === "right" ? hx + HEAD.w - 1 : hx, gy, fc);
        g.set(ox, gy - 1, glint);
      }
    }
    if (has("Scarf")) {
      g.rect(TORSO.x + 2, NECK.y - lift, TORSO.w - 4, 3, acc.b);
      g.row(TORSO.x + 2, NECK.y - lift, TORSO.w - 4, acc.h);
      g.row(TORSO.x + 2, NECK.y - lift + 2, TORSO.w - 4, acc.s);
      var tx = dir === "right" ? TORSO.x + TORSO.w - 5 : TORSO.x + 3;
      g.rect(tx, TORSO.y - lift + 1, 2, 6, acc.b);
      g.row(tx, TORSO.y - lift + 6, 2, acc.d);
    }
    if (has("Neckerchief") && !has("Scarf")) {
      g.rect(TORSO.x + 3, NECK.y - lift + 1, TORSO.w - 6, 2, acc.b);
      g.rect(TORSO.x + 5, NECK.y - lift + 3, 2, 1, acc.s);
    }
    if (has("Beanie")) {
      g.rect(hx - 1, hy - 3, HEAD.w + 2, 5, acc.b);
      g.row(hx, hy - 4, HEAD.w, acc.b);
      g.row(hx - 1, hy + 1, HEAD.w + 2, acc.s);
      g.row(hx - 1, hy + 2, HEAD.w + 2, acc.d);
      g.row(hx + 1, hy - 3, 3, acc.h);
    }
    if (has("Cap")) {
      g.rect(hx - 1, hy - 2, HEAD.w + 2, 4, acc.b);
      g.row(hx, hy - 3, HEAD.w, acc.b);
      g.row(hx + 1, hy - 2, 3, acc.h);
      g.row(hx - 1, hy + 1, HEAD.w + 2, acc.s);
      if (dir === "down") g.row(hx - 2, hy + 2, HEAD.w + 4, acc.d);
      else if (dir === "right") g.rect(hx + HEAD.w + 1, hy + 1, 3, 1, acc.d);
      else if (dir === "left") g.rect(hx - 4, hy + 1, 3, 1, acc.d);
      else g.row(hx - 1, hy + 2, HEAD.w + 2, acc.s);
    }
    if (has("Sun hat")) {
      g.rect(hx, hy - 4, HEAD.w, 4, acc.b);
      g.row(hx + 1, hy - 5, HEAD.w - 2, acc.b);
      g.row(hx + 1, hy - 4, 3, acc.h);
      g.row(hx, hy - 1, HEAD.w, acc.d);
      g.rect(hx - 4, hy, HEAD.w + 8, 1, acc.b);
      g.rect(hx - 4, hy + 1, HEAD.w + 8, 1, acc.s);
    }
    if (has("Satchel")) {
      var sy = TORSO.y + 7 - lift;
      if (dir === "up" || dir === "down") {
        var bx = dir === "up" ? TORSO.x - 2 : TORSO.x + TORSO.w - 1;
        g.rect(bx, sy, 3, 5, acc.b);
        g.row(bx, sy, 3, acc.h); g.row(bx, sy + 4, 3, acc.d);
      } else {
        g.rect(dir === "right" ? TORSO.x + 1 : TORSO.x + TORSO.w - 4, sy, 3, 5, acc.b);
      }
      g.row(TORSO.x + 1, TORSO.y + 1 - lift, TORSO.w - 2, acc.d);
    }
  }

  /* -------------------------------------------------------------- render ---- */

  function build(ch, dir, frame) {
    dir = dir || "down"; frame = frame || 0;
    var g = new Grid();
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var st = styleOf(ch);
    var lift = (frame === 1 || frame === 3) ? 1 : 0;
    hairBack(g, hair, st, dir, lift);
    body(g, ch, dir, frame);
    face(g, ch, dir, lift);
    hairFront(g, hair, st, dir, lift);
    accessories(g, ch, dir, frame);
    g.outline();
    return g;
  }

  function render(canvas, ch, dir, frame, scale) {
    var g = build(ch, dir, frame);
    canvas.width = W * scale;
    canvas.height = H * scale;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var c = g.px[y * W + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  /* -------------------------------------------------------------- records ---- */

  function defaultChar() {
    return {
      name: "", hometown: "", birthMonth: 6, birthDay: 12,
      skin: 2, hairStyle: 4, hairColor: 4, eyeShape: 2, eyeColor: 0,
      details: 0, beard: 0, outfit: 0, topColor: 13, bottomColor: 16, shoeColor: 18,
      accColor: 8, accessories: [], voice: 5
    };
  }

  /* Harmonious colour groups, so "Surprise me" can't produce a clash. */
  var COMBOS = [
    { top: [0, 1, 2], bottom: [16, 19, 18], shoe: [18, 19] },
    { top: [12, 13, 11], bottom: [2, 3, 18], shoe: [18, 19] },
    { top: [5, 6, 7], bottom: [1, 2, 19], shoe: [18, 19] },
    { top: [14, 15, 16], bottom: [0, 1, 2], shoe: [19, 18] },
    { top: [8, 9, 3], bottom: [18, 11, 19], shoe: [18] },
    { top: [4, 17], bottom: [0, 1, 19], shoe: [19, 18] },
    { top: [10, 11, 18], bottom: [2, 3, 19], shoe: [18, 19] }
  ];

  function randInt(n) { return Math.floor(Math.random() * n); }
  function any(a) { return a[randInt(a.length)]; }

  function randomChar(seedName) {
    var c = any(COMBOS);
    var accs = [];
    if (Math.random() < 0.34) accs.push(any(["Glasses", "Round glasses", "Cap", "Beanie", "Sun hat"]));
    if (Math.random() < 0.22) accs.push(any(["Scarf", "Neckerchief", "Earrings", "Satchel"]));
    return {
      name: seedName || "",
      hometown: "",
      birthMonth: randInt(12) + 1,
      birthDay: randInt(28) + 1,
      skin: randInt(SKINS.length),
      hairStyle: randInt(HAIR_STYLES.length),
      hairColor: randInt(16),
      eyeShape: randInt(EYE_SHAPES.length),
      eyeColor: randInt(EYE_COLORS.length),
      details: randInt(DETAILS.length),
      beard: Math.random() < 0.4 ? randInt(FACIAL_HAIR.length) : 0,
      outfit: randInt(OUTFITS.length),
      topColor: any(c.top),
      bottomColor: any(c.bottom),
      shoeColor: any(c.shoe),
      accColor: any(c.top),
      accessories: accs,
      voice: randInt(11)
    };
  }

  root.CozySprite = {
    W: W, H: H,
    SKINS: SKINS, HAIRS: HAIRS, EYE_COLORS: EYE_COLORS, CLOTH: CLOTH,
    HAIR_STYLES: HAIR_STYLES, EYE_SHAPES: EYE_SHAPES, OUTFITS: OUTFITS,
    ACCESSORIES: ACCESSORIES, DETAILS: DETAILS, FACIAL_HAIR: FACIAL_HAIR,
    tone: tone, shade: shade, tint: tint,
    starSign: starSign, render: render, build: build,
    randomChar: randomChar, defaultChar: defaultChar
  };
})(typeof window !== "undefined" ? window : this);
