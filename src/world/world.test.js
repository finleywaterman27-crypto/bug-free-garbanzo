/* ---------------------------------------------------------------------------
 * The island, checked exhaustively.
 *
 * Same rule as the character suite: not a sample, every one. There are few
 * enough tiles and props that "every combination" means every tile of every
 * map against every prop on it, so that is what this does.
 * ------------------------------------------------------------------------ */
"use strict";

var G = require("./ground.js").CozyGround;
var P = require("./props.js").CozyProps;
var M = require("./map.js").CozyMap;
var T = G.T;

var checked = 0, failures = [], t0 = Date.now();

function fail(what, why, detail) {
  failures.push({ what: what, why: why, detail: detail });
}
function say(label) {
  var pad = Math.max(1, 46 - label.length);
  process.stdout.write("  " + label + new Array(pad).join(" ") +
    checked.toLocaleString("en-GB") + "   " + Math.round((Date.now() - t0) / 1000) + "s\n");
}

var MAPS = { home: M.home() };

/* ---------------------------------------------------------------------------
 * 1. Every prop draws something, inside the bounds it claims.
 *    A prop that reaches outside its own bounds is a prop the game will clip
 *    when it caches it as a picture, and the top of the tree simply will not
 *    be there.
 * ------------------------------------------------------------------------ */
P.PROP_NAMES.forEach(function (name) {
  for (var seed = 0; seed < 24; seed++) {
   /* Every frame of the sway, not just the still one: a canopy that leans a
    * pixel too far on one frame of its breeze is clipped only on that frame,
    * which is exactly the kind of thing nobody notices until it ships. */
   for (var phase = 0; phase < P.FRAMES; phase++) {
    var b = P.bounds(name);
    /* Painted into a surface with a margin all round, so anything that
     * escapes the claimed bounds lands somewhere we can see it. */
    var pad = 40;
    var s = new G.Surface(b.w + pad * 2, b.h + pad * 2);
    var link = { left: !!(seed & 1), right: !!(seed & 2), up: !!(seed & 4), down: !!(seed & 8) };
    P.PROPS[name].draw(s, pad - b.x, pad - b.y, seed, link, phase);
    checked++;

    var lo = { x: s.w, y: s.h }, hi = { x: -1, y: -1 }, n = 0;
    for (var y = 0; y < s.h; y++) {
      for (var x = 0; x < s.w; x++) {
        if (!s.px[y * s.w + x]) continue;
        n++;
        if (x < lo.x) lo.x = x; if (x > hi.x) hi.x = x;
        if (y < lo.y) lo.y = y; if (y > hi.y) hi.y = y;
      }
    }
    if (n === 0) { fail("prop", name + " draws nothing at all", { seed: seed }); continue; }
    if (lo.x < pad || lo.y < pad || hi.x >= pad + b.w || hi.y >= pad + b.h) {
      fail("prop bounds", name + " draws outside the box it declares: " +
        "x " + (lo.x - pad) + ".." + (hi.x - pad) + " of 0.." + (b.w - 1) + ", " +
        "y " + (lo.y - pad) + ".." + (hi.y - pad) + " of 0.." + (b.h - 1) +
        " on frame " + phase, { seed: seed });
    }
   }
  }
});
say("every prop draws inside its own bounds, on every frame");

/* ---------------------------------------------------------------------------
 * 2. A prop looks the same every time it is drawn.
 *    The game caches each prop as one picture and stamps it wherever that
 *    kind appears, so anything that reaches for Math.random would flicker or,
 *    worse, be frozen at whatever it rolled the first time.
 * ------------------------------------------------------------------------ */
P.PROP_NAMES.forEach(function (name) {
  var b = P.bounds(name);
  for (var seed = 0; seed < 8; seed++) {
    var runs = [];
    for (var r = 0; r < 2; r++) {
      var s = new G.Surface(b.w, b.h);
      P.PROPS[name].draw(s, -b.x, -b.y, seed, { left: true, right: true });
      runs.push(s.px.join("|"));
    }
    checked++;
    if (runs[0] !== runs[1]) {
      fail("prop", name + " draws differently the second time, on seed " + seed, { seed: seed });
    }
  }
});
say("a prop draws the same every time");

/* ---------------------------------------------------------------------------
 * 3. The ground is painted everywhere, and only in tones it owns.
 *    A hole in the ground shows the page behind it.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  var s = G.paintGround(map);
  var holes = 0;
  for (var i = 0; i < s.px.length; i++) { checked++; if (!s.px[i]) holes++; }
  if (holes) fail("ground", name + " has " + holes + " unpainted pixels", {});
  if (s.w !== map.w * T || s.h !== map.h * T) {
    fail("ground", name + " painted " + s.w + "x" + s.h + ", expected " +
      (map.w * T) + "x" + (map.h * T), {});
  }
});
say("the ground is painted everywhere");

/* ---------------------------------------------------------------------------
 * 4. The map is well formed.
 *    Ragged rows are the classic hand-authored-map bug: one row a character
 *    short and every tile after it is in the wrong column.
 * ------------------------------------------------------------------------ */
