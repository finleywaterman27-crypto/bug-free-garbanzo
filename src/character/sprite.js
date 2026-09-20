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
  var OUT = {};                     /* any tone -> its family's outline tone */

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
    /* Every tone in the family remembers the one outline colour that family
     * uses. The outline pass reads the colour it is standing next to, and
     * deriving an outline from THAT gave a different colour depending on
     * whether the edge happened to border the base, the shade or the
     * highlight — so a single silhouette came out in three tones and looked
     * mottled and ragged. */
    var k;
    for (k in t) if (t.hasOwnProperty(k) && !OUT[t[k]]) OUT[t[k]] = t.o;
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
    { n: "Fishtail",     vol: 1, fringe: "side",     side: 3,  back: "fishtail" },
    { n: "Past shoulder",vol: 1, fringe: "side",     side: 14, back: "fall" },
    { n: "Long layered", vol: 2, fringe: "swept",    side: 17, back: "fall", wavy: true },
    { n: "Mid back",     vol: 1, fringe: "straight", side: 19, back: "fall" },
    { n: "Very long",    vol: 1, fringe: "middle",   side: 23, back: "fall" },
    { n: "Loose curls",  vol: 2, fringe: "curly",    side: 16, back: "fall", curly: true },
    { n: "Long braid",   vol: 1, fringe: "side",     side: 4,  back: "onebraid" },
    { n: "Low ponytail", vol: 1, fringe: "swept",    side: 5,  back: "lowpony" },
    { n: "Long twists",  vol: 1, fringe: "none",     side: 6,  back: "longtwists" }
  ];

  function styleIndex(name) {
    for (var i = 0; i < HAIR_STYLES.length; i++) if (HAIR_STYLES[i].n === name) return i;
    return 0;
  }

  var EYE_SHAPES = ["Round", "Soft", "Almond", "Sleepy", "Wide", "Keen", "Downturned", "Bright",
    "Upturned", "Hooded", "Monolid", "Narrow"];

  var EYEBROWS = ["Natural", "Straight", "Thick", "Thin", "Arched", "Angled",
    "Rounded", "Bushy", "Fine", "Low", "High", "Tapered", "Curved", "Sparse"];

  var HAIR_ACCENT = ["None", "Dyed tips", "Streak", "Roots", "Ombre"];

  var OUTFITS = [
    "T-shirt", "Long sleeves", "Knit jumper", "Fisherman's knit", "Dungarees",
    "Sundress", "Work apron", "Raincoat", "Striped tee", "Cardigan",
    "Overshirt", "Waistcoat",
    "Hoodie", "Shirt & tie", "Tank top", "Poncho", "Robe", "Pinafore",
    "Gilet", "Long coat", "Smock", "Tunic",
    "Blouse", "A-line skirt", "Wrap dress", "Long dress", "Knit & skirt", "Pinafore dress"
  ];

  /* Outfits that hang a skirt over bare legs, and how far down it falls.
   * A skirt takes the trouser colour, so the trousers section is never a
   * dead end for someone in a dress. */
  var SKIRTS = { 5: 16, 23: 15, 24: 17, 25: 27, 26: 14, 27: 16 };

  var ACCESSORIES = ["Glasses", "Round glasses", "Sunglasses", "Sun hat", "Cap", "Beanie",
    "Headscarf", "Headband", "Flower crown", "Goggles",
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

  var NOSES = ["Button", "Straight", "Upturned", "Roman", "Wide", "Snub",
    "Narrow", "Hooked", "Flat", "Pointed", "Bulbous", "Long"];
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
  /** Is (x, y) inside any rect the current guard fences off? */
  Grid.prototype.barred = function (x, y) {
    var fb = this.forbid;
    if (!fb) return false;
    for (var i = 0; i < fb.length; i++) {
      var r = fb[i];
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return true;
    }
    return false;
  };
  Grid.prototype.set = function (x, y, c) {
    if (!c) return;
    x = x | 0; y = y | 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    /* The guard is how the face is protected: hair draws normally and simply
     * cannot land inside it. Enforcing the rule here means it holds for all
     * forty-eight styles without each one having to remember. */
    if (this.forbid && this.barred(x, y)) return;
    this.px[y * W + x] = c;
  };

  /** The part of the face no hair may enter. */
  Grid.prototype.protectFace = function (dir, lift) {
    var y = HD.y - lift;
    /* Seen from behind there is no face to protect and the whole skull should
     * be hair, so the guard stands down. */
    if (dir === "up") { this.forbid = null; return; }

    if (dir === "right") {
      /* Side on there is no face to keep clear in the way there is head on:
       * the eye, the brow and the mouth are all in the outline rather than on
       * the cheek, and hair falling forward is SUPPOSED to hang over the side
       * of the face. Two things it must not do.
       *
       * It must not hang in front of the face, out in the air past the nose —
       * so everything forward of the skull is fenced off, down to the top of
       * the shoulders. (Down to the chin was not enough: a low ponytail's
       * mass cleared the jaw by two rows and stuck out in front of the
       * throat like a shelf. Below the shoulders hair is free again, because
       * falling forward over a shoulder is what long hair does.)
       *
       * And it must not swallow the profile line itself. The front two
       * columns of the face, from the brow down, are the
       * forehead-nose-lip-chin edge that makes a side view a side view. Cover
       * them and the nose is stranded outside the hair like a stuck-on beak;
       * leave only one and the face reads as a sliver split off from itself. */
      this.forbid = [
        { x: HD.x + HD.w, y: 0, w: W - (HD.x + HD.w), h: H },
        { x: HD.x + HD.w - 2, y: y + R.brow, w: 2, h: HD.h - R.brow + 1 }
      ];
      return;
    }
    this.forbid = [{ x: HD.x + 1, y: y + R.brow, w: HD.w - 2, h: HD.h - R.brow + 1 }];
  };
  Grid.prototype.unprotect = function () { this.forbid = null; };
  /** Fence off everything above `y` as well, so a hat's worth of hair is cut
   *  away rather than drawn and then covered over. */
  Grid.prototype.capHair = function (y) {
    if (!y) return;
    this.forbid = (this.forbid || []).concat([{ x: 0, y: 0, w: W, h: y }]);
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
  /* Erasing the face counts as covering it: a rounded corner that took a bite
   * out of the temple left a hole for the outline pass to fill in grey, which
   * read as hair on the brow. `clear` honours the guard for that reason. */
  Grid.prototype.clear = function (x, y, w, h) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var px = x + i, py = y + j;
      if (px < 0 || py < 0 || px >= W || py >= H) continue;
      if (this.forbid && this.barred(px, py)) continue;
      this.px[py * W + px] = null;
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
        if (found) this.px[y * W + x] = OUT[found] || tone(found).o;
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
  var R = { brow: 4, eye: 8, nose: 11, mouth: 16, chin: 18 };

  function pick(list, i) { return list[((i | 0) % list.length + list.length) % list.length]; }
  function idx(i, list) { return ((i | 0) % list.length + list.length) % list.length; }
  function styleOf(ch) { return HAIR_STYLES[idx(ch.hairStyle, HAIR_STYLES)]; }

  /* Hats that sit on the crown, and how far down the head each one reaches.
   * The number is rows below the top of the skull; hair does not draw above
   * that line at all, so short hair goes bald under a hat and long hair only
   * shows where it hangs out below the brim — which is how a hat works.
   * Drawing the hat over the hair instead meant sizing it to the hair, and a
   * hat cut to clear a big style looked enormous on everyone. The headscarf's
   * reach is the whole figure, because a scarf covers the hair rather than
   * sitting on it: left at the brim, a long style piled up below the drape
   * and read as a brown cape. */
  var CROWN_HAT = { "Sun hat": 4, "Cap": 4, "Beanie": 4, "Headscarf": 64 };
  /** The row below which hair may still draw, or 0 when nothing is worn. */
  function hatBrim(ch, lift) {
    var list = ch.accessories || [], deep = -1;
    for (var i = 0; i < list.length; i++) {
      var d = CROWN_HAT[list[i]];
      if (d !== undefined && d > deep) deep = d;
    }
    return deep < 0 ? 0 : HEAD.y - lift + deep;
  }

  /* ---------------------------------------------------------------- hair ---- */

  function hairBack(g, c, st, dir, lift) {
    if (st.bald) return;
    var x = HD.x, y = HD.y - lift, w = HD.w, v = st.vol * 2, k = st.back;
    var side = st.side * 2;

    /* Every part of the hair shares ONE outer edge. Drawn piece by piece with
     * its own margin — the cap two out from the head, the curtain two, the
     * mass four — the silhouette pinched in at the temples and bulged out at
     * the jaw for no reason anyone could see, which read as hair going thin
     * and thick at random. HL and HR are that edge; HW is the span. */
    var HL = x - v, HR2 = x + w + v - 1, HW = w + 2 * v;

    /* In profile the head is turned, so what are the sides of it from the
     * front are its FRONT and its BACK. Anything that hangs off one side —
     * a ponytail, a low bun, one of a pair of braids — has to be moved round
     * behind, or it comes out of the face. A pair collapses to the near one:
     * two tails side by side is a front view wearing a side view. */
    var turned = dir === "right";
    /** Where something `n` wide that hangs off the side belongs. Side on it
     *  butts against the back of the skull; set out by the hair's own volume,
     *  as it is head on, it floated clear of the head with daylight between
     *  the two. */
    function offside(n) { return turned ? x - n + 1 : x + w + v; }
    /** The pair, or just the near one of it when we are looking side on. */
    function pair(a, b, n) { return turned ? [offside(n)] : [a, b]; }

    /** The mass of hair that hangs down the back and past the ears.
     *
     *  It starts flush with the crown and widens by a pixel every other row
     *  for the first few, so the hair gets fuller as it falls. Drawn as one
     *  flat block four pixels proud of the head it stepped out all at once
     *  under the ear, and the two pixels of hair beside the eyes above that
     *  looked like a hairline receding. */
    function mass(top, len, flare) {
      flare = flare === undefined ? 2 : flare;
      for (var f = 0; f <= flare; f++) {
        var t = top + f * 2;
        if (t >= top + len) { flare = f - 1; break; }
        g.rect(HL - f, t, HW + 2 * f, top + len - t, c.b);
      }
      if (flare < 0) return;
      var t2 = top + 2 * flare;
      g.rect(HL - flare, t2, 2, top + len - t2, c.s);
      g.rect(HR2 + flare - 1, t2, 2, top + len - t2, c.s);
      g.row(HL - flare, top + len - 1, HW + 2 * flare, c.d);
      return flare;
    }

    if (k === "fall") {
      var len = side + 4;
      var fl0 = mass(y + 8, len);
      if (st.wavy) {
        g.rect(HL - fl0, y + 8 + len, 6, 2, c.b);
        g.rect(HR2 + fl0 - 5, y + 8 + len, 6, 2, c.b);
        g.rect(x + 4, y + 8 + len, 8, 2, c.s);
      }
    } else if (k === "ponytail") {
      var pt = offside(5);
      g.rect(pt, y + 12, 5, 22, c.b);
      g.rect(turned ? pt : pt + 3, y + 12, 2, 22, c.s);
      g.rect(pt + (turned ? 1 : -1), y + 32, 4, 4, c.d);
      if (dir === "up") g.rect(x + 6, y + 14, 6, 24, c.b);
    } else if (k === "highpony") {
      var hp = turned ? x - v - 4 : x + w + v - 2, ht = offside(5);
      g.rect(hp, y - v - 2, 6, 8, c.b);
      g.rect(ht, y + 4, 5, 20, c.b);
      g.rect(turned ? ht : ht + 3, y + 4, 2, 20, c.s);
      g.row(hp, y - v - 2, 6, c.h);
    } else if (k === "sidepony") {
      /* Gathered at the side of the head, so side on it hangs over the near
       * shoulder rather than straight down the back — which is what every
       * other tail does, and made this one indistinguishable from them. It
       * starts below the jaw so it stays off the face. */
      var sp = turned ? x + w - 7 : x + w + v - 2;
      var spy = turned ? y + 21 : y + 15;
      g.rect(sp, spy, 6, 20, c.b);
      g.rect(turned ? sp + 4 : sp + 4, spy, 2, 20, c.s);
      g.row(sp, spy + 18, 6, c.d);
    } else if (k === "pigtails") {
      pair(x - v - 6, x + w + v, 6).forEach(function (bx, i) {
        g.rect(bx, y + 11, 6, 20, c.b);
        g.rect(i === 0 ? bx : bx + 4, y + 11, 2, 20, c.s);
        g.row(bx, y + 29, 6, c.d);
        g.row(bx + 1, y + 11, 4, c.h);
      });
    } else if (k === "buns") {
      (turned ? [x + 3] : [x - 2, x + w - 6]).forEach(function (bx) {
        g.rect(bx, y - v - 8, 8, 7, c.b);
        g.round(bx, y - v - 8, 8, 7, 2);
        g.rect(bx + 1, y - v - 7, 3, 2, c.hh);
        g.row(bx, y - v - 3, 8, c.s);
      });
    } else if (k === "bun") {
      var bnx = turned ? x + 2 : x + 4;
      g.rect(bnx, y - v - 9, 8, 8, c.b);
      g.round(bnx, y - v - 9, 8, 8, 2);
      g.rect(bnx + 1, y - v - 8, 3, 2, c.hh);
      g.rect(bnx + 6, y - v - 7, 2, 5, c.s);
    } else if (k === "lowbun") {
      var lb = turned ? x - 4 : x + w - 3;
      g.rect(lb, y + 20, 7, 8, c.b);
      g.round(lb, y + 20, 7, 8, 2);
      g.rect(turned ? lb : lb + 5, y + 21, 2, 6, c.s);
      g.rect(lb + 1, y + 21, 3, 2, c.h);
      if (dir === "up") { g.rect(x + 5, y + 20, 8, 8, c.b); g.rect(x + 6, y + 21, 3, 2, c.h); }
    } else if (k === "halfup") {
      var hl = side + 8;
      mass(y + 8, hl);
      g.rect(x + 5, y - v - 4, 7, 5, c.b);
      g.rect(x + 6, y - v - 4, 3, 2, c.hh);
    } else if (k === "braids") {
      pair(x - v - 5, x + w + v, 5).forEach(function (bx) {
        g.rect(bx, y + 13, 5, 26, c.b);
        for (var i = y + 15; i < y + 37; i += 4) g.row(bx, i, 5, c.s);
        g.row(bx, y + 38, 5, c.d);
      });
    } else if (k === "fishtail") {
      var fx = dir === "up" ? x + 6 : turned ? x - v - 4 : x + w + v - 2;
      g.rect(fx, y + 13, 6, 26, c.b);
      for (var f = y + 15; f < y + 38; f += 4) {
        g.row(fx, f, 3, c.s); g.row(fx + 3, f + 2, 3, c.s);
      }
      g.row(fx, y + 38, 6, c.d);
      if (dir === "up") g.rect(x + 4, y + 9, 9, 6, c.b);
    } else if (k === "locs" || k === "twists") {
      var step = k === "twists" ? 5 : 3;
      var fl1 = mass(y + 8, 22);
      for (var i = 0; i < HW + 2 * fl1; i += step) {
        g.col(HL - fl1 + i, y + 12, 16, c.s);
        g.rect(HL - fl1 + i, y + 28, step - 1, 2, c.d);
      }
    } else if (k === "onebraid") {
      g.rect(x + 5, y + 13, 6, 34, c.b);
      for (var ob = y + 15; ob < y + 46; ob += 4) g.row(x + 5, ob, 6, c.s);
      g.row(x + 5, y + 46, 6, c.d);
    } else if (k === "lowpony") {
      mass(y + 8, 14);
      g.rect(x + 4, y + 21, 8, 22, c.b);
      g.rect(x + 9, y + 21, 3, 22, c.s);
      g.row(x + 4, y + 42, 8, c.d);
    } else if (k === "longtwists") {
      var fl2 = mass(y + 8, 30);
      for (var lt = 0; lt < HW + 2 * fl2; lt += 5) {
        g.col(HL - fl2 + lt, y + 12, 24, c.s);
        g.rect(HL - fl2 + lt, y + 36, 4, 2, c.d);
      }
    } else if (k === "bantu") {
      (turned ? [x, x + 5, x + 10] : [x, x + 6, x + 12]).forEach(function (bx) {
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
    var turned = dir === "right";
    /* The same one outer edge hairBack works to. */
    var HL = x - v, HR2 = x + w + v - 1, HW = w + 2 * v;
    /* How far below y+8 each back style's mass hangs — hairBack's own
     * numbers, so the near side can be made to match it. */
    var BACK_LEN = { fall: side + 4, halfup: side + 8, locs: 22, twists: 22,
      longtwists: 30, lowpony: 14 };

    if (st.mohawk) {
      g.rect(x + 5, y - 5, 7, 14, c.b);
      g.rect(x + 6, y - 9, 5, 5, c.b);
      g.rect(x + 6, y - 9, 2, 4, c.hh);
      g.col(x + 11, y - 5, 14, c.s);
      if (dir === "up") {
        /* From behind a mohawk is one strip down the middle of a shaved head.
         * The tufts that soften it either side from the front stuck out of
         * the skull like handles. */
        g.rect(x + 5, y - 5, 7, 24, c.b);
        g.col(x + 5, y - 5, 24, c.s); g.col(x + 11, y - 5, 24, c.s);
        return;
      }
      g.rect(x + 3, y + 5, 2, 4, c.b); g.rect(x + 12, y + 5, 2, 4, c.b);
      return;
    }

    var capH = st.thin ? 4 : 6 + v;
    g.rect(x - v, y - v, w + 2 * v, capH, c.b);
    if (!st.thin) g.rect(x - v + 2, y - v - 2, w + 2 * v - 4, 2, c.b);
    g.round(x - v, y - v - (st.thin ? 0 : 2), w + 2 * v, capH + (st.thin ? 0 : 2), 2);
    /* A thin catch of light along the crown. A six-by-two block in the
     * lightest tone, with a second block under it, read as a grey sticker
     * stuck to the top of every head. */
    g.row(x + 4, y - v, 5, c.hh);
    g.row(x + 5, y - v + 1, 3, c.h);

    if (side > 0) {
      var sw = 4 + v;
      /* Both sides, always. Clamping the near side in profile was what made
       * the same haircut look shorter from the side than from the front.
       *
       * Head on that is two curtains, one off each edge of the head. Side on
       * it is ONE: hair wraps from the back of the head round over the ear
       * and stops at the cheekbone, leaving the front of the face — forehead,
       * brow, nose, lip, chin — clear. Drawn as two curtains side on, it put
       * a band of hair across the middle of the face with a strip of cheek
       * showing on either side of it, and the face read as two slivers rather
       * than as a face. */
      if (turned) {
        /* Down the near side of the head the hair has to last as long as the
         * mass hanging down the back does, or it stops at the ear and the
         * jaw below it is bare — a low ponytail lost the whole side of its
         * head that way. And the front edge sweeps BACK from the temple over
         * three rows instead of stepping back four pixels in one, which is
         * how hair leaves a hairline. */
        var cl2 = Math.max(side, 6 + (BACK_LEN[st.back] || 0));
        for (var cr = 0; cr < cl2; cr++) {
          var edge = x + w - 7 + Math.max(0, 6 - cr);
          g.row(HL, y + 2 + cr, edge - HL + 1, c.b);
          if (cr < 2) g.set(HL, y + 2 + cr, c.s);
          g.set(edge, y + 2 + cr, c.s);
          g.set(edge - 1, y + 2 + cr, c.s);
        }
        g.rect(HL, y + 2, 2, cl2, c.s);
        if (st.hime) g.row(HL, y + 2 + cl2 - 1, x + w - 7 - HL + 1, c.d);
      } else {
        var nx = HR2 - sw + 1;
        g.rect(HL, y + 2, sw, side, c.b);
        g.rect(HL, y + 2, 2, side, c.s);
        g.rect(nx, y + 2, sw, side, c.b);
        g.rect(nx + sw - 2, y + 2, 2, side, c.s);
        if (st.hime) {
          g.row(HL, y + 2 + side - 1, sw, c.d);
          g.row(nx, y + 2 + side - 1, sw, c.d);
        }
      }
    }
    if (st.bowl) {
      /* Side on the bowl sweeps back with the same taper the curtain uses,
       * or its flat front edge steps back four pixels in one row where the
       * two meet. */
      for (var bw = 0; bw < 8; bw++) {
        var be = turned ? x + w - 7 + Math.max(0, 6 - bw) : HR2;
        g.row(HL, y + 2 + bw, be - HL + 1, bw === 6 ? c.s : bw === 7 ? c.d : c.b);
      }
    }
    if (st.slick) {
      for (var sl = 0; sl < capH - 1; sl += 2) g.row(x, y + sl, w, sl % 4 ? c.s : c.h);
    }

    /* Every fringe stops above the brow line. Nothing here may reach y+R.brow
     * — the grid refuses it anyway, but drawing inside the rule keeps the
     * shapes honest rather than clipped. */
    var fy = y + 1;
    var f = st.fringe;
    if (f === "straight") {
      g.rect(x, fy, w, 3, c.b);
    } else if (f === "blunt") {
      g.rect(x, fy - 1, w, 4, c.b);
      g.row(x + 1, fy + 2, w - 2, c.s);
    } else if (f === "side") {
      g.rect(x, fy, w - 4, 3, c.b);
      g.rect(x, fy - 1, 7, 2, c.b);
      g.rect(x + w - 3, fy, 3, 2, c.s);
    } else if (f === "swept") {
      g.rect(x, fy, w, 2, c.b);
      g.rect(x + w - 7, fy + 2, 7, 1, c.b);
      g.rect(x, fy, 3, 2, c.hh);
    } else if (f === "middle") {
      g.rect(x, fy - 1, 6, 4, c.b); g.rect(x + w - 6, fy - 1, 6, 4, c.b);
      g.rect(x + 6, fy - 1, w - 12, 2, c.s);
    } else if (f === "curly") {
      g.rect(x - v, fy - 1, w + 2 * v, 3, c.b);
      for (var i = 0; i < w + 2 * v; i += (st.tight ? 3 : 5)) g.rect(x - v + i, fy + 2, 2, 1, c.b);
      g.rect(x - v - 2, y + 2, 2, 3, c.b); g.rect(x + w + v, y + 2, 2, 3, c.b);
    } else if (f === "spiky") {
      g.rect(x, fy, w, 2, c.b);
      for (var k = 0; k < w; k += 4) { g.rect(x + k, y - v - 5, 2, 5 + v, c.b); g.set(x + k, y - v - 5, c.h); }
    } else if (f === "quiff") {
      g.rect(x + 2, y - v - 7, 10, 7 + v, c.b);
      g.rect(x + 2, y - v - 7, 4, 3, c.hh);
      g.rect(x, fy, w - 4, 2, c.b);
    }

    if (st.curly) {
      g.rect(HL - 1, y - v + 2, 1, 3, c.b); g.rect(HR2 + 1, y - v + 2, 1, 3, c.b);
      [1, 7, 12].forEach(function (o) { g.rect(x + o, y - v - 3, 3, 3, c.b); });
      g.rect(HL - 1, y + 7, 1, 3, c.s); g.rect(HR2 + 1, y + 7, 1, 3, c.s);
    }
    if (st.messy) {
      g.rect(HL - 1, y - v, 1, 2, c.b); g.rect(HR2 + 1, y - v + 2, 1, 2, c.b);
      g.rect(x + 3, y - v - 3, 2, 3, c.b); g.rect(x + 10, y - v - 3, 3, 3, c.b);
    }

    var LONG_BACK = { fall: 1, locs: 1, twists: 1, longtwists: 1, halfup: 1 };
    if (LONG_BACK[st.back] && dir !== "up") {
      /* the locks that fall in front of the shoulders */
      var fl = st.back === "fall" || st.back === "halfup" ? side + 4 : 28;
      [HL, turned ? x + w - 10 : HR2 - 3].forEach(function (lx, i) {
        g.rect(lx, y + 6, 4, fl, c.b);
        g.rect(i === 0 ? lx : lx + 2, y + 6, 2, fl, c.s);
        g.rect(lx, y + 6 + fl - 2, 4, 2, c.d);
      });
    }

    if (dir === "up") {
      g.rect(HL, y - v, HW, 19 + v, c.b);
      g.round(HL, y - v, HW, 19 + v, 2);
      g.rect(HL, y + 2, 2, 16, c.s); g.rect(HR2 - 1, y + 2, 2, 16, c.s);
      g.row(x + 4, y - v + 2, 4, c.hh);
      if (st.back === "bun") { g.rect(x + 4, y - v - 9, 8, 8, c.b); g.rect(x + 5, y - v - 8, 3, 2, c.hh); }
      if (st.back === "buns") [x - 2, x + w - 6].forEach(function (bx) { g.rect(bx, y - v - 8, 8, 7, c.b); });
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
    /* Both irises centred in their own eye. One was drawn hard against its
     * outer edge and the other one in from its inner edge, so both looked the
     * same way across the face — a sidelong glance, which under a pair of
     * brows reads as a glare. `facing` now only decides which side a shape
     * is trimmed on, not where the iris sits. */
    var ix = x + 1;



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
    else if (shape === 11) {                       /* Narrow across, not squeezed flat */
      var away = facing < 0 ? x : x + w - 1;        /* trim the outer side */
      g.col(away, top, h, sk.b);
      g.set(facing < 0 ? x + 1 : x + w - 2, top + 1, lid);
    }
  }

  /* Brows are five wide and sit just outside each eye, leaving a clear gap
   * between them. Six wide met in the middle and made a unibrow, which is
   * most of what was reading as "creepy". */
  /* Brows occupy y+R.brow .. y+R.brow+2 and nothing else. Above that is the
   * fringe's business; below it, the eyes. Five wide, sitting just outside
   * each eye, so the two never meet in the middle. */
  /* A brow, five wide, drawn from the OUTER end inward: offset 0 is the tail
   * beside the temple, offset 4 the end nearest the nose. The right brow is
   * the same shape flipped, which it was not before — both were drawn
   * identically, so one face wore a worried brow and the other an angry one
   * at the same time, and the whole face came out stern.
   *
   * There is a clear row between these and the eye now. Sitting straight on
   * the lid, even a level brow glowers. */
  function brow(g, x, y, c, style, flip) {
    function r(dx, dy, w, h, col) {
      g.rect(x + (flip ? 5 - dx - w : dx), y + dy, w, h, col);
    }
    function p(dx, dy, col) { r(dx, dy, 1, 1, col); }

    if (style === 0) { r(0, 1, 4, 2, c.s); p(4, 2, c.s); }                   /* Natural */
    else if (style === 1) r(0, 1, 5, 2, c.b);                                /* Straight */
    else if (style === 2) r(0, 0, 5, 3, c.b);                                /* Thick */
    else if (style === 3) r(0, 2, 4, 1, c.s);                                /* Thin */
    else if (style === 4) { p(0, 2, c.s); r(1, 1, 3, 2, c.s); p(4, 2, c.s); }/* Arched */
    else if (style === 5) { r(0, 2, 2, 1, c.s); r(2, 1, 3, 2, c.s); }        /* Angled */
    else if (style === 6) { r(0, 1, 5, 2, c.s); p(0, 1, null); p(4, 1, null); } /* Rounded */
    else if (style === 7) {                                                  /* Bushy */
      r(0, 0, 5, 3, c.b); p(1, 1, c.s); p(3, 1, c.s);
    } else if (style === 8) r(1, 1, 3, 1, c.s);                              /* Fine */
    else if (style === 9) r(0, 2, 5, 1, c.b);                                /* Low */
    else if (style === 10) r(0, 0, 5, 1, c.b);                               /* High */
    else if (style === 11) { p(0, 2, c.s); r(1, 1, 4, 2, c.s); }             /* Tapered */
    else if (style === 12) { p(0, 2, c.s); r(1, 1, 3, 1, c.s); p(4, 2, c.s); }/* Curved */
    else if (style === 13) { p(0, 1, c.s); p(2, 1, c.s); p(4, 1, c.s); }     /* Sparse */
  }

  /* The eye, edge-on. Two columns at the very front of the face — the outer
   * one is the profile line itself — built from the same parts as the eye you
   * see head on, so it reads as the same eye and not as a coloured chip: a
   * lash across the top, the white behind the iris (because from the side
   * that is the order you see them in), the iris on the line, and a lower
   * lash under it. Four rows, the same as the front eye, so a face turning
   * does not have its eye jump up or down.
   *
   * It goes down AFTER the hair, and only onto skin. Anything that has
   * fallen over those columns — a fringe, a curtain of long hair, a hat
   * pulled low — hides the eye, which is what hair does. */
  function profileEye(g, ch, lift) {
    var sk = tone(pick(SKINS, ch.skin).b);
    var hair = tone(pick(HAIRS, ch.hairColor).b);
    var iris = tone(pick(EYE_COLORS, ch.eyeColor).b);
    var shape = idx(ch.eyeShape, EYE_SHAPES);
    var ex = HD.x + HD.w - 2, ey = HD.y - lift + R.eye;
    var skin = [sk.b, sk.s, sk.h, sk.hh, sk.f, sk.ff, sk.d];
    for (var j = 0; j < 4; j++) {
      for (var i = 0; i < 2; i++) {
        if (skin.indexOf(g.get(ex + i, ey + j)) < 0) return;   /* covered */
      }
    }
    var lidRows = (shape === 3 || shape === 9) ? 2 : 1;        /* sleepy, hooded */
    g.rect(ex, ey, 2, lidRows, hair.d);                        /* the lash */
    g.set(ex, ey + lidRows, "#fbf7ee");
    g.set(ex + 1, ey + lidRows, tint(iris.b, 0.5));            /* the catchlight */
    g.set(ex, ey + lidRows + 1, shape === 11 ? sk.ff : "#fbf7ee");
    g.set(ex + 1, ey + lidRows + 1, iris.b);
    g.set(ex, ey + 3, sk.ff);                                  /* the lower lid */
    g.set(ex + 1, ey + 3, shape === 5 ? hair.d : iris.d);      /* keen: a lash */
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
      /* In profile the ear is the thing you actually see — and now very nearly
       * the only thing. Three wide by six rather than four by seven, which
       * read as a jug handle. What makes it an ear is not its size: it is the
       * hollow and the shadow it throws on the cheek. The old one was drawn
       * in two tones a shade apart and disappeared into the face. */
      g.rect(x + 2, y + 8, 3, 6, sk.s);              /* the ear, a shade under */
      g.round(x + 2, y + 8, 3, 6, 1);
      g.rect(x + 3, y + 10, 2, 3, sk.ff);            /* the hollow */
      g.set(x + 3, y + 9, sk.b);                     /* light on the rim */
      g.set(x + 3, y + 13, sk.b);                    /* the lobe */
    }

    if (dir === "down") {
      eye(g, x + 2, ey, sk, hair, iris, shape, -1);
      eye(g, x + w - 6, ey, sk, hair, iris, shape, 1);
      brow(g, x + 1, y + R.brow, hair, bw, false);
      brow(g, x + w - 6, y + R.brow, hair, bw, true);
    } else {
      /* Nothing here. Turn your head to the side in a mirror: an eye seen
       * edge-on is a sliver at the very front of the face and a brow is the
       * shape of the brow ridge, not features sitting on the cheek. The
       * sliver is drawn later, once the hair is down, so that hair falling
       * over it hides it — see `profileEye`. */
    }

    /* ---- nose ----
     * Each one changes the silhouette or the footprint, not just a pixel:
     * how far down the bridge runs, how wide the tip sits, where the
     * nostrils fall. A nose you can only tell apart by counting pixels is
     * not a choice. */
    var m = MIDX;
    if (dir === "down") {
      if (nose === 0) {                                  /* Button */
        g.rect(m - 1, y + 14, 2, 1, sk.s);
        g.set(m - 2, y + 15, sk.f); g.set(m + 1, y + 15, sk.f);
        g.set(m - 1, y + 13, sk.h);
      } else if (nose === 1) {                           /* Straight */
        g.rect(m - 1, y + 11, 1, 4, sk.ff);
        g.rect(m - 1, y + 14, 2, 1, sk.s);
        g.set(m - 2, y + 15, sk.f); g.set(m + 1, y + 15, sk.f);
      } else if (nose === 2) {                           /* Upturned */
        g.rect(m - 1, y + 12, 1, 2, sk.ff);
        g.rect(m - 1, y + 13, 2, 1, sk.s);
        g.set(m - 2, y + 14, sk.f); g.set(m + 1, y + 14, sk.f);
        g.rect(m - 1, y + 12, 2, 1, sk.hh);
      } else if (nose === 3) {                           /* Roman */
        g.rect(m - 1, y + 10, 1, 5, sk.ff);
        g.set(m - 2, y + 11, sk.ff); g.set(m - 2, y + 12, sk.s);
        g.rect(m - 2, y + 14, 3, 1, sk.s);
        g.set(m - 3, y + 15, sk.f); g.set(m + 1, y + 15, sk.f);
      } else if (nose === 4) {                           /* Wide */
        g.rect(m - 1, y + 12, 1, 2, sk.ff);
        g.rect(m - 2, y + 14, 4, 1, sk.s);
        g.set(m - 3, y + 15, sk.f); g.set(m + 2, y + 15, sk.f);
        g.rect(m - 1, y + 15, 2, 1, sk.s);
      } else if (nose === 5) {                           /* Snub */
        g.set(m - 1, y + 14, sk.f); g.set(m, y + 14, sk.f);
        g.set(m - 1, y + 13, sk.hh);
      } else if (nose === 6) {                           /* Narrow */
        g.rect(m - 1, y + 11, 1, 4, sk.ff);
        g.set(m - 1, y + 15, sk.f); g.set(m, y + 14, sk.s);
      } else if (nose === 7) {                           /* Hooked */
        g.rect(m - 1, y + 10, 1, 4, sk.ff);
        g.rect(m - 1, y + 14, 2, 2, sk.s);
        g.set(m + 1, y + 15, sk.f); g.set(m - 2, y + 15, sk.f);
        g.set(m, y + 16, sk.f);
      } else if (nose === 8) {                           /* Flat */
        g.rect(m - 2, y + 14, 4, 1, sk.s);
        g.rect(m - 2, y + 15, 4, 1, sk.f);
      } else if (nose === 9) {                           /* Pointed */
        g.rect(m - 1, y + 10, 1, 5, sk.ff);
        g.set(m - 1, y + 15, sk.s);
        g.set(m - 2, y + 15, sk.f); g.set(m, y + 15, sk.f);
      } else if (nose === 10) {                          /* Bulbous */
        g.rect(m - 2, y + 13, 4, 2, sk.s);
        g.rect(m - 1, y + 13, 2, 1, sk.hh);
        g.set(m - 3, y + 15, sk.f); g.set(m + 2, y + 15, sk.f);
        g.rect(m - 2, y + 15, 4, 1, sk.s);
      } else {                                           /* Long */
        g.rect(m - 1, y + 9, 1, 7, sk.ff);
        g.rect(m - 1, y + 15, 2, 1, sk.s);
        g.set(m - 2, y + 16, sk.f); g.set(m + 1, y + 16, sk.f);
      }
    } else {
      var out = front ? x + w : x - 1;
      var far = front ? 1 : -1;
      var edge = front ? x + w - 1 : x;
      var drop = [3, 3, 2, 5, 3, 2, 3, 5, 2, 5, 3, 7][nose];
      var top = y + [12, 12, 12, 10, 12, 13, 12, 10, 14, 10, 13, 9][nose];
      for (var i = 0; i < drop; i++) g.set(out, top + i, sk.b);
      if (nose === 2 || nose === 6 || nose === 9) g.set(out + far, top + drop - 2, sk.b);
      if (nose === 4 || nose === 8 || nose === 10) {
        g.set(out + far, top + drop - 1, sk.b); g.set(out + far, top + drop - 2, sk.b);
      }
      if (nose === 7) { g.set(out + far, top + drop - 1, sk.b); g.set(out, top + drop, sk.s); }
      if (nose === 3) g.set(out + far, top + 2, sk.b);
      g.set(edge, top + drop, sk.s);
    }

    /* ---- mouth ----
     * A warm lip tone rather than the outline colour: a hard dark line across
     * a face is what was reading as a gash. */
    var lip = mix(sk.f, [196, 116, 112], 0.42);
    var lipLight = mix(lip, LIGHT, 0.3);
    var mw = mouth === 2 ? 8 : mouth === 5 ? 8 : mouth === 3 ? 4 : 6;
    var my = y + R.mouth;

    /* Edge-on there is no mouth to see, only where the lips break the line of
     * the face. One pixel of lip in the outline column, pushed out by a
     * pixel for the fuller mouths, and the shape still tells them apart. */
    var mx, profileLip = dir !== "down";
    if (profileLip) {
      var lipX = front ? x + w - 1 : x;
      var pout = mouth === 4 || mouth === 5;
      mx = lipX; mw = 1;
      g.set(lipX, my, lip);
      g.set(lipX, my + 1, lipLight);
      if (pout) g.set(lipX + (front ? 1 : -1), my, lip);
      if (mouth === 1) g.set(lipX, my - 1, lip);           /* the corner lifts */
    } else {
      mx = m - Math.round(mw / 2);
    }

    if (profileLip) { /* the lip is already drawn */ }
    else if (mouth === 0) {                                   /* Neutral */
      g.rect(mx, my, mw, 1, lip);
      g.rect(mx + 1, my + 1, mw - 2, 1, lipLight);
    } else if (mouth === 1) {                            /* Smile */
      g.rect(mx + 1, my, mw - 2, 1, lip);
      g.set(mx, my - 1, lip); g.set(mx + mw - 1, my - 1, lip);
      g.rect(mx + 2, my + 1, mw - 4, 1, lipLight);
    } else if (mouth === 2) {                            /* Wide */
      g.rect(mx, my, mw, 1, lip);
      g.rect(mx + 1, my + 1, mw - 2, 1, lipLight);
    } else if (mouth === 3) {                            /* Small */
      g.rect(mx, my, mw, 1, lip);
      g.rect(mx, my + 1, mw, 1, lipLight);
    } else if (mouth === 4) {                            /* Pout */
      g.rect(mx + 1, my - 1, mw - 2, 1, lip);
      g.rect(mx, my, mw, 1, lip);
      g.rect(mx + 1, my + 1, mw - 2, 2, lipLight);
    } else {                                             /* Grin */
      g.rect(mx, my - 1, mw, 1, lip);
      g.rect(mx + 1, my, mw - 2, 1, "#f6ece2");          /* teeth */
      g.rect(mx + 1, my + 1, mw - 2, 1, lip);
      g.set(mx, my, lip); g.set(mx + mw - 1, my, lip);
    }

    /* ---- modelling ---- */
    /* The cheek in shade. Head on that is the far edge of the face catching
     * less light. Side on the same two-by-thirteen bar ran down the back of
     * the cheek as a hard stripe beside the ear and cut the face in half —
     * and the skull behind it is already shaded by the head itself. */
    /* Starting at y+4 it ran across the brow row and rubbed the outer tip off
     * one of the two, which is half of why they did not match. */
    if (!front) g.rect(x + w - 2, y + 7, 2, 11, sk.ff);
    /* Under the jaw. Side on that is the back half of it — run across the
     * whole width it reads as a band painted across the chin. */
    if (dir === "down") g.rect(x + 3, y + R.chin, w - 6, 2, sk.ff);
    else g.rect(front ? x + 2 : x + 5, y + R.chin, w - 7, 2, sk.ff);
    g.rect(x + 4, y + 2, 6, 2, sk.h);                            /* light on the brow */

    /* Side on you have one cheek, not two. Drawing both put a second patch of
     * blush and a second set of freckles out in the middle of the face, which
     * is what the pink dots on every profile were. */
    var blush = mix(sk.b, [222, 118, 118], 0.36);
    var cheeks = dir === "down" ? [x + 1, x + w - 4]
      : [front ? x + w - 6 : x + 3];
    if (det === 1 || det === 3) {
      cheeks.forEach(function (cx) {
        g.set(cx + 1, y + 12, sk.f); g.set(cx + 2, y + 14, sk.f); g.set(cx, y + 15, sk.f);
      });
    }
    if (det === 2 || det === 3) {
      cheeks.forEach(function (cx) { g.rect(cx, y + 13, 3, 2, blush); });
    } else if (det === 4) g.rect(dir === "down" ? x + 4 : x + w - 6, y + 16, 1, 1, hair.dd);
    else if (det === 5) {
      if (dir === "down") { g.set(mx - 2, my + 1, sk.f); g.set(mx + mw + 1, my + 1, sk.f); }
      else g.set(front ? mx - 2 : mx + 2, my + 1, sk.f);
    } else if (det === 6) { g.rect(x + w - 6, y + 4, 1, 5, sk.f); g.set(x + w - 5, y + 9, sk.f); }
    else if (det === 7) {
      if (dir === "down") { g.rect(x + 2, y + 12, 4, 1, sk.ff); g.rect(x + w - 6, y + 12, 4, 1, sk.ff); }
      else g.rect(front ? x + w - 7 : x + 3, y + 12, 4, 1, sk.ff);
    }

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
      g.rect(x, y + 7, 2, 9, hair.b); g.rect(x + w - 2, y + 7, 2, 9, hair.b);
      g.col(x + 1, y + 8, 7, hair.s); g.col(x + w - 2, y + 8, 7, hair.s);
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
      chops(); g.rect(x, y + 15, 3, 3, hair.b); g.rect(x + w - 3, y + 15, 3, 3, hair.b);
      g.set(x + 2, y + 16, hair.s); g.set(x + w - 3, y + 16, hair.s);
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
    var front = dir === "right";              /* which way a side view faces */
    var TW = side ? bd.stw * 2 : bd.tw * 2;
    var TX = Math.round(MIDX - TW / 2);
    var TH = TORSO.h, ty = TORSO.y - lift;
    var HW = bd.hw * 2, HX = Math.round(MIDX - HW / 2);
    var armL = TX - ARM.w, armR = TX + TW;
    var legL = HX, legR = HX + HW - LEG.w;

    var skirtLen = SKIRTS[fit] || 0;
    var isDress = skirtLen > 0;
    var longSleeve = (fit === 1 || fit === 2 || fit === 3 || fit === 7 || fit === 9 ||
      fit === 12 || fit === 16 || fit === 19 || fit === 20 || fit === 26);
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

    /* Side on both arms hang from the same place — the far one straight
     * behind the near one, so standing you see one arm and walking the swing
     * opens them. Drawn off the back edge of the torso it stuck out behind
     * like a front view turned sideways. */
    if (side) arm(TX + TW - 8 + G.farArm.dx, ty + G.farArm.dy, true, false, -1);

    /* ---- head ---- */
    var hx = HD.x, hy = HD.y - lift;
    g.rect(hx, hy, HD.w, HD.h, sk.b);
    g.round(hx, hy, HD.w, HD.h, 3);
    if (!side) {
      g.rect(hx + 1, hy + HD.h - 2, HD.w - 2, 2, sk.s);
    } else {
      /* The back of the skull, curved into the head. A flat two-by-eleven
       * block left a square lump sticking out of the back of a rounded
       * head, with corners the outline then traced. */
      g.col(hx - 1, hy + 3, 14, sk.b);
      g.col(hx - 2, hy + 5, 10, sk.b);
      g.col(hx - 1, hy + 3, 2, sk.s); g.col(hx - 1, hy + 15, 2, sk.s);
      g.col(hx - 2, hy + 5, 2, sk.s); g.col(hx - 2, hy + 12, 3, sk.s);
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
    var legTone = isDress ? sk : bot;
    var stride = isDress ? 0.5 : 1;

    function drawLegs() {
      if (side) {
        /* Both legs on the same column. Offsetting the far one by a pixel
         * gave depth standing still but left the lower half lopsided, and
         * the far leg shows plainly enough once the stride opens. */
        var mid = Math.round(MIDX - LEG.w / 2);
        leg(mid + Math.round(G.far.dx * stride), G.far.cut,
            tone(legTone.s), tone(shoe.s), true);
        leg(mid + Math.round(G.near.dx * stride), G.near.cut, legTone, shoe, true);
      } else {
        leg(legL + G.near.dx, G.near.cut, legTone, shoe, false);
        leg(legR - G.far.dx, G.far.cut, legTone, shoe, false);
      }
    }

    if (isDress) {
      /* Legs first, skirt over them — drawing the legs last was cropping
       * every skirt to the same length whatever it was meant to be. */
      drawLegs();
      var sk2 = bot;
      var skx = TX - 2, skw = TW + 4, body = skirtLen - 5;

      /* Side on the hem lifts at the front, over three columns. Cut level all
       * the way round, a skirt reads as a bell sitting on the hips rather
       * than cloth hanging off them. */
      function hemUp(cx) {
        if (!side) return 0;
        var fromFront = front ? (skx + skw - 1 - cx) : (cx - skx);
        return fromFront < 1 ? 2 : fromFront < 3 ? 1 : 0;
      }

      g.rect(TX, hipY, TW, 5, sk2.b);
      for (var sc = 0; sc < skw; sc++) {
        var cx2 = skx + sc, up = hemUp(cx2);
        g.rect(cx2, hipY + 5, 1, body - up, sk2.b);
        g.rect(cx2, hipY + 5 + body - up - 2, 1, 2, sk2.d);
      }
      g.rect(skx, hipY + 5, 2, body - hemUp(skx + 1), sk2.s);
      g.rect(TX + TW, hipY + 5, 2, body - hemUp(TX + TW + 1), sk2.s);
      for (var fold = TX + 3; fold < TX + TW - 2; fold += 7) {
        g.col(fold, hipY + 2, skirtLen - 4 - hemUp(fold), sk2.s);
      }
      if (fit === 24) {                                   /* wrap: a tie at the waist */
        g.rect(TX, hipY - 2, TW, 3, acc.b);
        g.rect(TX + TW - 6, hipY + 1, 4, 7, acc.s);
      } else {
        g.rect(TX, hipY - 2, TW, 2, acc.b);
        g.rect(TX, hipY, TW, 1, acc.s);
      }
    } else {
      g.rect(side ? TX : HX, hipY, side ? TW : HW, HIPS.h, bot.b);
      g.rect((side ? TX : HX) + 2, hipY, (side ? TW : HW) - 4, 2, bot.h);
      drawLegs();
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
      /* The hood, bunched behind the neck. Head on it spreads either side of
       * the neck; side on that same span put a slab of it out in front of
       * the chest, so it is pulled back behind the shoulder instead. */
      var turned = dir === "left" || dir === "right";
      var hoodX = turned ? HD.x - 5 : HD.x - 4, hoodW = turned ? HD.w + 1 : HD.w + 8;
      g.rect(hoodX, ty - 4, hoodW, 4, top.b);
      g.rect(hoodX, ty - 1, hoodW, 2, top.s);
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
    } else if (fit === 22) {                                     /* Blouse */
      g.rect(X - 2, ty, 8, 8, top.b); g.rect(X + TW - 6, ty, 8, 8, top.b);   /* puff sleeves */
      g.rect(X - 2, ty, 8, 2, top.h); g.rect(X + TW - 6, ty, 8, 2, top.h);
      g.rect(X - 2, ty + 7, 8, 1, top.d); g.rect(X + TW - 6, ty + 7, 8, 1, top.d);
      g.rect(mid - 4, ty, 3, 4, top.h); g.rect(mid + 1, ty, 3, 4, top.h);
      buttons(top.d, 6);
      g.rect(X, ty + TH - 3, TW, 1, top.d);
    } else if (fit === 23) {                                     /* A-line skirt */
      collar(); g.rect(X, ty + TH - 4, TW, 2, top.d);
    } else if (fit === 24) {                                     /* Wrap dress */
      g.rect(mid - 5, ty, 4, 9, top.h); g.rect(mid + 1, ty, 4, 9, top.h);
      g.rect(mid - 1, ty, 2, 9, top.d);
      g.rect(X, ty + TH - 5, TW, 2, top.s);
    } else if (fit === 25) {                                     /* Long dress */
      g.rect(mid - 4, ty, 8, 2, top.h);
      g.rect(X, ty + 6, TW, 1, top.s);
      g.rect(X, ty + TH - 4, TW, 2, top.s);
    } else if (fit === 26) {                                     /* Knit & skirt */
      g.rect(X, ty + TH - 5, TW, 3, top.s); g.rect(X, ty + TH - 2, TW, 2, top.d);
      for (var kk = X + 2; kk < X + TW - 2; kk += 5) g.rect(kk, ty + 4, 1, TH - 10, top.s);
      if (dir !== "up") g.rect(mid - 4, ty, 8, 2, top.d);
    } else if (fit === 27) {                                     /* Pinafore dress */
      g.rect(X + 2, ty + 6, TW - 4, TH - 6, acc.b);
      g.rect(X + 5, ty, 4, 7, acc.b); g.rect(X + TW - 9, ty, 4, 7, acc.b);
      g.rect(X + 2, ty + 6, TW - 4, 2, acc.h);
      g.rect(mid - 4, ty + 12, 8, 6, acc.s);
      g.rect(X, ty, 4, 6, top.hh); g.rect(X + TW - 4, ty, 4, 6, top.hh);
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

    /* A hat is cut to the skull and sits one pixel proud of it, because the
     * hair under it is not drawn at all (see CROWN_HAT). Sized to clear the
     * hair instead, it swamped the head. */
    var bx = hx - 1, bw = hw + 2;
    /* Things that go AROUND the head rather than on top of it — a band, a
     * crown, a goggle strap — are worn OVER the hair, so unlike a hat they
     * have to reach as wide as the hair does or they stop short of it and no
     * longer read as going round. How wide that is depends on the style and
     * on the curl and strand passes that run after it, so the band measures
     * the head as drawn rather than working it out from the style: guessed at
     * from the style's volume it came up two pixels short on every curly cut.
     * Forward it stops at the face — run past the front of the skull in
     * profile it hung off the end of the nose. */
    function headSpan(y0, y1) {
      var lo = W, hi = -1;
      for (var y = y0; y <= y1; y++) for (var x = 0; x < W; x++) {
        if (g.get(x, y)) { if (x < lo) lo = x; if (x > hi) hi = x; }
      }
      return hi < 0 ? { lo: hx - 1, hi: hx + hw } : { lo: lo, hi: hi };
    }
    /* The part of a hat that carries on round the BACK of the head. Drawn as
     * a crown alone, every hat was a lid laid across the top: side on there
     * was bare scalp behind it, and from the front nothing came down past
     * the temples. Which part you see depends on which way the head is
     * turned — both sides from the front, the whole skull from behind, the
     * back half in profile. */
    function wrap(top, depth, c, sideDepth) {
      if (dir === "up") {
        g.rect(bx, top, bw, depth, c);
        g.round(bx, top, bw, depth, 2);
      } else if (dir === "down") {
        var sd = sideDepth || depth;
        [bx, bx + bw - 3].forEach(function (sx2) {
          g.rect(sx2, top, 3, sd, c);
          g.round(sx2, top, 3, sd, 1);
        });
      } else {
        g.rect(bx, top, 8, depth, c);
        g.round(bx, top, 8, depth, 1);
      }
    }
    var span = headSpan(hy + 1, hy + 6);
    var wx = Math.min(span.lo, hx - 1);
    var wEnd = front ? hx + hw - 1 : Math.max(span.hi, hx + hw);
    var ww = wEnd - wx + 1;

    /* Something worn on the ear or at the throat goes under the hair, so side
     * on a long style hides it. Tested against skin instead of against hair,
     * the necklace vanished behind the collar of every shirt as well. */
    var hc = tone(pick(HAIRS, ch.hairColor).b);
    var hairTones = [hc.b, hc.s, hc.h, hc.hh, hc.d, hc.dd, hc.o, hc.f, hc.ff];
    function onBare(x, y, c) {
      if (hairTones.indexOf(g.get(x, y)) < 0) g.set(x, y, c);
    }
    function bareRect(x, y, w2, h2, c) {
      for (var j = 0; j < h2; j++) for (var i = 0; i < w2; i++) onBare(x + i, y + j, c);
    }

    if (has("Earrings") && dir !== "up") {
      if (dir === "down") {
        [hx - 2, hx + hw].forEach(function (x) {
          bareRect(x, ey + 5, 2, 2, acc.b); onBare(x, ey + 5, acc.hh);
        });
      } else { bareRect(hx + 2, ey + 5, 2, 2, acc.b); }
    }
    if ((has("Glasses") || has("Round glasses")) && dir !== "up") {
      var fc = has("Round glasses") ? acc.b : tone("#4a4652").b;
      var glint = tint(fc, 0.5);
      if (dir === "down") {
        [hx + 1, hx + hw - 7].forEach(function (lx) {
          g.rect(lx, ey - 2, 6, 1, fc);
          g.rect(lx, ey + 4, 6, 1, fc);
          g.rect(lx, ey - 1, 1, 5, fc); g.rect(lx + 5, ey - 1, 1, 5, fc);
          g.set(lx + 1, ey - 2, glint);
        });
        g.rect(hx + 7, ey, 2, 1, fc);
      } else {
        /* Edge-on a lens is nearly a line: what you actually see of a pair of
         * glasses from the side is the rim at the front of the face and the
         * arm running back over the ear. A six-wide lens drawn flat on the
         * cheek was the front pair turned sideways. */
        var rimX = front ? hx + hw - 4 : hx;
        g.rect(rimX, ey - 2, 4, 1, fc);
        g.rect(rimX, ey + 3, 4, 1, fc);
        g.col(front ? rimX + 3 : rimX, ey - 1, 4, fc);
        /* The arm, unbroken from the rim back over the ear. Drawn as a
         * separate stub it floated on the cheek with a gap in front of it. */
        g.rect(front ? hx + 2 : rimX + 4, ey - 2, hw - 6, 1, fc);
        g.set(front ? rimX : rimX + 3, ey - 2, glint);
      }
    }
    if (has("Sunglasses") && dir !== "up") {
      var dk = tone("#2b2a33");
      if (dir === "down") {
        g.rect(hx, ey - 2, hw, 6, dk.b);
        g.rect(hx + 6, ey, 4, 2, dk.h);
        g.rect(hx + 1, ey - 1, 3, 2, tint(dk.b, 0.4));
      } else {
        /* Same again: a dark lens at the front of the face and the arm back
         * to the ear, not a nine-wide slab across the cheek. */
        var sx = front ? hx + hw - 5 : hx;
        g.rect(sx, ey - 2, 5, 5, dk.b);
        g.rect(front ? hx + 2 : sx + 5, ey - 2, hw - 7, 2, dk.b);   /* the arm */
        g.rect(front ? sx + 1 : sx + 2, ey - 1, 2, 2, tint(dk.b, 0.4));
      }
    }
    if (has("Goggles")) {
      g.rect(wx, hy + 2, ww, 5, acc.d);                     /* the strap, all round */
      if (dir === "down") {
        g.rect(hx, hy + 2, 6, 5, tint(acc.b, 0.35));
        g.rect(hx + hw - 6, hy + 2, 6, 5, tint(acc.b, 0.35));
        g.rect(hx + 1, hy + 3, 2, 2, "#fbf7ee"); g.rect(hx + hw - 5, hy + 3, 2, 2, "#fbf7ee");
      } else if (dir !== "up") {
        var gx = front ? hx + hw - 5 : hx;
        g.rect(gx, hy + 2, 5, 5, tint(acc.b, 0.35));
        g.rect(front ? gx + 1 : gx + 2, hy + 3, 2, 2, "#fbf7ee");
      }
    }
    if (has("Headband")) {
      /* On the forehead, above the brows. At hy+4 it sat exactly on the brow
       * line and read as a blindfold. */
      g.rect(wx, hy + 1, ww, 3, acc.b);            /* right round, over the hair */
      g.rect(hx, hy + 1, 4, 1, acc.hh);
    }
    if (has("Headscarf")) {
      /* A scarf wraps the head — it does not perch on it. Drawn as a tall
       * rounded cap with a knot it was a beanie in another colour, so this is
       * the shape that actually says headscarf: fitted over the crown, down
       * past the ears, and framing the face in an opening, with the cloth
       * falling behind. The hair under it is covered completely (see
       * CROWN_HAT), which is the point of wearing one. */
      g.rect(bx, hy - 3, bw, 9, acc.b);                      /* the crown */
      g.rect(bx + 2, hy - 5, bw - 4, 3, acc.b);
      g.rect(hx + 2, hy - 3, 6, 2, acc.hh);                  /* catch of light */
      g.rect(bx, hy + 4, bw, 2, acc.s);                      /* the hem */
      g.round(bx, hy - 5, bw, 11, 2);
      if (dir === "down") {
        /* Cloth down both sides of the face, clear of the brow and the eye. */
        [bx - 1, bx + bw - 2].forEach(function (lx) {
          g.rect(lx, hy + 5, 3, 13, acc.s);
          g.rect(lx, hy + 15, 3, 3, acc.d);
          g.round(lx, hy + 5, 3, 13, 1);
        });
      } else if (dir === "up") {
        g.rect(bx + 1, hy + 5, bw - 2, 14, acc.s);           /* the fall */
        g.rect(bx + 3, hy + 16, bw - 6, 3, acc.d);
        g.round(bx + 1, hy + 5, bw - 2, 14, 2);
      } else {
        /* In profile it covers the ear and falls down the back of the neck. */
        g.rect(bx, hy + 5, 8, 14, acc.s);
        g.rect(bx, hy + 16, 8, 3, acc.d);
        g.round(bx, hy + 5, 8, 14, 1);
      }
    }
    if (has("Beanie")) {
      /* Pulled down over the head, cuff just above the brow. Standing nine
       * rows clear of a twenty-row skull it was not being worn, it was
       * balanced on top. */
      wrap(hy + 1, 11, acc.s);                               /* over the ears */
      g.rect(bx, hy - 2, bw, 6, acc.b);                      /* the crown */
      g.rect(bx + 2, hy - 4, bw - 4, 3, acc.b);
      g.strands(bx + 1, hy - 3, bw - 2, 4, 4, acc.s);        /* the rib */
      g.rect(hx + 2, hy - 3, 4, 1, acc.hh);
      g.rect(bx, hy + 1, bw, 2, acc.s);                      /* the turned cuff */
      g.rect(bx, hy + 3, bw, 1, acc.d);
      g.round(bx, hy - 4, bw, 8, 2);
    }
    if (has("Cap")) {
      /* Sat down on the head, band just above the brow, rather than perched
       * seven rows above the skull on a crown taller than the face. */
      wrap(hy + 1, 8, acc.s, 5);                             /* round the back */
      g.rect(bx, hy - 2, bw, 6, acc.b);
      g.rect(bx + 2, hy - 4, bw - 4, 3, acc.b);
      g.rect(hx + 2, hy - 3, 5, 2, acc.hh);
      g.rect(bx, hy + 2, bw, 2, acc.s);
      /* The peak, above the brow line — three rows down it buried the brows.
       * Curved rather than a flat bar, and tapered side on, so it reads as a
       * peak and not as a tab stuck to the side of the head. */
      if (dir === "down") {
        g.rect(bx - 3, hy + 2, bw + 6, 2, acc.d);
      } else if (dir === "up") {
        g.rect(bx, hy + 2, bw, 2, acc.s);
      } else {
        g.rect(bx + bw, hy + 1, 6, 2, acc.d);
        g.rect(bx + bw, hy + 3, 4, 1, acc.d);
      }
      g.round(bx, hy - 4, bw, 8, 2);
    }
    if (has("Sun hat")) {
      /* The crown comes down over the head and the brim sits at the brow. A
       * crown drawn entirely above the skull left the hat balanced on the
       * brim alone, floating a head's height off the hair. */
      wrap(hy + 1, 6, acc.s, 4);                             /* round the back */
      g.rect(bx + 1, hy - 5, bw - 2, 8, acc.b);              /* the crown */
      g.rect(bx + 3, hy - 7, bw - 6, 3, acc.b);
      g.rect(hx + 3, hy - 5, 5, 2, acc.hh);
      g.rect(bx + 1, hy, bw - 2, 2, acc.d);                  /* the band */
      g.rect(bx - 6, hy + 2, bw + 12, 2, acc.b);             /* the brim */
      g.rect(bx - 6, hy + 3, bw + 12, 1, acc.s);
      g.round(bx + 1, hy - 7, bw - 2, 11, 2);
      g.round(bx - 6, hy + 2, bw + 12, 2, 1);
    }
    if (has("Flower crown")) {
      var petals = [tint(acc.b, 0.3), acc.b, "#f6efe2"];
      /* ON the head, not hovering over it. Drawn a row above the skull it
       * floated clear of the hair in profile with daylight underneath. */
      g.rect(wx, hy + 3, ww, 1, tone("#5f8a5a").b);      /* the band, right round */
      /* Flowers all the way to the far end. Stepped four at a time and cut
       * off two short of the width, the last one landed anywhere up to three
       * pixels in and left a bare stretch of band at one side. */
      var slots = Math.max(1, Math.round((ww - 3) / 4) + 1);
      for (var fi = 0; fi < slots; fi++) {
        var fl = slots === 1 ? 0 : Math.round(fi * (ww - 3) / (slots - 1));
        g.rect(wx + fl, hy, 3, 3, petals[fi % petals.length]);
        g.set(wx + fl + 1, hy + 1, "#e9c94f");
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
      bareRect(TX + 8, ty + 2, TW - 16, 1, acc.b);
      bareRect(MIDX - 1, ty + 3, 2, 3, acc.hh);
      onBare(MIDX - 1, ty + 5, acc.d);          /* the drop, under the hair too */
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
      var sbx = dir === "up" ? TX - 5 : dir === "down" ? TX + TW - 2 : (front ? TX + 2 : TX + TW - 9);
      g.rect(sbx, sy, 7, 11, acc.b);
      g.rect(sbx, sy, 7, 3, acc.h);
      g.rect(sbx, sy + 8, 7, 3, acc.d);
      g.rect(sbx + 2, sy + 3, 3, 2, acc.hh);
      g.round(sbx, sy, 7, 11, 1);
      g.rect(TX + 2, ty + 2, TW - 4, 2, acc.d);                /* the strap */
    }
  }

  /* -------------------------------------------------------------- render ---- */

  function mirror(g) {
    var out = new Grid();
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) out.px[y * W + (W - 1 - x)] = g.px[y * W + x];
    return out;
  }

  /* Lay hair down, then run one pass of strands over what it just drew.
   *
   * Every piece of hair used to shade itself — a patch of strands on the cap,
   * another on each curtain, another on the fall, each with its own spacing
   * and its own start — and the result read as confetti rather than as hair,
   * because the stripes never lined up with each other. One pass over the
   * finished shape gives strands that run the whole length of the hair
   * whatever shape it is, and lands on nothing else: only pixels this call
   * added are touched, so a beard in the same colour is left alone. */
  function comb(g, draw, before, c, st, dir, lift) {
    draw(g, c, st, dir, lift);
    if (st.bald || st.slick) return;
    var step = st.tight ? 3 : 4;
    for (var x = 0; x < W; x += step) {
      for (var y = 0; y < H; y++) {
        var i = y * W + x;
        if (g.px[i] === c.b && before[i] !== c.b) g.px[i] = c.s;
      }
    }
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
    var brim = hatBrim(ch, lift);
    g.protectFace(dir, lift);
    g.capHair(brim);
    comb(g, hairBack, g.px.slice(), hair, st, dir, lift);
    g.unprotect();
    body(g, ch, dir, frame);
    face(g, ch, dir, lift);
    g.protectFace(dir, lift);
    g.capHair(brim);
    comb(g, hairFront, g.px.slice(), hair, st, dir, lift);
    hairAccent(g, ch, lift);
    g.unprotect();
    if (dir === "right") profileEye(g, ch, lift);
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

  /* Two starting characters rather than one, so the first thing you see when
   * you pick a gender is a person and not a form. Both are meant to be
   * pleasant and unremarkable — a place to push off from. */
  var DEFAULTS = [
    {   /* Female */
      gender: 0, build: 0, nose: 0, mouth: 1,
      skin: 2, hairStyle: styleIndex("Waves"), hairColor: 5,
      eyeShape: 0, eyeColor: 6, eyebrows: 4,
      hairAccent: 0, hairAccentColor: 18,
      details: 2, beard: 0, outfit: 5,
      topColor: 4, bottomColor: 1, shoeColor: 18, accColor: 9,
      accessories: [], voice: 7
    },
    {   /* Male */
      gender: 1, build: 1, nose: 1, mouth: 0,
      skin: 3, hairStyle: styleIndex("Side part"), hairColor: 3,
      eyeShape: 2, eyeColor: 0, eyebrows: 0,
      hairAccent: 0, hairAccentColor: 18,
      details: 0, beard: 0, outfit: 0,
      topColor: 13, bottomColor: 16, shoeColor: 18, accColor: 8,
      accessories: [], voice: 4
    }
  ];

  /** The fields that make up a look, as opposed to a name or a birthday. */
  var LOOK_KEYS = ["gender", "build", "nose", "mouth", "skin", "hairStyle", "hairColor",
    "eyeShape", "eyeColor", "eyebrows", "hairAccent", "hairAccentColor", "details",
    "beard", "outfit", "topColor", "bottomColor", "shoeColor", "accColor", "accessories"];

  function defaultChar(gender) {
    var d = DEFAULTS[((gender | 0) % DEFAULTS.length + DEFAULTS.length) % DEFAULTS.length];
    var c = {};
    LOOK_KEYS.forEach(function (k) { c[k] = Array.isArray(d[k]) ? d[k].slice() : d[k]; });
    c.voice = d.voice;
    c.name = "";
    c.birthMonth = 6;
    c.birthDay = 12;
    return c;
  }

  /** True when nothing about the look has been touched since it was handed over. */
  function isDefaultLook(ch, gender) {
    var d = defaultChar(gender);
    return LOOK_KEYS.every(function (k) {
      if (Array.isArray(d[k])) return (ch[k] || []).join() === d[k].join();
      return ch[k] === d[k];
    });
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
    if (Math.random() < 0.34) accs.push(any(["Glasses", "Round glasses", "Cap", "Beanie", "Sun hat", "Headscarf"]));
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

  /* ------------------------------------------------- order and grouping ----
   * The palettes keep their order, because a saved character refers to a
   * colour by its index. What changes is the order they are SHOWN in, which
   * is exported separately: hue order for anything that can be any colour,
   * and light-to-dark for skin, because that is the order you look for a
   * skin tone in.
   * ---------------------------------------------------------------------- */
  function hsl(hex) {
    var c = parse(hex).map(function (v) { return v / 255; });
    var mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]);
    var l = (mx + mn) / 2, d = mx - mn, h = 0, sat = 0;
    if (d) {
      sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === c[0]) h = ((c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0));
      else if (mx === c[1]) h = (c[2] - c[0]) / d + 2;
      else h = (c[0] - c[1]) / d + 4;
      h *= 60;
    }
    return { h: h, s: sat, l: l };
  }

  /** Pink, red, orange, yellow, green, blue, violet — then the neutrals.
   *
   *  Two things the naive version got wrong. A colour can be far too dark or
   *  too washed out to read as its hue at all — near-black Black came out at
   *  264 degrees and sorted itself in among the lavenders — so anything that
   *  dark, that pale or that grey is a neutral whatever its hue says. And the
   *  wheel has to be cut somewhere: cut at red, and the deep pinks that sit
   *  just below it (Burgundy, Wine, Blossom) land at the far end after the
   *  violets instead of beside the reds they belong with. The cut goes above
   *  the pinks instead.
   *
   *  Hues are binned rather than compared directly, because a fuzzy "close
   *  enough" comparison is not a consistent ordering and sorts differ by
   *  engine. */
  function rainbowOrder(list) {
    var key = list.map(function (c) {
      var t = hsl(c.b);
      var flat = t.s < 0.20 || t.l < 0.16 || t.l > 0.90 || (t.l > 0.80 && t.s < 0.32);
      var h = t.h >= 330 ? t.h - 360 : t.h;
      return { flat: flat, bin: Math.floor(h / 12), l: t.l };
    });
    return list.map(function (_, i) { return i; }).sort(function (a, b) {
      var A = key[a], B = key[b];
      if (A.flat !== B.flat) return A.flat ? 1 : -1;
      if (A.flat) return B.l - A.l;
      if (A.bin !== B.bin) return A.bin - B.bin;
      return B.l - A.l;
    });
  }

  /** Lightest to darkest. */
  function depthOrder(list) {
    return list.map(function (_, i) { return i; }).sort(function (a, b) {
      return luma(list[b].b) - luma(list[a].b);
    });
  }

  var SKIN_ORDER = depthOrder(SKINS);
  var HAIR_ORDER = rainbowOrder(HAIRS);
  var EYE_ORDER = rainbowOrder(EYE_COLORS);
  var CLOTH_ORDER = rainbowOrder(CLOTH);

  var TIED = { ponytail: 1, highpony: 1, sidepony: 1, pigtails: 1, buns: 1, bun: 1,
    lowbun: 1, braids: 1, fishtail: 1, onebraid: 1, lowpony: 1, halfup: 1, bantu: 1 };

  /** Grouped by how long it hangs, with everything tied back kept together —
   *  a ponytail is short at the front and long at the back, so arguing about
   *  which length bucket it belongs in is a waste of everyone's time. */
  function hairGroups() {
    var buckets = [
      { n: "Shaved & buzzed", max: 1, ids: [] },
      { n: "Short", max: 4, ids: [] },
      { n: "Chin length", max: 9, ids: [] },
      { n: "Shoulder", max: 14, ids: [] },
      { n: "Long", max: 19, ids: [] },
      { n: "Very long", max: 999, ids: [] }
    ];
    var tied = { n: "Tied back", ids: [] };
    HAIR_STYLES.forEach(function (st, i) {
      if (TIED[st.back]) return tied.ids.push(i);
      for (var b = 0; b < buckets.length; b++) {
        if (st.side <= buckets[b].max) return buckets[b].ids.push(i);
      }
    });
    return buckets.concat([tied]).filter(function (g) { return g.ids.length; })
      .map(function (g) { return { n: g.n, ids: g.ids }; });
  }

  /* The face proper: brow line down to the chin, inside the cheeks. This is
   * derived from the anatomy constants rather than from the hair guard, so a
   * test built on it still catches a guard that stops a row short. `left` is
   * `right` mirrored, so its band is mirrored too. */
  function faceBand(dir, frame) {
    var side = dir === "left" || dir === "right";
    var hd = side ? HEAD_SIDE : HEAD;
    var lift = gait(dir, frame || 0).lift;
    var y0 = hd.y - lift + R.brow, y1 = hd.y - lift + R.chin;
    var x0, x1;
    if (side) {
      /* Side on, what has to stay clear is not the cheek — hair is supposed
       * to fall over that — but the profile line itself and the air in front
       * of it: forehead, brow, nose, lip, chin. */
      x0 = hd.x + hd.w - 2; x1 = W - 1;
    } else {
      x0 = hd.x + 1; x1 = hd.x + hd.w - 2;
    }
    if (dir === "left") { var t = W - 1 - x1; x1 = W - 1 - x0; x0 = t; }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  var HAIR_GROUPS = hairGroups();

  root.CozySprite = {
    W: W, H: H, U: U, CROP: CROP, EYE_ROW: HEAD.y + R.eye,
    /* Front only: side on there is no eye to find, just lashes in the line. */
    EYES: { front: [HEAD.x + 2, HEAD.x + HEAD.w - 6], y: HEAD.y + R.eye, size: 4 },
    SKINS: SKINS, HAIRS: HAIRS, EYE_COLORS: EYE_COLORS, CLOTH: CLOTH,
    HAIR_STYLES: HAIR_STYLES, EYE_SHAPES: EYE_SHAPES, OUTFITS: OUTFITS,
    ACCESSORIES: ACCESSORIES, DETAILS: DETAILS, FACIAL_HAIR: FACIAL_HAIR,
    EYEBROWS: EYEBROWS, HAIR_ACCENT: HAIR_ACCENT, styleIndex: styleIndex,
    GENDERS: GENDERS, BUILDS: BUILDS, NOSES: NOSES, MOUTHS: MOUTHS,
    SKIN_ORDER: SKIN_ORDER, HAIR_ORDER: HAIR_ORDER, EYE_ORDER: EYE_ORDER,
    CLOTH_ORDER: CLOTH_ORDER, HAIR_GROUPS: HAIR_GROUPS,
    faceBand: faceBand, R: R, HEAD: HEAD, HEAD_SIDE: HEAD_SIDE,
    tone: tone, shade: shade, tint: tint,
    starSign: starSign, render: render, build: build, hatBrim: hatBrim,
    randomChar: randomChar, defaultChar: defaultChar, inherit: inherit,
    isDefaultLook: isDefaultLook, LOOK_KEYS: LOOK_KEYS
  };
})(typeof window !== "undefined" ? window : this);
