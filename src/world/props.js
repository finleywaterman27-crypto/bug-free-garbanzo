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

  /* Anything that grows sways, on a four-frame cycle held slowly. A prop says
   * how far it leans and everything above its trunk moves by that much —
   * which is enough, because what the eye catches is the CHANGE, not the
   * distance. Two pixels on a palm is a breeze; four is a gale. */
  var FRAMES = 4;
  var SWAY = [0, 1, 0, -1];
  function swayOf(phase, amount) {
    if (!amount) return 0;
    return SWAY[((phase | 0) % FRAMES + FRAMES) % FRAMES] * amount;
  }

  /* A warm, light fence timber. The old brown was so close to bark that a
   * fence in front of a tree disappeared into it. */
  var WOOD = tone("#bb883f");
  var BARK = tone("#6b4a2c");
  /* Leaves get their own ramp rather than a derived one. `tone` lightens
   * towards white, which is right for skin and wrong for foliage: sunlight
   * on leaves goes YELLOWER and more saturated, not paler. Derived, the lit
   * side of every tree came out a grey-green and read as fog sitting on the
   * canopy.
   *
   * Darker than grass, too — drawn a shade or two off it, a tree was a
   * slightly different patch of field rather than a thing standing in one. */
  var LEAF = { dd: "#1f4526", d: "#29562d", s: "#336835", b: "#407c3d",
               h: "#5aa347", hh: "#83c95a" };
  var LEAF2 = { dd: "#274e28", d: "#316033", s: "#3d743a", b: "#4c8b42",
                h: "#68b24d", hh: "#93d763" };
  /* A palm is a brighter, yellower green than a broadleaf, and its trunk is
   * pale and ringed rather than dark and furrowed. */
  var PALM = { dd: "#1e5127", d: "#2b6b2f", s: "#3a8438", b: "#4e9f41",
               h: "#6ec14f", hh: "#9adc63" };
  var PALM_BARK = tone("#a08256");
  var COCONUT = tone("#a86a2c");
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
  /* Shadows are GATHERED first and painted once.
   *
   * Darkening the ground as each shadow is cast has two faults and both of
   * them show. Where two shadows overlap the ground is darkened twice, which
   * leaves a hard dark seam between neighbours. And to avoid that you have to
   * keep them from touching — which is what was happening under the fence,
   * where every tile's shadow stopped two pixels short of the tile edge and
   * left a pale stripe of unshaded grass every four posts.
   *
   * So a shadow marks a mask, the mask takes the darkest claim on each pixel,
   * and the ground is darkened one time at the end. Shadows may then overlap
   * as freely as they like. */
  function shadowMask(w, h) {
    return { w: w, h: h, m: new Uint8Array(w * h) };
  }
  function castShadow(mask, kind, px, py, link) {
    var d = PROPS[kind];
    if (!d || !d.shade) return;
    var cx = px + ((d.w * T) >> 1), baseY = py + d.h * T - 4;
    /* A prop that turns a corner casts a different shadow depending on which
     * way it is facing — a fence running away throws a narrow one down its
     * own length, not a wide one out to the sides. */
    var shade = d.shadeFor ? d.shadeFor(link) : d.shade;
    var rw = shade[0], rh = shade[1];
    for (var y = -rh; y <= rh; y++) {
      for (var x = -rw; x <= rw; x++) {
        var q = (x * x) / (rw * rw) + (y * y) / (rh * rh);
        if (q > 1) continue;
        var ax = cx + x, ay = baseY + y;
        if (ax < 0 || ay < 0 || ax >= mask.w || ay >= mask.h) continue;
        var level = q > 0.62 ? 1 : 2;
        var i = ay * mask.w + ax;
        if (level > mask.m[i]) mask.m[i] = level;
      }
    }
  }
  function paintShadows(s, mask) {
    for (var i = 0; i < mask.m.length; i++) {
      var lvl = mask.m[i];
      if (!lvl) continue;
      var here = s.px[i];
      if (!here) continue;
      s.px[i] = darken(here, lvl === 2 ? 0.71 : 0.84);
    }
  }

  /** One rounded mass of leaves, ragged at the rim. */
  function blob(s, cx, cy, rw, rh, c, seed) {
    for (var y = -rh; y <= rh; y++) {
      for (var x = -rw; x <= rw; x++) {
        var d = (x * x) / (rw * rw) + (y * y) / (rh * rh);
        if (d > 1) continue;
        /* Ragged at the rim: a hard ellipse edge is a balloon, not a tree. */
        if (d > 0.72 && hash(cx + x, cy + y, seed) < 0.40) continue;
        s.set(cx + x, cy + y, c);
      }
    }
  }

  /* A canopy is a HANDFUL OF CLUSTERS, not one cloud of green.
   *
   * Drawn as a single speckled ellipse with a light gradient over it, a tree
   * was a green blob you had to take on trust. What makes a tree read is that
   * you can see the separate masses of leaf it is built from — so each lobe
   * is laid down over a slightly larger dark copy of itself, which leaves a
   * dark seam wherever two of them meet, and takes a lit cap on its upper
   * left, because that is where the sun is for everything else on this
   * island. Back to front, so the near ones overlap the far ones.
   */
  function canopy(s, cx, cy, rw, rh, t, seed, lobes) {
    /* Two passes, doing two different jobs, because doing them together was
     * the muddle. The lobes give the SEAMS — each laid over a slightly larger
     * dark copy of itself, so a dark line is left wherever two clusters meet.
     * Then one lighting pass over the whole mass gives the FORM. Lighting
     * each lobe separately meant six little suns arguing with each other and
     * a pale smear across the middle of every tree. */
    lobes.forEach(function (L, i) {
      var lx = cx + L[0], ly = cy + L[1];
      var lw = Math.round(rw * L[2]), lh = Math.round(rh * L[2]);
      blob(s, lx, ly, lw + 1, lh + 1, t.dd, seed + i * 3);
      blob(s, lx, ly, lw, lh, t.b, seed + i * 3);
    });

    /* One sun, up and to the left, the same as everything else on the
     * island. Seam pixels are left alone or the clusters melt together. */
    for (var y = -rh - 3; y <= rh + 3; y++) {
      for (var x = -rw - 3; x <= rw + 3; x++) {
        var px = cx + x, py = cy + y;
        if (s.get(px, py) !== t.b) continue;
        var lit = (-y / rh) * 0.52 + (-x / rw) * 0.26
                + hash(px, py, seed + 40) * 0.22
                + hash((px / 5) | 0, (py / 5) | 0, seed + 41) * 0.26;
        s.set(px, py,
          lit > 0.72 ? t.hh : lit > 0.55 ? t.h : lit > 0.38 ? t.b :
          lit > 0.24 ? t.s : t.d);
      }
    }
  }

  /* Undergrowth round the foot of a thing. Nothing in a field stands on
   * bare lawn: there is always a ring of longer grass at the base where the
   * mower never reached. Cheap, and it does more to settle a tree into the
   * ground than the shadow does. */
  function skirt(s, cx, baseY, spread, seed, t) {
    for (var i = 0; i < spread; i++) {
      var a = hash(seed, i, 88);
      var x = cx + Math.round((a - 0.5) * spread * 2.2);
      var y = baseY - Math.round(hash(seed, i, 89) * 4);
      var tallness = 3 + Math.round(hash(seed, i, 90) * 3);
      var lean = hash(seed, i, 91) < 0.5 ? -1 : 1;
      for (var j = 0; j < tallness; j++) {
        s.set(x + (j > tallness - 2 ? lean : 0), y - j, j > tallness - 2 ? t.s : t.d);
      }
    }
  }

  function trunk(s, cx, baseY, w, h, t) {
    s.rect(cx - (w >> 1), baseY - h, w, h, t.b);
    s.rect(cx - (w >> 1), baseY - h, 2, h, t.s);          /* shaded side */
    s.rect(cx + (w >> 1) - 1, baseY - h, 1, h, t.h);      /* lit edge */
    /* Bark: broken vertical streaks. A flat brown column is a pole. */
    for (var by = baseY - h; by < baseY - 2; by++) {
      for (var bx = cx - (w >> 1) + 2; bx < cx + (w >> 1) - 1; bx++) {
        var n = hash(bx, (by / 3) | 0, 95);
        if (n > 0.86) s.set(bx, by, t.s);
        else if (n < 0.10) s.set(bx, by, t.h);
      }
    }
    /* Roots spreading where it meets the ground, so it does not look posted
     * into a hole. */
    s.rect(cx - (w >> 1) - 1, baseY - 2, w + 2, 2, t.s);
    s.rect(cx - (w >> 1) - 2, baseY - 1, w + 4, 1, t.d);
  }

  /* ---------------------------------------------------------------- props --- */

  var PROPS = {
    tree: {
      w: 2, h: 1, rise: 112, over: 16, shade: [26, 9], sway: 1,
      block: [[0, 0], [1, 0]],
      draw: function (s, px, py, seed, link, phase) {
        /* A tree stands well above head height. Drawn the same height as the
         * person walking past it, the island read as a model of itself. */
        var cx = px + T, base = py + T - 4;
        skirt(s, cx, base + 1, 11, seed, LEAF);
        trunk(s, cx, base, 12, 54, BARK);
        /* A branch showing where the trunk goes into the leaves, or the
         * canopy is a hat balanced on a pole. */
        s.rect(cx - 12, base - 58, 8, 3, BARK.s);
        s.rect(cx + 5, base - 64, 8, 3, BARK.s);
        /* The clusters shift a little from tree to tree. Fixed, a row of
         * them along a path were identical twins. */
        function w2(i, amp) { return Math.round((hash(seed, i, 80) - 0.5) * amp); }
        canopy(s, cx, base - 72, 30, 24, LEAF, seed, [
          [-19 + w2(0, 7), 4 + w2(1, 6), 0.52 + w2(2, 0.18) / 10],
          [19 + w2(3, 7), 6 + w2(4, 6), 0.50 + w2(5, 0.18) / 10],
          [-11 + w2(6, 6), -13 + w2(7, 6), 0.56 + w2(8, 0.16) / 10],
          [13 + w2(9, 6), -15 + w2(10, 6), 0.54 + w2(11, 0.16) / 10],
          [0 + w2(12, 5), -2 + w2(13, 4), 0.78],
          [2 + w2(14, 7), 12 + w2(15, 5), 0.46 + w2(16, 0.16) / 10]
        ]);
      }
    },
    palm: {
      w: 1, h: 1, rise: 84, over: 42, shade: [17, 6], sway: 2,
      block: [[0, 0]],
      draw: function (s, px, py, seed, link, phase) {
        var cx = px + (T >> 1), base = py + T - 4;
        skirt(s, cx, base + 1, 8, seed, PALM);

        /* The trunk leans, because a palm always does, and carries the rings
         * left by the fronds it has already dropped. Drawn straight and
         * smooth it is a lamp post. */
        var bend = (hash(seed, 0, 20) - 0.5) * 2;
        var tall = 58 + Math.round(hash(seed, 1, 21) * 10);
        var topX = cx;
        for (var i = 0; i < tall; i++) {
          var f = i / tall;
          var y = base - i;
          topX = Math.round(cx + bend * f * f * 9);
          var half = Math.round(5 - f * 1.6);
          s.rect(topX - half, y, half * 2, 1, PALM_BARK.b);
          s.rect(topX - half, y, 2, 1, PALM_BARK.s);
          s.set(topX + half - 1, y, PALM_BARK.h);
          if (i % 5 === 2) {                                /* a frond scar */
            s.rect(topX - half, y, half * 2, 1, PALM_BARK.s);
            s.set(topX - half + 1, y, PALM_BARK.d);
          }
        }
        s.rect(topX - 6, base - 2, 12, 2, PALM_BARK.d);     /* the foot */

        var cy = base - tall;
        /* The crown moves; the trunk does not. A palm bends at the top. */
        cx = topX + swayOf(phase, 2);

        /* Fronds. Each one leaves the crown going out and up, then droops
         * under its own weight, and carries leaflets down both sides that
         * are widest in the middle. A palm read from its fronds or not at
         * all — a blob on a stick is not one. */
        function frond(deg, len, seed2, fat) {
          var a = deg * Math.PI / 180;
          var dx = Math.cos(a), dy = -Math.sin(a);
          var droop = len * 0.72;
          for (var t2 = 0; t2 <= len; t2++) {
            var f2 = t2 / len;
            var sx = Math.round(cx + dx * t2);
            var sy = Math.round(cy + dy * t2 + f2 * f2 * droop);
            var wide = Math.round(Math.sin(f2 * Math.PI) * 6) + 1 + fat;
            if (!fat) s.set(sx, sy, PALM.d);                /* the spine */
            for (var k = 0; k <= wide; k++) {
              /* Serrated: a notch every third leaflet, which is what gives a
               * frond its comb edge rather than a smooth blade. */
              var cut = !fat && (t2 + k) % 3 === 0 && k > wide - 3
                && hash(seed2, t2 + k, 22) < 0.75;
              if (cut) continue;
              var ox = -Math.round(dy * k), oy = Math.round(dx * k * 0.3) - k;
              if (fat) {
                s.set(sx + ox, sy + oy, PALM.dd);
                s.set(sx - ox, sy - oy, PALM.dd);
              } else {
                /* Lit along the top of the frond, shaded underneath. */
                s.set(sx + ox, sy + oy, k > wide - 2 ? PALM.s : PALM.h);
                s.set(sx - ox, sy - oy, k > wide - 2 ? PALM.dd : PALM.b);
              }
            }
          }
        }
        var spread = [168, 138, 106, 74, 42, 12];
        var fronds = spread.map(function (deg, i) {
          return [deg + Math.round((hash(seed, i, 23) - 0.5) * 14),
                  29 + Math.round(hash(seed, i, 24) * 10), seed + i];
        });
        /* Outline pass first, then the fronds on top of it, so every one has
         * a dark edge and the crown reads as leaves rather than as haze. */
        fronds.forEach(function (f) { frond(f[0], f[1], f[2], 1); });
        fronds.forEach(function (f) { frond(f[0], f[1], f[2], 0); });

        /* Coconuts, tucked under the crown. */
        if (hash(seed, 0, 25) > 0.35) {
          [[-4, 2], [3, 1], [0, 5]].forEach(function (c, i) {
            if (hash(seed, i, 26) < 0.3) return;
            s.rect(cx + c[0] - 2, cy + c[1] - 2, 5, 5, COCONUT.b);
            s.rect(cx + c[0] - 2, cy + c[1] - 2, 5, 1, COCONUT.h);
            s.rect(cx + c[0] - 2, cy + c[1] + 2, 5, 1, COCONUT.d);
          });
        }
      }
    },
    bush: {
      w: 1, h: 1, rise: 14, over: 5, shade: [14, 5], sway: 1,
      block: [[0, 0]],
      draw: function (s, px, py, seed, link, phase) {
        var cx = px + (T >> 1), base = py + T - 4;
        cx += swayOf(phase, 1);
        canopy(s, cx, base - 9, 14, 11, LEAF2, seed,
          [[-6, 2, 0.62], [6, 3, 0.58], [0, -4, 0.74]]);
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
        skirt(s, cx, base + 1, 7, seed, LEAF2);
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
      w: 1, h: 1, rise: 14, over: 4, drop: 4, shade: [18, 4], lines: true,
      shadeFor: function (link) {
        link = link || {};
        var across = link.left || link.right, along = link.up || link.down;
        if (along && !across) return [7, 17];        /* down its own length */
        if (along && across) return [13, 13];        /* a corner */
        return [18, 4];
      },
      block: [[0, 0]],
      /* `link` is filled in by the map: which sides have a fence next door.
       *
       * A PICKET fence — a tidy row of boards with two rails running behind
       * them — rather than the leaning posts this was. Posts with a rail
       * slung between them is a ranch fence: sparse, wonky, and around a
       * cottage garden it read as a mess. What makes a picket fence read is
       * regularity: boards the same width, evenly spaced, each with a dark
       * edge and a nail where it crosses a rail. */
      draw: function (s, px, py, seed, link) {
        var base = py + T - 4;
        link = link || {};
        var cx = px + (T >> 1);
        /* Four boards to a tile, five wide with a three-pixel gap. Six wide
         * left a two-pixel gap, and once each board's dark edges were in it
         * the boards ran together into a wall — a picket fence is as much
         * about the daylight between the pickets as about the pickets.
         *
         * Four wide with four of daylight was tried and put back: the gap
         * read as the fence being thin rather than as light coming through
         * it, and the pale face and cut head that went with it lost the
         * timber. */
        var PW = 5, STEP = 8;
        var H = 22;
        var top = base - H;
        var railA = base - 16, railB = base - 8;
        var across = link.left || link.right;
        var along = link.up || link.down;
        var corner = across && along;

        function rail(x0, w, y) {
          s.rect(x0, y - 1, w, 5, WOOD.dd);      /* its dark edge */
          s.rect(x0, y, w, 3, WOOD.d);
          s.rect(x0, y, w, 1, WOOD.s);           /* light along its top */
        }

        /** One board, with its dark edge part of it rather than around it.
         *  `clip` is the line above which it is not drawn, so a post standing
         *  taller than its tile can be cut off level with the top of the run.
         *
         *  No nail heads where it crosses the rails and no cap on top of it:
         *  at this size a nail is a dot and a cap is a little hat, and four
         *  of each to a tile is a rash across the whole fence. */
        function board(bx, bTop, bH, w, clip) {
          w = w || PW;
          for (var y = 0; y < bH; y++) {
            if (clip !== undefined && bTop + y < clip) continue;
            var inset = y === 0 ? 2 : y === 1 ? 1 : 0;   /* the rounded head */
            var w2 = w - inset * 2;
            s.rect(bx + inset, bTop + y, w2, 1, WOOD.b);
            s.set(bx + inset, bTop + y, WOOD.dd);
            s.set(bx + inset + w2 - 1, bTop + y, WOOD.dd);
            if (w2 > 3) {
              s.set(bx + inset + 1, bTop + y, y < 2 ? WOOD.b : WOOD.h);
              s.set(bx + inset + w2 - 2, bTop + y, WOOD.s);
            }
          }
        }

        /* A POST is the same board as every picket — the same width and the
         * same height, so a corner does not stand a head above the run it
         * turns. A run ends on one, a run TURNS on one, and a run going away
         * from you is made of nothing else.
         *
         * A post stands IN one of the picket slots rather than wherever the
         * middle of the tile happens to fall, so the daylight either side of
         * it is the same three pixels as the daylight between any two
         * pickets. Centred, it sat half a gap out of step and every corner
         * had a wide side and a narrow one. */
        var POST = PW, PH = H, X = px + 1 + 2 * STEP;
        var posts = [];
        function post(x0) { board(x0, base - PH, PH, POST); }

        /* ---- the run going across ----------------------------------------
         * A run ends on a post, and at a corner the rails run INTO the corner
         * post. Stopped dead at the middle of the tile instead, the rails
         * ended in mid-air and the run going away stood in front of them
         * touching nothing; and a run that simply stopped left two rails
         * poking out into the gateway like a pair of sticks. */
        if (along) posts.push(X);                    /* the corner post */
        if (!across && !along) posts.push(X);        /* a gatepost on its own */
        if (across) {
          if (!link.left && !along) posts.push(px + 1);
          if (!link.right && !along) posts.push(px + 1 + 3 * STEP);
          var rx0 = link.left ? px : (along ? X : px + 1);
          var rx1 = link.right ? px + T : (along ? X + PW : px + 1 + 3 * STEP + PW);
          rail(rx0, rx1 - rx0, railA);
          rail(rx0, rx1 - rx0, railB);
          /* The boards keep to the tile's own eight-pixel grid whatever the
           * run is doing, so the spacing never shifts from tile to tile, and
           * wherever a post stands it stands in a slot of that same grid. */
          for (var k = 0; k < 4; k++) {
            var bx = px + 1 + k * STEP;
            if (posts.indexOf(bx) >= 0) continue;
            if (bx >= rx0 && bx + PW <= rx1 + 1) board(bx, top, H);
          }
        }

        /* ---- the run going away from you ----------------------------------
         * POSTS, one every sixteen pixels, each standing face on and each
         * overlapping the one behind it. This is how the games that have
         * solved it do it: in Stardew Valley a fence piece in a vertical run
         * overlaps its neighbour by a whole tile, so what you see going away
         * is a line of posts leaning into one another, not a fence drawn from
         * a second angle.
         *
         * Everything that tried to draw the fence as it would really look
         * from the side failed, because the run going across is drawn face on
         * and the two cannot share a projection: two thin rails was a ladder,
         * one fat rail a plank, the whole panel turned on its side a trellis,
         * and a bar with the tone wandering along it a stack of crates. */
        if (along) {
          /* On the same eight-pixel pitch as the boards across, so a fence
           * going away is spaced like a fence coming towards you: a head
           * every eight pixels either way. At sixteen the run going away was
           * in a slower rhythm than the run going across and the two did not
           * look like the same fence.
           *
           * Cut level with the top of the fence at the far end, so the run
           * starts where the boards across start rather than a post-height
           * above it. */
          /* Nothing is drawn more than a few pixels above the tile: the one
           * above has already drawn the posts that stand up there, and a
           * prop that reaches outside its own box is a prop the game clips
           * when it caches it as a picture. */
          var clip = link.up ? py - STEP : top;
          for (var f = base - PH; f <= base; f += STEP) board(X, f - PH, PH, POST, clip);
        }

        /* Posts go on last, over the rails that die into them. */
        posts.forEach(post);
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

  root.CozyProps = {
    PROPS: PROPS, PROP_NAMES: PROP_NAMES, bounds: bounds, T: T,
    shadowMask: shadowMask, castShadow: castShadow, paintShadows: paintShadows,
    darken: darken, FRAMES: FRAMES, swayOf: swayOf
  };
})(typeof window !== "undefined" ? window : this);