(function () {
  var rows = M.HOME_GROUND;
  var w = rows[0].length;
  rows.forEach(function (r, y) {
    checked++;
    if (r.length !== w) fail("map", "row " + y + " is " + r.length + " tiles, not " + w, {});
    for (var x = 0; x < r.length; x++) {
      checked++;
      if (!M.LEGEND[r[x]]) fail("map", "row " + y + " column " + x + " is '" + r[x] + "', which is not in the legend", {});
    }
  });
})();
say("the map is well formed");

/* ---------------------------------------------------------------------------
 * 5. Nothing stands off the edge, and nothing stands on anything else.
 *    Two props sharing a tile means one of them is inside the other.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  var taken = {};
  map.props.forEach(function (p) {
    var d = P.PROPS[p.kind];
    checked++;
    if (!d) return fail("prop", "there is no prop called " + p.kind, p);
    if (p.tx < 0 || p.ty < 0 || p.tx + d.w > map.w || p.ty + d.h > map.h) {
      fail("placement", name + ": a " + p.kind + " at " + p.tx + "," + p.ty + " hangs off the map", p);
    }
    d.block.forEach(function (c) {
      var key = (p.tx + c[0]) + "," + (p.ty + c[1]);
      checked++;
      if (taken[key]) {
        fail("placement", name + ": a " + p.kind + " and a " + taken[key] + " both stand on " + key, p);
      }
      taken[key] = p.kind;
    });
  });
});
say("nothing stands off the edge or inside anything else");

/* ---------------------------------------------------------------------------
 * 6. You can get everywhere you can see.
 *    A patch of grass fenced off by accident is a bug you only find by
 *    walking into it. Asked of the real collision rather than of the tile
 *    grid: what stops you now is where a thing meets the ground, which is a
 *    few pixels of fence rather than the whole tile it stands in, so a flood
 *    fill over TILES would answer a question the game never asks.
 * ------------------------------------------------------------------------ */
var STEP = 4;                       /* finer than the foot box, so nothing slips through */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  var gw = Math.ceil(map.w * T / STEP), gh = Math.ceil(map.h * T / STEP);
  function ok(gx, gy) { return M.canStand(map, gx * STEP + 2, gy * STEP + 2); }
  var start = { x: Math.round(map.spawn.x / STEP), y: Math.round(map.spawn.y / STEP) };
  checked++;
  if (!ok(start.x, start.y)) fail("reach", name + ": you cannot stand where you start", start);
  var seen = new Uint8Array(gw * gh), queue = [start], reached = 0;
  while (queue.length) {
    var c = queue.pop();
    if (c.x < 0 || c.y < 0 || c.x >= gw || c.y >= gh) continue;
    var i = c.y * gw + c.x;
    if (seen[i]) continue;
    if (!ok(c.x, c.y)) continue;
    seen[i] = 1; reached++;
    queue.push({ x: c.x + 1, y: c.y }, { x: c.x - 1, y: c.y },
               { x: c.x, y: c.y + 1 }, { x: c.x, y: c.y - 1 });
  }
  var standable = 0, cut = null;
  for (var gy = 0; gy < gh; gy++) {
    for (var gx = 0; gx < gw; gx++) {
      checked++;
      if (!ok(gx, gy)) continue;
      standable++;
      if (!seen[gy * gw + gx] && !cut) cut = { x: gx * STEP, y: gy * STEP };
    }
  }
  if (standable !== reached) {
    fail("reach", name + ": " + (standable - reached) + " of " + standable +
      " places you could stand are cut off from where you start, the first at " +
      cut.x + "," + cut.y, {});
  }
});
say("you can get everywhere you can see");

/* ---------------------------------------------------------------------------
 * 7. What stops you is what you can see stopping you.
 *    Every solid rectangle has to belong to something drawn there, and it
 *    may not be much bigger than the thing itself — a fence that stops you a
 *    tile away is a fence with an invisible wall beside it.
 * ------------------------------------------------------------------------ */
