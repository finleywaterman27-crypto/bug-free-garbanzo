/* ---------------------------------------------------------------------------
 * One screen of the island, laid out by hand.
 *
 * Hand-authored rather than generated: this is one island that everyone
 * visits, so it can be tuned by eye until it is pleasant to walk around,
 * and a shop or a neighbour can be put somewhere because that is where it
 * ought to be rather than wherever the generator left a gap.
 *
 * The map is written as pictures — a row of characters per row of tiles —
 * because a layout you can read is a layout you can edit. An array of tile
 * ids is a spreadsheet nobody will ever change twice.
 * ------------------------------------------------------------------------ */
(function (root) {
  "use strict";

  var G = root.CozyGround || (typeof require === "function" && require("./ground.js").CozyGround);
  var P = root.CozyProps || (typeof require === "function" && require("./props.js").CozyProps);
  var T = G.T;

  var LEGEND = { ".": "grass", "#": "path", "~": "water", ",": "sand", "=": "deck" };

  /* ----------------------------------------------------------------- home --- */

  /* Twenty by fifteen: wide enough to walk about in, small enough to hold in
   * your head. The sea is along the top, the path comes up from the beach to
   * the front door, and the garden is fenced with a gate where the path runs
   * through it. */
  var HOME_GROUND = [
    "~~~~~~~~~~~~~~~~~~~~",
    "~~~~~~~~~~~~~~~~~~~~",
    ",,,,,,,,,,,,,,,,,,,,",
    ",,,,,,,,,#,,,,,,,,,,",
    ".........#..........",
    ".........#..........",
    ".........#..........",
    ".........#..........",
    ".........#..........",
    ".........#..........",
    "....##########......",
    ".........#..........",
    ".........#..........",
    ".........#..........",
    "...................."
  ];

  /* Props are placed on tiles. A fence works out its own rails from whatever
   * is next to it, so a run of fence is written as a run of fence and not as
   * a list of corner pieces. */
  var HOME_PROPS = [
    { kind: "house", tx: 7, ty: 4 },          /* its doorway is on the path */

    { kind: "tree", tx: 1, ty: 6 }, { kind: "tree", tx: 16, ty: 7 },
    { kind: "tree", tx: 14, ty: 13 },
    /* Palms along the top, where the beach is. */
    { kind: "palm", tx: 2, ty: 4 }, { kind: "palm", tx: 17, ty: 4 },
    { kind: "palm", tx: 13, ty: 3 }, { kind: "palm", tx: 5, ty: 3 },

    { kind: "bush", tx: 4, ty: 13 }, { kind: "bush", tx: 12, ty: 5 },
    { kind: "bush", tx: 15, ty: 9 }, { kind: "rock", tx: 3, ty: 5 },
    { kind: "rock", tx: 13, ty: 13 },

    { kind: "flower", tx: 5, ty: 12 }, { kind: "flower", tx: 6, ty: 8 },
    { kind: "flower", tx: 12, ty: 12 }, { kind: "flower", tx: 2, ty: 8 },
    { kind: "flower", tx: 15, ty: 4 }, { kind: "flower", tx: 11, ty: 13 },

    /* The garden fence, open where the path runs through it, and turning a
     * corner at each end so the garden is a garden and not a line. */
    { kind: "fence", tx: 3, ty: 13 }, { kind: "fence", tx: 3, ty: 14 },
    { kind: "fence", tx: 12, ty: 13 }, { kind: "fence", tx: 12, ty: 14 },
    { kind: "fence", tx: 3, ty: 12 }, { kind: "fence", tx: 4, ty: 12 },
    { kind: "fence", tx: 5, ty: 12 }, { kind: "fence", tx: 6, ty: 12 },
    { kind: "fence", tx: 7, ty: 12 }, { kind: "fence", tx: 8, ty: 12 },
    { kind: "fence", tx: 10, ty: 12 }, { kind: "fence", tx: 11, ty: 12 },
    { kind: "fence", tx: 12, ty: 12 }
  ];

  /* ----------------------------------------------------------------- build --- */

  function parse(rows) {
    var h = rows.length, w = rows[0].length, out = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        out.push(LEGEND[rows[y][x]] || "grass");
      }
    }
    return { w: w, h: h, ground: out };
  }

  /** Every solid rectangle on the map, in world pixels.
   *
   * Tiles are how the map is WRITTEN; they are not how it stops you. A tile
   * is thirty-two pixels and a fence is five, so blocking the tile a fence
   * stands in walls off a strip of garden a yard wide on both sides of it,
   * and a tree becomes a pillar the width of its canopy. What stops you is
   * where the thing actually meets the ground, which each prop works out
   * from its own drawing. */
  function hitRects(map) {
    var out = [];
    map.props.forEach(function (p) {
      var ox = p.tx * T + p.jx, oy = p.ty * T + p.jy;
      P.groundBox(p.kind, p.seed, p.link).forEach(function (r) {
        out.push({ x0: ox + r[0], y0: oy + r[1], x1: ox + r[2], y1: oy + r[3],
                   kind: p.kind });
      });
    });
    return out;
  }

  /* You are a point on the ground with a small box around your feet. The box
   * is the character's stance, not the character: colliding with the whole
   * sprite would mean your hair bumped into fences. */
  var FOOT = { w: 16, h: 8 };

  /** Which sides of each fence have another fence next door. */
  function fenceLinks(map) {
    var at = {};
    map.props.forEach(function (p) { if (p.kind === "fence") at[p.tx + "," + p.ty] = true; });
    map.props.forEach(function (p) {
      if (p.kind !== "fence") return;
      p.link = {
        left: !!at[(p.tx - 1) + "," + p.ty], right: !!at[(p.tx + 1) + "," + p.ty],
        up: !!at[p.tx + "," + (p.ty - 1)], down: !!at[p.tx + "," + (p.ty + 1)]
      };
    });
  }

  function make(rows, props, spawn) {
    var m = parse(rows);
    /* A seed fixed by where the prop stands: the same tree is the same tree
     * every time the page is opened, and two trees side by side are not
     * twins. */
    m.props = props.map(function (p) {
      var seed = p.tx * 73 + p.ty * 149 + 11;
      /* Nudged off the grid. Every prop sitting dead centre in its own tile is
       * most of what makes a hand-made place look machine-made: a row of
       * fence posts in a perfect line, trees at exact intervals. A few pixels
       * either way costs nothing and the grid stops showing. */
      /* Except anything that forms a RUN. A fence nudged tile by tile steps
       * up and down along its length and stops being one fence. */
      var loose = !P.PROPS[p.kind].lines;
      var jx = loose ? Math.round((G.hash(p.tx, p.ty, 90) - 0.5) * 9) : 0;
      var jy = loose ? Math.round((G.hash(p.tx, p.ty, 91) - 0.5) * 7) : 0;
      return { kind: p.kind, tx: p.tx, ty: p.ty, seed: seed, jx: jx, jy: jy };
    });
    m.edge = "water";
    m.spawn = spawn;
    fenceLinks(m);
    m.hits = hitRects(m);
    /* Sorted by the bottom of the footprint, so drawing them in order puts
     * the far ones behind the near ones without sorting every frame. */
    m.props.sort(function (a, b) {
      return (a.ty + P.PROPS[a.kind].h) - (b.ty + P.PROPS[b.kind].h);
    });
    return m;
  }

  function home() {
    return make(HOME_GROUND, HOME_PROPS, { x: 9.5 * T, y: 13.6 * T });
  }

  /** Is this world-pixel point inside something you cannot walk through? */
  function blocked(map, x, y) {
    var tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return true;
    var k = G.KINDS[map.ground[ty * map.w + tx]];
    if (k && k.solid) return true;                      /* the sea */
    for (var i = 0; i < map.hits.length; i++) {
      var r = map.hits[i];
      if (x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1) return true;
    }
    return false;
  }

  /** Can you stand with your feet here?
   *
   * The whole box against the whole rectangle, not its four corners against
   * it. Corners miss anything narrower than the box: with the fence down to
   * the width of its own timber, a character could stand astride it with a
   * corner either side and walk straight through. */
  function canStand(map, x, y) {
    var x0 = x - FOOT.w / 2, x1 = x + FOOT.w / 2, y0 = y - FOOT.h, y1 = y;
    var tx0 = Math.floor(x0 / T), tx1 = Math.floor((x1 - 0.001) / T);
    var ty0 = Math.floor(y0 / T), ty1 = Math.floor((y1 - 0.001) / T);
    for (var ty = ty0; ty <= ty1; ty++) {
      for (var tx = tx0; tx <= tx1; tx++) {
        if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return false;
        var k = G.KINDS[map.ground[ty * map.w + tx]];
        if (k && k.solid) return false;                 /* the sea */
      }
    }
    for (var i = 0; i < map.hits.length; i++) {
      var r = map.hits[i];
      if (x1 > r.x0 && x0 < r.x1 && y1 > r.y0 && y0 < r.y1) return false;
    }
    return true;
  }

  root.CozyMap = {
    LEGEND: LEGEND, make: make, home: home, blocked: blocked,
    canStand: canStand, FOOT: FOOT, hitRects: hitRects, fenceLinks: fenceLinks, T: T,
    HOME_GROUND: HOME_GROUND, HOME_PROPS: HOME_PROPS
  };
})(typeof window !== "undefined" ? window : this);
