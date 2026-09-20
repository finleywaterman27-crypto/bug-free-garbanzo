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

  /* ---------------------------------------------------------------- kinds --- */

  /* Each kind fills its own pixel and says nothing about its neighbours. What
   * happens where two kinds meet is decided later, in `fray`. */
  var KINDS = {
    grass: {
      solid: false,
      base: tone("#6fae5a"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        /* Two scales of noise, mixed rather than nested. Speckled one pixel
         * at a time it read as television static; switched on the patch alone
         * it read as camouflage, because a grid of patches is a grid however
         * you colour it. Mixing the two blurs the patch edges into the
         * speckle, so the field goes light and dark without going square. */
        var patch = hash((wx / 7) | 0, (wy / 7) | 0, 1) * 0.6
                  + hash((wx / 3) | 0, (wy / 3) | 0, 2) * 0.4;
        var v = patch * 0.7 + hash(wx, wy, 3) * 0.3;
        var c = v < 0.34 ? t.s : v < 0.80 ? t.b : t.h;
        s.set(x, y, c);
        /* A blade every so often: two pixels standing up, which is enough to
         * read as grass and not as dust on the screen. */
        if (hash(wx, wy, 4) > 0.978) {
          s.set(x, y, t.d);
          s.set(x, y - 1, t.s);
        }
      }
    },
    path: {
      solid: false,
      base: tone("#b79b6e"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        var n = hash(wx, wy, 3);
        s.set(x, y, n < 0.10 ? t.s : n < 0.80 ? t.b : t.h);
        /* Trodden-in stones. Two pixels across so they read as a pebble
         * rather than as a dead pixel. */
        if (hash(wx, wy, 4) > 0.988) {
          s.set(x, y, t.dd); s.set(x + 1, y, t.d);
        }
      }
    },
    sand: {
      solid: false,
      base: tone("#e6d3a3"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        var n = hash(wx, wy, 5);
        s.set(x, y, n < 0.13 ? t.s : n < 0.92 ? t.b : t.h);
        if (hash(wx, wy, 6) > 0.994) s.set(x, y, t.d);
      }
    },
    water: {
      solid: true,                        /* you do not walk into the sea */
      base: tone("#4f9fc4"),
      paint: function (s, x, y, wx, wy) {
        var t = this.base;
        var n = hash(wx, wy, 7);
        s.set(x, y, n < 0.18 ? t.s : n < 0.93 ? t.b : t.h);
        /* Ripples, in rows, because water moves in lines and not in specks. */
        /* Ripples: long, sparse and in rows, because water moves in lines.
         * Dashed every few pixels it looked like a knitted blanket. */
        if (wy % 7 === 0 && hash((wx / 9) | 0, (wy / 7) | 0, 8) > 0.72) s.set(x, y, t.hh);
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

  var REACH = 4;                     /* how far a kind creeps over its neighbour */

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
        /* Nearer the join, more likely to be taken over — which is what makes
         * the edge break up instead of stepping in a neat stair. */
        if (hash(x, y, 11) > (REACH - near + 1) / (REACH + 1)) continue;
        var t = KINDS[win].base;
        out[y * s.w + x] = hash(x, y, 12) < 0.45 ? t.s : t.b;
      }
    }
    s.px = out;
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
    return s;
  }

  root.CozyGround = {
    T: T, Surface: Surface, KINDS: KINDS, KIND_NAMES: KIND_NAMES,
    hash: hash, paintGround: paintGround, tone: tone, tint: tint
  };
})(typeof window !== "undefined" ? window : this);
