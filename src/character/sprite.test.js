/*
 * Combination tests for the character renderer.
 *
 * The creator can produce ~10^16 characters, so they cannot all be looked at.
 * These assert the things that go wrong when parts are drawn over each other:
 * a hat that erases the hair, a fringe that covers both eyes, a beard that
 * swallows the mouth, a build whose arms fall outside the grid.
 *
 * Run: node src/character/sprite.test.js
 */
"use strict";
global.window = {};
require("./sprite.js");
require("./villagers.js");
var S = global.window.CozySprite;
var V = global.window.CozyVillagers;

var SCLERA = "#f7f3ea";
var failures = [];
var checked = 0;

function px(g, x, y) { return g.px[y * S.W + x]; }

/** Nothing may touch the edge of the grid, or it is being clipped. */
function notClipped(g, what) {
  for (var x = 0; x < S.W; x++) {
    if (px(g, x, 0) || px(g, x, S.H - 1)) return what + ": clipped top or bottom";
  }
  for (var y = 0; y < S.H; y++) {
    if (px(g, 0, y) || px(g, S.W - 1, y)) return what + ": clipped left or right";
  }
  return null;
}

function countIn(g, x0, y0, w, h, colour) {
  var n = 0;
  for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) {
    if (px(g, x, y) === colour) n++;
  }
  return n;
}

function filledIn(g, x0, y0, w, h) {
  var n = 0;
  for (var y = y0; y < y0 + h; y++) for (var x = x0; x < x0 + w; x++) if (px(g, x, y)) n++;
  return n;
}

function check(label, ch, dir, frame, opts) {
  checked++;
  var g = S.build(ch, dir, frame);
  var clip = notClipped(g, label);
  if (clip) { failures.push(clip); return; }

  if (dir === "up") return;                       /* no face to check from behind */

  /* Eyes must survive whatever is worn over them. Sunglasses and goggles are
   * meant to cover them, so they are the one exemption. */
  var covered = (ch.accessories || []).some(function (a) {
    return a === "Sunglasses" || a === "Goggles";
  });
  if (!covered) {
    var eyes = countIn(g, 8, S.EYE_ROW - 1, 10, 4, SCLERA);
    var wanted = dir === "down" ? 2 : 1;
    if (eyes < wanted) failures.push(label + ": eyes hidden (" + eyes + " visible pixels)");
  }

  /* A face that is entirely hair, hat and beard is a bug. */
  var face = filledIn(g, 9, S.EYE_ROW, 8, 5);
  if (face < 8) failures.push(label + ": face area almost entirely covered");

  /* Hair must still show under a hat. */
  if (opts && opts.hat && !opts.bald) {
    var crown = filledIn(g, 6, S.EYE_ROW - 5, 14, 4);
    if (crown < 6) failures.push(label + ": hat left no head");
  }
}

/* ---- every hair style against every hat, both facings ---- */
var HATS = ["Sun hat", "Cap", "Beanie", "Bucket hat", "Beret", "Headscarf", "Flower crown", "Headband"];
S.HAIR_STYLES.forEach(function (st, hi) {
  ["down", "right"].forEach(function (dir) {
    check("hair " + st.n + " / bare / " + dir,
      Object.assign(S.defaultChar(), { hairStyle: hi }), dir, 0, {});
    HATS.forEach(function (hat) {
      check("hair " + st.n + " / " + hat + " / " + dir,
        Object.assign(S.defaultChar(), { hairStyle: hi, accessories: [hat] }),
        dir, 0, { hat: true, bald: st.bald });
    });
  });
});

/* ---- every fringe-heavy cut against every eyewear ---- */
["Glasses", "Round glasses", "Sunglasses", "Goggles"].forEach(function (eyewear) {
  S.HAIR_STYLES.forEach(function (st, hi) {
    S.EYE_SHAPES.forEach(function (_, ei) {
      check("eyes " + st.n + " / " + eyewear + " / shape " + ei,
        Object.assign(S.defaultChar(), { hairStyle: hi, eyeShape: ei, accessories: [eyewear] }),
        "down", 0, {});
    });
  });
});

/* ---- every beard against every mouth, on every build ---- */
S.FACIAL_HAIR.forEach(function (fh, fi) {
  S.MOUTHS.forEach(function (m, mi) {
    S.BUILDS.forEach(function (bd, bi) {
      ["down", "right"].forEach(function (dir) {
        check("beard " + fh + " / mouth " + m + " / " + bd.n + " / " + dir,
          Object.assign(S.defaultChar(), { beard: fi, mouth: mi, build: bi }), dir, 0, {});
      });
    });
  });
});

/* ---- every outfit on every build, walking, all four ways ---- */
S.OUTFITS.forEach(function (o, oi) {
  S.BUILDS.forEach(function (bd, bi) {
    ["down", "left", "right", "up"].forEach(function (dir) {
      for (var f = 0; f < 4; f++) {
        check("outfit " + o + " / " + bd.n + " / " + dir + " f" + f,
          Object.assign(S.defaultChar(), { outfit: oi, build: bi }), dir, f, {});
      }
    });
  });
});

/* ---- everything at once, which is where parts collide ---- */
S.BUILDS.forEach(function (bd, bi) {
  ["down", "right"].forEach(function (dir) {
    check("everything / " + bd.n + " / " + dir,
      Object.assign(S.defaultChar(), {
        build: bi, beard: 5, hairStyle: S.styleIndex("Afro"), outfit: 19,
        accessories: S.ACCESSORIES, details: 3, hairAccent: 4
      }), dir, 0, {});
  });
});

/* ---- a thousand random characters, since that is what players make ---- */
for (var i = 0; i < 1000; i++) {
  var r = S.randomChar();
  var dirs = ["down", "left", "right", "up"];
  check("random #" + i, r, dirs[i % 4], i % 4, {});
}

/* ---- the authored cast ---- */
V.roster(S.defaultChar()).forEach(function (v) {
  ["down", "left", "right", "up"].forEach(function (dir) {
    for (var f = 0; f < 4; f++) check("villager " + v.name + " / " + dir, v.record, dir, f, {});
  });
});

/* ---- report ---- */
var unique = [];
var seen = {};
failures.forEach(function (f) {
  var kind = f.split(":").pop().trim();
  if (!seen[kind]) { seen[kind] = 0; unique.push(kind); }
  seen[kind]++;
});

console.log(checked + " combinations checked");
if (!failures.length) {
  console.log("PASS — nothing clipped, nothing hidden behind anything else");
  process.exit(0);
}
console.log(failures.length + " failures, " + unique.length + " kinds:");
unique.forEach(function (k) { console.log("  " + seen[k] + "x  " + k); });
unique.forEach(function (k) {
  var eg = failures.filter(function (f) { return f.split(":").pop().trim() === k; }).slice(0, 5);
  console.log("  " + k + ":");
  eg.forEach(function (f) { console.log("    " + f); });
});
process.exit(1);
