/*
 * Combination tests for the character renderer.
 *
 * The whole space is about 7x10^20 characters — at a sixth of a millisecond
 * each that is four billion years, so "every character" is not a thing anyone
 * can run. What IS runnable, and what actually catches bugs, is every
 * combination of the parts that can land on top of each other.
 *
 * Parts that never share a pixel cannot hide each other, so they are swept
 * exhaustively against the things they DO touch rather than against
 * everything. The upper face — hair, brows, eyes, hats, glasses — is one
 * region and gets a complete cross product. The lower face — nose, mouth,
 * beard, markings — is another. The body is a third.
 *
 * Run: node src/character/sprite.test.js          (exhaustive, a few minutes)
 *      node src/character/sprite.test.js --quick  (a fast subset)
 */
"use strict";
global.window = {};
require("./sprite.js");
require("./villagers.js");
var S = global.window.CozySprite;
var V = global.window.CozyVillagers;

var QUICK = process.argv.indexOf("--quick") >= 0;
var SCLERA = "#fbf7ee";
var failures = [];
var checked = 0;
var started = Date.now();

var HEADWEAR = ["Sun hat", "Cap", "Beanie", "Bucket hat", "Beret", "Headscarf",
  "Flower crown", "Headband", "Glasses", "Round glasses", "Sunglasses", "Goggles"];
var BODYWEAR = ["Scarf", "Neckerchief", "Necklace", "Earrings", "Satchel", "Tool belt"];
var DIRS = ["down", "left", "right", "up"];
var FACE_DIRS = ["down", "left", "right"];

function px(g, x, y) { return g.px[y * S.W + x]; }

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

/** Nothing may touch the edge of the grid, or it is being clipped. */
function clipped(g) {
  for (var x = 0; x < S.W; x++) if (px(g, x, 0) || px(g, x, S.H - 1)) return true;
  for (var y = 0; y < S.H; y++) if (px(g, 0, y) || px(g, S.W - 1, y)) return true;
  return false;
}

function fail(label, why, ch) {
  if (failures.length < 400) failures.push({ why: why, label: label, ch: JSON.stringify(ch) });
}

function check(label, ch, dir, frame) {
  checked++;
  var g = S.build(ch, dir, frame);
  if (clipped(g)) return fail(label, "clipped by the edge of the grid", ch);
  if (dir === "up") return;

  /* EVERY eye must survive whatever is worn over it — checked eye by eye, so
   * a fringe swept over one of them cannot pass. Sunglasses and goggles are
   * the only things meant to cover them. */
  var acc = ch.accessories || [];
  if (acc.indexOf("Sunglasses") < 0 && acc.indexOf("Goggles") < 0) {
    var iris = S.tone(S.EYE_COLORS[ch.eyeColor | 0].b);
    var boxes = (dir === "down") ? S.EYES.front
      : dir === "right" ? S.EYES.side
      : S.EYES.side.map(function (bx) { return S.W - S.EYES.size - bx; });
    /* the body bobs two pixels through the walk, so the box covers both */
    var by = S.EYES.y - 2, bh = S.EYES.size + 2;
    for (var n = 0; n < boxes.length; n++) {
      var bx = boxes[n];
      var white = countIn(g, bx, by, S.EYES.size, bh, SCLERA);
      var colour = countIn(g, bx, by, S.EYES.size, bh, iris.b) +
                   countIn(g, bx, by, S.EYES.size, bh, iris.d) +
                   countIn(g, bx, by, S.EYES.size, bh, iris.dd);
      if (white < 1 || colour < 1) return fail(label, "eye " + (n + 1) + " is covered", ch);
    }
  }

  /* A face that is entirely hair, hat and beard is a bug. */
  if (filledIn(g, 18, S.EYE_ROW, 16, 10) < 40) return fail(label, "face almost entirely covered", ch);
}

function base(over) { return Object.assign(S.defaultChar(0), over); }

function say(what) {
  process.stdout.write("  " + what.padEnd(44) +
    checked.toLocaleString().padStart(12) + "   " +
    ((Date.now() - started) / 1000).toFixed(0) + "s\n");
}

console.log("Exhaustive combination test");
console.log("  " + "region".padEnd(44) + "combinations checked".padStart(12) + "   elapsed");

