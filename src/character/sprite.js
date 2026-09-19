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

  var W = 26, H = 64;

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

  var HEAD = { x: 9, y: 11, w: 8, h: 10 };          /* facing the camera */
  var HEAD_SIDE = { x: 10, y: 11, w: 7, h: 10 };    /* narrower, set forward */
  var HD = HEAD;                                    /* the one in force */
  var NECK = { x: 12, y: 21, w: 2, h: 2 };
  var TORSO = { x: 7, y: 23, w: 12, h: 12 };
  var ARM = { lx: 4, rx: 19, w: 3, y: 23, h: 14 };
  var HIPS = { x: 8, y: 35, w: 10, h: 4 };
  var LEG = { y: 39, h: 15, lx: 8, rx: 14, w: 4 };
  var SHOE = { y: 54, h: 2, lx: 7, rx: 14, w: 5 };

  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }
  function styleOf(ch) { return HAIR_STYLES[((ch.hairStyle | 0) % HAIR_STYLES.length + HAIR_STYLES.length) % HAIR_STYLES.length]; }

  /* ---------------------------------------------------------------- hair ---- */

  function hairBack(g, c, st, dir, lift) {
    if (st.bald) return;
    var x = HD.x, y = HD.y - lift, w = HD.w, v = st.vol, k = st.back;

    if (k === "fall") {
      var len = st.side + 4;
      g.rect(x - v - 1, y + 3, w + 2 * v + 2, len, c.b);
      g.col(x - v - 1, y + 3, len, c.s);
      g.col(x + w + v, y + 3, len, c.s);
      if (st.wavy) {
        g.row(x - v - 1, y + 3 + len, 3, c.b);
        g.row(x + w + v - 2, y + 3 + len, 3, c.b);
        g.row(x + 2, y + 3 + len, 4, c.s);
      }
      if (st.hime) { g.row(x - v - 1, y + 3 + len, w + 2 * v + 2, c.d); }
    } else if (k === "ponytail") {
      g.rect(x + w + v, y + 5, 2, 10, c.b);
      g.col(x + w + v + 1, y + 5, 10, c.s);
      g.rect(x + w + v - 1, y + 14, 2, 2, c.s);
      if (dir === "up") g.rect(x + 3, y + 6, 3, 11, c.b);
    } else if (k === "highpony") {
      g.rect(x + w + v - 1, y - v - 1, 3, 4, c.b);
      g.rect(x + w + v, y + 2, 2, 9, c.b);
      g.col(x + w + v + 1, y + 2, 9, c.s);
      g.row(x + w + v - 1, y - v - 1, 3, c.h);
    } else if (k === "sidepony") {
      g.rect(x + w + v - 1, y + 7, 3, 9, c.b);
      g.col(x + w + v + 1, y + 7, 9, c.s);
      g.row(x + w + v - 1, y + 15, 3, c.d);
    } else if (k === "pigtails") {
      [x - v - 3, x + w + v].forEach(function (bx, i) {
        g.rect(bx, y + 5, 3, 9, c.b);
        g.col(i === 0 ? bx : bx + 2, y + 5, 9, c.s);
        g.row(bx, y + 13, 3, c.d);
        g.row(bx, y + 5, 3, c.h);
      });
    } else if (k === "buns") {
      [x - 1, x + w - 3].forEach(function (bx) {
        g.rect(bx, y - v - 5, 4, 3, c.b);          /* one clear row of gap below */
        g.row(bx + 1, y - v - 6, 2, c.b);
        g.row(bx + 1, y - v - 5, 2, c.h);
        g.row(bx, y - v - 3, 4, c.s);
      });
    } else if (k === "bun") {
      g.rect(x + 2, y - v - 4, 4, 3, c.b);
      g.row(x + 3, y - v - 5, 2, c.b);
      g.row(x + 3, y - v - 4, 2, c.h);
      g.col(x + 5, y - v - 4, 3, c.s);
    } else if (k === "lowbun") {
      g.rect(x + w - 1, y + 9, 3, 4, c.b);
      g.col(x + w + 1, y + 9, 4, c.s);
      g.row(x + w - 1, y + 9, 3, c.h);
      if (dir === "up") { g.rect(x + 2, y + 9, 4, 4, c.b); g.row(x + 3, y + 9, 2, c.h); }
    } else if (k === "halfup") {
      var hl = st.side + 3;
      g.rect(x - v - 1, y + 3, w + 2 * v + 2, hl, c.b);
      g.col(x - v - 1, y + 3, hl, c.s);
      g.col(x + w + v, y + 3, hl, c.s);
      g.rect(x + 2, y - v - 2, 4, 2, c.b);
      g.row(x + 3, y - v - 2, 2, c.h);
    } else if (k === "braids") {
      [x - v - 2, x + w + v].forEach(function (bx) {
        g.rect(bx, y + 6, 2, 12, c.b);
        g.row(bx, y + 9, 2, c.s);
        g.row(bx, y + 13, 2, c.s);
        g.row(bx, y + 17, 2, c.d);
      });
    } else if (k === "fishtail") {
      var fx = dir === "up" ? x + 3 : x + w + v - 1;
      g.rect(fx, y + 6, 3, 12, c.b);
      for (var f = y + 7; f < y + 18; f += 2) { g.set(fx, f, c.s); g.set(fx + 2, f + 1, c.s); }
      g.row(fx, y + 17, 3, c.d);
      if (dir === "up") g.rect(x + 2, y + 5, 4, 4, c.b);
    } else if (k === "locs" || k === "twists") {
      var step = k === "twists" ? 3 : 2;
      g.rect(x - v - 1, y + 3, w + 2 * v + 2, 10, c.b);
      for (var i = 0; i < w + 2 * v + 2; i += step) {
        g.col(x - v - 1 + i, y + 5, 10, c.s);
        g.set(x - v - 1 + i, y + 13, c.d);
        if (k === "twists") g.set(x - v + i, y + 8, c.d);
      }
    } else if (k === "bantu") {
      [x, x + 3, x + 6].forEach(function (bx) {
        g.rect(bx, y - v - 2, 2, 2, c.b);
        g.set(bx, y - v - 2, c.h);
        g.set(bx + 1, y - v - 1, c.s);
      });
    }
  }

  function hairFront(g, c, st, dir, lift) {
    if (st.bald) return;
    var x = HD.x, y = HD.y - lift, w = HD.w, v = st.vol;

    if (st.mohawk) {
      g.rect(x + 2, y - 2, 4, 5, c.b);            /* the base, sat on the skull */
      g.rect(x + 3, y - 4, 2, 2, c.b);            /* the crest */
      g.row(x + 3, y - 4, 2, c.h);
      g.col(x + 5, y - 2, 5, c.s);
      g.set(x + 2, y + 3, c.b); g.set(x + 5, y + 3, c.b);
      if (dir === "up") g.rect(x + 2, y - 2, 4, 11, c.b);
      return;
    }

    /* skull cap */
    var capH = st.thin ? 2 : 3 + v;
    g.rect(x - v, y - v, w + 2 * v, capH, c.b);
    if (!st.thin) g.row(x - v + 1, y - v - 1, w + 2 * v - 2, c.b);
    g.clear(x - v, y - v, 1, 1); g.clear(x + w + v - 1, y - v, 1, 1);
    g.row(x + 1, y - v, 3, c.h);
    g.set(x + 1, y - v + 1, c.h);

    /* sides */
    if (st.side > 0) {
      var sw = 1 + v;
      g.rect(x - v, y + 1, sw, st.side, c.b);
      g.col(x - v, y + 1, st.side, c.s);
      /* In profile the near side is the face — hair there covers the eye. */
      if (dir !== "right") {
        g.rect(x + w - 1, y + 1, sw, st.side, c.b);
        g.col(x + w + v - 1, y + 1, st.side, c.s);
      } else {
        g.col(x + w + v - 1, y + 1, Math.min(st.side, 3), c.s);
      }
      if (st.hime) { g.row(x - v, y + st.side, sw, c.d); g.row(x + w - 1, y + st.side, sw, c.d); }
    }
    if (st.bowl) { g.rect(x - v, y + 1, w + 2 * v, 4, c.b); g.row(x - v, y + 4, w + 2 * v, c.s); }
    if (st.slick) { g.row(x, y + 1, w, c.h); g.row(x, y + 2, w, c.s); }

    /* fringe — the eyes sit at y+5, so nothing here reaches below y+4 */
    var f = st.fringe;
    if (f === "straight") {
      g.row(x, y + 3, w, c.b);
      g.row(x, y + 4, 2, c.b); g.row(x + w - 2, y + 4, 2, c.b);
    } else if (f === "blunt") {
      g.rect(x, y + 3, w, 2, c.b);
      g.row(x + 1, y + 4, w - 2, c.s);
    } else if (f === "side") {
      g.row(x, y + 3, w - 2, c.b);
      g.row(x, y + 4, 3, c.b);
      g.set(x + w - 1, y + 3, c.s);
    } else if (f === "swept") {
      g.row(x, y + 3, w, c.b);
      g.row(x + w - 3, y + 4, 3, c.b);
      g.set(x, y + 3, c.h);
    } else if (f === "middle") {
      g.row(x, y + 3, 3, c.b); g.row(x + w - 3, y + 3, 3, c.b);
      g.set(x, y + 4, c.b); g.set(x + w - 1, y + 4, c.b);
      g.set(x + 3, y + 2, c.s); g.set(x + 4, y + 2, c.s);
    } else if (f === "curly") {
      g.rect(x - v, y + 2, w + 2 * v, 2, c.b);
      for (var i = 0; i < w + 2 * v; i += (st.tight ? 2 : 3)) g.set(x - v + i, y + 4, c.b);
      g.set(x - v - 1, y + 2, c.b); g.set(x + w + v, y + 2, c.b);
    } else if (f === "spiky") {
      g.row(x, y + 3, w, c.b);
      for (var k = 0; k < w; k += 2) { g.set(x + k, y - v - 2, c.b); g.set(x + k, y - v - 1, c.b); }
    } else if (f === "quiff") {
      g.rect(x + 1, y - v - 3, 5, 3, c.b);
      g.row(x + 1, y - v - 3, 3, c.h);
      g.row(x, y + 3, w - 2, c.b);
    }

    if (st.curly) {
      g.set(x - v - 1, y - v + 1, c.b); g.set(x + w + v, y - v + 1, c.b);
      g.set(x + 1, y - v - 2, c.b); g.set(x + 4, y - v - 2, c.b); g.set(x + 6, y - v - 2, c.b);
      g.set(x - v - 1, y + 3, c.s); g.set(x + w + v, y + 3, c.s);
      if (st.tight) for (var t = 0; t < w; t += 2) g.set(x + t, y - v + 1, c.s);
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
      if (st.back === "bun") { g.rect(x + 2, y - v - 4, 4, 3, c.b); g.row(x + 3, y - v - 4, 2, c.h); }
      if (st.back === "buns") [x, x + w - 4].forEach(function (bx) { g.rect(bx, y - v - 4, 4, 3, c.b); });
      if (st.back === "bantu") [x, x + 3, x + 6].forEach(function (bx) { g.rect(bx, y - v - 3, 2, 2, c.b); });
    }
  }

  /** Dyed tips, a streak, grown-out roots or an ombre — a second hair colour
   *  painted over hair pixels that are already down. */
  function hairAccent(g, ch, lift) {
    var mode = ((ch.hairAccent | 0) % HAIR_ACCENT.length + HAIR_ACCENT.length) % HAIR_ACCENT.length;
    if (!mode) return;
    var base = tone(pick(HAIRS, ch.hairColor).b);
    var to = tone(pick(HAIRS, ch.hairAccentColor).b);
    var y = HD.y - lift;
    var band = mode === 1 ? [y + 9, H] : mode === 3 ? [0, y + 3] : mode === 4 ? [y + 7, H] : [0, H];
    var colFilter = mode === 2 ? [HD.x + 1, HD.x + 3] : null;

    for (var yy = Math.max(0, band[0]); yy < Math.min(H, band[1]); yy++) {
      for (var xx = 0; xx < W; xx++) {
        if (colFilter && (xx < colFilter[0] || xx > colFilter[1])) continue;
        var c = g.get(xx, yy);
        if (c === base.b) g.set(xx, yy, to.b);
        else if (c === base.s) g.set(xx, yy, to.s);
        else if (c === base.h) g.set(xx, yy, to.h);
        else if (c === base.d) g.set(xx, yy, to.d);
      }
    }
  }

  /* ---------------------------------------------------------------- face ---- */

  /* Head rows, for reference: y+0..y+2 under the hair cap, y+3 high brow,
   * y+4 brow, y+5..y+6 eyes, y+7 nose, y+8 mouth, y+9 jaw. */
  function face(g, ch, dir, lift) {
    if (dir === "up") return;
    var sk = tone(pick(SKINS, ch.skin).b);
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var eye = tone(pick(EYE_COLORS, ch.eyeColor).b);
    var shape = ((ch.eyeShape | 0) % EYE_SHAPES.length + EYE_SHAPES.length) % EYE_SHAPES.length;
    var brow = ((ch.eyebrows | 0) % EYEBROWS.length + EYEBROWS.length) % EYEBROWS.length;
    var det = ((ch.details | 0) % DETAILS.length + DETAILS.length) % DETAILS.length;
    var x = HD.x, y = HD.y - lift;
    var SCLERA = "#f7f3ea";

    var eyes = dir === "down" ? [x + 1, x + 5] : dir === "right" ? [x + 4] : [x + 2];
    var ey = y + 5;

    eyes.forEach(function (ex, idx) {
      /* A white column beside a dark iris column — this is what makes the eye
       * read at 2x2 against any skin tone, light or dark. */
      g.rect(ex, ey, 2, 2, SCLERA);
      var ix = dir === "left" ? ex : ex + 1;
      var sx = ix === ex ? ex + 1 : ex;
      g.col(ix, ey, 2, eye.b);
      g.set(ix, ey, eye.d);

      if (shape === 1) { g.set(sx, ey, tint(sk.b, 0.3)); }
      else if (shape === 2) { g.row(ex, ey, 2, hair.d); }
      else if (shape === 3) { g.row(ex, ey, 2, hair.d); g.set(ix, ey + 1, eye.b); }
      else if (shape === 4) { g.rect(ex, ey + 2, 2, 1, SCLERA); g.set(ix, ey + 2, eye.b); }
      else if (shape === 5) { g.set(sx, ey + 1, eye.d); }
      else if (shape === 6) { g.set(sx, ey, hair.d); }
      else if (shape === 7) { g.set(sx, ey, "#ffffff"); }
      else if (shape === 8) { g.set(sx, ey + 1, hair.d); g.set(ix, ey - 1, hair.d); }   /* Upturned */
      else if (shape === 9) { g.row(ex, ey - 1, 2, hair.d); g.row(ex, ey, 2, hair.s); } /* Hooded */
      else if (shape === 10) { g.set(sx, ey, sk.b); g.set(sx, ey + 1, SCLERA); }        /* Monolid */
      else if (shape === 11) { g.row(ex, ey, 2, sk.s); }                                /* Narrow */

      /* eyebrow */
      var out = idx === 0 && dir === "down" ? ex - 1 : ex;
      if (brow === 0) g.row(ex, ey - 1, 2, hair.s);
      else if (brow === 1) g.row(out, ey - 1, 3, hair.s);
      else if (brow === 2) { g.row(out, ey - 1, 3, hair.b); g.row(ex, ey - 2, 2, hair.s); }
      else if (brow === 3) g.set(ex, ey - 1, hair.s);
      else if (brow === 4) { g.set(ex, ey - 1, hair.s); g.set(ex + 1, ey - 2, hair.s); }
      else if (brow === 5) { g.set(ex, ey - 2, hair.s); g.set(ex + 1, ey - 1, hair.s); }
      else if (brow === 6) g.row(ex, ey - 2, 2, hair.s);
      else if (brow === 7) { g.row(out, ey - 2, 3, hair.b); g.row(out, ey - 1, 3, hair.s); }
      else if (brow === 8) g.set(ex + 1, ey - 2, hair.s);
    });

    var blush = mix(sk.b, [214, 118, 118], 0.34);
    var front = dir === "right";
    var nose = ((ch.nose | 0) % NOSES.length + NOSES.length) % NOSES.length;
    var mouth = ((ch.mouth | 0) % MOUTHS.length + MOUTHS.length) % MOUTHS.length;

    if (dir === "down") {
      var nx = x + 3;
      if (nose === 0) { g.set(nx, y + 7, sk.f); }                                  /* Button */
      else if (nose === 1) { g.set(nx, y + 6, sk.ff); g.set(nx, y + 7, sk.f); }     /* Straight */
      else if (nose === 2) { g.set(nx, y + 7, sk.f); g.set(nx + 1, y + 7, sk.ff); } /* Upturned */
      else if (nose === 3) { g.set(nx, y + 5, sk.ff); g.set(nx, y + 6, sk.ff); g.set(nx, y + 7, sk.f); }
      else if (nose === 4) { g.row(nx, y + 7, 2, sk.f); g.set(nx, y + 6, sk.ff); }  /* Wide */
      else { g.set(nx, y + 7, sk.ff); }                                             /* Small */

      var mx = x + 3;
      if (mouth === 0) { g.row(mx, y + 8, 2, sk.f); }                               /* Neutral */
      else if (mouth === 1) { g.row(mx, y + 8, 2, sk.f); g.set(mx - 1, y + 7, sk.ff); g.set(mx + 2, y + 7, sk.ff); }
      else if (mouth === 2) { g.row(mx - 1, y + 8, 4, sk.f); }                      /* Wide */
      else if (mouth === 3) { g.set(mx, y + 8, sk.f); }                             /* Small */
      else if (mouth === 4) { g.row(mx, y + 8, 2, sk.f); g.row(mx, y + 9, 2, sk.ff); }
      else { g.row(mx - 1, y + 8, 4, sk.f); g.row(mx, y + 7, 2, tint(sk.b, 0.45)); } /* Grin */
    } else {
      var px = front ? x + HD.w - 1 : x;
      var out = front ? x + HD.w : x - 1;
      var far = front ? 1 : -1;
      /* the nose in silhouette — this is what makes a profile read as one */
      if (nose === 0) { g.set(out, y + 6, sk.b); g.set(px, y + 7, sk.ff); }
      else if (nose === 1) { g.set(out, y + 6, sk.b); g.set(out, y + 7, sk.s); }
      else if (nose === 2) { g.set(out, y + 6, sk.b); g.set(out + far, y + 6, sk.b); g.set(px, y + 7, sk.ff); }
      else if (nose === 3) { g.set(out, y + 5, sk.b); g.set(out, y + 6, sk.b); g.set(out + far, y + 6, sk.b); g.set(out, y + 7, sk.s); }
      else if (nose === 4) { g.set(out, y + 6, sk.b); g.set(out, y + 7, sk.b); g.set(out + far, y + 7, sk.s); }
      else { g.set(out, y + 6, sk.s); }

      var lipX = front ? x + HD.w - 3 : x + 1;
      if (mouth === 3) g.set(lipX + (front ? 1 : 0), y + 8, sk.f);
      else if (mouth === 2 || mouth === 5) g.row(lipX, y + 8, 3, sk.f);
      else g.row(lipX + (front ? 1 : 0), y + 8, 2, sk.f);
      if (mouth === 1) g.set(front ? lipX + 3 : lipX - 1, y + 7, sk.ff);
      if (mouth === 4) g.row(lipX + (front ? 1 : 0), y + 9, 2, sk.ff);
    }

    g.col(dir === "down" || !front ? x + HD.w - 1 : x, y + 2, 7, sk.ff);   /* cheek shadow */
    g.row(x + 1, y + HD.h - 1, HD.w - 2, sk.ff);                           /* jaw */

    /* face markings */
    var cheekL = dir === "down" ? x : front ? x + 3 : x + 1;
    var cheekR = dir === "down" ? x + 6 : front ? x + 5 : x + 3;
    if (det === 1 || det === 3) {
      g.set(cheekL + 1, y + 7, sk.f); g.set(cheekL + 2, y + 8, sk.f);
      g.set(cheekR, y + 7, sk.f); g.set(cheekR - 1, y + 8, sk.f);
    }
    if (det === 2 || det === 3) { g.rect(cheekL, y + 7, 2, 1, blush); g.rect(cheekR, y + 7, 2, 1, blush); }
    else if (det === 4) g.set(x + 2, y + 8, tone(hair.b).d);                    /* Beauty mark */
    else if (det === 5) { g.set(x + 2, y + 8, sk.f); g.set(x + 5, y + 8, sk.f); } /* Dimples */
    else if (det === 6) { g.set(x + 5, y + 3, sk.f); g.set(x + 5, y + 4, sk.f); g.set(x + 6, y + 5, sk.f); }
    else if (det === 7) { g.row(x + 1, y + 7, 2, sk.ff); g.row(x + 5, y + 7, 2, sk.ff); }

    facialHair(g, ch, dir, lift, hair, sk);
  }

  function facialHair(g, ch, dir, lift, hair, sk) {
    var f = ((ch.beard | 0) % FACIAL_HAIR.length + FACIAL_HAIR.length) % FACIAL_HAIR.length;
    if (!f) return;
    var x = HD.x, y = HD.y - lift, w = HD.w;
    var lo = y + HD.h - 1;
    var tache = function () { g.row(x + 2, y + 7, w - 4, hair.b); g.set(x + 1, y + 7, hair.s); g.set(x + w - 2, y + 7, hair.s); };
    var chops = function () { g.col(x, y + 4, 4, hair.b); g.col(x + w - 1, y + 4, 4, hair.b); };

    if (f === 1) {                                   /* Stubble */
      for (var i = 0; i < w; i += 2) { g.set(x + i, lo - 1, sk.f); g.set(x + i + 1, lo, sk.f); }
      g.row(x + 2, lo, w - 4, mix(sk.b, parse(hair.b), 0.32));
    } else if (f === 2) { tache(); }                 /* Moustache */
    else if (f === 3) {                              /* Goatee */
      tache(); g.rect(x + 3, y + 9, 2, 2, hair.b); g.set(x + 3, lo, hair.s);
    } else if (f === 4) {                            /* Beard */
      tache(); g.rect(x + 1, y + 9, w - 2, 2, hair.b);
      g.row(x + 1, lo, w - 2, hair.s); chops();
    } else if (f === 5) {                            /* Full beard */
      g.rect(x, y + 7, w, 4, hair.b);
      g.row(x + 3, y + 8, 2, hair.s);
      g.col(x, y + 4, 6, hair.s); g.col(x + w - 1, y + 4, 6, hair.s);
      g.row(x + 1, lo + 2, w - 2, hair.b);
      g.row(x + 2, y + 7, w - 4, hair.h);
    } else if (f === 6) { chops(); }                 /* Sideburns */
    else if (f === 7) {                              /* Mutton chops */
      chops(); g.col(x, y + 8, 2, hair.b); g.col(x + w - 1, y + 8, 2, hair.b);
      g.set(x + 1, y + 8, hair.s); g.set(x + w - 2, y + 8, hair.s);
    } else if (f === 8) { g.row(x + 3, y + 9, 2, hair.b); }   /* Soul patch */
    else if (f === 9) {                              /* Handlebar */
      tache(); g.set(x + 1, y + 8, hair.b); g.set(x + w - 2, y + 8, hair.b);
      g.set(x, y + 7, hair.s); g.set(x + w - 1, y + 7, hair.s);
    } else if (f === 10) {                           /* Short boxed */
      tache(); g.rect(x + 2, y + 9, w - 4, 2, hair.b);
      g.col(x + 1, y + 7, 3, hair.s); g.col(x + w - 2, y + 7, 3, hair.s);
    } else if (f === 11) {                           /* Long beard */
      g.rect(x, y + 7, w, 4, hair.b);
      g.row(x + 3, y + 8, 2, hair.s);
      g.col(x, y + 4, 6, hair.s); g.col(x + w - 1, y + 4, 6, hair.s);
      g.rect(x + 1, lo + 2, w - 2, 4, hair.b);
      g.rect(x + 2, lo + 6, w - 4, 2, hair.b);
      g.row(x + 2, lo + 7, w - 4, hair.d);
    }
  }

  /* ---------------------------------------------------------------- body ---- */

  /* Walk cycle. The body rides highest at mid-stride and lowest at full
   * stride, which is what gives a walk its bounce. Front and back views step
   * roughly in place; the side view takes a real stride, with the far leg and
   * far arm dropped into shadow so the profile reads as depth rather than as
   * a front view with an arm missing. */
  function gait(dir, frame) {
    var f = ((frame | 0) % 4 + 4) % 4;
    var swing = f === 1 ? 1 : f === 3 ? -1 : 0;
    var side = dir === "left" || dir === "right";
    return {
      side: side,
      swing: swing,
      lift: swing === 0 ? 1 : 0,
      near: side ? { dx: 3 * swing, cut: Math.abs(swing) }
                 : { dx: swing > 0 ? -1 : 0, cut: swing > 0 ? 3 : 0 },
      far:  side ? { dx: -3 * swing, cut: Math.abs(swing) }
                 : { dx: swing < 0 ? 1 : 0, cut: swing < 0 ? 3 : 0 },
      nearArm: side ? { dx: -2 * swing, dy: 0 } : { dx: 0, dy: swing },
      farArm:  side ? { dx: 2 * swing, dy: 0 } : { dx: 0, dy: -swing }
    };
  }

  function body(g, ch, dir, frame) {
    var sk = tone(pick(SKINS, ch.skin).b);
    var top = tone(pick(CLOTH, ch.topColor).b);
    var bot = tone(pick(CLOTH, ch.bottomColor).b);
    var shoe = tone(pick(CLOTH, ch.shoeColor).b);
    var fit = ((ch.outfit | 0) % OUTFITS.length + OUTFITS.length) % OUTFITS.length;

    var G = gait(dir, frame);
    var lift = G.lift, side = G.side;

    /* Build sets the width; profile is narrower again, because a full-width
     * torso is most of what made the old side view look wrong. Everything
     * stays centred on x=12.5 so the head never drifts off the shoulders. */
    var bd = BUILDS[((ch.build | 0) % BUILDS.length + BUILDS.length) % BUILDS.length];
    var TW = side ? bd.stw : bd.tw;
    var TX = Math.round(13 - TW / 2);
    var TH = TORSO.h;
    var HW = bd.hw, HX = Math.round(13 - HW / 2);
    var armL = TX - ARM.w, armR = TX + TW;
    var legL = HX, legR = HX + HW - LEG.w;
    var ty = TORSO.y - lift;

    var isDress = fit === 5;
    var longSleeve = (fit === 1 || fit === 2 || fit === 3 || fit === 7 || fit === 9 ||
      fit === 12 || fit === 16 || fit === 19 || fit === 20);
    var sleeve = longSleeve ? ARM.h - 3 : 6;

    /* ---- far arm, behind the torso ---- */
    function arm(ax, ay, shadowed, seam) {
      var sleeveTone = shadowed ? tone(top.s) : top;
      var skinTone = shadowed ? tone(sk.s) : sk;
      if (seam) g.col(ax - 1, ay + 1, ARM.h + 2, top.d);
      g.rect(ax, ay, ARM.w, sleeve, sleeveTone.b);
      g.col(ax + ARM.w - 1, ay, sleeve, sleeveTone.s);
      if (longSleeve) g.row(ax, ay + sleeve - 1, ARM.w, sleeveTone.d);
      else {
        g.rect(ax, ay + sleeve, ARM.w, ARM.h - sleeve, skinTone.b);
        g.col(ax + ARM.w - 1, ay + sleeve, ARM.h - sleeve, skinTone.s);
        g.row(ax, ay + sleeve, ARM.w, sleeveTone.d);
      }
      g.rect(ax, ay + ARM.h, ARM.w, 3, skinTone.b);
      g.col(ax + ARM.w - 1, ay + ARM.h, 3, skinTone.s);
      g.row(ax, ay + ARM.h + 2, ARM.w, skinTone.d);
    }

    if (side) arm(TX - 1 + G.farArm.dx, ty + G.farArm.dy, true, false);

    /* ---- head ---- */
    var hx = HD.x, hy = HD.y - lift;
    g.rect(hx, hy, HD.w, HD.h, sk.b);
    g.clear(hx, hy, 1, 1); g.clear(hx + HD.w - 1, hy, 1, 1);
    g.clear(hx, hy + HD.h - 1, 1, 1); g.clear(hx + HD.w - 1, hy + HD.h - 1, 1, 1);
    if (dir === "down" || dir === "up") {
      g.rect(hx - 1, hy + 4, 1, 2, sk.b); g.rect(hx + HD.w, hy + 4, 1, 2, sk.b);
      g.set(hx + HD.w, hy + 5, sk.s);
    } else {
      g.rect(hx - 1, hy + 2, 1, 5, sk.b);          /* back of the skull */
      g.set(hx - 1, hy + 2, sk.s); g.set(hx - 1, hy + 6, sk.s);
      g.rect(hx + 1, hy + 5, 1, 2, sk.s);          /* ear, set back */
      g.set(hx + 1, hy + 5, sk.d);
    }

    /* ---- neck ---- */
    g.rect(NECK.x, NECK.y - lift, NECK.w, NECK.h, sk.b);
    g.row(NECK.x, NECK.y - lift, NECK.w, sk.d);

    /* ---- torso ---- */
    g.rect(TX, ty, TW, TH, top.b);
    g.row(TX + 1, ty, TW - 2, top.h);
    g.col(TX, ty, TH, top.s);
    g.col(TX + TW - 1, ty, TH, top.s);
    g.row(TX, ty + TH - 1, TW, top.s);

    /* ---- legs and shoes ---- */
    function leg(lx, cut, legTone, shoeTone, toe) {
      g.rect(lx, LEG.y - lift, LEG.w, LEG.h - cut, legTone.b);
      g.col(lx + LEG.w - 1, LEG.y - lift, LEG.h - cut, legTone.s);
      g.row(lx, LEG.y - lift + LEG.h - cut - 1, LEG.w, legTone.d);
      var sx = toe ? lx : lx - 1;
      g.rect(sx, SHOE.y - lift - cut, SHOE.w, SHOE.h, shoeTone.b);
      g.row(sx, SHOE.y - lift - cut, SHOE.w, shoeTone.h);
      g.row(sx, SHOE.y - lift - cut + 1, SHOE.w, shoeTone.d);
    }

    var hipY = HIPS.y - lift;
    if (isDress) {
      g.rect(TX, hipY, TW, 5, top.b);
      g.rect(TX - 1, hipY + 5, TW + 2, 3, top.b);
      g.row(TX - 1, hipY + 7, TW + 2, top.d);
      g.col(TX - 1, hipY + 5, 3, top.s);
      g.col(TX + TW, hipY + 5, 3, top.s);
      for (var fold = TX + 2; fold < TX + TW - 1; fold += 4) g.col(fold, hipY + 1, 6, top.s);
      var sash = tone(pick(CLOTH, ch.accColor).b);
      g.row(TX, hipY - 1, TW, sash.b);
      g.row(TX, hipY, TW, sash.s);
    } else {
      g.rect(side ? TX : HX, hipY, side ? TW : HW, HIPS.h, bot.b);
      g.row((side ? TX : HX) + 1, hipY, (side ? TW : HW) - 2, bot.h);
    }

    var legTone = isDress ? sk : bot;
    var stride = isDress ? 0.5 : 1;
    if (side) {
      var mid = Math.round(13 - LEG.w / 2);
      leg(mid + Math.round(G.far.dx * stride), G.far.cut, tone(legTone.s), tone(shoe.s), true);
      leg(mid + Math.round(G.near.dx * stride), G.near.cut, legTone, shoe, true);
    } else {
      leg(legL + G.near.dx, G.near.cut, legTone, shoe, false);
      leg(legR - G.far.dx, G.far.cut, legTone, shoe, false);
    }

    /* ---- near arm, over the torso ---- */
    if (side) arm(TX + TW - 4 + G.nearArm.dx, ty + G.nearArm.dy, false, true);
    else {
      arm(armL, ty + G.nearArm.dy, false, false);
      arm(armR, ty + G.farArm.dy, false, false);
    }

    outfitDetail(g, fit, top, bot, tone(pick(CLOTH, ch.accColor).b), sk, dir, ty, lift, TX, TW);
  }

  function outfitDetail(g, fit, top, bot, acc, sk, dir, ty, lift, X, TW) {
    var TH = TORSO.h, mid = X + Math.floor(TW / 2);
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
      if (dir === "up") g.rect(HD.x - 1, HD.y - lift + 5, HD.w + 2, 4, top.b);
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
    } else if (fit === 12) {                                   /* Hoodie */
      g.row(X, ty + TH - 2, TW, acc.b); g.row(X, ty + TH - 1, TW, acc.d);
      g.rect(HD.x - 2, ty - 2, HD.w + 4, 2, top.b);              /* hood, behind the shoulders */
      g.row(HD.x - 2, ty - 1, HD.w + 4, top.s);
      g.col(mid - 2, ty + 3, 5, top.d); g.col(mid + 1, ty + 3, 5, top.d);
      g.rect(mid - 1, ty + TH - 6, 2, 3, top.s);                     /* pocket */
    } else if (fit === 13) {                                   /* Shirt & tie */
      g.rect(X + 2, ty, TW - 4, TH, top.h);
      g.col(X + 2, ty, TH, top.d); g.col(X + TW - 3, ty, TH, top.d);
      g.rect(mid - 1, ty, 2, 2, acc.b);
      g.rect(mid - 1, ty + 2, 2, TH - 5, acc.b);
      g.col(mid, ty + 2, TH - 5, acc.s);
      g.row(mid - 1, ty + TH - 3, 2, acc.d);
    } else if (fit === 14) {                                   /* Tank top */
      g.rect(X, ty, 3, 3, sk.b); g.rect(X + TW - 3, ty, 3, 3, sk.b);
      g.rect(X + 2, ty, 2, 2, top.b); g.rect(X + TW - 4, ty, 2, 2, top.b);
      g.row(X + 4, ty, TW - 8, sk.b);
      g.row(X, ty + TH - 1, TW, top.s);
    } else if (fit === 15) {                                   /* Poncho */
      g.rect(X - 1, ty + 1, TW + 2, TH + 1, top.b);
      g.row(X - 1, ty + 1, TW + 2, top.h);
      for (var pz = ty + 4; pz < ty + TH; pz += 4) g.row(X - 1, pz, TW + 2, acc.b);
      g.row(X - 1, ty + TH, TW + 2, top.d);
      g.rect(mid - 2, ty, 4, 2, top.s);
    } else if (fit === 16) {                                   /* Robe */
      g.rect(X, ty, TW, TH, top.b);
      g.col(mid - 1, ty, TH, top.d);
      g.rect(X + 3, ty, 2, 4, top.h); g.rect(X + TW - 5, ty, 2, 4, top.h);
      g.row(X, ty + TH - 3, TW, acc.b);                              /* sash */
      g.row(X, ty + TH - 2, TW, acc.s);
    } else if (fit === 17) {                                   /* Pinafore */
      g.rect(X + 1, ty + 3, TW - 2, TH - 3, acc.b);
      g.rect(X + 2, ty, 2, 4, acc.b); g.rect(X + TW - 4, ty, 2, 4, acc.b);
      g.row(X + 1, ty + 3, TW - 2, acc.h);
      g.rect(mid - 2, ty + 6, 4, 3, acc.s);
    } else if (fit === 18) {                                   /* Gilet */
      g.rect(X, ty, 4, TH, acc.b); g.rect(X + TW - 4, ty, 4, TH, acc.b);
      g.col(X + 3, ty, TH, acc.d); g.col(X + TW - 4, ty, TH, acc.d);
      g.row(X, ty, 4, acc.h); g.row(X + TW - 4, ty, 4, acc.h);
      for (var q = ty + 2; q < ty + TH - 1; q += 3) { g.row(X, q, 4, acc.s); g.row(X + TW - 4, q, 4, acc.s); }
    } else if (fit === 19) {                                   /* Long coat */
      g.col(mid - 1, ty, TH, acc.d);
      g.rect(X + 2, ty, 3, 3, top.h); g.rect(X + TW - 5, ty, 3, 3, top.h);
      g.rect(X, ty + TH, TW, 6, top.b);                              /* skirt of the coat */
      g.col(X, ty + TH, 6, top.s); g.col(X + TW - 1, ty + TH, 6, top.s);
      g.col(mid - 1, ty + TH, 6, acc.d);
      g.row(X, ty + TH + 5, TW, top.d);
      for (var bt = ty + 3; bt < ty + TH; bt += 4) g.set(mid, bt, acc.h);
    } else if (fit === 20) {                                   /* Smock */
      g.rect(X - 1, ty + 2, TW + 2, TH, top.b);
      g.row(X - 1, ty + 2, TW + 2, top.h);
      g.row(X, ty + 5, TW, top.s);
      g.rect(mid - 3, ty + TH - 4, 6, 3, acc.b);
      g.row(X - 1, ty + TH + 1, TW + 2, top.d);
    } else if (fit === 21) {                                   /* Tunic */
      g.rect(X + 1, ty + TH, TW - 2, 4, top.b);
      g.row(X + 1, ty + TH + 3, TW - 2, top.d);
      g.rect(mid - 2, ty, 4, 3, top.h);
      g.row(X, ty + TH - 4, TW, acc.b); g.row(X, ty + TH - 3, TW, acc.s);
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
    var hx = HD.x, hy = HD.y - lift;
    var has = function (n) { return list.indexOf(n) >= 0; };

    if (has("Earrings") && dir !== "up") {
      if (dir === "down") { g.set(hx - 1, hy + 6, acc.b); g.set(hx + HD.w, hy + 6, acc.b); }
      else if (dir === "right") g.set(hx + 1, hy + 6, acc.b);
      else g.set(hx + HD.w - 2, hy + 6, acc.b);
    }
    if ((has("Glasses") || has("Round glasses")) && dir !== "up") {
      var round = has("Round glasses");
      var ey2 = HD.y - lift + 5;                    /* the eye row itself */
      var fc = round ? acc.b : tone("#4a4652").b;
      var glint = tint(fc, 0.5);
      /* Rims go above, below and outside each eye — never across it. */
      if (dir === "down") {
        [hx + 1, hx + 5].forEach(function (ex) {
          g.row(ex - 1, ey2 - 1, 4, fc);
          g.row(ex - 1, ey2 + 2, 4, fc);
          g.col(ex - 1, ey2, 2, fc); g.col(ex + 2, ey2, 2, fc);
        });
        g.set(hx + 3, ey2, fc); g.set(hx + 4, ey2, fc);   /* bridge, between them */
        g.set(hx, ey2 - 1, glint);
      } else {
        var ox = hx + 3;
        g.row(ox - 1, ey2 - 1, 4, fc);
        g.row(ox - 1, ey2 + 2, 4, fc);
        g.col(ox - 1, ey2, 2, fc); g.col(ox + 2, ey2, 2, fc);
        g.set(ox - 1, ey2 - 1, glint);
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
      g.rect(hx - 1, hy - 3, HD.w + 2, 5, acc.b);
      g.row(hx, hy - 4, HD.w, acc.b);
      g.row(hx - 1, hy + 1, HD.w + 2, acc.s);
      g.row(hx - 1, hy + 2, HD.w + 2, acc.d);
      g.row(hx + 1, hy - 3, 3, acc.h);
    }
    if (has("Cap")) {
      g.rect(hx - 1, hy - 2, HD.w + 2, 4, acc.b);
      g.row(hx, hy - 3, HD.w, acc.b);
      g.row(hx + 1, hy - 2, 3, acc.h);
      g.row(hx - 1, hy + 1, HD.w + 2, acc.s);
      if (dir === "down") g.row(hx - 2, hy + 2, HD.w + 4, acc.d);
      else if (dir === "right") g.rect(hx + HD.w + 1, hy + 1, 3, 1, acc.d);
      else if (dir === "left") g.rect(hx - 4, hy + 1, 3, 1, acc.d);
      else g.row(hx - 1, hy + 2, HD.w + 2, acc.s);
    }
    if (has("Sun hat")) {
      g.rect(hx, hy - 4, HD.w, 4, acc.b);
      g.row(hx + 1, hy - 5, HD.w - 2, acc.b);
      g.row(hx + 1, hy - 4, 3, acc.h);
      g.row(hx, hy - 1, HD.w, acc.d);
      g.rect(hx - 4, hy, HD.w + 8, 1, acc.b);
      g.rect(hx - 4, hy + 1, HD.w + 8, 1, acc.s);
    }
    if (has("Sunglasses") && dir !== "up") {
      var sy2 = HD.y - lift + 5;
      var dark = tone("#2b2a33");
      if (dir === "down") {
        g.rect(hx, sy2 - 1, HD.w, 3, dark.b);
        g.set(hx + 3, sy2, dark.h); g.set(hx + 4, sy2, dark.h);
        g.set(hx + 1, sy2, tint(dark.b, 0.45));
      } else {
        g.rect(dir === "right" ? hx + 3 : hx + 1, sy2 - 1, 4, 3, dark.b);
      }
    }
    if (has("Goggles")) {
      var gy2 = HD.y - lift + 1;
      g.rect(hx - 1, gy2, HD.w + 2, 2, acc.d);
      g.rect(hx, gy2, 3, 2, tint(acc.b, 0.4));
      g.rect(hx + HD.w - 3, gy2, 3, 2, tint(acc.b, 0.4));
      g.set(hx + 1, gy2, "#f7f3ea"); g.set(hx + HD.w - 2, gy2, "#f7f3ea");
    }
    if (has("Headband")) {
      g.rect(hx - 1, HD.y - lift + 2, HD.w + 2, 1, acc.b);
      g.set(hx, HD.y - lift + 2, acc.h);
    }
    if (has("Headscarf")) {
      g.rect(hx - 1, hy - 2, HD.w + 2, 5, acc.b);
      g.row(hx, hy - 3, HD.w, acc.b);
      g.row(hx + 1, hy - 2, 3, acc.h);
      g.col(hx - 1, hy + 1, 5, acc.b); g.col(hx + HD.w, hy + 1, 5, acc.b);
      g.row(hx - 1, hy + 2, HD.w + 2, acc.s);
      g.rect(dir === "right" ? hx + HD.w : hx - 2, hy + 4, 2, 3, acc.s);
    }
    if (has("Beret")) {
      g.rect(hx, hy - 3, HD.w, 4, acc.b);
      g.row(hx + 1, hy - 4, HD.w - 2, acc.b);
      g.row(hx + 1, hy - 3, 3, acc.h);
      g.set(hx + HD.w - 1, hy - 4, acc.d);
      g.row(hx, hy + 1, HD.w, acc.s);
    }
    if (has("Bucket hat")) {
      g.rect(hx, hy - 3, HD.w, 4, acc.b);
      g.row(hx + 1, hy - 3, 3, acc.h);
      g.rect(hx - 3, hy + 1, HD.w + 6, 2, acc.b);
      g.row(hx - 3, hy + 2, HD.w + 6, acc.d);
    }
    if (has("Flower crown")) {
      var petals = [tint(acc.b, 0.25), acc.b, tone("#f2efe6").b];
      for (var fl = 0; fl < HD.w; fl += 2) {
        g.set(hx + fl, hy - 1, petals[(fl / 2) % petals.length]);
        g.set(hx + fl, hy - 2, tone("#5f8a4e").b);
      }
      g.row(hx, hy - 1, 1, acc.h);
    }
    if (has("Necklace")) {
      g.row(TORSO.x + 4, TORSO.y - lift + 1, TORSO.w - 8, acc.b);
      g.set(TORSO.x + Math.floor(TORSO.w / 2) - 1, TORSO.y - lift + 2, acc.h);
    }
    if (has("Tool belt")) {
      var by = HIPS.y - lift;
      g.row(HIPS.x, by + 1, HIPS.w, acc.b);
      g.row(HIPS.x, by + 2, HIPS.w, acc.d);
      g.rect(HIPS.x + 1, by + 1, 2, 3, acc.s);
      g.rect(HIPS.x + HIPS.w - 3, by + 1, 2, 3, acc.s);
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

  function mirror(g) {
    var out = new Grid();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) out.px[y * W + (W - 1 - x)] = g.px[y * W + x];
    return out;
  }

  function build(ch, dir, frame) {
    dir = dir || "down"; frame = frame || 0;
    /* Left is right, flipped. One profile to get right rather than two, and
     * the two can never drift apart. */
    if (dir === "left") return mirror(build(ch, "right", frame));
    HD = dir === "right" ? HEAD_SIDE : HEAD;
    var g = new Grid();
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var st = styleOf(ch);
    var lift = (frame === 1 || frame === 3) ? 1 : 0;
    hairBack(g, hair, st, dir, lift);
    body(g, ch, dir, frame);
    face(g, ch, dir, lift);
    hairFront(g, hair, st, dir, lift);
    hairAccent(g, ch, lift);
    accessories(g, ch, dir, frame);
    g.outline();
    return g;
  }

  /* `crop` is an optional {y, h} band of sprite rows — head, torso or legs —
   * so a picker can show the part it actually changes. */
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

  /* The bands the pickers crop to. */
  var CROP = { head: { y: 2, h: 24 }, bust: { y: 2, h: 38 }, torso: { y: 19, h: 22 },
    legs: { y: 32, h: 28 }, full: { y: 0, h: H } };

  /* -------------------------------------------------------------- records ---- */

  function defaultChar() {
    return {
      name: "", hometown: "", birthMonth: 6, birthDay: 12,
      gender: 0, build: 1, nose: 0, mouth: 0,
      skin: 2, hairStyle: styleIndex("Side part"), hairColor: 4,
      eyeShape: 2, eyeColor: 0, eyebrows: 0,
      hairAccent: 0, hairAccentColor: 18,
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
      gender: randInt(GENDERS.length),
      build: randInt(BUILDS.length),
      nose: randInt(NOSES.length),
      mouth: randInt(MOUTHS.length),
      skin: randInt(SKINS.length),
      hairStyle: randInt(HAIR_STYLES.length),
      hairColor: randInt(HAIRS.length),
      eyeShape: randInt(EYE_SHAPES.length),
      eyeColor: randInt(EYE_COLORS.length),
      eyebrows: randInt(EYEBROWS.length),
      hairAccent: Math.random() < 0.18 ? randInt(HAIR_ACCENT.length) : 0,
      hairAccentColor: randInt(HAIRS.length),
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

  /**
   * A child of two characters.
   *
   * Skin tends toward the midpoint of its parents, because the palette runs
   * light to dark and that is what mixing looks like. The features that read
   * as family — eyes, nose, mouth, brows — come whole from one parent or the
   * other rather than being averaged, which is how resemblance actually
   * works: your mother's nose, your father's eyes.
   *
   * Nothing here is final. The player can change every part of the result.
   */
  function inherit(a, b) {
    function either() { return Math.random() < 0.5 ? a : b; }
    function mix(key, spread) {
      var m = Math.round(((a[key] | 0) + (b[key] | 0)) / 2);
      return clamp(m + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) * (spread || 1) : 0), key);
    }
    function clamp(v, key) {
      var len = LEN[key] || 1;
      return Math.max(0, Math.min(len - 1, v));
    }
    var LEN = {
      skin: SKINS.length, hairColor: HAIRS.length, eyeColor: EYE_COLORS.length,
      build: BUILDS.length
    };

    var kid = defaultChar();
    kid.skin = Math.random() < 0.7 ? mix("skin", 1) : either().skin;
    kid.hairColor = Math.random() < 0.75 ? either().hairColor : clamp(mix("hairColor", 2), "hairColor");
    kid.eyeColor = either().eyeColor;
    kid.eyeShape = either().eyeShape;
    kid.eyebrows = either().eyebrows;
    kid.nose = either().nose;
    kid.mouth = either().mouth;
    kid.build = Math.random() < 0.6 ? mix("build", 1) : either().build;
    kid.details = Math.random() < 0.4 ? either().details : 0;
    kid.gender = randInt(GENDERS.length);
    kid.hairStyle = randInt(HAIR_STYLES.length);   /* nobody inherits a haircut */
    kid.beard = 0;
    kid.hairAccent = 0;
    var fit = randomChar();
    kid.outfit = fit.outfit;
    kid.topColor = fit.topColor; kid.bottomColor = fit.bottomColor;
    kid.shoeColor = fit.shoeColor; kid.accColor = fit.accColor;
    kid.accessories = [];
    kid.birthMonth = randInt(12) + 1;
    kid.birthDay = randInt(28) + 1;
    kid.voice = randInt(11);
    kid.name = "";
    kid.hometown = "the island";
    return kid;
  }

  root.CozySprite = {
    W: W, H: H,
    SKINS: SKINS, HAIRS: HAIRS, EYE_COLORS: EYE_COLORS, CLOTH: CLOTH,
    HAIR_STYLES: HAIR_STYLES, EYE_SHAPES: EYE_SHAPES, OUTFITS: OUTFITS,
    ACCESSORIES: ACCESSORIES, DETAILS: DETAILS, FACIAL_HAIR: FACIAL_HAIR,
    EYEBROWS: EYEBROWS, HAIR_ACCENT: HAIR_ACCENT, styleIndex: styleIndex,
    GENDERS: GENDERS, BUILDS: BUILDS, NOSES: NOSES, MOUTHS: MOUTHS,
    tone: tone, shade: shade, tint: tint, CROP: CROP, EYE_ROW: HEAD.y + 5,
    starSign: starSign, render: render, build: build,
    randomChar: randomChar, defaultChar: defaultChar, inherit: inherit
  };
})(typeof window !== "undefined" ? window : this);