var SLACK = 4;                      /* a little cushion, so you do not scrape */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  map.props.forEach(function (p) {
    var d = P.PROPS[p.kind];
    var b = P.bounds(p.kind);
    var s = new G.Surface(b.w, b.h);
    d.draw(s, -b.x, -b.y, p.seed, p.link, 0);
    var boxes = P.groundBox(p.kind, p.seed, p.link);
    if (d.stands === "all") return;                 /* a building is a block */
    boxes.forEach(function (r) {
      /* everything the prop draws between the top and the bottom of this box */
      var lo = 1e9, hi = -1e9;
      for (var y = r[1]; y < r[3]; y++) {
        for (var x = -b.x < 0 ? 0 : 0; x < d.w * T; x++) {
          if (!s.px[(y - b.y) * b.w + (x - b.x)]) continue;
          if (x < lo) lo = x;
          if (x > hi) hi = x;
        }
      }
      checked++;
      if (hi < lo) {
        return fail("collision", name + ": a " + p.kind + " stops you at " +
          r.join(",") + " where it draws nothing at all", p);
      }
      if (r[0] < lo - SLACK || r[2] > hi + 1 + SLACK) {
        fail("collision", name + ": a " + p.kind + " stops you from " + r[0] +
          " to " + r[2] + " but only draws from " + lo + " to " + (hi + 1), p);
      }
    });
  });
});
say("what stops you is what you can see");

/* ---------------------------------------------------------------------------
 * 8. Where a thing meets the ground, you cannot stand.
 *    The other half of the same rule: collision may not be bigger than the
 *    art (7), and it may not be smaller either, or you walk through the foot
 *    of a fence. Every pixel a prop draws along the line it stands on has to
 *    be inside one of its solid rectangles.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  map.props.forEach(function (p) {
    var d = P.PROPS[p.kind];
    if (!d.shade || d.stands === "all") return;     /* flowers, buildings */
    var b = P.bounds(p.kind);
    var s = new G.Surface(b.w, b.h);
    d.draw(s, -b.x, -b.y, p.seed, p.link, 0);
    var boxes = P.groundBox(p.kind, p.seed, p.link);
    var base = d.h * T - 4;
    for (var y = base - 6; y < base + 2; y++) {
      for (var x = 0; x < d.w * T; x++) {
        if (!s.px[(y - b.y) * b.w + (x - b.x)]) continue;
        checked++;
        var inside = boxes.some(function (r) {
          return x >= r[0] && x < r[2] && y >= r[1] && y < r[3];
        });
        if (!inside) {
          fail("collision", name + ": a " + p.kind + " has timber on the ground at " +
            x + "," + y + " that you can walk straight through", p);
        }
      }
    }
  });
});
say("where a thing meets the ground, you cannot stand");

/* ---------------------------------------------------------------------------
 * 9. Depth: anything more than one tile deep is solid all through.
 *    Everything is sorted by the bottom of its footprint and you by your
 *    feet, which is right for anything one tile deep — stand above it and
 *    you are behind it, below it and you are in front. Something that
 *    reaches back several tiles is the exception: stand inside its footprint and your feet are above the
 *    line it sorts on, so its walls are drawn over the top of you. It is how
 *    the house swallowed a character standing in the open doorway.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  map.props.forEach(function (p) {
    var d = P.PROPS[p.kind];
    if (d.h === 1) return;      /* one tile deep: you walk behind it */
    checked++;
    if (d.stands !== "all") {
      return fail("depth", name + ": a " + p.kind + " is " + d.h + " tiles deep " +
        "but is not solid all through, so you can stand inside it", p);
    }
    for (var j = 0; j < d.h; j++) {
      for (var i = 0; i < d.w; i++) {
        var cx = (p.tx + i) * T + (T >> 1), cy = (p.ty + j) * T + (T >> 1);
        checked++;
        if (!M.blocked(map, cx, cy)) {
          fail("depth", name + ": you can stand at " + cx + "," + cy + ", inside a " +
            p.kind + ", which will then be drawn over the top of you", p);
        }
      }
    }
  });
});
say("a building is solid all through");

/* --------------------------------------------------------------------------- */

process.stdout.write("\n" + checked.toLocaleString("en-GB") + " checks in " +
  Math.round((Date.now() - t0) / 1000) + "s\n");
if (failures.length) {
  var seen = {};
  failures.forEach(function (f) {
    var k = f.what + "|" + f.why;
    seen[k] = (seen[k] || 0) + 1;
  });
  process.stdout.write("\nFAIL — " + failures.length + " problems\n");
  Object.keys(seen).slice(0, 40).forEach(function (k) {
    var parts = k.split("|");
    process.stdout.write("  " + seen[k] + "x  " + parts[1] + "\n      " + parts[0] + "\n");
  });
  process.exit(1);
}
process.stdout.write("PASS — every prop inside its bounds, the ground whole, " +
  "nothing cut off, and nothing drawn over the top of you\n");
