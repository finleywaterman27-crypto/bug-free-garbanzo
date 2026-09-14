/*
 * Cozy game — character sprite system.
 *
 * Every human in the game is one of these: the player, their partner, their
 * children, and all twenty-odd neighbours. No image files — a character is a
 * plain record, and this module draws it as pixels at any scale, facing any
 * of four directions, with a four-frame walk cycle.
 *
 * Sprite is 16x20 drawn inside an 18x22 grid so the outline pass has a margin.
 */
(function (root) {
  "use strict";

  var W = 18, H = 22;
  var OUTLINE = "#2b2028";

  /* ---------------------------------------------------------------- palettes */

  var SKINS = [
    { n: "Porcelain", b: "#ffe2c8", s: "#eec3a4" },
    { n: "Shell",     b: "#f9d2ae", s: "#e6b78f" },
    { n: "Sand",      b: "#f0be96", s: "#d9a178" },
    { n: "Honey",     b: "#e3a87f", s: "#c98d64" },
    { n: "Amber",     b: "#d49264", s: "#b8774d" },
    { n: "Clay",      b: "#bd7a52", s: "#a1633f" },
    { n: "Chestnut",  b: "#a2643f", s: "#874f30" },
    { n: "Cedar",     b: "#8a5132", s: "#6f3f26" },
    { n: "Walnut",    b: "#6f4028", s: "#57311e" },
    { n: "Cocoa",     b: "#59331f", s: "#452718" },
    { n: "Espresso",  b: "#442619", s: "#331c12" },
    { n: "Onyx",      b: "#331c12", s: "#26150d" }
  ];

  var HAIRS = [
    { n: "Black",     b: "#221f2b", s: "#17151d", h: "#39344a" },
    { n: "Soot",      b: "#3a3340", s: "#2a252f", h: "#524a5a" },
    { n: "Dark brown",b: "#3c2a1e", s: "#2b1e15", h: "#553d2c" },
    { n: "Brown",     b: "#5b3c26", s: "#452d1c", h: "#7a5436" },
    { n: "Chestnut",  b: "#7a4a2a", s: "#5e381f", h: "#9c6238" },
    { n: "Auburn",    b: "#8d3f24", s: "#6d2f19", h: "#b3552f" },
    { n: "Ginger",    b: "#c05a1f", s: "#9a4515", h: "#dd7a34" },
    { n: "Apricot",   b: "#d98b52", s: "#b56d3c", h: "#eda86e" },
    { n: "Blonde",    b: "#dfb25c", s: "#bf9241", h: "#f2cd80" },
    { n: "Platinum",  b: "#ece0bd", s: "#ccbe98", h: "#f8f2dd" },
    { n: "Ash",       b: "#b5aea1", s: "#968f82", h: "#d2cbbe" },
    { n: "Silver",    b: "#8e8b88", s: "#726f6c", h: "#aaa7a3" },
    { n: "Snow",      b: "#eeeee6", s: "#cbcbc1", h: "#ffffff" },
    { n: "Seafoam",   b: "#3f8a80", s: "#2d685f", h: "#5cab9f" },
    { n: "Cornflower",b: "#43629e", s: "#324a7a", h: "#5f80bd" },
    { n: "Peony",     b: "#cf6f95", s: "#ab5578", h: "#e58fb0" },
    { n: "Plum",      b: "#77519c", s: "#5c3d7b", h: "#956dbb" }
  ];

  var EYE_COLORS = [
    { n: "Coffee", b: "#3e2a1c" }, { n: "Ink", b: "#241b21" },
    { n: "Hazel", b: "#7b5a2c" },  { n: "Amber", b: "#a8701f" },
    { n: "Moss", b: "#3f7a45" },   { n: "Sea", b: "#35708f" },
    { n: "Sky", b: "#4f86bd" },    { n: "Slate", b: "#6b7780" },
    { n: "Violet", b: "#7a5aa0" }
  ];

  var CLOTH = [
    { n: "Chalk", b: "#f1eee4", s: "#d6d2c5" },
    { n: "Cream", b: "#e7dbbe", s: "#cbbf9f" },
    { n: "Sand", b: "#d8c29a", s: "#bba67e" },
    { n: "Rose", b: "#dc93a6", s: "#bd7387" },
    { n: "Poppy", b: "#c4483f", s: "#a1352d" },
    { n: "Rust", b: "#a8552c", s: "#8a411f" },
    { n: "Marigold", b: "#df9f2c", s: "#bc821c" },
    { n: "Butter", b: "#ecd06a", s: "#ccb050" },
    { n: "Olive", b: "#74803f", s: "#5c672f" },
    { n: "Meadow", b: "#4f8a4e", s: "#3c6d3b" },
    { n: "Lagoon", b: "#2e7d78", s: "#20605c" },
    { n: "Sky", b: "#6fa8d4", s: "#548bb6" },
    { n: "Denim", b: "#3f5f9e", s: "#2f487a" },
    { n: "Iris", b: "#6f4f96", s: "#563a77" },
    { n: "Cocoa", b: "#6b4a33", s: "#533825" },
    { n: "Charcoal", b: "#3c3a44", s: "#2b2a31" }
  ];

  var HAIR_STYLES = [
    "Cropped", "Fringe", "Long", "Ponytail", "Top knot", "Curls",
    "Buzzed", "Side part", "Braids", "Bob", "Tousled", "Shaved"
  ];

  var EYE_SHAPES = ["Round", "Soft", "Sleepy", "Wide", "Keen", "Bright"];

  var OUTFITS = [
    "T-shirt", "Long sleeves", "Knit jumper", "Dungarees",
    "Sundress", "Work apron", "Raincoat", "Striped tee"
  ];

  var ACCESSORIES = ["Glasses", "Sun hat", "Cap", "Scarf", "Earrings", "Satchel"];

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

  /* ------------------------------------------------------------------- grid */

  function Grid() {
    this.px = new Array(W * H);
    for (var i = 0; i < W * H; i++) this.px[i] = null;
  }
  Grid.prototype.set = function (x, y, c) {
    if (!c || x < 0 || y < 0 || x >= W || y >= H) return;
    this.px[(y | 0) * W + (x | 0)] = c;
  };
  Grid.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    return this.px[y * W + x];
  };
  Grid.prototype.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c);
  };
  Grid.prototype.row = function (x, y, w, c) { this.rect(x, y, w, 1, c); };
  /* Paint c only where a pixel already exists (for shading over a garment). */
  Grid.prototype.over = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (this.get(x + i, y + j)) this.set(x + i, y + j, c);
    }
  };
  Grid.prototype.outline = function () {
    var src = this.px.slice();
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        if (src[y * W + x]) continue;
        var n = (y > 0 && src[(y - 1) * W + x]) || (y < H - 1 && src[(y + 1) * W + x]) ||
                (x > 0 && src[y * W + x - 1]) || (x < W - 1 && src[y * W + x + 1]);
        if (n) this.px[y * W + x] = OUTLINE;
      }
    }
  };

  /* --------------------------------------------------------------- geometry */

  var HEAD = { x: 5, y: 2, w: 8, h: 8 };
  var TORSO = { x: 6, y: 11, w: 6, h: 5 };

  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }

  /* ------------------------------------------------------------------- hair */

  function hairBack(g, c, style, dir) {
    if (style === 2) {                                  /* Long */
      g.rect(4, 3, 10, 12, c.b);
      g.rect(4, 3, 1, 12, c.s); g.rect(13, 3, 1, 12, c.s);
    } else if (style === 3) {                           /* Ponytail */
      g.rect(13, 5, 2, 7, c.b); g.set(14, 11, c.s); g.rect(13, 5, 1, 7, c.s);
      if (dir === "up") g.rect(8, 9, 3, 6, c.b);
    } else if (style === 8) {                           /* Braids */
      g.rect(3, 6, 2, 8, c.b); g.rect(13, 6, 2, 8, c.b);
      g.set(3, 9, c.s); g.set(14, 9, c.s);
      g.set(3, 12, c.s); g.set(14, 12, c.s);
    } else if (style === 9) {                           /* Bob */
      g.rect(4, 4, 10, 7, c.b);
      g.rect(4, 4, 1, 7, c.s); g.rect(13, 4, 1, 7, c.s);
    } else if (style === 5) {                           /* Curls */
      g.rect(4, 2, 10, 7, c.b);
    }
  }

  function hairFront(g, c, style, dir) {
    var x = HEAD.x, y = HEAD.y, w = HEAD.w;
    if (style === 11) return;                            /* Shaved */

    if (style === 6) {                                   /* Buzzed */
      g.row(x + 1, y, w - 2, c.b); g.row(x, y + 1, w, c.b);
      g.set(x, y + 1, c.s); g.set(x + w - 1, y + 1, c.s);
      return;
    }

    /* Everything else starts from a cap over the crown. */
    g.row(x + 1, y, w - 2, c.b);
    g.rect(x, y + 1, w, 2, c.b);
    g.rect(x, y + 1, 1, 3, c.s);
    g.rect(x + w - 1, y + 1, 1, 3, c.s);
    g.row(x + 2, y, 3, c.h);

    if (style === 0) {                                   /* Cropped */
      g.rect(x, y + 3, 1, 2, c.b); g.rect(x + w - 1, y + 3, 1, 2, c.b);
      if (dir !== "up") g.row(x + 1, y + 3, w - 2, c.b);
    } else if (style === 1) {                            /* Fringe */
      g.rect(x, y + 3, w, 1, c.b);
      g.rect(x, y + 4, 2, 2, c.b); g.rect(x + w - 2, y + 4, 2, 2, c.b);
      if (dir !== "up") { g.set(x + 3, y + 4, c.b); g.set(x + 4, y + 4, c.b); }
    } else if (style === 2 || style === 9) {             /* Long / Bob */
      g.rect(x, y + 3, 2, 4, c.b); g.rect(x + w - 2, y + 3, 2, 4, c.b);
      g.row(x + 2, y + 3, w - 4, c.b);
    } else if (style === 3) {                            /* Ponytail */
      g.row(x, y + 3, w, c.b);
      g.set(x, y + 4, c.b); g.set(x + w - 1, y + 4, c.b);
    } else if (style === 4) {                            /* Top knot */
      g.rect(x + 2, y - 2, 4, 2, c.b); g.row(x + 3, y - 2, 2, c.h);
      g.row(x, y + 3, w, c.b);
    } else if (style === 5) {                            /* Curls */
      g.rect(x - 1, y - 1, w + 2, 5, c.b);
      g.set(x - 1, y - 1, null); g.set(x + w, y - 1, null);
      g.set(x, y - 2, c.b); g.set(x + 3, y - 2, c.b); g.set(x + 6, y - 2, c.b);
      g.set(x - 1, y + 4, c.b); g.set(x + w, y + 4, c.b);
      g.row(x + 2, y - 1, 2, c.h);
    } else if (style === 7) {                            /* Side part */
      g.row(x, y + 3, w - 2, c.b);
      g.set(x, y + 4, c.b); g.set(x + 1, y + 4, c.b);
      g.set(x + w - 1, y + 3, c.s); g.set(x + w - 1, y + 4, c.b);
    } else if (style === 8) {                            /* Braids */
      g.row(x, y + 3, w, c.b);
      g.rect(x, y + 4, 1, 3, c.b); g.rect(x + w - 1, y + 4, 1, 3, c.b);
    } else if (style === 10) {                           /* Tousled */
      g.row(x, y + 3, w, c.b);
      g.set(x + 1, y - 1, c.b); g.set(x + 4, y - 1, c.b); g.set(x + 6, y - 1, c.b);
      g.set(x - 1, y + 2, c.b); g.set(x + w, y + 2, c.b);
    }

    if (dir === "up") {                                  /* Back of the head is all hair. */
      g.rect(x, y + 1, w, 6, c.b);
      g.rect(x, y + 1, 1, 6, c.s); g.rect(x + w - 1, y + 1, 1, 6, c.s);
      g.row(x + 2, y + 1, 3, c.h);
      if (style === 4) { g.rect(x + 2, y - 2, 4, 2, c.b); g.row(x + 3, y - 2, 2, c.h); }
    }
  }

  /* ------------------------------------------------------------------- face */

  function face(g, ch, dir) {
    if (dir === "up") return;
    var eye = pick(EYE_COLORS, ch.eyeColor).b;
    var shape = ((ch.eyeShape | 0) % EYE_SHAPES.length + EYE_SHAPES.length) % EYE_SHAPES.length;
    var y = HEAD.y + 4;
    var pair = dir === "down" ? [[HEAD.x + 1, y], [HEAD.x + 5, y]]
      : dir === "right" ? [[HEAD.x + 4, y]] : [[HEAD.x + 2, y]];

    pair.forEach(function (p) {
      var ex = p[0], ey = p[1];
      if (shape === 0) { g.rect(ex, ey, 2, 2, eye); }
      else if (shape === 1) { g.rect(ex, ey, 2, 2, eye); g.set(ex + 1, ey, null); }
      else if (shape === 2) { g.rect(ex, ey + 1, 2, 1, eye); g.set(ex, ey, OUTLINE); g.set(ex + 1, ey, OUTLINE); }
      else if (shape === 3) { g.rect(ex, ey - 1, 2, 3, eye); g.set(ex + 1, ey - 1, "#ffffff"); }
      else if (shape === 4) { g.rect(ex, ey, 2, 1, eye); }
      else { g.rect(ex, ey, 2, 2, eye); g.set(ex, ey, "#ffffff"); }
    });

    /* Mouth, and a nose pixel in profile. */
    var skin = pick(SKINS, ch.skin);
    if (dir === "down") {
      g.set(HEAD.x + 3, y + 3, skin.s); g.set(HEAD.x + 4, y + 3, skin.s);
      g.set(HEAD.x, y + 1, skin.s); g.set(HEAD.x + 7, y + 1, skin.s);
    } else if (dir === "right") {
      g.set(HEAD.x + 7, y + 1, skin.s);
      g.set(HEAD.x + 5, y + 3, skin.s);
    } else {
      g.set(HEAD.x, y + 1, skin.s);
      g.set(HEAD.x + 2, y + 3, skin.s);
    }
  }

  /* ---------------------------------------------------------------- outfits */

  function body(g, ch, dir, frame) {
    var skin = pick(SKINS, ch.skin);
    var top = pick(CLOTH, ch.topColor);
    var bottom = pick(CLOTH, ch.bottomColor);
    var shoe = pick(CLOTH, ch.shoeColor);
    var fit = ((ch.outfit | 0) % OUTFITS.length + OUTFITS.length) % OUTFITS.length;

    var lift = (frame === 1 || frame === 3) ? 1 : 0;      /* body bob */
    var legL = frame === 1 ? 1 : 0;
    var legR = frame === 3 ? 1 : 0;

    var hx = HEAD.x, hy = HEAD.y - lift;
    /* head */
    g.rect(hx, hy, HEAD.w, HEAD.h, skin.b);
    g.set(hx, hy, null); g.set(hx + HEAD.w - 1, hy, null);
    g.set(hx, hy + HEAD.h - 1, null); g.set(hx + HEAD.w - 1, hy + HEAD.h - 1, null);
    g.row(hx + 1, hy + HEAD.h - 1, HEAD.w - 2, skin.s);
    /* ears */
    if (dir === "down" || dir === "up") { g.set(hx - 1, hy + 4, skin.b); g.set(hx + HEAD.w, hy + 4, skin.b); }
    else if (dir === "right") g.set(hx + 1, hy + 4, skin.s);
    else g.set(hx + HEAD.w - 2, hy + 4, skin.s);
    /* neck */
    g.rect(8, 10 - lift, 2, 1, skin.s);

    var ty = TORSO.y - lift;
    var isDress = fit === 4;
    var longSleeve = (fit === 1 || fit === 2 || fit === 6);

    /* torso */
    g.rect(TORSO.x, ty, TORSO.w, TORSO.h, top.b);
    /* arms */
    var armC = longSleeve ? top.b : skin.b;
    if (dir === "down" || dir === "up") {
      g.rect(4, ty, 2, 4, armC); g.rect(12, ty, 2, 4, armC);
      g.rect(4, ty + 4, 2, 1, skin.b); g.rect(12, ty + 4, 2, 1, skin.b);
    } else {
      var ax = dir === "right" ? 11 : 5;
      g.rect(ax, ty + (frame === 1 ? -1 : frame === 3 ? 1 : 0), 2, 4, armC);
      g.rect(ax, ty + 4 + (frame === 1 ? -1 : frame === 3 ? 1 : 0), 2, 1, skin.b);
    }

    /* legs */
    var ly = 16 - lift;
    if (isDress) {
      g.rect(5, ty + 4, 8, 3, top.b);
      g.row(5, ty + 6, 8, top.s);
      g.rect(6, ly + 3, 2, 1, skin.b); g.rect(10, ly + 3, 2, 1, skin.b);
      g.rect(6, ly + 4 - legL, 2, 1, shoe.b); g.rect(10, ly + 4 - legR, 2, 1, shoe.b);
    } else {
      g.rect(6, ly, 2, 3 - legL, bottom.b);
      g.rect(10, ly, 2, 3 - legR, bottom.b);
      g.rect(6, ly + 3 - legL, 2, 2, shoe.b);
      g.rect(10, ly + 3 - legR, 2, 2, shoe.b);
      g.row(6, ly + 4 - legL, 2, shoe.s);
      g.row(10, ly + 4 - legR, 2, shoe.s);
    }

    /* outfit detailing */
    if (fit === 2) {                                     /* Knit jumper */
      g.row(TORSO.x, ty, TORSO.w, top.s);
      g.row(TORSO.x, ty + TORSO.h - 1, TORSO.w, top.s);
      g.set(TORSO.x + 1, ty + 2, top.s); g.set(TORSO.x + 4, ty + 2, top.s);
    } else if (fit === 3) {                              /* Dungarees */
      g.rect(TORSO.x, ty + 1, TORSO.w, TORSO.h - 1, bottom.b);
      g.rect(TORSO.x + 1, ty, 1, 2, bottom.b);
      g.rect(TORSO.x + 4, ty, 1, 2, bottom.b);
      g.rect(TORSO.x + 2, ty + 2, 2, 2, bottom.s);
    } else if (fit === 5) {                              /* Work apron */
      g.rect(TORSO.x + 1, ty + 1, TORSO.w - 2, TORSO.h - 1, bottom.b);
      g.row(TORSO.x + 1, ty + 1, TORSO.w - 2, bottom.s);
    } else if (fit === 6) {                              /* Raincoat */
      g.rect(TORSO.x, ty + TORSO.h - 1, TORSO.w, 1, top.s);
      g.rect(TORSO.x + 2, ty, 2, TORSO.h, top.s);
      if (dir === "up") g.rect(hx, hy + 5, HEAD.w, 3, top.b);
    } else if (fit === 7) {                              /* Striped tee */
      g.row(TORSO.x, ty + 1, TORSO.w, top.s);
      g.row(TORSO.x, ty + 3, TORSO.w, top.s);
    } else if (fit === 0 || fit === 1) {
      g.row(TORSO.x, ty + TORSO.h - 1, TORSO.w, top.s);
    }
    if (dir === "down" && !isDress && fit !== 3) {
      g.set(TORSO.x + 2, ty, skin.s); g.set(TORSO.x + 3, ty, skin.s);   /* collar */
    }
  }

  /* ------------------------------------------------------------ accessories */

  function accessories(g, ch, dir, frame) {
    var list = ch.accessories || [];
    var lift = (frame === 1 || frame === 3) ? 1 : 0;
    var hy = HEAD.y - lift, hx = HEAD.x;
    var acc = pick(CLOTH, ch.accColor);
    var eye = pick(EYE_COLORS, ch.eyeColor);

    if (list.indexOf("Earrings") >= 0 && dir !== "up") {
      if (dir === "down") { g.set(hx - 1, hy + 5, acc.b); g.set(hx + HEAD.w, hy + 5, acc.b); }
      else if (dir === "right") g.set(hx + 1, hy + 5, acc.b);
      else g.set(hx + HEAD.w - 2, hy + 5, acc.b);
    }
    if (list.indexOf("Glasses") >= 0 && dir !== "up") {
      var gy = hy + 4;
      if (dir === "down") {
        g.rect(hx, gy, 3, 2, "#e9f4f7"); g.rect(hx + 4, gy, 3, 2, "#e9f4f7");
        g.set(hx + 3, gy, OUTLINE);
        g.rect(hx + 1, gy, 2, 2, eye.b); g.rect(hx + 5, gy, 2, 2, eye.b);
        g.set(hx + 1, gy, "#ffffff"); g.set(hx + 5, gy, "#ffffff");
      } else {
        var ox = dir === "right" ? hx + 3 : hx + 1;
        g.rect(ox, gy, 3, 2, "#e9f4f7");
        g.rect(ox + (dir === "right" ? 1 : 0), gy, 2, 2, eye.b);
      }
    }
    if (list.indexOf("Scarf") >= 0) {
      g.rect(6, 10 - lift, 6, 2, acc.b);
      g.row(6, 11 - lift, 6, acc.s);
      if (dir !== "up") g.rect(8, 12 - lift, 2, 3, acc.b);
      else g.rect(8, 12 - lift, 2, 4, acc.b);
    }
    if (list.indexOf("Cap") >= 0) {
      g.rect(hx, hy, HEAD.w, 3, acc.b);
      g.row(hx + 1, hy - 1, HEAD.w - 2, acc.b);
      g.row(hx, hy + 1, HEAD.w, acc.s);
      if (dir === "down") g.row(hx - 1, hy + 3, HEAD.w + 2, acc.s);
      else if (dir === "right") g.rect(hx + HEAD.w, hy + 2, 2, 1, acc.s);
      else if (dir === "left") g.rect(hx - 2, hy + 2, 2, 1, acc.s);
    }
    if (list.indexOf("Sun hat") >= 0) {
      g.rect(hx + 1, hy - 2, HEAD.w - 2, 3, acc.b);
      g.row(hx + 2, hy - 3, HEAD.w - 4, acc.b);
      g.rect(hx - 2, hy + 1, HEAD.w + 4, 1, acc.b);
      g.rect(hx - 2, hy + 2, HEAD.w + 4, 1, acc.s);
      g.row(hx + 1, hy, HEAD.w - 2, acc.s);
    }
    if (list.indexOf("Satchel") >= 0) {
      var sy = 12 - lift;
      if (dir === "up" || dir === "down") {
        g.rect(dir === "up" ? 6 : 11, sy, 2, 3, acc.b);
        g.set(dir === "up" ? 6 : 11, sy + 1, acc.s);
      } else {
        g.rect(dir === "right" ? 5 : 11, sy, 2, 3, acc.b);
      }
      g.rect(6, sy - 1, 6, 1, acc.s);
    }
  }

  /* ----------------------------------------------------------------- render */

  function build(ch, dir, frame) {
    var g = new Grid();
    var hair = pick(HAIRS, ch.hairColor);
    var style = ((ch.hairStyle | 0) % HAIR_STYLES.length + HAIR_STYLES.length) % HAIR_STYLES.length;
    hairBack(g, hair, style, dir);
    body(g, ch, dir, frame);
    face(g, ch, dir);
    hairFront(g, hair, style, dir);
    accessories(g, ch, dir, frame);
    g.outline();
    return g;
  }

  function render(canvas, ch, dir, frame, scale) {
    var g = build(ch, dir || "down", frame || 0);
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

  /* ------------------------------------------------------------------ record */

  var FIRST = ["Wren", "Marlow", "Juniper", "Ash", "Pilar", "Otto", "Nell", "Caspian",
    "Maeve", "Rueben", "Ines", "Barnaby", "Sorrel", "Hana", "Teodor", "Clemence",
    "Bo", "Adaeze", "Mikkel", "Saoirse", "Tomas", "Fen", "Greta", "Yusuf"];
  var TOWNS = ["Marrow Hill", "Little Pike", "Saltbrook", "Wick", "Under-Elm",
    "Fallow End", "Copperfield", "Nine Ash", "Tern Bay", "Drybridge"];

  function randInt(n) { return Math.floor(Math.random() * n); }

  function randomChar(seedName) {
    var month = randInt(12) + 1, day = randInt(28) + 1;
    var accs = [];
    ACCESSORIES.forEach(function (a) { if (Math.random() < 0.22) accs.push(a); });
    return {
      name: seedName || FIRST[randInt(FIRST.length)],
      hometown: TOWNS[randInt(TOWNS.length)],
      birthMonth: month,
      birthDay: day,
      skin: randInt(SKINS.length),
      hairStyle: randInt(HAIR_STYLES.length),
      hairColor: randInt(HAIRS.length),
      eyeShape: randInt(EYE_SHAPES.length),
      eyeColor: randInt(EYE_COLORS.length),
      outfit: randInt(OUTFITS.length),
      topColor: randInt(CLOTH.length),
      bottomColor: randInt(CLOTH.length),
      shoeColor: randInt(CLOTH.length),
      accColor: randInt(CLOTH.length),
      accessories: accs,
      voice: randInt(11)
    };
  }

  function defaultChar() {
    return {
      name: "", hometown: "", birthMonth: 6, birthDay: 12,
      skin: 2, hairStyle: 1, hairColor: 3, eyeShape: 0, eyeColor: 0,
      outfit: 0, topColor: 11, bottomColor: 12, shoeColor: 14,
      accColor: 6, accessories: [], voice: 5
    };
  }

  root.CozySprite = {
    W: W, H: H, OUTLINE: OUTLINE,
    SKINS: SKINS, HAIRS: HAIRS, EYE_COLORS: EYE_COLORS, CLOTH: CLOTH,
    HAIR_STYLES: HAIR_STYLES, EYE_SHAPES: EYE_SHAPES, OUTFITS: OUTFITS,
    ACCESSORIES: ACCESSORIES,
    starSign: starSign, render: render, build: build,
    randomChar: randomChar, defaultChar: defaultChar,
    FIRST_NAMES: FIRST, TOWNS: TOWNS
  };
})(typeof window !== "undefined" ? window : this);
