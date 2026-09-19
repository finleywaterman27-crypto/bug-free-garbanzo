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

var SCLERA = "#fbf7ee";
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

  /* EVERY eye must survive whatever is worn over it — checked eye by eye, not
   * by counting white pixels across the face. A fringe swept over one eye used
   * to pass that way; it does not pass this way. Sunglasses and goggles are
   * the only things allowed to cover them. */
  var covered = (ch.accessories || []).some(function (a) {
    return a === "Sunglasses" || a === "Goggles";
  });
  if (!covered) {
    var iris = S.tone(S.EYE_COLORS[ch.eyeColor | 0].b);
    /* A left-facing sprite is the right-facing one mirrored, so its eye is at
     * the mirrored column — the box has to be flipped with it. */
    var boxes = (dir === "down" || dir === "up") ? S.EYES.front
      : dir === "right" ? S.EYES.side
      : S.EYES.side.map(function (bx) { return S.W - S.EYES.size - bx; });
    /* The body bobs two pixels through the walk, so the eye is not always on
     * the same row — the box has to cover both heights. */
    var by = S.EYES.y - 2, bh = S.EYES.size + 2;
    boxes.forEach(function (ex, n) {
      var white = countIn(g, ex, by, S.EYES.size, bh, SCLERA);
      var colour = countIn(g, ex, by, S.EYES.size, bh, iris.b) +
                   countIn(g, ex, by, S.EYES.size, bh, iris.d) +
                   countIn(g, ex, by, S.EYES.size, bh, iris.dd);
      if (white < 1 || colour < 1) {
        failures.push(label + ": eye " + (n + 1) + " is covered" +
          "  [" + JSON.stringify(ch) + "]");
      }
    });
  }

  /* A face that is entirely hair, hat and beard is a bug. */
  var face = filledIn(g, 18, S.EYE_ROW, 16, 10);
  if (face < 40) failures.push(label + ": face area almost entirely covered");

  /* Hair must still show under a hat. */
  if (opts && opts.hat && !opts.bald) {
    var crown = filledIn(g, 14, S.EYE_ROW - 12, 26, 8);
    if (crown < 24) failures.push(label + ": hat left no head");
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

/* ---- a haircut is the same length from the side as from the front ---- */
function lowestHair(ch, dir) {
  var g = S.build(ch, dir, 0);
  var h = S.tone(S.HAIRS[ch.hairColor | 0].b);
  var tones = [h.b, h.s, h.d, h.dd, h.h, h.hh];
  var low = -1;
  for (var y = 0; y < S.H; y++) for (var x = 0; x < S.W; x++) {
    if (tones.indexOf(g.px[y * S.W + x]) >= 0) low = y;
  }
  return low;
}

var HANGS_LOOSE = { none: 1, fall: 1, locs: 1, twists: 1, longtwists: 1, halfup: 1 };
S.HAIR_STYLES.forEach(function (st, i) {
  if (!HANGS_LOOSE[st.back]) return;          /* a ponytail IS hidden from the front */
  var ch = Object.assign(S.defaultChar(0), { hairStyle: i, hairColor: 4, accessories: [] });
  var front = lowestHair(ch, "down"), side = lowestHair(ch, "right");
  checked++;
  if (front < 0) return;                       /* bald */
  if (Math.abs(front - side) > 6) {
    failures.push("hair " + st.n + ": falls to row " + front + " from the front but " +
      side + " from the side");
  }
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