/* ---------------------------------------------------------------------------
 * 1. The upper face, complete.
 *    Every hair style x every brow x every eye shape x every beard x every
 *    hat, pair of glasses or bare head x every facing. These all draw within
 *    a dozen rows of each other, so every pair of them can collide.
 * ------------------------------------------------------------------------ */
var hairs = S.HAIR_STYLES.length, brows = S.EYEBROWS.length, eyes = S.EYE_SHAPES.length;
var beards = S.FACIAL_HAIR.length;
var hats = [null].concat(HEADWEAR);
if (QUICK) { hats = [null, "Cap", "Glasses"]; }

for (var h = 0; h < hairs; h++) {
  for (var b = 0; b < brows; b++) {
    for (var e = 0; e < eyes; e++) {
      for (var f = 0; f < beards; f++) {
        for (var w = 0; w < hats.length; w++) {
          var ch = base({ hairStyle: h, eyebrows: b, eyeShape: e, beard: f,
            accessories: hats[w] ? [hats[w]] : [] });
          for (var d = 0; d < FACE_DIRS.length; d++) check("upper face", ch, FACE_DIRS[d], 0);
        }
      }
    }
  }
  if (QUICK && h > 6) break;
}
say("upper face: hair x brow x eye x beard x hat");

/* ---------------------------------------------------------------------------
 * 2. The lower face, complete, on every skin tone.
 *    Nose, mouth, beard and markings all share the bottom third of the head,
 *    and skin tone decides the contrast every one of them is drawn with.
 * ------------------------------------------------------------------------ */
for (var sk = 0; sk < S.SKINS.length; sk++) {
  for (var no = 0; no < S.NOSES.length; no++) {
    for (var mo = 0; mo < S.MOUTHS.length; mo++) {
      for (var fh = 0; fh < S.FACIAL_HAIR.length; fh++) {
        for (var dt = 0; dt < S.DETAILS.length; dt++) {
          var ch2 = base({ skin: sk, nose: no, mouth: mo, beard: fh, details: dt });
          for (var d2 = 0; d2 < FACE_DIRS.length; d2++) check("lower face", ch2, FACE_DIRS[d2], 0);
        }
      }
    }
  }
  if (QUICK && sk > 2) break;
}
say("lower face: skin x nose x mouth x beard x marks");

/* ---------------------------------------------------------------------------
 * 3. Every colour against every other colour it shares a silhouette with.
 *    Colour decides whether a tone gets a dark outline or a rim light, so a
 *    dark hair on dark skin is a different drawing from a light one.
 * ------------------------------------------------------------------------ */
for (var s3 = 0; s3 < S.SKINS.length; s3++) {
  for (var hc = 0; hc < S.HAIRS.length; hc++) {
    for (var ec = 0; ec < S.EYE_COLORS.length; ec++) {
      for (var dy = 0; dy < S.HAIR_ACCENT.length; dy++) {
        check("colour", base({ skin: s3, hairColor: hc, eyeColor: ec, hairAccent: dy,
          hairAccentColor: (hc + 7) % S.HAIRS.length }), "down", 0);
      }
    }
  }
  if (QUICK && s3 > 2) break;
}
say("colour: skin x hair x eye x dye");

/* ---------------------------------------------------------------------------
 * 4. Every outfit, on every build, in every colour, walking every way.
 * ------------------------------------------------------------------------ */
for (var o = 0; o < S.OUTFITS.length; o++) {
  for (var bd = 0; bd < S.BUILDS.length; bd++) {
    for (var cl = 0; cl < S.CLOTH.length; cl++) {
      var ch4 = base({ outfit: o, build: bd, topColor: cl,
        bottomColor: (cl + 11) % S.CLOTH.length, shoeColor: (cl + 19) % S.CLOTH.length,
        accColor: (cl + 5) % S.CLOTH.length });
      for (var d4 = 0; d4 < DIRS.length; d4++) {
        for (var fr = 0; fr < 4; fr++) check("outfit", ch4, DIRS[d4], fr);
      }
    }
    if (QUICK) break;
  }
}
say("outfit x build x colour x facing x frame");

/* ---------------------------------------------------------------------------
 * 5. Every accessory against every other accessory, and against every outfit.
 * ------------------------------------------------------------------------ */
