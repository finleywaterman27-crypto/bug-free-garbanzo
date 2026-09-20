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
        /* THREE scales, not two. One uniform speckle across a whole field is
         * wallpaper however finely you tune it — what a real field has is
         * areas: a darker stretch here, a sunnier one there, and detail on
         * top of both. The slowest scale is the one that stops the screen
         * looking like one flat carpet. */
        var v = smooth(wx, wy, 38, 0) * 0.36
              + smooth(wx, wy, 11, 1) * 0.30
              + smooth(wx, wy, 4, 2) * 0.18
              + hash(wx, wy, 3) * 0.16;
        var c = v < 0.26 ? t.d : v < 0.44 ? t.s : v < 0.78 ? t.b : t.h;
        s.set(x, y, c);
      },
      /* Tufts are drawn after the fill, so a tuft is a shape rather than a
       * pixel that happened to come out dark. A blade of grass has a base and
       * a tip; two stray pixels do not. */
      detail: function (s, x, y) {
        var t = this.base;
        if (hash(x, y, 20) > 0.9955) {
          var lean = hash(x, y, 21) < 0.5 ? -1 : 1;
          s.set(x, y, t.d);
          s.set(x, y - 1, t.d);
          s.set(x + lean, y - 2, t.s);
          s.set(x - lean * 2, y - 1, t.s);
          s.set(x + lean * 2, y, t.s);
        } else if (hash(x, y, 22) > 0.99975) {
          /* A daisy here and there. At one in four hundred pixels the field
           * was under snow: this is one in four thousand, which is a flower
           * you notice rather than a texture. */
          s.set(x, y, "#fdf6e0"); s.set(x - 1, y, "#efe6c6"); s.set(x + 1, y, "#efe6c6");
          s.set(x, y - 1, "#efe6c6"); s.set(x, y + 1, "#f5d873");
        }
      }
    },
    path: {
      solid: false,
      base: tone("#c9a46d"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        var n = smooth(wx, wy, 19, 30) * 0.45 + hash(wx, wy, 3) * 0.55;
        s.set(x, y, n < 0.22 ? t.s : n < 0.78 ? t.b : t.h);
      },
      detail: function (s, x, y) {
        var t = this.base;
        /* Trodden-in stones, three pixels with a lit top, so they sit in the
         * dirt rather than lying on it. */
        if (hash(x, y, 24) > 0.986) {
          s.set(x, y, t.d); s.set(x + 1, y, t.d); s.set(x, y + 1, t.dd);
          s.set(x + 1, y + 1, t.dd); s.set(x, y - 1, t.h);
        }
      }
    },
    sand: {
      solid: false,
      base: tone("#f2dfa8"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        var n = smooth(wx, wy, 21, 31) * 0.4 + hash(wx, wy, 5) * 0.6;
        s.set(x, y, n < 0.20 ? t.s : n < 0.90 ? t.b : t.h);
      },
      detail: function (s, x, y) {
        var t = this.base;
        if (hash(x, y, 25) > 0.9955) { s.set(x, y, t.d); s.set(x + 1, y, t.s); }
        /* the odd shell */
        if (hash(x, y, 26) > 0.9988) {
          s.set(x, y, "#fff2e4"); s.set(x - 1, y, "#f3d9c6"); s.set(x + 1, y, "#f3d9c6");
          s.set(x, y + 1, "#e8c4ad");
        }
      }
    },
    water: {
      solid: true,                        /* you do not walk into the sea */
      base: tone("#3fa8cf"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        /* Water reads as water because of what moves ACROSS it. Round noise
         * gives cloud — blobs with no direction, which is a sky, not a sea —
         * and that goes for the depth as much as for the crests: it was the
         * depth blobbing that made the sea look overcast, not the ripples.
         * So every scale here is stretched flat, long across and short down,
         * and the sea runs in lines the eye can follow.
         *
         * Depth first, in bands lying along the shore. */
        var deep = smooth(wx, wy * 7, 54, 7);
        var base = deep > 0.70 ? t.s : deep < 0.24 ? t.h : t.b;
        /* A fine sparkle over the lot, or the surface is a flat sheet. */
        if (hash(wx, wy, 70) < 0.09) base = tint(base, 0.08);
        s.set(x, y, base);
        /* Then the swell, stretched harder still, so a crest is a line and
         * not a patch. */
        var swell = smooth(wx, wy * 16, 44, 8);
        if (swell > 0.80) s.set(x, y, tint(base, 0.18));
        else if (swell > 0.71) s.set(x, y, tint(base, 0.09));
        else if (swell < 0.15) s.set(x, y, t.s);
        /* A glint on the odd crest, which is what says wet rather than
         * merely blue. Sparse: a sea with a highlight on every wave is not
         * calm, it is choppy, and this one is meant to be a nice day. */
        if (swell > 0.88 && smooth(wx, wy * 16, 9, 9) > 0.66) s.set(x, y, t.hh);
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
  function foam(s, at) {
    for (var y = 0; y < s.h; y++) {
      for (var x = 0; x < s.w; x++) {
        if (at((x / T) | 0, (y / T) | 0) !== "water") continue;
        var near = 0;
        for (var d = 1; d <= 7 && !near; d++) {
          if (at((x / T) | 0, ((y + d) / T) | 0) !== "water") near = d;
        }
        if (!near) continue;
        var wob = hash((x / 5) | 0, 0, 40) * 3 + hash((x / 11) | 0, 0, 41) * 3;
        if (near > 3 + wob) continue;
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
  function paintGround(map) {
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
            k.paint(s, x, y, x, y);
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
        if (kind && kind.detail) kind.detail(s, dx, dy);
      }
    }
    foam(s, at);
    light(s);
    return s;
  }

  root.CozyGround = {
    T: T, Surface: Surface, KINDS: KINDS, KIND_NAMES: KIND_NAMES,
    hash: hash, smooth: smooth, paintGround: paintGround, light: light, tone: tone, tint: tint
  };
})(typeof window !== "undefined" ? window : this);
