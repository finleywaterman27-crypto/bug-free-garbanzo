/*
 * Cozy game — character sprite system (v3).
 *
 * Twice the resolution of v2, and twice the detail to fill it. The figure is
 * about 36x90 inside a 52x124 grid. What the extra pixels buy:
 *
 *   eyes      lid, sclera, iris, pupil and a catchlight — five tones, where
 *             v2 had a white column beside a dark one
 *   nose      a bridge, a tip and two nostrils instead of one pixel
 *   mouth     an upper and a lower lip, lit differently
 *   ears      an outer edge and an inner hollow
 *   hair      strand lines through the mass rather than a flat cap
 *   clothes   collars, cuffs, hems, seams, buttons and folds
 *   hands     a thumb
 *   shoes     a sole, an upper and a lace line
 *
 * Colour still works the v2 way: palettes store one base colour each and the
 * shades, highlights and outline derive from it, with near-black tones getting
 * a rim light instead of a dark outline so they keep their silhouette.
 */
(function (root) {
  "use strict";

  var W = 52, H = 124;
  var U = 2;                        /* one "old pixel" is now this many */

  var DARK = [36, 27, 38];
  var LIGHT = [255, 246, 232];

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

  /** Readable against its own base: shadow on light tones, rim light on dark. */
  function contrastOf(hex, strength) {
    return luma(hex) < 66 ? tint(hex, strength * 1.15) : shade(hex, strength * 1.9);
  }

  var toneCache = {};
  /** One base colour expands into the tones the renderer paints with. */
  function tone(hex) {
    if (toneCache[hex]) return toneCache[hex];
    var t = {
      b: hex,
      s: shade(hex, 0.16),
      d: shade(hex, 0.32),
      dd: shade(hex, 0.46),
      h: tint(hex, 0.18),
      hh: tint(hex, 0.36),
      o: luma(hex) < 66 ? tint(hex, 0.34) : shade(hex, 0.58),
      f: contrastOf(hex, 0.30),
      ff: contrastOf(hex, 0.18)
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
    P("Onyx", "#3a1f13"), P("Ink", "#2c1810"),
    P("Ivory", "#fbdcc2"), P("Wheat", "#f5cba7"), P("Olive", "#dcae7c"),
    P("Golden", "#d19a60"), P("Terracotta", "#c07f4c"), P("Umber", "#96583a"),
    P("Bronze", "#7d4a2d"), P("Mahogany", "#663823")
  ];

  var HAIRS = [
    P("Black", "#1a1620"), P("Soot", "#2e2833"), P("Dark brown", "#3a2a1e"),
    P("Coffee", "#4e3524"), P("Brown", "#62402a"), P("Chestnut", "#7a4f2f"),
    P("Auburn", "#8e4526"), P("Copper", "#a9501f"), P("Ginger", "#c2601c"),
    P("Apricot", "#d98f57"), P("Honey", "#e0b25c"), P("Wheat", "#eccf8e"),
    P("Platinum", "#f0e4c0"), P("Ash", "#bdb3a3"), P("Silver", "#948f89"),
    P("Snow", "#e8e8e0"), P("Seafoam", "#3f7f74"), P("Cornflower", "#43629e"),
    P("Peony", "#c96f95"), P("Plum", "#7a539e"),
    P("Burgundy", "#6e2436"), P("Mahogany", "#6b2f22"), P("Sand", "#c9a86a"),
    P("Strawberry", "#d4713f"), P("Rose gold", "#dba088"), P("Mint", "#8fcfae"),
    P("Teal", "#2f6f80"), P("Lavender", "#b096d6"), P("Forest", "#37543a"),
    P("Midnight", "#2c3557"), P("Blossom", "#eeb3c6"), P("Butter", "#f3dd9a")
  ];

  var EYE_COLORS = [
    P("Coffee", "#3b2a1c"), P("Ink", "#241b21"), P("Hazel", "#6b4f2a"),
    P("Amber", "#9a6a22"), P("Moss", "#3f7a45"), P("Sea", "#2f6b7d"),
    P("Sky", "#4f86bd"), P("Slate", "#6b7780"), P("Violet", "#7a5aa0"),
    P("Russet", "#8a4a3a"), P("Jade", "#2f7a63"), P("Storm", "#4a5a6b"),
    P("Copper", "#b5702a"), P("Pale blue", "#8fb6d6"), P("Olive", "#6b7a3a"),
    P("Wine", "#6b3348")
  ];

  var CLOTH = [
    P("Chalk", "#f2efe6"), P("Cream", "#e6dcc4"), P("Sand", "#d8c49f"),
    P("Camel", "#c9a87c"), P("Rose", "#dc93a6"), P("Poppy", "#c4483f"),
    P("Brick", "#9c4436"), P("Rust", "#a8552c"), P("Marigold", "#d9992b"),
    P("Butter", "#ecd06a"), P("Olive", "#8a8f45"), P("Meadow", "#5f8a4e"),
    P("Fern", "#35705e"), P("Lagoon", "#2e7d78"), P("Sky", "#6fa8d4"),
    P("Denim", "#3f5f9e"), P("Navy", "#34477a"), P("Iris", "#6f4f96"),
    P("Cocoa", "#6b4a33"), P("Charcoal", "#3c3a44"),
    P("Blush", "#eec4c4"), P("Coral", "#e0785e"), P("Lilac", "#b9a3d8"),
    P("Mint", "#9fd4b4"), P("Seafoam", "#7fc0b0"), P("Mustard", "#c8a227"),
    P("Plum", "#5c3350"), P("Wine", "#7a2f3f"), P("Slate", "#5e6b74"),
    P("Moss", "#556b39"), P("Ink", "#22242e"), P("Bone", "#ddd6c4")
  ];

  /* -------------------------------------------------------------- styles ---- */

  /* Hair is parameterised rather than hand-drawn per style, which keeps
   * eighteen cuts consistent with each other instead of eighteen accidents.
   *   vol    how far the hair stands off the skull (0-2)
   *   fringe none | straight | side | swept | curly
   *   side   how far down the sides it falls, in pixels
   *   back   none | fall | ponytail | bun | lowbun | braids | locs      */
  /* Hair is parameterised rather than hand-drawn per style, which keeps
   * thirty-six cuts consistent with each other instead of thirty-six accidents.
   *   vol    how far the hair stands off the skull (0-3)
   *   fringe none | straight | blunt | side | swept | middle | curly | spiky | quiff
   *   side   how far down the sides it falls, in pixels
   *   back   none | fall | ponytail | highpony | sidepony | pigtails | bun |
   *          lowbun | buns | halfup | braids | fishtail | locs | twists | bantu */
  var HAIR_STYLES = [
    { n: "Shaved",       vol: 0, fringe: "none",     side: 0,  back: "none", bald: true },
    { n: "Buzzed",       vol: 0, fringe: "none",     side: 1,  back: "none", thin: true },
    { n: "Crew cut",     vol: 0, fringe: "none",     side: 1,  back: "none" },
    { n: "Cropped",      vol: 0, fringe: "none",     side: 2,  back: "none" },
    { n: "Undercut",     vol: 2, fringe: "swept",    side: 0,  back: "none" },
    { n: "Mohawk",       vol: 3, fringe: "spiky",    side: 0,  back: "none", mohawk: true },
    { n: "Spiky",        vol: 2, fringe: "spiky",    side: 1,  back: "none" },
    { n: "Quiff",        vol: 2, fringe: "quiff",    side: 1,  back: "none" },
    { n: "Pompadour",    vol: 3, fringe: "quiff",    side: 1,  back: "none" },
    { n: "Slicked back", vol: 1, fringe: "none",     side: 2,  back: "none", slick: true },
    { n: "Side part",    vol: 1, fringe: "side",     side: 3,  back: "none" },
    { n: "Middle part",  vol: 1, fringe: "middle",   side: 5,  back: "none" },
    { n: "Swept",        vol: 1, fringe: "swept",    side: 3,  back: "none" },
    { n: "Tousled",      vol: 2, fringe: "swept",    side: 2,  back: "none", messy: true },
    { n: "Fringe",       vol: 1, fringe: "straight", side: 4,  back: "none" },
    { n: "Blunt fringe", vol: 1, fringe: "blunt",    side: 6,  back: "none" },
    { n: "Bowl cut",     vol: 1, fringe: "blunt",    side: 5,  back: "none", bowl: true },
    { n: "Bob",          vol: 1, fringe: "blunt",    side: 9,  back: "none" },
    { n: "Chin length",  vol: 1, fringe: "side",     side: 8,  back: "none" },
    { n: "Shoulder",     vol: 1, fringe: "straight", side: 12, back: "fall" },
    { n: "Long",         vol: 1, fringe: "straight", side: 16, back: "fall" },
    { n: "Hime",         vol: 1, fringe: "blunt",    side: 15, back: "fall", hime: true },
    { n: "Waves",        vol: 2, fringe: "side",     side: 13, back: "fall", wavy: true },
    { n: "Long curls",   vol: 2, fringe: "curly",    side: 13, back: "fall", curly: true },
    { n: "Curls",        vol: 2, fringe: "curly",    side: 6,  back: "none", curly: true },
    { n: "Coils",        vol: 2, fringe: "curly",    side: 3,  back: "none", curly: true, tight: true },
    { n: "Afro",         vol: 3, fringe: "curly",    side: 5,  back: "none", curly: true },
    { n: "Locs",         vol: 1, fringe: "none",     side: 4,  back: "locs" },
    { n: "Twists",       vol: 1, fringe: "none",     side: 4,  back: "twists" },
    { n: "Bantu knots",  vol: 1, fringe: "none",     side: 2,  back: "bantu" },
    { n: "Ponytail",     vol: 1, fringe: "side",     side: 3,  back: "ponytail" },
    { n: "High ponytail",vol: 1, fringe: "swept",    side: 2,  back: "highpony" },
    { n: "Side ponytail",vol: 1, fringe: "side",     side: 4,  back: "sidepony" },
    { n: "Pigtails",     vol: 1, fringe: "straight", side: 3,  back: "pigtails" },
    { n: "Space buns",   vol: 1, fringe: "straight", side: 2,  back: "buns" },
    { n: "High bun",     vol: 1, fringe: "swept",    side: 2,  back: "bun" },
    { n: "Low bun",      vol: 1, fringe: "side",     side: 4,  back: "lowbun" },
    { n: "Half up",      vol: 1, fringe: "side",     side: 10, back: "halfup" },
    { n: "Braids",       vol: 1, fringe: "straight", side: 3,  back: "braids" },
    { n: "Fishtail",     vol: 1, fringe: "side",     side: 3,  back: "fishtail" }
  ];

  function styleIndex(name) {
    for (var i = 0; i < HAIR_STYLES.length; i++) if (HAIR_STYLES[i].n === name) return i;
    return 0;
  }

  var EYE_SHAPES = ["Round", "Soft", "Almond", "Sleepy", "Wide", "Keen", "Downturned", "Bright",
    "Upturned", "Hooded", "Monolid", "Narrow"];

  var EYEBROWS = ["Natural", "Straight", "Thick", "Thin", "Arched", "Angled", "Rounded", "Bushy", "Fine"];

  var HAIR_ACCENT = ["None", "Dyed tips", "Streak", "Roots", "Ombre"];

  var OUTFITS = [
    "T-shirt", "Long sleeves", "Knit jumper", "Fisherman's knit", "Dungarees",
    "Sundress", "Work apron", "Raincoat", "Striped tee", "Cardigan",
    "Overshirt", "Waistcoat",
    "Hoodie", "Shirt & tie", "Tank top", "Poncho", "Robe", "Pinafore",
    "Gilet", "Long coat", "Smock", "Tunic"
  ];

  var ACCESSORIES = ["Glasses", "Round glasses", "Sunglasses", "Sun hat", "Cap", "Beanie",
    "Bucket hat", "Beret", "Headscarf", "Headband", "Flower crown", "Goggles",
    "Scarf", "Neckerchief", "Necklace", "Earrings", "Satchel", "Tool belt"];

  var DETAILS = ["None", "Freckles", "Blush", "Freckles & blush",
    "Beauty mark", "Dimples", "Scar", "Tired eyes"];

  var GENDERS = ["Female", "Male"];

  /* Three silhouettes. Everyone can wear everything; this only changes the
   * width of the torso and hips, and the arms and legs that hang off them. */
  var BUILDS = [
    { n: "Slight", tw: 10, hw: 8, stw: 7 },
    { n: "Average", tw: 12, hw: 10, stw: 8 },
    { n: "Broad", tw: 14, hw: 12, stw: 9 }
  ];

  var NOSES = ["Button", "Straight", "Upturned", "Roman", "Wide", "Small"];
  var MOUTHS = ["Neutral", "Smile", "Wide", "Small", "Pout", "Grin"];

  var FACIAL_HAIR = ["Clean-shaven", "Stubble", "Moustache", "Goatee", "Beard", "Full beard",
    "Sideburns", "Mutton chops", "Soul patch", "Handlebar", "Short boxed", "Long beard"];

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
  Grid.prototype.clear = function (x, y, w, h) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      if (x + i >= 0 && y + j >= 0 && x + i < W && y + j < H) this.px[(y + j) * W + (x + i)] = null;
    }
  };
  /** Round a rectangle's corners by the given radius, in pixels. */
  Grid.prototype.round = function (x, y, w, h, r) {
    for (var j = 0; j < r; j++) {
      var cut = r - j;
      this.clear(x, y + j, cut, 1);
      this.clear(x + w - cut, y + j, cut, 1);
      this.clear(x, y + h - 1 - j, cut, 1);
      this.clear(x + w - cut, y + h - 1 - j, cut, 1);
    }
  };
  /** Stripe a region with a lighter tone, for hair strands and knitwear. */
  Grid.prototype.strands = function (x, y, w, h, step, c) {
    for (var i = 0; i < w; i += step) this.col(x + i, y, h, c);
  };
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
          if (src[ny * W + nx]) { found = src[ny * W + nx]; break; }
        }
        if (found) this.px[y * W + x] = tone(found).o;
      }
    }
  };

  /* ------------------------------------------------------------ geometry ---- */

  var HEAD = { x: 18, y: 22, w: 16, h: 20 };
  var HEAD_SIDE = { x: 20, y: 22, w: 14, h: 20 };
  var HD = HEAD;
  var NECK = { x: 24, y: 42, w: 4, h: 4 };
  var TORSO = { x: 14, y: 46, w: 24, h: 24 };
  var ARM = { w: 6, h: 28, hand: 6 };
  var HIPS = { x: 16, y: 70, w: 20, h: 8 };
  var LEG = { y: 78, h: 30, w: 8 };
  var SHOE = { y: 108, h: 4, w: 10 };
  var MIDX = 26;                    /* everything is centred here */

  /* Face rows, measured down from the top of the head. */
  var R = { brow: 6, eye: 8, nose: 12, mouth: 15, chin: 17 };

  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }
  function idx(i, list) { return ((i | 0) % list.length + list.length) % list.length; }
  function styleOf(ch) { return HAIR_STYLES[idx(ch.hairStyle, HAIR_STYLES)]; }

  /* ---------------------------------------------------------------- hair ---- */

  function hairBack(g, c, st, dir, lift) {
    if (st.bald) return;
    var x = HD.x, y = HD.y - lift, w = HD.w, v = st.vol * 2, k = st.back;
    var side = st.side * 2;

    if (k === "fall") {
      var len = side + 10;
      g.rect(x - v - 2, y + 8, w + 2 * v + 4, len, c.b);
      g.rect(x - v - 2, y + 8, 2, len, c.s);
      g.rect(x + w + v, y + 8, 2, len, c.s);
      g.strands(x - v, y + 12, w + 2 * v, len - 6, 5, c.s);
      g.row(x - v - 2, y + 8 + len - 1, w + 2 * v + 4, c.d);
      if (st.wavy) {
        g.rect(x - v - 2, y + 8 + len, 6, 2, c.b);
        g.rect(x + w + v - 2, y + 8 + len, 6, 2, c.b);
        g.rect(x + 4, y + 8 + len, 8, 2, c.s);
      }
    } else if (k === "ponytail") {
      g.rect(x + w + v, y + 12, 5, 22, c.b);
      g.rect(x + w + v + 3, y + 12, 2, 22, c.s);
      g.strands(x + w + v, y + 14, 5, 18, 2, c.s);
      g.rect(x + w + v - 1, y + 32, 4, 4, c.d);
      if (dir === "up") g.rect(x + 6, y + 14, 6, 24, c.b);
    } else if (k === "highpony") {
      g.rect(x + w + v - 2, y - v - 2, 6, 8, c.b);
      g.rect(x + w + v, y + 4, 5, 20, c.b);
      g.rect(x + w + v + 3, y + 4, 2, 20, c.s);
      g.row(x + w + v - 2, y - v - 2, 6, c.h);
    } else if (k === "sidepony") {
      g.rect(x + w + v - 2, y + 15, 6, 20, c.b);
      g.rect(x + w + v + 2, y + 15, 2, 20, c.s);
      g.row(x + w + v - 2, y + 33, 6, c.d);
    } else if (k === "pigtails") {
      [x - v - 6, x + w + v].forEach(function (bx, i) {
        g.rect(bx, y + 11, 6, 20, c.b);
        g.rect(i === 0 ? bx : bx + 4, y + 11, 2, 20, c.s);
        g.strands(bx, y + 13, 6, 16, 3, c.s);
        g.row(bx, y + 29, 6, c.d);
        g.row(bx + 1, y + 11, 4, c.h);
      });
    } else if (k === "buns") {
      [x - 2, x + w - 6].forEach(function (bx) {
        g.rect(bx, y - v - 11, 8, 7, c.b);
        g.round(bx, y - v - 11, 8, 7, 2);
        g.rect(bx + 1, y - v - 10, 3, 2, c.hh);
        g.row(bx, y - v - 6, 8, c.s);
      });
    } else if (k === "bun") {
      g.rect(x + 4, y - v - 11, 8, 8, c.b);
      g.round(x + 4, y - v - 11, 8, 8, 2);
      g.rect(x + 5, y - v - 10, 3, 2, c.hh);
      g.rect(x + 10, y - v - 9, 2, 5, c.s);
    } else if (k === "lowbun") {
      g.rect(x + w - 3, y + 20, 7, 8, c.b);
      g.round(x + w - 3, y + 20, 7, 8, 2);
      g.rect(x + w + 2, y + 21, 2, 6, c.s);
      g.rect(x + w - 2, y + 21, 3, 2, c.h);
      if (dir === "up") { g.rect(x + 5, y + 20, 8, 8, c.b); g.rect(x + 6, y + 21, 3, 2, c.h); }
    } else if (k === "halfup") {
      var hl = side + 8;
      g.rect(x - v - 2, y + 8, w + 2 * v + 4, hl, c.b);
      g.rect(x - v - 2, y + 8, 2, hl, c.s);
      g.rect(x + w + v, y + 8, 2, hl, c.s);
      g.strands(x - v, y + 12, w + 2 * v, hl - 6, 5, c.s);
      g.rect(x + 5, y - v - 5, 7, 5, c.b);
      g.rect(x + 6, y - v - 5, 3, 2, c.hh);
    } else if (k === "braids") {
      [x - v - 5, x + w + v].forEach(function (bx) {
        g.rect(bx, y + 13, 5, 26, c.b);
        for (var i = y + 15; i < y + 37; i += 4) {
          g.row(bx, i, 5, c.s);
          g.set(bx + 2, i + 2, c.hh);
        }
        g.row(bx, y + 38, 5, c.d);
      });
    } else if (k === "fishtail") {
      var fx = dir === "up" ? x + 6 : x + w + v - 2;
      g.rect(fx, y + 13, 6, 26, c.b);
      for (var f = y + 15; f < y + 38; f += 4) {
        g.row(fx, f, 3, c.s); g.row(fx + 3, f + 2, 3, c.s);
      }
      g.row(fx, y + 38, 6, c.d);
      if (dir === "up") g.rect(x + 4, y + 9, 9, 6, c.b);
    } else if (k === "locs" || k === "twists") {
      var step = k === "twists" ? 5 : 3;
      g.rect(x - v - 2, y + 8, w + 2 * v + 4, 22, c.b);
      for (var i = 0; i < w + 2 * v + 4; i += step) {
        g.col(x - v - 2 + i, y + 10, 20, c.s);
        g.rect(x - v - 2 + i, y + 28, step - 1, 2, c.d);
        if (k === "twists") { g.set(x - v + i, y + 16, c.d); g.set(x - v + i, y + 22, c.d); }
      }
    } else if (k === "bantu") {
      [x, x + 6, x + 12].forEach(function (bx) {
        g.rect(bx, y - v - 5, 4, 5, c.b);
        g.round(bx, y - v - 5, 4, 5, 1);
        g.set(bx + 1, y - v - 4, c.hh);
      });
    }
  }

  function hairFront(g, c, st, dir, lift) {
    if (st.bald) return;
    var x = HD.x, y = HD.y - lift, w = HD.w, v = st.vol * 2;
    var side = st.side * 2;

    if (st.mohawk) {
      g.rect(x + 5, y - 5, 7, 14, c.b);
      g.rect(x + 6, y - 9, 5, 5, c.b);
      g.rect(x + 6, y - 9, 2, 4, c.hh);
      g.col(x + 11, y - 5, 14, c.s);
      g.rect(x + 3, y + 5, 2, 4, c.b); g.rect(x + 12, y + 5, 2, 4, c.b);
      if (dir === "up") g.rect(x + 5, y - 5, 7, 24, c.b);
      return;
    }

    var capH = st.thin ? 4 : 6 + v;
    g.rect(x - v, y - v, w + 2 * v, capH, c.b);
    if (!st.thin) g.rect(x - v + 2, y - v - 2, w + 2 * v - 4, 2, c.b);
    g.round(x - v, y - v - (st.thin ? 0 : 2), w + 2 * v, capH + (st.thin ? 0 : 2), 2);
    g.rect(x + 2, y - v, 6, 3, c.hh);            /* the light on the crown */
    g.rect(x + 2, y - v + 3, 3, 2, c.h);
    if (!st.slick && !st.thin) g.strands(x - v + 1, y - v + 2, w + 2 * v - 2, capH - 2, 5, c.s);

    if (side > 0) {
      var sw = 2 + v;
      g.rect(x - v, y + 2, sw, side, c.b);
      g.rect(x - v, y + 2, 2, side, c.s);
      g.strands(x - v, y + 4, sw, side - 2, 4, c.s);
      if (dir !== "right") {
        g.rect(x + w - 2, y + 2, sw, side, c.b);
        g.rect(x + w + v - 2, y + 2, 2, side, c.s);
        g.strands(x + w - 2, y + 4, sw, side - 2, 4, c.s);
      } else {
        g.rect(x + w + v - 2, y + 2, 2, Math.min(side, 7), c.s);
      }
      if (st.hime) {
        g.row(x - v, y + 2 + side - 1, sw, c.d);
        if (dir !== "right") g.row(x + w - 2, y + 2 + side - 1, sw, c.d);
      }
    }
    if (st.bowl) {
      g.rect(x - v, y + 2, w + 2 * v, 6, c.b);
      g.row(x - v, y + 6, w + 2 * v, c.s);
      g.row(x - v, y + 7, w + 2 * v, c.d);
      g.strands(x - v + 1, y + 3, w + 2 * v - 2, 4, 5, c.s);
    }
    if (st.slick) {
      for (var sl = 0; sl < capH - 1; sl += 2) g.row(x, y + sl, w, sl % 4 ? c.s : c.h);
    }

    /* the fringe stops above the eyes, which start at R.eye */
    var fy = y + capH - v;
    var f = st.fringe;
    if (f === "straight") {
      g.rect(x, fy, w, 2, c.b);
      g.rect(x, fy + 2, 4, 2, c.b); g.rect(x + w - 4, fy + 2, 4, 2, c.b);
      g.strands(x + 1, fy, w - 2, 2, 5, c.s);
    } else if (f === "blunt") {
      g.rect(x, fy, w, 4, c.b);
      g.row(x + 1, fy + 3, w - 2, c.s);
      g.strands(x + 1, fy, w - 2, 3, 4, c.s);
    } else if (f === "side") {
      g.rect(x, fy, w - 4, 2, c.b);
      g.rect(x, fy + 2, 6, 2, c.b);
      g.rect(x + w - 2, fy, 2, 2, c.s);
      g.strands(x + 1, fy, w - 6, 2, 4, c.h);
    } else if (f === "swept") {
      g.rect(x, fy, w, 2, c.b);
      g.rect(x + w - 6, fy + 2, 6, 2, c.b);
      g.rect(x, fy, 3, 2, c.hh);
    } else if (f === "middle") {
      g.rect(x, fy, 6, 2, c.b); g.rect(x + w - 6, fy, 6, 2, c.b);
      g.rect(x, fy + 2, 3, 2, c.b); g.rect(x + w - 3, fy + 2, 3, 2, c.b);
      g.rect(x + 6, fy - 2, 4, 2, c.s);
    } else if (f === "curly") {
      g.rect(x - v, fy - 2, w + 2 * v, 4, c.b);
      for (var i = 0; i < w + 2 * v; i += (st.tight ? 3 : 5)) g.rect(x - v + i, fy + 2, 2, 2, c.b);
      g.rect(x - v - 2, y + 4, 2, 4, c.b); g.rect(x + w + v, y + 4, 2, 4, c.b);
    } else if (f === "spiky") {
      g.rect(x, fy, w, 2, c.b);
      for (var k = 0; k < w; k += 4) { g.rect(x + k, y - v - 5, 2, 5, c.b); g.set(x + k, y - v - 5, c.h); }
    } else if (f === "quiff") {
      g.rect(x + 2, y - v - 7, 10, 7, c.b);
      g.rect(x + 2, y - v - 7, 4, 3, c.hh);
      g.rect(x, fy, w - 4, 2, c.b);
    }

    if (st.curly) {
      g.rect(x - v - 2, y - v + 2, 2, 3, c.b); g.rect(x + w + v, y - v + 2, 2, 3, c.b);
      [1, 7, 12].forEach(function (o) { g.rect(x + o, y - v - 4, 3, 3, c.b); });
      g.rect(x - v - 2, y + 7, 2, 3, c.s); g.rect(x + w + v, y + 7, 2, 3, c.s);
      if (st.tight) for (var t = 0; t < w; t += 3) g.set(x + t, y - v + 3, c.s);
    }
    if (st.messy) {
      g.rect(x - v - 2, y - v, 2, 2, c.b); g.rect(x + w + v, y - v + 2, 2, 2, c.b);
      g.rect(x + 3, y - v - 4, 2, 3, c.b); g.rect(x + 10, y - v - 4, 3, 3, c.b);
    }

    if (dir === "up") {
      g.rect(x - v, y - v, w + 2 * v, 19 + v, c.b);
      g.round(x - v, y - v, w + 2 * v, 19 + v, 2);
      g.rect(x - v, y + 2, 2, 16, c.s); g.rect(x + w + v - 2, y + 2, 2, 16, c.s);
      g.rect(x + 3, y - v + 2, 5, 3, c.hh);
      g.strands(x - v + 1, y + 2, w + 2 * v - 2, 15, 5, c.s);
      if (st.back === "bun") { g.rect(x + 4, y - v - 11, 8, 8, c.b); g.rect(x + 5, y - v - 10, 3, 2, c.hh); }
      if (st.back === "buns") [x - 2, x + w - 6].forEach(function (bx) { g.rect(bx, y - v - 11, 8, 7, c.b); });
      if (st.back === "bantu") [x, x + 6, x + 12].forEach(function (bx) { g.rect(bx, y - v - 5, 4, 5, c.b); });
    }
  }

  /** Dyed tips, a streak, roots or an ombre, painted over hair already down. */
  function hairAccent(g, ch, lift) {
    var mode = idx(ch.hairAccent, HAIR_ACCENT);
    if (!mode) return;
    var base = tone(pick(HAIRS, ch.hairColor).b);
    var to = tone(pick(HAIRS, ch.hairAccentColor).b);
    var y = HD.y - lift;
    var band = mode === 1 ? [y + 20, H] : mode === 3 ? [0, y + 8] : mode === 4 ? [y + 15, H] : [0, H];
    var cols = mode === 2 ? [HD.x + 2, HD.x + 7] : null;
    var map = { }; map[base.b] = to.b; map[base.s] = to.s; map[base.d] = to.d;
    map[base.dd] = to.dd; map[base.h] = to.h; map[base.hh] = to.hh;

    for (var yy = Math.max(0, band[0]); yy < Math.min(H, band[1]); yy++) {
      for (var xx = 0; xx < W; xx++) {
        if (cols && (xx < cols[0] || xx > cols[1])) continue;
        var c = g.get(xx, yy);
        if (c && map[c]) g.set(xx, yy, map[c]);
      }
    }
  }
  /* ---------------------------------------------------------------- face ---- */

  function eye(g, x, y, sk, hair, iris, shape, facing) {
    var w = 4, h = 4;
    var lash = hair.d, lid = sk.ff;
    var top = y, bot = y + h - 1;
    var ix = facing < 0 ? x : x + 1;            /* which way the iris looks */

    if (shape === 11) { top = y + 1; h = 3; bot = y + 3; }

    g.rect(x, top + 1, w, bot - top - 1, "#fbf7ee");           /* sclera */
    g.rect(ix, top + 1, 2, bot - top - 1, iris.b);             /* iris */
    g.set(ix, bot - 1, iris.d);
    g.set(ix + 1, bot - 1, iris.dd);                           /* pupil */
    g.set(ix + 1, top + 1, tint(iris.b, 0.55));                /* catchlight */

    g.row(x, top, w, lash);                                    /* upper lash */
    g.row(x, bot, w, lid);                                     /* lower lid */

    if (shape === 1) { g.clear(x, top, 1, 1); g.clear(x + w - 1, top, 1, 1); }
    else if (shape === 2) { g.row(x, top + 1, w, lash); g.set(x, top + 2, lash); }
    else if (shape === 3) { g.row(x, top, w, lash); g.row(x, top + 1, w, lash); g.set(ix, top + 2, iris.b); g.set(ix + 1, top + 2, iris.d); }
    else if (shape === 4) { g.rect(x, bot, w, 2, "#fbf7ee"); g.rect(ix, bot, 2, 1, iris.b); g.row(x, bot + 1, w, lid); }
    else if (shape === 5) { g.row(x, bot, w, lash); }
    else if (shape === 6) { g.set(x + w - 1, top, lid); g.set(x + w - 1, top + 1, lash); g.set(x, bot, lash); }
    else if (shape === 7) { g.rect(ix + 1, top + 1, 2, 2, tint(iris.b, 0.6)); g.set(ix + 1, top + 2, iris.dd); }
    else if (shape === 8) { g.set(x, bot, lid); g.set(x + w - 1, top, lash); g.set(x + w - 1, top - 1, lash); }
    else if (shape === 9) { g.row(x, top - 1, w, lid); g.row(x, top, w, lash); }
    else if (shape === 10) { g.row(x, top, w, lid); g.row(x, top + 1, w, lash); }
  }

  function brow(g, x, y, c, style) {
    if (style === 0) g.rect(x, y, 6, 2, c.s);
    else if (style === 1) g.rect(x - 1, y, 8, 2, c.s);
    else if (style === 2) { g.rect(x - 1, y - 1, 8, 3, c.b); g.row(x, y + 2, 6, c.s); }
    else if (style === 3) g.rect(x + 1, y + 1, 5, 1, c.s);
    else if (style === 4) { g.rect(x, y + 1, 3, 2, c.s); g.rect(x + 3, y - 1, 3, 2, c.s); }
    else if (style === 5) { g.rect(x, y - 1, 3, 2, c.s); g.rect(x + 3, y + 1, 3, 2, c.s); }
    else if (style === 6) g.rect(x, y - 1, 6, 2, c.s);
    else if (style === 7) { g.rect(x - 1, y - 2, 8, 4, c.b); g.strands(x, y - 1, 6, 3, 2, c.s); }
    else if (style === 8) g.rect(x + 2, y - 1, 4, 1, c.s);
  }

  function face(g, ch, dir, lift) {
    if (dir === "up") return;
    var sk = tone(pick(SKINS, ch.skin).b);
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var iris = tone(pick(EYE_COLORS, ch.eyeColor).b);
    var shape = idx(ch.eyeShape, EYE_SHAPES);
    var bw = idx(ch.eyebrows, EYEBROWS);
    var det = idx(ch.details, DETAILS);
    var nose = idx(ch.nose, NOSES);
    var mouth = idx(ch.mouth, MOUTHS);
    var x = HD.x, y = HD.y - lift, w = HD.w;
    var front = dir === "right";
    var ey = y + R.eye;

    /* ears, with a hollow */
    if (dir === "down") {
      [x - 2, x + w].forEach(function (ex, i) {
        g.rect(ex, y + 8, 2, 5, sk.b);
        g.set(ex + (i ? 0 : 1), y + 9, sk.d);
        g.set(ex + (i ? 0 : 1), y + 10, sk.s);
      });
    } else {
      g.rect(x + 2, y + 8, 3, 5, sk.s);
      g.rect(x + 3, y + 9, 1, 3, sk.d);
    }

    if (dir === "down") {
      eye(g, x + 2, ey, sk, hair, iris, shape, -1);
      eye(g, x + w - 6, ey, sk, hair, iris, shape, 1);
      brow(g, x + 2, y + R.brow, hair, bw);
      brow(g, x + w - 8, y + R.brow, hair, bw);
    } else {
      eye(g, x + w - 7, ey, sk, hair, iris, shape, 1);
      brow(g, x + w - 9, y + R.brow, hair, bw);
    }

    /* ---- nose: a bridge, a tip and nostrils ---- */
    var m = MIDX;
    if (dir === "down") {
      var len = nose === 3 ? 6 : nose === 5 ? 3 : 4;
      var wide = nose === 4 ? 4 : 2;
      g.rect(m - 1, y + 13 - len, 1, len, sk.ff);                 /* bridge */
      g.rect(m - wide / 2 - 1, y + 13, wide + 2, 2, sk.s);        /* the tip */
      g.rect(m - wide / 2, y + 14, wide, 1, sk.f);
      g.set(m - wide / 2 - 1, y + 14, sk.f); g.set(m + wide / 2, y + 14, sk.f);
      if (nose === 2) { g.set(m + 1, y + 13, sk.hh); g.clear(m - 2, y + 14, 1, 1); }
      if (nose === 3) { g.rect(m - 1, y + 9, 2, 2, sk.s); }
      if (nose === 0) g.set(m, y + 13, sk.hh);
    } else {
      var out = front ? x + w : x - 1;
      var far = front ? 1 : -1;
      var drop = nose === 3 ? 5 : nose === 5 ? 2 : 3;
      for (var i = 0; i < drop; i++) g.set(out, y + 11 + i, sk.b);
      g.set(out + far, y + 13, sk.b);
      if (nose === 4) { g.set(out + far, y + 14, sk.b); g.set(out, y + 15, sk.s); }
      if (nose === 2) g.set(out + far, y + 12, sk.b);
      if (nose === 3) { g.set(out, y + 10, sk.b); g.set(out + far, y + 14, sk.s); }
      g.set(front ? x + w - 1 : x, y + 15, sk.f);
    }

    /* ---- mouth: two lips, lit differently ---- */
    var mw = mouth === 2 || mouth === 5 ? 8 : mouth === 3 ? 4 : 6;
    var mx = dir === "down" ? m - mw / 2 : front ? x + w - mw - 1 : x + 1;
    var my = y + R.mouth;
    g.rect(mx, my, mw, 1, sk.f);
    g.rect(mx + 1, my + 1, mw - 2, 1, tint(sk.b, 0.22));
    if (mouth === 1) { g.set(mx - 1, my - 1, sk.f); g.set(mx + mw, my - 1, sk.f); }
    else if (mouth === 4) { g.rect(mx + 1, my + 2, mw - 2, 1, sk.s); g.rect(mx + 2, my - 1, mw - 4, 1, sk.s); }
    else if (mouth === 5) { g.rect(mx + 1, my - 1, mw - 2, 1, "#f4e3d6"); g.set(mx, my - 1, sk.f); g.set(mx + mw - 1, my - 1, sk.f); }
    else if (mouth === 0) g.rect(mx + 1, my + 1, mw - 2, 1, sk.s);

    /* ---- modelling ---- */
    g.rect(front ? x : x + w - 2, y + 4, 2, 13, sk.ff);          /* cheek in shade */
    g.rect(x + 2, y + R.chin, w - 4, 2, sk.ff);                  /* under the jaw */
    g.rect(x + 4, y + 2, 6, 2, sk.h);                            /* light on the brow */

    var blush = mix(sk.b, [222, 118, 118], 0.36);
    var cl = dir === "down" ? x + 1 : front ? x + 4 : x + 2;
    var cr = dir === "down" ? x + w - 4 : front ? x + w - 5 : x + 5;
    if (det === 1 || det === 3) {
      [cl, cr].forEach(function (cx) {
        g.set(cx + 1, y + 12, sk.f); g.set(cx + 2, y + 14, sk.f); g.set(cx, y + 15, sk.f);
      });
    }
    if (det === 2 || det === 3) { g.rect(cl, y + 13, 3, 2, blush); g.rect(cr, y + 13, 3, 2, blush); }
    else if (det === 4) g.rect(x + 4, y + 16, 1, 1, hair.dd);
    else if (det === 5) { g.set(mx - 2, my + 1, sk.f); g.set(mx + mw + 1, my + 1, sk.f); }
    else if (det === 6) { g.rect(x + w - 6, y + 4, 1, 5, sk.f); g.set(x + w - 5, y + 9, sk.f); }
    else if (det === 7) { g.rect(x + 2, y + 12, 4, 1, sk.ff); g.rect(x + w - 6, y + 12, 4, 1, sk.ff); }

    facialHair(g, ch, dir, lift, hair, sk);
  }

  function facialHair(g, ch, dir, lift, hair, sk) {
    var f = idx(ch.beard, FACIAL_HAIR);
    if (!f) return;
    var x = HD.x, y = HD.y - lift, w = HD.w;
    var lo = y + HD.h - 1;
    function tache() {
      g.rect(x + 4, y + 13, w - 8, 2, hair.b);
      g.rect(x + 3, y + 14, 2, 1, hair.s); g.rect(x + w - 5, y + 14, 2, 1, hair.s);
      g.strands(x + 5, y + 13, w - 10, 2, 3, hair.s);
    }
    function chops() {
      g.rect(x, y + 7, 3, 9, hair.b); g.rect(x + w - 3, y + 7, 3, 9, hair.b);
      g.col(x + 2, y + 8, 7, hair.s); g.col(x + w - 3, y + 8, 7, hair.s);
    }

    if (f === 1) {
      for (var i = 0; i < w; i += 2) { g.set(x + i, lo - 3, sk.f); g.set(x + i + 1, lo - 1, sk.f); }
      g.rect(x + 3, lo - 2, w - 6, 2, mix(sk.b, parse(hair.b), 0.3));
    } else if (f === 2) { tache(); }
    else if (f === 3) { tache(); g.rect(x + 6, y + 17, 4, 4, hair.b); g.set(x + 6, y + 20, hair.s); }
    else if (f === 4) {
      tache(); g.rect(x + 2, y + 16, w - 4, 4, hair.b);
      g.rect(x + 3, lo, w - 6, 2, hair.s); chops();
      g.strands(x + 4, y + 17, w - 8, 4, 3, hair.s);
    } else if (f === 5) {
      g.rect(x, y + 13, w, 9, hair.b);
      g.rect(x + 5, y + 15, 6, 2, hair.s);
      g.rect(x, y + 7, 2, 8, hair.s); g.rect(x + w - 2, y + 7, 2, 8, hair.s);
      g.rect(x + 3, lo + 2, w - 6, 3, hair.b);
      g.rect(x + 4, y + 13, w - 8, 2, hair.hh);
      g.strands(x + 2, y + 16, w - 4, 8, 4, hair.s);
    } else if (f === 6) { chops(); }
    else if (f === 7) {
      chops(); g.rect(x, y + 15, 4, 3, hair.b); g.rect(x + w - 4, y + 15, 4, 3, hair.b);
      g.set(x + 3, y + 16, hair.s); g.set(x + w - 4, y + 16, hair.s);
    } else if (f === 8) { g.rect(x + 6, y + 17, 4, 2, hair.b); }
    else if (f === 9) {
      tache(); g.rect(x + 2, y + 15, 2, 2, hair.b); g.rect(x + w - 4, y + 15, 2, 2, hair.b);
      g.set(x + 1, y + 14, hair.s); g.set(x + w - 2, y + 14, hair.s);
    } else if (f === 10) {
      tache(); g.rect(x + 4, y + 17, w - 8, 4, hair.b);
      g.rect(x + 2, y + 13, 2, 6, hair.s); g.rect(x + w - 4, y + 13, 2, 6, hair.s);
    } else if (f === 11) {
      g.rect(x, y + 13, w, 9, hair.b);
      g.rect(x + 5, y + 15, 6, 2, hair.s);
      g.rect(x, y + 7, 2, 8, hair.s); g.rect(x + w - 2, y + 7, 2, 8, hair.s);
      g.rect(x + 2, lo + 2, w - 4, 8, hair.b);
      g.rect(x + 4, lo + 10, w - 8, 4, hair.b);
      g.row(x + 4, lo + 13, w - 8, hair.d);
      g.strands(x + 3, y + 16, w - 6, 18, 4, hair.s);
    }
  }
  /* ---------------------------------------------------------------- body ---- */

  /* The body rides highest at mid-stride and lowest at full stride. Front and
   * back views step roughly in place; the side view takes a real stride with
   * the far limbs in shadow, so the profile reads as depth. */
  function gait(dir, frame) {
    var f = ((frame | 0) % 4 + 4) % 4;
    var swing = f === 1 ? 1 : f === 3 ? -1 : 0;
    var side = dir === "left" || dir === "right";
    return {
      side: side, swing: swing, lift: swing === 0 ? 2 : 0,
      near: side ? { dx: 6 * swing, cut: 4 * Math.abs(swing) }
                 : { dx: swing > 0 ? -2 : 0, cut: swing > 0 ? 6 : 0 },
      far:  side ? { dx: -6 * swing, cut: 4 * Math.abs(swing) }
                 : { dx: swing < 0 ? 2 : 0, cut: swing < 0 ? 6 : 0 },
      nearArm: side ? { dx: -4 * swing, dy: 0 } : { dx: 0, dy: 2 * swing },
      farArm:  side ? { dx: 4 * swing, dy: 0 } : { dx: 0, dy: -2 * swing }
    };
  }

  function body(g, ch, dir, frame) {
    var sk = tone(pick(SKINS, ch.skin).b);
    var top = tone(pick(CLOTH, ch.topColor).b);
    var bot = tone(pick(CLOTH, ch.bottomColor).b);
    var shoe = tone(pick(CLOTH, ch.shoeColor).b);
    var acc = tone(pick(CLOTH, ch.accColor).b);
    var fit = idx(ch.outfit, OUTFITS);
    var bd = BUILDS[idx(ch.build, BUILDS)];

    var G = gait(dir, frame);
    var lift = G.lift, side = G.side;
    var TW = side ? bd.stw * 2 : bd.tw * 2;
    var TX = Math.round(MIDX - TW / 2);
    var TH = TORSO.h, ty = TORSO.y - lift;
    var HW = bd.hw * 2, HX = Math.round(MIDX - HW / 2);
    var armL = TX - ARM.w, armR = TX + TW;
    var legL = HX, legR = HX + HW - LEG.w;

    var isDress = fit === 5;
    var longSleeve = (fit === 1 || fit === 2 || fit === 3 || fit === 7 || fit === 9 ||
      fit === 12 || fit === 16 || fit === 19 || fit === 20);
    var sleeve = longSleeve ? ARM.h : 11;

    /** An arm with a cuff and a hand with a thumb. */
    function arm(ax, ay, shadowed, seam, inner) {
      var sl = shadowed ? tone(top.s) : top;
      var sn = shadowed ? tone(sk.s) : sk;
      if (seam) g.rect(ax - 1, ay + 2, 1, ARM.h + 2, top.d);
      g.rect(ax, ay, ARM.w, sleeve, sl.b);
      g.rect(ax + (inner < 0 ? 0 : ARM.w - 2), ay, 2, sleeve, sl.s);
      g.rect(ax, ay, ARM.w, 2, sl.h);
      if (longSleeve) { g.rect(ax, ay + ARM.h - 3, ARM.w, 3, sl.d); }   /* cuff */
      else {
        g.rect(ax, ay + sleeve, ARM.w, ARM.h - sleeve, sn.b);
        g.rect(ax + (inner < 0 ? 0 : ARM.w - 2), ay + sleeve, 2, ARM.h - sleeve, sn.s);
        g.rect(ax, ay + sleeve, ARM.w, 1, sl.d);
      }
      /* hand */
      g.rect(ax, ay + ARM.h, ARM.w, ARM.hand, sn.b);
      g.rect(ax + (inner < 0 ? 0 : ARM.w - 2), ay + ARM.h, 2, ARM.hand, sn.s);
      g.rect(ax + (inner < 0 ? ARM.w - 2 : 0), ay + ARM.h + 1, 2, 3, sn.h);   /* thumb */
      g.rect(ax + 1, ay + ARM.h + ARM.hand - 1, ARM.w - 2, 1, sn.d);
      g.round(ax, ay + ARM.h, ARM.w, ARM.hand, 1);
    }

    if (side) arm(TX - 2 + G.farArm.dx, ty + G.farArm.dy, true, false, -1);

    /* ---- head ---- */
    var hx = HD.x, hy = HD.y - lift;
    g.rect(hx, hy, HD.w, HD.h, sk.b);
    g.round(hx, hy, HD.w, HD.h, 3);
    if (!side) {
      g.rect(hx + 1, hy + HD.h - 2, HD.w - 2, 2, sk.s);
    } else {
      g.rect(hx - 2, hy + 4, 2, 11, sk.b);                  /* back of the skull */
      g.rect(hx - 2, hy + 4, 2, 2, sk.s); g.rect(hx - 2, hy + 13, 2, 2, sk.s);
      g.rect(hx + 1, hy + HD.h - 2, HD.w - 2, 2, sk.s);
    }

    /* ---- neck ---- */
    g.rect(NECK.x, NECK.y - lift, NECK.w, NECK.h + 1, sk.b);
    g.rect(NECK.x, NECK.y - lift, NECK.w, 2, sk.d);
    g.rect(NECK.x + NECK.w - 1, NECK.y - lift, 1, NECK.h, sk.s);

    /* ---- torso ---- */
    g.rect(TX, ty, TW, TH, top.b);
    g.rect(TX + 2, ty, TW - 4, 2, top.h);
    g.rect(TX, ty, 2, TH, top.s);
    g.rect(TX + TW - 2, ty, 2, TH, top.s);
    g.rect(TX, ty + TH - 2, TW, 2, top.s);
    g.round(TX, ty, TW, TH, 2);

    /* ---- hips, legs, shoes ---- */
    function leg(lx, cut, legT, shoeT, toe) {
      g.rect(lx, LEG.y - lift, LEG.w, LEG.h - cut, legT.b);
      g.rect(lx + LEG.w - 2, LEG.y - lift, 2, LEG.h - cut, legT.s);
      g.rect(lx + 1, LEG.y - lift + 12, LEG.w - 2, 1, legT.s);        /* knee */
      g.rect(lx, LEG.y - lift + LEG.h - cut - 2, LEG.w, 2, legT.d);
      var sx = toe ? lx - 1 : lx - 1;
      g.rect(sx, SHOE.y - lift - cut, SHOE.w, SHOE.h, shoeT.b);
      g.rect(sx, SHOE.y - lift - cut, SHOE.w, 1, shoeT.h);
      g.rect(sx + 2, SHOE.y - lift - cut + 1, 4, 1, shoeT.hh);        /* laces */
      g.rect(sx, SHOE.y - lift - cut + SHOE.h - 2, SHOE.w, 2, shoeT.dd);
      g.round(sx, SHOE.y - lift - cut, SHOE.w, SHOE.h, 1);
    }

    var hipY = HIPS.y - lift;
    if (isDress) {
      g.rect(TX, hipY, TW, 10, top.b);
      g.rect(TX - 2, hipY + 10, TW + 4, 6, top.b);
      g.rect(TX - 2, hipY + 14, TW + 4, 2, top.d);
      g.rect(TX - 2, hipY + 10, 2, 6, top.s); g.rect(TX + TW, hipY + 10, 2, 6, top.s);
      for (var fold = TX + 3; fold < TX + TW - 2; fold += 7) g.col(fold, hipY + 2, 12, top.s);
      g.rect(TX, hipY - 2, TW, 2, acc.b);
      g.rect(TX, hipY, TW, 1, acc.s);
    } else {
      g.rect(side ? TX : HX, hipY, side ? TW : HW, HIPS.h, bot.b);
      g.rect((side ? TX : HX) + 2, hipY, (side ? TW : HW) - 4, 2, bot.h);
    }

    var legTone = isDress ? sk : bot;
    var stride = isDress ? 0.5 : 1;
    if (side) {
      var mid = Math.round(MIDX - LEG.w / 2);
      leg(mid + Math.round(G.far.dx * stride), G.far.cut, tone(legTone.s), tone(shoe.s), true);
      leg(mid + Math.round(G.near.dx * stride), G.near.cut, legTone, shoe, true);
    } else {
      leg(legL + G.near.dx, G.near.cut, legTone, shoe, false);
      leg(legR - G.far.dx, G.far.cut, legTone, shoe, false);
    }

    if (side) arm(TX + TW - 8 + G.nearArm.dx, ty + G.nearArm.dy, false, true, 1);
    else {
      arm(armL, ty + G.nearArm.dy, false, false, -1);
      arm(armR, ty + G.farArm.dy, false, false, 1);
    }

    outfitDetail(g, fit, top, bot, acc, sk, dir, ty, lift, TX, TW);
  }

  /* ------------------------------------------------------------- outfits ---- */

  function outfitDetail(g, fit, top, bot, acc, sk, dir, ty, lift, X, TW) {
    var TH = TORSO.h, mid = X + Math.round(TW / 2);
    function collar() {
      if (dir === "up") return;
      g.rect(mid - 3, ty, 6, 2, sk.s);
      g.rect(mid - 4, ty, 2, 3, top.h); g.rect(mid + 2, ty, 2, 3, top.h);
    }
    function hem() { g.rect(X, ty + TH - 3, TW, 1, top.d); }
    function buttons(c, from) {
      for (var b = ty + (from || 4); b < ty + TH - 3; b += 6) g.rect(mid, b, 1, 2, c);
    }

    if (fit === 0 || fit === 1) { collar(); hem(); }
    else if (fit === 2) {                                        /* Knit jumper */
      g.rect(X, ty + TH - 5, TW, 3, top.s); g.rect(X, ty + TH - 2, TW, 2, top.d);
      g.strands(X + 2, ty + 4, TW - 4, TH - 10, 5, top.s);
      if (dir !== "up") g.rect(mid - 4, ty, 8, 2, top.d);
    } else if (fit === 3) {                                      /* Fisherman's */
      g.rect(X, ty + TH - 3, TW, 3, top.d);
      g.rect(mid - 5, ty - 2, 10, 4, top.h);
      g.rect(X, ty + 8, TW, 1, top.s); g.rect(X, ty + 15, TW, 1, top.s);
      g.strands(X + 2, ty + 3, TW - 4, TH - 8, 6, top.s);
    } else if (fit === 4) {                                      /* Dungarees */
      g.rect(X, ty + 6, TW, TH - 6, acc.b);
      g.rect(X, ty + 6, TW, 2, acc.h);
      g.rect(X + 4, ty, 3, 7, acc.b); g.rect(X + TW - 7, ty, 3, 7, acc.b);
      g.rect(mid - 4, ty + 11, 8, 7, acc.s);
      g.set(X + 4, ty + 6, acc.dd); g.set(X + TW - 5, ty + 6, acc.dd);
    } else if (fit === 6) {                                      /* Work apron */
      g.rect(X + 5, ty + 4, TW - 10, TH - 4, acc.b);
      g.rect(X + 5, ty + 4, TW - 10, 2, acc.h);
      g.rect(X + 1, ty + TH - 10, TW - 2, 2, acc.d);
      g.rect(mid - 4, ty + TH - 8, 8, 5, acc.s);
      g.rect(X + 5, ty + 4, 2, TH - 4, acc.s);
    } else if (fit === 7) {                                      /* Raincoat */
      g.rect(mid - 1, ty, 2, TH, top.d);
      hem(); buttons(top.hh, 5);
      g.rect(X, ty + TH - 2, TW, 2, top.d);
      if (dir === "up") g.rect(HD.x - 2, HD.y - lift + 11, HD.w + 4, 8, top.b);
    } else if (fit === 8) {                                      /* Striped tee */
      for (var s = ty + 4; s < ty + TH - 2; s += 6) g.rect(X, s, TW, 3, top.s);
      collar();
    } else if (fit === 9) {                                      /* Cardigan */
      g.rect(X + 8, ty, TW - 16, TH, top.h);
      g.rect(X + 8, ty, 2, TH, top.d); g.rect(X + TW - 10, ty, 2, TH, top.d);
      buttons(top.dd, 4); hem();
    } else if (fit === 10) {                                     /* Overshirt */
      g.rect(X + 8, ty, TW - 16, TH, top.h);
      g.rect(X + 8, ty, 2, TH, top.d); g.rect(X + TW - 10, ty, 2, TH, top.d);
      g.rect(X + 2, ty + 12, 6, 2, top.d); g.rect(X + TW - 8, ty + 12, 6, 2, top.d);
      collar();
    } else if (fit === 11) {                                     /* Waistcoat */
      g.rect(X + 4, ty, TW - 8, TH, acc.b);
      g.rect(mid - 2, ty, 2, TH, acc.d); g.rect(mid, ty, 2, TH, acc.h);
      g.rect(X + 6, ty, 4, 4, top.hh); g.rect(X + TW - 10, ty, 4, 4, top.hh);
      buttons(acc.hh, 6);
    } else if (fit === 12) {                                     /* Hoodie */
      g.rect(X, ty + TH - 4, TW, 2, acc.b); g.rect(X, ty + TH - 2, TW, 2, acc.d);
      g.rect(HD.x - 4, ty - 4, HD.w + 8, 4, top.b);
      g.rect(HD.x - 4, ty - 1, HD.w + 8, 2, top.s);
      g.rect(mid - 4, ty + 6, 1, 10, top.d); g.rect(mid + 3, ty + 6, 1, 10, top.d);
      g.rect(mid - 5, ty + TH - 11, 10, 6, top.s);
    } else if (fit === 13) {                                     /* Shirt & tie */
      g.rect(X + 4, ty, TW - 8, TH, top.hh);
      g.rect(X + 4, ty, 2, TH, top.d); g.rect(X + TW - 6, ty, 2, TH, top.d);
      g.rect(mid - 2, ty, 4, 4, acc.b);
      g.rect(mid - 2, ty + 4, 4, TH - 10, acc.b);
      g.rect(mid, ty + 4, 2, TH - 10, acc.s);
      g.rect(mid - 3, ty + TH - 7, 6, 2, acc.d);
      collar();
    } else if (fit === 14) {                                     /* Tank top */
      g.rect(X, ty, 6, 6, sk.b); g.rect(X + TW - 6, ty, 6, 6, sk.b);
      g.rect(X + 4, ty, 4, 5, top.b); g.rect(X + TW - 8, ty, 4, 5, top.b);
      g.rect(X + 8, ty, TW - 16, 3, sk.b);
      hem();
    } else if (fit === 15) {                                     /* Poncho */
      g.rect(X - 2, ty + 2, TW + 4, TH, top.b);
      g.rect(X - 2, ty + 2, TW + 4, 2, top.h);
      for (var pz = ty + 8; pz < ty + TH; pz += 8) g.rect(X - 2, pz, TW + 4, 2, acc.b);
      g.rect(X - 2, ty + TH, TW + 4, 2, top.d);
      g.rect(mid - 4, ty, 8, 3, top.s);
    } else if (fit === 16) {                                     /* Robe */
      g.rect(mid - 2, ty, 2, TH, top.d);
      g.rect(X + 6, ty, 4, 9, top.hh); g.rect(X + TW - 10, ty, 4, 9, top.hh);
      g.rect(X, ty + TH - 7, TW, 4, acc.b);
      g.rect(X, ty + TH - 4, TW, 2, acc.s);
    } else if (fit === 17) {                                     /* Pinafore */
      g.rect(X + 2, ty + 7, TW - 4, TH - 7, acc.b);
      g.rect(X + 5, ty, 4, 8, acc.b); g.rect(X + TW - 9, ty, 4, 8, acc.b);
      g.rect(X + 2, ty + 7, TW - 4, 2, acc.h);
      g.rect(mid - 4, ty + 13, 8, 6, acc.s);
    } else if (fit === 18) {                                     /* Gilet */
      g.rect(X, ty, 8, TH, acc.b); g.rect(X + TW - 8, ty, 8, TH, acc.b);
      g.rect(X + 6, ty, 2, TH, acc.d); g.rect(X + TW - 8, ty, 2, TH, acc.d);
      g.rect(X, ty, 8, 2, acc.h); g.rect(X + TW - 8, ty, 8, 2, acc.h);
      for (var q = ty + 5; q < ty + TH - 2; q += 6) {
        g.rect(X, q, 8, 1, acc.s); g.rect(X + TW - 8, q, 8, 1, acc.s);
      }
    } else if (fit === 19) {                                     /* Long coat */
      g.rect(mid - 2, ty, 2, TH, acc.d);
      g.rect(X + 4, ty, 6, 6, top.hh); g.rect(X + TW - 10, ty, 6, 6, top.hh);
      g.rect(X, ty + TH, TW, 14, top.b);
      g.rect(X, ty + TH, 2, 14, top.s); g.rect(X + TW - 2, ty + TH, 2, 14, top.s);
      g.rect(mid - 2, ty + TH, 2, 14, acc.d);
      g.rect(X, ty + TH + 12, TW, 2, top.d);
      buttons(acc.hh, 7);
    } else if (fit === 20) {                                     /* Smock */
      g.rect(X - 2, ty + 4, TW + 4, TH, top.b);
      g.rect(X - 2, ty + 4, TW + 4, 2, top.h);
      g.rect(X, ty + 10, TW, 1, top.s);
      g.rect(mid - 6, ty + TH - 9, 12, 6, acc.b);
      g.rect(X - 2, ty + TH + 2, TW + 4, 2, top.d);
    } else if (fit === 21) {                                     /* Tunic */
      g.rect(X + 2, ty + TH, TW - 4, 9, top.b);
      g.rect(X + 2, ty + TH + 7, TW - 4, 2, top.d);
      g.rect(mid - 4, ty, 8, 6, top.h);
      g.rect(X, ty + TH - 8, TW, 3, acc.b); g.rect(X, ty + TH - 5, TW, 1, acc.s);
    }
  }
  /* --------------------------------------------------------- accessories ---- */

  function accessories(g, ch, dir, frame) {
    var list = ch.accessories || [];
    var G = gait(dir, frame);
    var lift = G.lift;
    var acc = tone(pick(CLOTH, ch.accColor).b);
    var iris = tone(pick(EYE_COLORS, ch.eyeColor).b);
    var hx = HD.x, hy = HD.y - lift, hw = HD.w;
    var ey = hy + R.eye;
    var bd = BUILDS[idx(ch.build, BUILDS)];
    var TW = (dir === "left" || dir === "right" ? bd.stw : bd.tw) * 2;
    var TX = Math.round(MIDX - TW / 2);
    var ty = TORSO.y - lift;
    var has = function (n) { return list.indexOf(n) >= 0; };
    var front = dir === "right";

    if (has("Earrings") && dir !== "up") {
      if (dir === "down") {
        [hx - 2, hx + hw].forEach(function (x) { g.rect(x, ey + 5, 2, 2, acc.b); g.set(x, ey + 5, acc.hh); });
      } else { g.rect(hx + 2, ey + 5, 2, 2, acc.b); }
    }
    if ((has("Glasses") || has("Round glasses")) && dir !== "up") {
      var fc = has("Round glasses") ? acc.b : tone("#4a4652").b;
      var glint = tint(fc, 0.5);
      var lenses = dir === "down" ? [hx + 1, hx + hw - 7] : [hx + hw - 8];
      lenses.forEach(function (lx) {
        g.rect(lx, ey - 2, 6, 1, fc);
        g.rect(lx, ey + 4, 6, 1, fc);
        g.rect(lx, ey - 1, 1, 5, fc); g.rect(lx + 5, ey - 1, 1, 5, fc);
        g.set(lx + 1, ey - 2, glint);
      });
      if (dir === "down") g.rect(hx + 7, ey, 2, 1, fc);
      else g.rect(front ? hx + 1 : hx + hw - 2, ey, 3, 1, fc);
    }
    if (has("Sunglasses") && dir !== "up") {
      var dk = tone("#2b2a33");
      if (dir === "down") {
        g.rect(hx, ey - 2, hw, 6, dk.b);
        g.rect(hx + 6, ey, 4, 2, dk.h);
        g.rect(hx + 1, ey - 1, 3, 2, tint(dk.b, 0.4));
      } else { g.rect(hx + hw - 9, ey - 2, 9, 6, dk.b); g.rect(hx + hw - 8, ey - 1, 3, 2, tint(dk.b, 0.4)); }
    }
    if (has("Goggles")) {
      g.rect(hx - 2, hy + 2, hw + 4, 5, acc.d);
      g.rect(hx, hy + 2, 6, 5, tint(acc.b, 0.35));
      g.rect(hx + hw - 6, hy + 2, 6, 5, tint(acc.b, 0.35));
      g.rect(hx + 1, hy + 3, 2, 2, "#fbf7ee"); g.rect(hx + hw - 5, hy + 3, 2, 2, "#fbf7ee");
    }
    if (has("Headband")) { g.rect(hx - 2, hy + 4, hw + 4, 3, acc.b); g.rect(hx, hy + 4, 4, 1, acc.hh); }
    if (has("Headscarf")) {
      g.rect(hx - 2, hy - 4, hw + 4, 10, acc.b);
      g.rect(hx, hy - 6, hw, 3, acc.b);
      g.rect(hx + 2, hy - 4, 6, 2, acc.hh);
      g.rect(hx - 2, hy + 4, hw + 4, 2, acc.s);
      g.rect(front ? hx + hw : hx - 4, hy + 8, 4, 7, acc.s);
      g.round(hx - 2, hy - 6, hw + 4, 12, 2);
    }
    if (has("Beret")) {
      g.rect(hx, hy - 6, hw, 8, acc.b);
      g.rect(hx + 1, hy - 8, hw - 2, 3, acc.b);
      g.rect(hx + 2, hy - 6, 5, 2, acc.hh);
      g.rect(hx + hw - 3, hy - 8, 2, 2, acc.d);
      g.rect(hx, hy + 1, hw, 2, acc.s);
      g.round(hx, hy - 8, hw, 11, 2);
    }
    if (has("Beanie")) {
      g.rect(hx - 2, hy - 6, hw + 4, 10, acc.b);
      g.rect(hx, hy - 8, hw, 3, acc.b);
      g.rect(hx - 2, hy + 2, hw + 4, 2, acc.s);
      g.rect(hx - 2, hy + 4, hw + 4, 2, acc.d);
      g.strands(hx - 1, hy - 5, hw + 2, 7, 4, acc.s);
      g.rect(hx + 2, hy - 7, 4, 2, acc.hh);
      g.round(hx - 2, hy - 8, hw + 4, 12, 2);
    }
    if (has("Cap")) {
      g.rect(hx - 2, hy - 5, hw + 4, 8, acc.b);
      g.rect(hx, hy - 7, hw, 3, acc.b);
      g.rect(hx + 2, hy - 5, 5, 2, acc.hh);
      g.rect(hx - 2, hy + 1, hw + 4, 2, acc.s);
      if (dir === "down") g.rect(hx - 5, hy + 3, hw + 10, 3, acc.d);
      else if (dir === "up") g.rect(hx - 2, hy + 3, hw + 4, 2, acc.s);
      else g.rect(front ? hx + hw + 2 : hx - 7, hy + 3, 5, 3, acc.d);
      g.round(hx - 2, hy - 7, hw + 4, 10, 2);
    }
    if (has("Bucket hat")) {
      g.rect(hx, hy - 7, hw, 9, acc.b);
      g.rect(hx + 2, hy - 7, 5, 3, acc.hh);
      g.rect(hx - 6, hy + 2, hw + 12, 3, acc.b);
      g.rect(hx - 6, hy + 4, hw + 12, 2, acc.d);
      g.round(hx - 6, hy + 2, hw + 12, 4, 1);
    }
    if (has("Sun hat")) {
      g.rect(hx + 1, hy - 9, hw - 2, 9, acc.b);
      g.rect(hx + 3, hy - 11, hw - 6, 3, acc.b);
      g.rect(hx + 3, hy - 9, 5, 3, acc.hh);
      g.rect(hx + 1, hy - 3, hw - 2, 2, acc.d);             /* band */
      g.rect(hx - 8, hy, hw + 16, 3, acc.b);
      g.rect(hx - 8, hy + 2, hw + 16, 2, acc.s);
      g.round(hx - 8, hy, hw + 16, 4, 1);
    }
    if (has("Flower crown")) {
      var petals = [tint(acc.b, 0.3), acc.b, "#f6efe2"];
      for (var fl = 0; fl < hw; fl += 4) {
        g.rect(hx + fl, hy - 3, 3, 3, petals[(fl / 4) % petals.length]);
        g.set(hx + fl + 1, hy - 2, "#e9c94f");
        g.rect(hx + fl + 2, hy - 1, 2, 1, tone("#5f8a5a").b);
      }
    }
    if (has("Scarf")) {
      g.rect(TX + 4, ty - 4, TW - 8, 6, acc.b);
      g.rect(TX + 4, ty - 4, TW - 8, 2, acc.h);
      g.rect(TX + 4, ty, TW - 8, 2, acc.s);
      g.strands(TX + 5, ty - 3, TW - 10, 5, 4, acc.s);
      var tx2 = front ? TX + TW - 10 : TX + 6;
      g.rect(tx2, ty + 2, 5, 12, acc.b);
      g.rect(tx2, ty + 12, 5, 2, acc.d);
    }
    if (has("Neckerchief") && !has("Scarf")) {
      g.rect(TX + 6, ty - 2, TW - 12, 4, acc.b);
      g.rect(TX + 6, ty - 2, TW - 12, 1, acc.h);
      g.rect(MIDX - 2, ty + 2, 4, 3, acc.s);
    }
    if (has("Necklace")) {
      g.rect(TX + 8, ty + 2, TW - 16, 1, acc.b);
      g.rect(MIDX - 1, ty + 3, 2, 3, acc.hh);
      g.set(MIDX - 1, ty + 5, acc.d);
    }
    if (has("Tool belt")) {
      var by = HIPS.y - lift;
      g.rect(HIPS.x - 1, by + 2, HIPS.w + 2, 3, acc.b);
      g.rect(HIPS.x - 1, by + 4, HIPS.w + 2, 2, acc.d);
      g.rect(HIPS.x + 1, by + 2, 4, 6, acc.s);
      g.rect(HIPS.x + HIPS.w - 5, by + 2, 4, 6, acc.s);
      g.rect(MIDX - 2, by + 2, 4, 3, acc.hh);
    }
    if (has("Satchel")) {
      var sy = ty + 14;
      var bx = dir === "up" ? TX - 5 : dir === "down" ? TX + TW - 2 : (front ? TX + 2 : TX + TW - 9);
      g.rect(bx, sy, 7, 11, acc.b);
      g.rect(bx, sy, 7, 3, acc.h);
      g.rect(bx, sy + 8, 7, 3, acc.d);
      g.rect(bx + 2, sy + 3, 3, 2, acc.hh);
      g.round(bx, sy, 7, 11, 1);
      g.rect(TX + 2, ty + 2, TW - 4, 2, acc.d);                /* the strap */
    }
  }

  /* -------------------------------------------------------------- render ---- */

  function mirror(g) {
    var out = new Grid();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) out.px[y * W + (W - 1 - x)] = g.px[y * W + x];
    return out;
  }

  function build(ch, dir, frame) {
    dir = dir || "down"; frame = frame || 0;
    /* Left is right, flipped: one profile to get right rather than two. */
    if (dir === "left") return mirror(build(ch, "right", frame));
    HD = dir === "right" ? HEAD_SIDE : HEAD;
    var g = new Grid();
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var st = styleOf(ch);
    var lift = gait(dir, frame).lift;
    hairBack(g, hair, st, dir, lift);
    body(g, ch, dir, frame);
    face(g, ch, dir, lift);
    hairFront(g, hair, st, dir, lift);
    hairAccent(g, ch, lift);
    accessories(g, ch, dir, frame);
    g.outline();
    return g;
  }

  /* `crop` is an optional {y, h} band — head, torso or legs — so a picker can
   * show the part it actually changes. */
  function render(canvas, ch, dir, frame, scale, crop) {
    var g = build(ch, dir, frame);
    var y0 = crop ? crop.y : 0;
    var rows = crop ? crop.h : H;
    canvas.width = W * scale;
    canvas.height = rows * scale;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var y = y0; y < y0 + rows && y < H; y++) {
      for (var x = 0; x < W; x++) {
        var c = g.px[y * W + x];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * scale, (y - y0) * scale, scale, scale);
      }
    }
  }

  var CROP = { head: { y: 4, h: 48 }, bust: { y: 4, h: 76 }, torso: { y: 38, h: 44 },
    legs: { y: 64, h: 56 }, full: { y: 0, h: H } };

  /* ------------------------------------------------------------- records ---- */

  function defaultChar() {
    return {
      gender: 0, build: 1, nose: 0, mouth: 0,
      skin: 2, hairStyle: styleIndex("Side part"), hairColor: 4,
      eyeShape: 2, eyeColor: 0, eyebrows: 0,
      hairAccent: 0, hairAccentColor: 18,
      details: 0, beard: 0, outfit: 0,
      topColor: 13, bottomColor: 16, shoeColor: 18,
      accColor: 8, accessories: [], voice: 5,
      name: "", hometown: "", birthMonth: 6, birthDay: 12
    };
  }

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
    if (Math.random() < 0.34) accs.push(any(["Glasses", "Round glasses", "Cap", "Beanie", "Sun hat", "Beret"]));
    if (Math.random() < 0.22) accs.push(any(["Scarf", "Neckerchief", "Earrings", "Satchel", "Necklace"]));
    return {
      name: seedName || "", hometown: "",
      gender: randInt(GENDERS.length), build: randInt(BUILDS.length),
      nose: randInt(NOSES.length), mouth: randInt(MOUTHS.length),
      birthMonth: randInt(12) + 1, birthDay: randInt(28) + 1,
      skin: randInt(SKINS.length),
      hairStyle: randInt(HAIR_STYLES.length), hairColor: randInt(HAIRS.length),
      eyeShape: randInt(EYE_SHAPES.length), eyeColor: randInt(EYE_COLORS.length),
      eyebrows: randInt(EYEBROWS.length),
      hairAccent: Math.random() < 0.18 ? randInt(HAIR_ACCENT.length) : 0,
      hairAccentColor: randInt(HAIRS.length),
      details: randInt(DETAILS.length),
      beard: Math.random() < 0.4 ? randInt(FACIAL_HAIR.length) : 0,
      outfit: randInt(OUTFITS.length),
      topColor: any(c.top), bottomColor: any(c.bottom),
      shoeColor: any(c.shoe), accColor: any(c.top),
      accessories: accs, voice: randInt(11)
    };
  }

  /**
   * A child of two characters.
   *
   * Skin tends toward the midpoint of its parents, because the palette runs
   * light to dark and that is what mixing looks like. The features that read
   * as family — eyes, nose, mouth, brows — come whole from one parent or the
   * other rather than being averaged: your mother's nose, your father's eyes.
   * Nothing here is final; the player may change every part of the result.
   */
  function inherit(a, b) {
    var LEN = { skin: SKINS.length, hairColor: HAIRS.length, build: BUILDS.length };
    function either() { return Math.random() < 0.5 ? a : b; }
    function clamp(v, key) { return Math.max(0, Math.min((LEN[key] || 1) - 1, v)); }
    function mixKey(key, spread) {
      var m = Math.round(((a[key] | 0) + (b[key] | 0)) / 2);
      return clamp(m + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) * (spread || 1) : 0), key);
    }
    var kid = defaultChar();
    kid.skin = Math.random() < 0.7 ? mixKey("skin", 1) : either().skin;
    kid.hairColor = Math.random() < 0.75 ? either().hairColor : mixKey("hairColor", 2);
    kid.eyeColor = either().eyeColor;
    kid.eyeShape = either().eyeShape;
    kid.eyebrows = either().eyebrows;
    kid.nose = either().nose;
    kid.mouth = either().mouth;
    kid.build = Math.random() < 0.6 ? mixKey("build", 1) : either().build;
    kid.details = Math.random() < 0.4 ? either().details : 0;
    kid.gender = randInt(GENDERS.length);
    kid.hairStyle = randInt(HAIR_STYLES.length);      /* nobody inherits a haircut */
    var fit = randomChar();
    kid.outfit = fit.outfit;
    kid.topColor = fit.topColor; kid.bottomColor = fit.bottomColor;
    kid.shoeColor = fit.shoeColor; kid.accColor = fit.accColor;
    kid.birthMonth = randInt(12) + 1; kid.birthDay = randInt(28) + 1;
    kid.voice = randInt(11);
    kid.hometown = "the island";
    return kid;
  }

  root.CozySprite = {
    W: W, H: H, U: U, CROP: CROP, EYE_ROW: HEAD.y + R.eye,
    SKINS: SKINS, HAIRS: HAIRS, EYE_COLORS: EYE_COLORS, CLOTH: CLOTH,
    HAIR_STYLES: HAIR_STYLES, EYE_SHAPES: EYE_SHAPES, OUTFITS: OUTFITS,
    ACCESSORIES: ACCESSORIES, DETAILS: DETAILS, FACIAL_HAIR: FACIAL_HAIR,
    EYEBROWS: EYEBROWS, HAIR_ACCENT: HAIR_ACCENT, styleIndex: styleIndex,
    GENDERS: GENDERS, BUILDS: BUILDS, NOSES: NOSES, MOUTHS: MOUTHS,
    tone: tone, shade: shade, tint: tint,
    starSign: starSign, render: render, build: build,
    randomChar: randomChar, defaultChar: defaultChar, inherit: inherit
  };
})(typeof window !== "undefined" ? window : this);