var A = S.ACCESSORIES;
for (var i5 = 0; i5 < A.length; i5++) {
  for (var j5 = i5; j5 < A.length; j5++) {
    var pair = i5 === j5 ? [A[i5]] : [A[i5], A[j5]];
    for (var d5 = 0; d5 < DIRS.length; d5++) check("accessory pair", base({ accessories: pair }), DIRS[d5], 0);
  }
  for (var o5 = 0; o5 < S.OUTFITS.length; o5++) {
    check("accessory x outfit", base({ accessories: [A[i5]], outfit: o5 }), "down", 0);
  }
}
/* and all eighteen at once, on every cut */
for (var h5 = 0; h5 < S.HAIR_STYLES.length; h5++) {
  for (var d6 = 0; d6 < DIRS.length; d6++) {
    check("everything at once", base({ hairStyle: h5, accessories: A.slice(), beard: 5, details: 3 }), DIRS[d6], 0);
  }
}
say("accessory pairs, outfits, and all at once");

/* ---------------------------------------------------------------------------
 * 6. A loose cut is the same length from the front as from the side.
 * ------------------------------------------------------------------------ */
var HANGS_LOOSE = { none: 1, fall: 1, locs: 1, twists: 1, longtwists: 1, halfup: 1 };
function lowestHair(ch, dir) {
  var g = S.build(ch, dir, 0);
  var t = S.tone(S.HAIRS[ch.hairColor | 0].b);
  var tones = [t.b, t.s, t.d, t.dd, t.h, t.hh];
  var low = -1;
  for (var y = 0; y < S.H; y++) for (var x = 0; x < S.W; x++) {
    if (tones.indexOf(g.px[y * S.W + x]) >= 0) low = y;
  }
  return low;
}
S.HAIR_STYLES.forEach(function (st, i) {
  if (!HANGS_LOOSE[st.back]) return;
  for (var hc2 = 0; hc2 < S.HAIRS.length; hc2 += 4) {
    var ch6 = base({ hairStyle: i, hairColor: hc2, accessories: [] });
    checked += 2;
    var front = lowestHair(ch6, "down"), sideL = lowestHair(ch6, "right");
    if (front < 0) continue;
    if (Math.abs(front - sideL) > 6) {
      fail("hair length", st.n + " falls to row " + front + " from the front but " + sideL + " from the side", ch6);
    }
  }
});
say("hair length, front against side");

/* ---------------------------------------------------------------------------
 * 7. Both starting characters, the authored cast, and inherited children.
 * ------------------------------------------------------------------------ */
[0, 1].forEach(function (gdr) {
  for (var d7 = 0; d7 < DIRS.length; d7++) {
    for (var f7 = 0; f7 < 4; f7++) check("default " + gdr, S.defaultChar(gdr), DIRS[d7], f7);
  }
});
V.roster(S.defaultChar(0)).forEach(function (v) {
  for (var d8 = 0; d8 < DIRS.length; d8++) {
    for (var f8 = 0; f8 < 4; f8++) check("villager " + v.name, v.record, DIRS[d8], f8);
  }
});
for (var k = 0; k < (QUICK ? 200 : 4000); k++) {
  var kid = S.inherit(S.randomChar(), S.randomChar());
  check("child", kid, DIRS[k % 4], k % 4);
}
say("defaults, the cast, and 4000 children");

/* ---------------------------------------------------------------------------
 * report
 * ------------------------------------------------------------------------ */
var kinds = {};
failures.forEach(function (f) { (kinds[f.why] = kinds[f.why] || []).push(f); });
var names = Object.keys(kinds);

console.log("");
console.log(checked.toLocaleString() + " combinations checked in " +
  ((Date.now() - started) / 1000).toFixed(0) + "s");
if (!failures.length) {
  console.log("PASS — nothing clipped, no eye covered, no face swallowed, " +
    "and every loose cut the same length either way round");
  process.exit(0);
}
console.log(failures.length + " failures, " + names.length + " kinds:");
names.forEach(function (n) {
  console.log("  " + kinds[n].length + "x  " + n);
  kinds[n].slice(0, 3).forEach(function (f) { console.log("      " + f.label + "  " + f.ch); });
});
process.exit(1);
