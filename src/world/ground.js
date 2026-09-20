/* ---------------------------------------------------------------------------
 * The ground of the island.
 *
 * Drawn in code, pixel by pixel, exactly like the people who walk on it —
 * there are no art files anywhere in this project and there are not going to
 * be any. The world and the character share one palette language (`tone`),
 * so a person standing on grass looks like they are standing on the same
 * island rather than pasted onto it.
 *
 * Ground is painted ONCE into a whole-map surface rather than tile by tile.
 * Tiles drawn one at a time have to know about their neighbours to blend, and
 * every such scheme ends up as a wall of corner cases; painting the lot in
 * one pass means an edge is just a thing you draw after the fill.
 * ------------------------------------------------------------------------ */
(function (root) {
  "use strict";

  var S = root.CozySprite || (typeof require === "function" && require("../character/sprite.js").CozySprite);
  var tone = S.tone, tint = S.tint;

  var T = 32;                       /* one tile, in the same pixels as a person */

  /* --------------------------------------------------------------- surface --- */

  /** A rectangle of pixels with the handful of drawing verbs the ground needs. */
  function Surface(w, h) {
    this.w = w; this.h = h;
    this.px = new Array(w * h);
    for (var i = 0; i < w * h; i++) this.px[i] = null;
  }
  Surface.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.px[y * this.w + x];
  };
  Surface.prototype.set = function (x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  };
  Surface.prototype.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c);
  };

  /* ------------------------------------------------------------- variation --- */

  /* The same patch of grass has to look the same every time the screen is
   * painted, so the speckle comes from the coordinates rather than from
   * Math.random. Two different-looking hashes, because one hash reused for
   * "is there a blade here" and "which blade" lines the two up and the field
   * grows stripes. */
  function hash(x, y, salt) {
    var n = (x * 73856093) ^ (y * 19349663) ^ ((salt | 0) * 83492791);
    n = (n ^ (n >>> 13)) >>> 0;
    n = (n * 1274126177) >>> 0;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  /* Four frames, the same cycle the trees sway on. */
  var FRAMES = 4;
  var TIDE = [0, 1, 2, 1];

  /* A hash gives one value per cell, so using it at a coarse scale paints
   * visible rectangles — the field grew great square patches of light and
   * dark. This reads the four corners of a cell and eases between them, so a
   * slow variation is a slow variation and not a grid of blocks. */
  function smooth(x, y, scale, salt) {
    var fx = x / scale, fy = y / scale;
    var x0 = Math.floor(fx), y0 = Math.floor(fy);
    var tx = fx - x0, ty = fy - y0;
    tx = tx * tx * (3 - 2 * tx);
    ty = ty * ty * (3 - 2 * ty);
    var a = hash(x0, y0, salt), b = hash(x0 + 1, y0, salt);
    var c = hash(x0, y0 + 1, salt), d = hash(x0 + 1, y0 + 1, salt);
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  }

  /* ---------------------------------------------------------------- kinds --- */

  /* Each kind fills its own pixel and says nothing about its neighbours. What
   * happens where two kinds meet is decided later, in `fray`. */
  var KINDS = {
    grass: {
      solid: false,
      base: tone("#71bc52"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        /* Flat ground with CLUMPS on it, not a smooth wash. Smooth noise at
         * pixel scale is blur — the same lesson the sea taught: what reads is
         * flat colour with crisp marks on top of it.
         *
         * So the tone comes from thresholded noise, which gives clumps with
         * actual edges, and the edge is dithered a pixel or two so it breaks
         * up rather than drawing a contour line round every patch. */
        var slow = smooth(wx, wy, 30, 0) * 0.62 + smooth(wx, wy, 11, 1) * 0.38;
        var edge = (hash(wx, wy, 2) - 0.5) * 0.07;     /* the ragged boundary */
        var v = slow + edge;
        /* Barely any change of colour. Stepped through the full tone ramp
         * this came out as camouflage: big blobs of light and dark green
         * with a dithered edge, which is a pattern, not a field. The clumps
         * are carried by how THICK the blades are — see `detail` — and the
         * ground underneath them stays very nearly one green. */
        s.set(x, y, v < 0.34 ? tint(t.b, -0.04) : v > 0.74 ? tint(t.b, 0.035) : t.b);
      },
      detail: function (s, x, y) {
        var t = this.base;
        /* Blades, drawn as marks. Denser in the clumps, because that is what
         * makes a clump read as longer grass rather than as a stain. */
        var slow = smooth(x, y, 30, 0) * 0.62 + smooth(x, y, 11, 1) * 0.38;
        /* Thick in the clumps, thin between them. This is what the eye reads
         * as longer and shorter grass, and it does the job the colour was
         * doing badly. */
        /* Fewer blades, and a narrower range between the thin places and the
         * thick ones. At nearly one pixel in sixteen the clumps read as
         * patches of something else rather than as longer grass. */
        var thick = slow < 0.34 ? 0.968 : slow > 0.74 ? 0.992 : 0.980;
        var n = hash(x, y, 20);
        if (n > thick) {
          var lean = hash(x, y, 21) < 0.5 ? -1 : 1;
          /* Most blades a shade under the ground; only the odd one properly
           * dark, or the thick patches turn into dark stains. */
          var tone2 = (slow < 0.34 && hash(x, y, 24) > 0.80) ? t.d : t.s;
          s.set(x, y, tone2);
          s.set(x, y - 1, tone2);
          s.set(x + lean, y - 2, tone2);
          if (hash(x, y, 22) > 0.55) s.set(x - lean, y - 1, tone2);
        }
        if (hash(x, y, 23) > 0.99975) {
          /* A daisy here and there. One in four hundred pixels put the
           * field under snow; this is one in four thousand. */
          s.set(x, y, "#fdf6e0"); s.set(x - 1, y, "#efe6c6"); s.set(x + 1, y, "#efe6c6");
          s.set(x, y - 1, "#efe6c6"); s.set(x, y + 1, "#f5d873");
        }
      }
    },
    path: {
      solid: false,
      base: tone("#dcc08a"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        /* Laid stones, not scattered dirt. A path is a thing somebody MADE,
         * and what says so is that it is built of pieces: courses of stone,
         * each one set in mortar, each catching the light along its top edge.
         *
         * The stones are found by looking up a jittered coordinate rather
         * than the real one, which bends every edge. Looked up straight, the
         * courses came out as a brick wall — perfectly straight joints, every
         * stone the same rectangle. */
        var jx = wx + Math.round((smooth(wx, wy, 6, 61) - 0.5) * 5);
        var jy = wy + Math.round((smooth(wx, wy, 5, 62) - 0.5) * 4);
        var rowH = 7, colW = 10;
        var row = Math.floor(jy / rowH);
        /* Each course is offset, so the joints never line up down the path. */
        var slide = Math.round(hash(0, row, 63) * colW);
        var cxr = jx + slide;
        var col = Math.floor(cxr / colW);
        var fy = jy - row * rowH, fx = cxr - col * colW;

        if (fy === 0 || fx === 0) {                        /* the mortar */
          s.set(x, y, hash(wx, wy, 64) < 0.4 ? t.dd : t.d);
          return;
        }
        /* Every stone a slightly different colour, or it is a printed
         * pattern rather than a pile of stones somebody carried. */
        var v = hash(col, row, 65);
        var stone = v < 0.20 ? t.s : v < 0.72 ? t.b : t.h;
        /* Light along the top and the left of each one. */
        if (fy === 1) stone = v < 0.5 ? t.h : t.hh;
        else if (fx === 1) stone = t.h;
        else if (fy === rowH - 1) stone = t.s;
        /* And a little wear over the whole thing. */
        if (hash(wx, wy, 66) > 0.93) stone = t.s;
        s.set(x, y, stone);
      },
      detail: function (s, x, y) {
        var t = this.base;
        /* A chipped stone here and there, and grass finding its way up
         * through a joint. */
        if (hash(x, y, 24) > 0.9965) {
          s.set(x, y, t.d); s.set(x + 1, y, t.d); s.set(x, y + 1, t.dd);
        }
        if (hash(x, y, 27) > 0.9975) {
          s.set(x, y, "#4e8c3e"); s.set(x, y - 1, "#5da348");
          s.set(x + 1, y - 1, "#4e8c3e");
        }
      }
    },
    sand: {
      solid: false,
      base: tone("#f2dfa8"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        /* Flat, with the lines the tide left. A beach is not evenly speckled:
         * it is smooth sand with ripples lying along the water's edge, and
         * those lines are the whole reason it reads as a beach and not as a
         * patch of desert. Stretched hard so they run with the shore. */
        var ripple = smooth(wx, wy * 13, 60, 30);
        s.set(x, y, ripple > 0.72 ? t.h : ripple < 0.33 ? t.s : t.b);
      },
      detail: function (s, x, y) {
        var t = this.base;
        /* Grains, and the odd thing washed up. */
        /* Grains, and very few of them dark. Sand is a pale, even thing —
         * peppered with dark specks it read as gravel. */
        if (hash(x, y, 25) > 0.972) s.set(x, y, t.s);
        if (hash(x, y, 26) > 0.9994) { s.set(x, y, t.d); s.set(x + 1, y, t.s); }
        if (hash(x, y, 27) > 0.99955) {
          /* a shell */
          s.set(x, y, "#fff2e4"); s.set(x - 1, y, "#f3d9c6"); s.set(x + 1, y, "#f3d9c6");
          s.set(x, y + 1, "#e8c4ad"); s.set(x, y - 1, "#fff8f0");
        }
        if (hash(x, y, 28) > 0.99993) {
          /* a pebble, pale rather than dark */
          s.set(x, y, "#d4c5a4"); s.set(x + 1, y, "#c2b293");
          s.set(x, y + 1, "#b3a384"); s.set(x + 1, y + 1, "#b3a384");
        }
      }
    },
    water: {
      solid: true,                        /* you do not walk into the sea */
      base: tone("#3fa8cf"),
      paint: function (s, x, y, wx, wy, phase) {
        var t = this.base;
        /* Mostly one blue. The first go had bands in three tones with light
         * streaks AND dark streaks over them, which is four things competing
         * across a surface that is meant to be the calm bit of the picture —
         * the eye should rest on the sea, not work at it.
         *
         * So: one colour, and a single wide band a shade off it. */
        var band = smooth(wx + phase * 3, wy * 17, 110, 7);
        s.set(x, y, band > 0.62 ? tint(t.b, -0.05) : t.b);
      },
      detail: function (s, x, y, at, phase) {
        var t = this.base;
        /* A streak runs until it would leave the water, so nothing bleeds
         * onto the beach. */
        function dash(len, c) {
          for (var i = 0; i < len; i++) {
            if (at(((x + i) / T) | 0, (y / T) | 0) !== "water") return;
            s.set(x + i, y, c);
          }
        }
        /* Light streaks only, and few of them, gathered into the odd
         * stretch. Dark ones as well made the whole sea busy. */
        /* Streaks only where the light happens to be catching — perhaps a
         * fifth of the surface. Sprinkled over the whole sea at any density
         * they read as scratches on it rather than as light on it. */
        /* The streaks drift sideways over the cycle, which is what the eye
         * reads as the surface moving. */
        var dx2 = phase * 4;
        var lit = smooth(x + dx2, y * 20, 120, 55);
        if (lit < 0.62) return;
        var n = hash(x + dx2, y, 50);
        if (n > 0.9975) dash(6 + ((hash(x + dx2, y, 51) * 16) | 0), t.h);
        else if (n > 0.9930) dash(5 + ((hash(x + dx2, y, 52) * 12) | 0), tint(t.b, 0.16));
      }
    },
    deck: {
      solid: false,
      base: tone("#c39a63"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        /* One tone per plank plus a fine grain along it. Tone chosen in
         * chunks across the plank as well, it broke into patches that read as
         * holes in the decking. */
        var plank = (wy / 8) | 0;
        var n = hash(0, plank, 9);
        var wood = n < 0.35 ? t.s : n < 0.8 ? t.b : t.h;
        s.set(x, y, hash(wx, wy, 10) < 0.22 ? tone(wood).s : wood);
        if (wy % 8 === 0) s.set(x, y, t.d);                      /* the seam */
        if (wy % 8 === 1) s.set(x, y, t.h);                      /* light on it */
      }
    }
  };
  var KIND_NAMES = Object.keys(KINDS);

  /* ------------------------------------------------------------------ edge --- */

  /* Where two kinds meet, the join is ragged rather than ruled. Nothing in
   * nature has a straight edge, and a straight one at 32 pixels a tile reads
   * as graph paper. Softer kinds creep over harder ones: grass over path,
   * sand over water, so a beach has sand running into the sea and not a line
   * drawn between them. */
  var CREEP = { grass: ["path", "sand", "deck"], sand: ["water"], path: [] };

  var REACH = 7;                     /* how far a kind creeps over its neighbour */

  function fray(s, at) {
    var out = s.px.slice();
    for (var y = 0; y < s.h; y++) {
      for (var x = 0; x < s.w; x++) {
        var here = at((x / T) | 0, (y / T) | 0);
        /* Which neighbouring kind, if any, creeps over THIS one — and how
         * near it is. Asking the question the other way round, which is what
         * this did at first, paints a kind over itself and does nothing. */
        var win = null, near = 0;
        for (var d = 1; d <= REACH && !win; d++) {
          var n = [at(((x + d) / T) | 0, (y / T) | 0), at(((x - d) / T) | 0, (y / T) | 0),
                   at((x / T) | 0, ((y + d) / T) | 0), at((x / T) | 0, ((y - d) / T) | 0)];
          for (var i = 0; i < 4; i++) {
            var nk = n[i];
            if (nk === here) continue;
            if (CREEP[nk] && CREEP[nk].indexOf(here) >= 0) { win = nk; near = d; break; }
          }
        }
        if (!win) continue;
        /* The join WANDERS. A per-pixel coin toss frays the edge but leaves
         * the shape underneath: a path drawn as rectangles still read as
         * rectangles with fuzzy sides, and its corners were still square.
         * Smooth noise along the edge instead makes the boundary meander in
         * and out by several pixels at a time, which is what stops a path
         * looking like it was laid out with a set square. */
        var wander = smooth(x, y, 13, 11) * 0.7 + smooth(x, y, 5, 12) * 0.3;
        if (near > 1 + wander * (REACH - 1)) continue;
        var t = KINDS[win].base;
        out[y * s.w + x] = hash(x, y, 14) < 0.45 ? t.s : t.b;
      }
    }
    s.px = out;
  }

  /* ----------------------------------------------------------------- foam --- */

  /* Where the sea meets the land there is a line of white water. It is the
   * cheapest thing on this whole page and it does more for the sea than the
   * ripples do: without it the water was a flat blue band with a ruler edge. */
  function foam(s, at, phase) {
    for (var y = 0; y < s.h; y++) {
      for (var x = 0; x < s.w; x++) {
        if (at((x / T) | 0, (y / T) | 0) !== "water") continue;
        var near = 0;
        for (var d = 1; d <= 7 && !near; d++) {
          if (at((x / T) | 0, ((y + d) / T) | 0) !== "water") near = d;
        }
        if (!near) continue;
        /* The waterline breathes in and out over the cycle — a small tide,
         * which is most of what makes a still sea look alive. */
        var wob = hash((x / 5) | 0, 0, 40) * 3 + hash((x / 11) | 0, 0, 41) * 3;
        var tide = TIDE[phase];
        if (near > 3 + wob + tide) continue;
        var n = hash(x, y, 42);
        if (near <= 1 + wob * 0.4) s.set(x, y, n < 0.3 ? "#dff2f7" : "#f4fbfd");
        else if (n < 0.55) s.set(x, y, n < 0.22 ? "#cbe8f1" : "#a9d8e8");
      }
    }
  }

  /* ----------------------------------------------------------------- light --- */

  /* The sun. Everything was lit evenly from nowhere, which is why the island
   * looked like a map of itself: a warm wash falling across it from the top
   * left, and the far corners dropping away, gives the whole screen a shape
   * your eye can read before it reads anything in it. */
  function light(s) {
    var cx = s.w * 0.3, cy = s.h * 0.12;
    var far = Math.sqrt(s.w * s.w + s.h * s.h);
    for (var y = 0; y < s.h; y++) {
      for (var x = 0; x < s.w; x++) {
        var c = s.px[y * s.w + x];
        if (!c) continue;
        var dx = x - cx, dy = y - cy;
        var d = Math.sqrt(dx * dx + dy * dy) / far;
        var k = 1.10 - d * 0.30;                    /* bright near, cooler far */
        var n = parseInt(c.slice(1), 16);
        var r = (n >> 16) & 255, g2 = (n >> 8) & 255, b = n & 255;
        /* Warm where the light falls, a touch blue where it does not. */
        r = Math.min(255, Math.round(r * (k + 0.035)));
        g2 = Math.min(255, Math.round(g2 * (k + 0.008)));
        b = Math.min(255, Math.round(b * (k - 0.028)));
        s.px[y * s.w + x] = "#" + (((1 << 24) + (r << 16) + (g2 << 8) + b).toString(16).slice(1));
      }
    }
  }

  /* ----------------------------------------------------------------- paint --- */

  /**
   * Paint a whole map's ground into one surface.
   * `map.ground` is a row-major array of kind names, `map.w` x `map.h` tiles.
   */
  function paintGround(map, phase) {
    phase = ((phase | 0) % FRAMES + FRAMES) % FRAMES;
    var s = new Surface(map.w * T, map.h * T);
    function at(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return map.edge || "water";
      return map.ground[ty * map.w + tx];
    }
    for (var ty = 0; ty < map.h; ty++) {
      for (var tx = 0; tx < map.w; tx++) {
        var k = KINDS[at(tx, ty)] || KINDS.grass;
        for (var j = 0; j < T; j++) {
          for (var i = 0; i < T; i++) {
            var x = tx * T + i, y = ty * T + j;
            k.paint(s, x, y, x, y, phase);
          }
        }
      }
    }
    fray(s, at);
    /* Detail goes on after the join, or a tuft of grass would be frayed away
     * along with the ground it is standing on. */
    for (var dy = 0; dy < s.h; dy++) {
      for (var dx = 0; dx < s.w; dx++) {
        var kind = KINDS[at((dx / T) | 0, (dy / T) | 0)];
        if (kind && kind.detail) kind.detail(s, dx, dy, at, phase);
      }
    }
    foam(s, at, phase);
    light(s);
    return s;
  }

  root.CozyGround = {
    T: T, Surface: Surface, KINDS: KINDS, KIND_NAMES: KIND_NAMES,
    hash: hash, smooth: smooth, paintGround: paintGround, light: light,
    FRAMES: FRAMES, tone: tone, tint: tint
  };
})(typeof window !== "undefined" ? window : this);
