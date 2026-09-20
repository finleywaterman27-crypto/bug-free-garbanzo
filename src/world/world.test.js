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
    var b = P.bounds(name);
    /* Painted into a surface with a margin all round, so anything that
     * escapes the claimed bounds lands somewhere we can see it. */
    var pad = 40;
    var s = new G.Surface(b.w + pad * 2, b.h + pad * 2);
    var link = { left: !!(seed & 1), right: !!(seed & 2), up: !!(seed & 4), down: !!(seed & 8) };
    P.PROPS[name].draw(s, pad - b.x, pad - b.y, seed, link);
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
        "y " + (lo.y - pad) + ".." + (hi.y - pad) + " of 0.." + (b.h - 1), { seed: seed });
    }
  }
});
say("every prop draws inside its own bounds");

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
 *    walking into it, which is exactly the kind of thing a flood fill from
 *    where you start is good at.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  var start = { x: Math.floor(map.spawn.x / T), y: Math.floor(map.spawn.y / T) };
  checked++;
  if (map.solid[start.y * map.w + start.x]) {
    fail("reach", name + ": you start inside something solid", start);
  }
  var seen = {}, queue = [start], reached = 0;
  while (queue.length) {
    var c = queue.pop();
    var k = c.x + "," + c.y;
    if (seen[k] || c.x < 0 || c.y < 0 || c.x >= map.w || c.y >= map.h) continue;
    if (map.solid[c.y * map.w + c.x]) continue;
    seen[k] = true; reached++;
    queue.push({ x: c.x + 1, y: c.y }, { x: c.x - 1, y: c.y },
               { x: c.x, y: c.y + 1 }, { x: c.x, y: c.y - 1 });
  }
  var walkable = 0;
  for (var i = 0; i < map.solid.length; i++) { checked++; if (!map.solid[i]) walkable++; }
  if (reached !== walkable) {
    fail("reach", name + ": " + (walkable - reached) + " walkable tiles are cut off from where you start", {});
  }
});
say("you can get everywhere you can see");

/* ---------------------------------------------------------------------------
 * 7. What stops you is what you can see stopping you.
 *    Collision drifting away from the drawing is how you end up walking
 *    through a tree, or bouncing off thin air beside one. Every solid tile
 *    has to have something drawn on it, and no prop may quietly block a tile
 *    it is not standing on.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  var drawn = {};
  map.props.forEach(function (p) {
    P.PROPS[p.kind].block.forEach(function (c) {
      drawn[(p.tx + c[0]) + "," + (p.ty + c[1])] = p.kind;
    });
  });
  for (var ty = 0; ty < map.h; ty++) {
    for (var tx = 0; tx < map.w; tx++) {
      checked++;
      var solid = map.solid[ty * map.w + tx];
      var ground = G.KINDS[map.ground[ty * map.w + tx]];
      var why = drawn[tx + "," + ty] || (ground && ground.solid ? map.ground[ty * map.w + tx] : null);
      if (solid && !why) fail("collision", name + ": " + tx + "," + ty + " stops you but nothing is there", {});
      if (!solid && why) fail("collision", name + ": " + tx + "," + ty + " has a " + why + " on it but lets you through", {});
    }
  }
});
say("what stops you is what you can see");

/* ---------------------------------------------------------------------------
 * 8. Depth: anything nearer the bottom of the screen is drawn later.
 *    This is the one rule that makes a map read as a place — walk behind a
 *    tree and in front of its trunk — so it gets checked rather than
 *    eyeballed. For every prop and every tile you can stand on, whoever is
 *    lower down the screen has to be drawn on top.
 * ------------------------------------------------------------------------ */
Object.keys(MAPS).forEach(function (name) {
  var map = MAPS[name];
  map.props.forEach(function (p) {
    var d = P.PROPS[p.kind];
    /* Everything is sorted by the bottom of its footprint, and you by your
     * feet. That works so long as you can never be standing INSIDE a
     * footprint: there, your feet are above the line the prop sorts on, and
     * it gets drawn over the top of you. It is how the walls of the house
     * swallowed a character standing in the open doorway. So: every tile a
     * prop covers must be one you cannot stand on — unless the prop is flat
     * enough to have no shadow, like a flower, which you are meant to walk
     * over. */
    if (!d.shade) return;
    for (var j = 0; j < d.h; j++) {
      for (var i = 0; i < d.w; i++) {
        var tx = p.tx + i, ty = p.ty + j;
        if (tx >= map.w || ty >= map.h) continue;
        checked++;
        if (!map.solid[ty * map.w + tx]) {
          fail("depth", name + ": you can stand at " + tx + "," + ty + ", inside a " +
            p.kind + ", which will then be drawn over the top of you", {});
        }
      }
    }
  });
});
say("whoever is lower down the screen is drawn on top");

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
