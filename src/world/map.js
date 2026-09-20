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
    { kind: "tree", tx: 14, ty: 13 }, { kind: "pine", tx: 18, ty: 5 },
    { kind: "pine", tx: 2, ty: 11 }, { kind: "pine", tx: 17, ty: 12 },

    { kind: "bush", tx: 4, ty: 13 }, { kind: "bush", tx: 12, ty: 5 },
    { kind: "bush", tx: 15, ty: 9 }, { kind: "rock", tx: 3, ty: 5 },
    { kind: "rock", tx: 13, ty: 13 },

    { kind: "flower", tx: 5, ty: 12 }, { kind: "flower", tx: 6, ty: 8 },
    { kind: "flower", tx: 12, ty: 12 }, { kind: "flower", tx: 2, ty: 8 },
    { kind: "flower", tx: 15, ty: 4 }, { kind: "flower", tx: 11, ty: 13 },

    /* The garden fence, open where the path runs through it. */
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

  /** Which tiles you cannot stand on: hard ground plus every prop's footprint. */
  function solidGrid(map) {
    var solid = new Array(map.w * map.h);
    for (var i = 0; i < solid.length; i++) {
      var k = G.KINDS[map.ground[i]];
      solid[i] = !!(k && k.solid);
    }
    map.props.forEach(function (p) {
      var def = P.PROPS[p.kind];
      if (!def) return;
      def.block.forEach(function (c) {
        var tx = p.tx + c[0], ty = p.ty + c[1];
        if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return;
        solid[ty * map.w + tx] = true;
      });
    });
    return solid;
  }

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
      var jx = p.jitter === false ? 0 : Math.round((G.hash(p.tx, p.ty, 90) - 0.5) * 9);
      var jy = p.jitter === false ? 0 : Math.round((G.hash(p.tx, p.ty, 91) - 0.5) * 7);
      return { kind: p.kind, tx: p.tx, ty: p.ty, seed: seed, jx: jx, jy: jy };
    });
    m.edge = "water";
    m.spawn = spawn;
    fenceLinks(m);
    m.solid = solidGrid(m);
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
    return map.solid[ty * map.w + tx];
  }

  root.CozyMap = {
    LEGEND: LEGEND, make: make, home: home, blocked: blocked,
    solidGrid: solidGrid, fenceLinks: fenceLinks, T: T,
    HOME_GROUND: HOME_GROUND, HOME_PROPS: HOME_PROPS
  };
})(typeof window !== "undefined" ? window : this);
