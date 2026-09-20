/* ---------------------------------------------------------------------------
 * Things that stand on the ground.
 *
 * A prop is not part of the ground: it has a FOOTPRINT (the tiles it stands
 * on, some of which stop you walking) and it may rise a long way above that
 * footprint. A tree's trunk takes up one tile; its canopy hangs over four.
 * Keeping those two apart is what lets you walk behind a tree — the thing
 * that makes a map read as a place rather than as a plan of one.
 *
 * Everything is drawn in code, in the same palette as the people and the
 * ground.
 * ------------------------------------------------------------------------ */
(function (root) {
  "use strict";

  var G = root.CozyGround || (typeof require === "function" && require("./ground.js").CozyGround);
  var T = G.T, tone = G.tone, hash = G.hash;

  /* A prop's own pixels go into a surface that is bigger than its footprint,
   * because most of them lean out over it. `rise` is how far above the
   * footprint the drawing reaches, `over` how far to each side. */

  var WOOD = tone("#8a6134");
  var BARK = tone("#6b4a2c");
  /* Leaves are a good deal darker than grass. Drawn a shade or two off it,
   * a tree was a slightly different patch of field rather than a thing
   * standing in one. */
  var LEAF = tone("#357a38");
  var LEAF2 = tone("#458c40");
  var STONE = tone("#9aa3a6");
  var PLASTER = tone("#f0e2c4");
  var ROOF = tone("#c4654a");

  /* ------------------------------------------------------------------ art --- */

  /** Darken whatever is already there, keeping its texture. */
  function darken(c, k) {
    if (!c) return c;
    var n = parseInt(c.slice(1), 16);
    var r = Math.round(((n >> 16) & 255) * k);
    var g2 = Math.round(((n >> 8) & 255) * k);
    var b = Math.round((n & 255) * k);
    return "#" + (((1 << 24) + (r << 16) + (g2 << 8) + b).toString(16).slice(1));
  }

  /* The shadow an object throws on the ground. Nothing reads as standing ON
   * something until it has one — without it every prop looked stuck to the
   * screen rather than planted in the field. It darkens the ground instead of
   * painting over it, so the grass texture still shows through.
   *
   * Which is exactly why a shadow is NOT part of a prop's own drawing: the
   * game caches each prop as a little picture of itself and stamps it, and a
   * shadow has to be cast onto whatever the prop is standing on. So a prop
   * declares the size of its shadow and the ground layer casts it. */
  function shadow(s, cx, baseY, rw, rh) {
    for (var y = -rh; y <= rh; y++) {
      for (var x = -rw; x <= rw; x++) {
        var d = (x * x) / (rw * rw) + (y * y) / (rh * rh);
        if (d > 1) continue;
        var px = cx + x, py = baseY + y;
        var here = s.get(px, py);
        if (!here) continue;
        s.set(px, py, darken(here, d > 0.62 ? 0.84 : 0.71));
      }
    }
  }

  /** A rounded blob of leaves, speckled so it does not read as a green disc. */
  function canopy(s, cx, cy, rw, rh, t, seed) {
    for (var y = -rh; y <= rh; y++) {
      for (var x = -rw; x <= rw; x++) {
        var d = (x * x) / (rw * rw) + (y * y) / (rh * rh);
        if (d > 1) continue;
        var n = hash(cx + x, cy + y, seed) * 0.55 + hash(((cx + x) / 4) | 0, ((cy + y) / 4) | 0, seed + 1) * 0.45;
        /* Ragged at the rim: a hard ellipse edge is a balloon, not a tree. */
        if (d > 0.74 && n < 0.42) continue;
        /* Light comes from above and a little to the left, so the top of a
         * canopy catches it and the underside falls away. Speckled evenly it
         * was a flat green cloud. */
        var lit = (-y / rh) * 0.6 + (-x / rw) * 0.25 + n * 0.5;
        var c = lit > 0.78 ? t.h : lit > 0.52 ? t.b : lit > 0.30 ? t.s : t.d;
        s.set(cx + x, cy + y, c);
      }
    }
  }

  function trunk(s, cx, baseY, w, h, t) {
    s.rect(cx - (w >> 1), baseY - h, w, h, t.b);
    s.rect(cx - (w >> 1), baseY - h, 2, h, t.s);          /* shaded side */
    s.rect(cx + (w >> 1) - 1, baseY - h, 1, h, t.h);      /* lit edge */
    /* Roots spreading where it meets the ground, so it does not look posted
     * into a hole. */
    s.rect(cx - (w >> 1) - 1, baseY - 2, w + 2, 2, t.s);
    s.rect(cx - (w >> 1) - 2, baseY - 1, w + 4, 1, t.d);
  }

  /* ---------------------------------------------------------------- props --- */

  var PROPS = {
    tree: {
      w: 2, h: 1, rise: 112, over: 14, shade: [26, 9],
      block: [[0, 0], [1, 0]],
      draw: function (s, px, py, seed) {
        /* A tree stands well above head height. Drawn the same height as the
         * person walking past it, the island read as a model of itself. */
        var cx = px + T, base = py + T - 4;
        trunk(s, cx, base, 12, 54, BARK);
        canopy(s, cx, base - 74, 34, 27, LEAF, seed);
        canopy(s, cx - 13, base - 60, 18, 15, LEAF2, seed + 7);
        canopy(s, cx + 14, base - 84, 16, 13, LEAF2, seed + 13);
      }
    },
    pine: {
      w: 1, h: 1, rise: 122, over: 22, shade: [19, 7],
      block: [[0, 0]],
      draw: function (s, px, py, seed) {
        var cx = px + (T >> 1), base = py + T - 4;
        trunk(s, cx, base, 9, 30, BARK);
        /* Five skirts, each wider than the one above it. */
        for (var i = 0; i < 5; i++) {
          var top = base - 34 - i * 19;
          var wide = 9 + i * 7;
          for (var y = 0; y < 26; y++) {
            var half = Math.round(wide * (y / 26));
            for (var x = -half; x <= half; x++) {
              var n = hash(cx + x, top + y, seed + i);
              if (Math.abs(x) > half - 2 && n < 0.4) continue;
              s.set(cx + x, top + y, n < 0.3 ? LEAF.d : n < 0.68 ? LEAF.s : LEAF.b);
            }
          }
        }
      }
    },
    bush: {
      w: 1, h: 1, rise: 14, over: 4, shade: [14, 5],
      block: [[0, 0]],
      draw: function (s, px, py, seed) {
        var cx = px + (T >> 1), base = py + T - 4;
        canopy(s, cx, base - 9, 14, 11, LEAF2, seed);
        if (hash(seed, 0, 31) > 0.55) {
          /* berries */
          for (var b = 0; b < 3; b++) {
            var bx = cx - 6 + ((hash(seed, b, 40) * 13) | 0);
            var by = base - 10 + ((hash(seed, b, 50) * 10) | 0);
            s.set(bx, by, "#d85a6a"); s.set(bx + 1, by, "#f08a92");
          }
        }
      }
    },
    flower: {
      w: 1, h: 1, rise: 0, over: 0,
      block: [],
      draw: function (s, px, py, seed) {
        /* Five pixels across with a leaf under it, not a single speck. One
         * pixel of colour in a field of grass is invisible from any normal
         * distance — which is what these were. */
        var petals = [["#f2d14e", "#fae98f"], ["#ef7fae", "#ffc0d8"],
                      ["#e8674f", "#ff9f87"], ["#f6f1e2", "#ffffff"],
                      ["#a97fd6", "#d2b6f0"]];
        /* Placed from the seed rather than from where on the map this is, so
         * a patch can be drawn once into its own little picture and stamped
         * wherever it belongs — which is how every other prop is cached. */
        for (var i = 0; i < 3; i++) {
          var fx = px + 6 + ((hash(seed, i, 60) * (T - 13)) | 0);
          var fy = py + 10 + ((hash(seed, i, 70) * (T - 18)) | 0);
          var pal = petals[(hash(seed, i, 80) * petals.length) | 0];
          var c = pal[0], hi = pal[1];
          s.rect(fx, fy + 2, 1, 4, LEAF.d);                       /* stem */
          s.set(fx - 1, fy + 4, LEAF.s); s.set(fx + 1, fy + 5, LEAF.s);
          s.set(fx - 2, fy, c); s.set(fx + 2, fy, c);
          s.set(fx - 1, fy - 1, c); s.set(fx + 1, fy - 1, c);
          s.set(fx - 1, fy + 1, c); s.set(fx + 1, fy + 1, c);
          s.set(fx, fy - 2, hi); s.set(fx, fy + 2, c);
          s.set(fx, fy, "#fff4c8");                               /* the middle */
        }
      }
    },
    rock: {
      w: 1, h: 1, rise: 8, over: 2, shade: [13, 5],
      block: [[0, 0]],
      draw: function (s, px, py, seed) {
        var cx = px + (T >> 1), base = py + T - 5;
        for (var y = -11; y <= 0; y++) {
          var half = Math.round(11 * Math.sqrt(Math.max(0, 1 - (y * y) / 144)));
          for (var x = -half; x <= half; x++) {
            var n = hash(cx + x, base + y, seed);
            s.set(cx + x, base + y, y < -7 || (x < -half + 3 && n > 0.4) ? STONE.h
              : n < 0.25 ? STONE.s : STONE.b);
          }
        }
        s.rect(cx - 8, base, 16, 2, STONE.d);
      }
    },
    fence: {
      w: 1, h: 1, rise: 20, over: 2, drop: 10, shade: [6, 3],
      block: [[0, 0]],
      /* `link` is filled in by the map: which sides have a fence next door.
       * A fence post on its own is a stick in the ground; what makes a fence
       * is the rail running to the next one. */
      draw: function (s, px, py, seed, link) {
        var cx = px + (T >> 1), base = py + T - 4;
        link = link || {};
        var railY = base - 14;
        if (link.left) { s.rect(px - 1, railY, (T >> 1) + 2, 3, WOOD.b); s.rect(px - 1, railY + 3, (T >> 1) + 2, 1, WOOD.d); }
        if (link.right) { s.rect(cx, railY, (T >> 1) + 2, 3, WOOD.b); s.rect(cx, railY + 3, (T >> 1) + 2, 1, WOOD.d); }
        if (link.up) { s.rect(cx - 2, py - 2, 4, (T >> 1) + 2, WOOD.s); }
        if (link.down) { s.rect(cx - 2, railY, 4, (T >> 1) + 8, WOOD.s); }
        /* the post */
        s.rect(cx - 3, base - 20, 6, 20, WOOD.b);
        s.rect(cx - 3, base - 20, 2, 20, WOOD.s);
        s.rect(cx + 2, base - 20, 1, 20, WOOD.h);
        s.rect(cx - 3, base - 21, 6, 1, WOOD.h);
        s.rect(cx - 4, base - 2, 8, 2, WOOD.d);
      }
    },
    house: {
      w: 5, h: 3, rise: 86, over: 8, shade: [84, 9],
      /* Every tile of it, the doorway included. Left open so you could stand
       * in it, you stood INSIDE the building's own ground: the house sorts by
       * the bottom of its footprint, you were above that line, and the wall
       * was drawn over the top of you. You walk UP to a door and go through
       * it; you do not loiter in the middle of one. */
      block: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
              [0, 1], [1, 1], [2, 1], [3, 1], [4, 1],
              [0, 2], [1, 2], [2, 2], [3, 2], [4, 2]],
      door: [2, 2],                        /* which tile you knock on */
      draw: function (s, px, py, seed) {
        var w = 5 * T, base = py + 3 * T - 4;
        var cx = px + (w >> 1);
        var wallH = 66, roofH = 58;
        var wallTop = base - wallH, ridge = wallTop - roofH;

        /* Roof first, widening from the ridge down to an overhanging eave.
         * Drawn as a flat trapezoid the house was a shed; a roof you can see
         * the pitch of is most of what makes a cottage a cottage. */
        for (var r = 0; r < roofH; r++) {
          var t2 = r / (roofH - 1);
          var half = Math.round(8 + t2 * ((w >> 1) + 6 - 8));
          var course = r % 6;
          var c = course === 5 ? ROOF.d : course === 0 ? ROOF.h : r < 4 ? ROOF.h : ROOF.b;
          if (hash(r, 0, 77) < 0.3 && course !== 5) c = ROOF.s;
          s.rect(cx - half, ridge + r, half * 2, 1, c);
          s.set(cx - half, ridge + r, ROOF.s);             /* the rake edges */
          s.set(cx + half - 1, ridge + r, ROOF.d);
        }
        s.rect(cx - 9, ridge - 2, 18, 3, ROOF.h);          /* ridge cap */
        s.rect(cx - (w >> 1) - 6, wallTop - 3, w + 12, 4, ROOF.dd);   /* the eave */

        /* Chimney, off to one side and behind the ridge. */
        s.rect(cx + 26, ridge - 14, 12, 26, tone("#b08e78").b);
        s.rect(cx + 26, ridge - 14, 3, 26, tone("#b08e78").s);
        s.rect(cx + 25, ridge - 16, 14, 3, tone("#b08e78").d);

        /* Walls */
        s.rect(px + 8, wallTop, w - 16, wallH, PLASTER.b);
        s.rect(px + 8, wallTop, 3, wallH, PLASTER.s);
        s.rect(px + w - 11, wallTop, 3, wallH, PLASTER.h);
        s.rect(px + 8, base - 5, w - 16, 5, PLASTER.s);
        for (var b = 1; b < 4; b++) {
          s.rect(px + 8 + Math.round(b * (w - 16) / 4) - 1, wallTop, 3, wallH, WOOD.s);
        }
        s.rect(px + 8, wallTop, w - 16, 3, WOOD.d);
        s.rect(px + 8, base - 2, w - 16, 2, WOOD.d);       /* the sill course */

        /* Door, with a step, because a door flush to the grass is a hole. */
        var dx = cx - 11;
        s.rect(dx - 2, base - 42, 26, 42, WOOD.s);
        s.rect(dx, base - 40, 22, 40, WOOD.b);
        s.rect(dx, base - 40, 22, 3, WOOD.h);
        for (var pl = 1; pl < 4; pl++) s.rect(dx + pl * 5, base - 38, 1, 38, WOOD.s);
        s.rect(dx + 17, base - 22, 2, 3, "#e9c94f");       /* the handle */
        s.rect(dx - 4, base - 3, 30, 3, STONE.b);
        s.rect(dx - 4, base - 1, 30, 1, STONE.d);

        /* Windows, with sills and a cross bar. */
        [px + 20, px + w - 40].forEach(function (wx) {
          s.rect(wx - 2, base - 56, 24, 24, WOOD.s);
          s.rect(wx, base - 54, 20, 20, "#a9d4e8");
          s.rect(wx, base - 54, 20, 7, "#d6eef8");         /* sky in the glass */
          s.rect(wx + 9, base - 54, 2, 20, WOOD.s);
          s.rect(wx, base - 45, 20, 2, WOOD.s);
          s.rect(wx - 4, base - 33, 28, 3, WOOD.b);        /* the sill */
          s.rect(wx - 4, base - 31, 28, 1, WOOD.d);
        });
      }
    }
  };

  var PROP_NAMES = Object.keys(PROPS);

  /** Where a prop's drawing starts and ends, so a surface can be sized.
   *  `drop` is how far BELOW its footprint a prop reaches — a fence rail runs
   *  on into the tile below it, and cached in a box that stopped at the
   *  footprint the rail was sliced off. */
  function bounds(kind) {
    var p = PROPS[kind];
    return {
      x: -p.over, y: -p.rise,
      w: p.w * T + p.over * 2,
      h: p.h * T + p.rise + (p.drop || 0)
    };
  }

  /** Cast a prop's shadow onto the ground surface it stands on. */
  function castShadow(s, kind, px, py) {
    var d = PROPS[kind];
    if (!d || !d.shade) return;
    shadow(s, px + ((d.w * T) >> 1), py + d.h * T - 4, d.shade[0], d.shade[1]);
  }

  root.CozyProps = {
    PROPS: PROPS, PROP_NAMES: PROP_NAMES, bounds: bounds, T: T,
    shadow: shadow, castShadow: castShadow, darken: darken
  };
})(typeof window !== "undefined" ? window : this);
