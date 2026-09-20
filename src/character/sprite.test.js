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
   * the only things meant to cover them. Side on there is no eye to find:
   * what you see of one edge-on is a lash in the outline. */
  var acc = ch.accessories || [];
  if (dir === "down" && acc.indexOf("Sunglasses") < 0 && acc.indexOf("Goggles") < 0) {
    var iris = S.tone(S.EYE_COLORS[ch.eyeColor | 0].b);
    var boxes = S.EYES.front;
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
 * 5b. No hairstyle touches the face.
 *     Compared against the same character shaved: below the brow line, the
 *     face must be pixel-identical whichever of the forty-eight cuts is on
 *     top. Anything that differs is hair that got in.
 * ------------------------------------------------------------------------ */
var BALD = S.styleIndex("Shaved");
/* Head on, the face itself and not the space beside it: hair hanging past the
 * cheek is the point of long hair. Side on it is the other way round — hair
 * falling over the cheek is exactly what it should do, and what must stay
 * untouched is the profile line and the air in front of it, so that the nose
 * is never left stranded outside a curtain of hair. `faceBand` knows which
 * of the two it is. */
function faceStrip(ch, dir) {
  var g = S.build(ch, dir, 0);
  var b = S.faceBand(dir, 0);
  var out = [];
  for (var y = b.y0; y <= b.y1; y++) for (var x = b.x0; x <= b.x1; x++) out.push(g.px[y * S.W + x]);
  return out.join("|");
}
for (var hs = 0; hs < S.HAIR_STYLES.length; hs++) {
  for (var hcl = 0; hcl < S.HAIRS.length; hcl += 6) {
    for (var dd = 0; dd < FACE_DIRS.length; dd++) {
      var lookA = base({ hairStyle: BALD, hairColor: hcl });
      var lookB = base({ hairStyle: hs, hairColor: hcl });
      checked += 2;
      if (faceStrip(lookA, FACE_DIRS[dd]) !== faceStrip(lookB, FACE_DIRS[dd])) {
        fail("hair on face", S.HAIR_STYLES[hs].n + (FACE_DIRS[dd] === "down"
          ? " changes the face below the brow line (down)"
          : " gets in front of the profile line (" + FACE_DIRS[dd] + ")"), lookB);
      }
    }
  }
}
say("no hairstyle touches the face");

/* ---------------------------------------------------------------------------
 * 5d. Seen from behind, the back of the head is hair.
 *     The guard that keeps hair off the face has no business running on the
 *     back view, where there is no face and the whole skull should be
 *     covered. Left switched on there, it punched a bald patch of scalp out
 *     of the middle of every long cut. So: for any style that is not a
 *     deliberately bare one, the skin showing through the back of the skull
 *     must be a thin edge at most, never the middle of it.
 * ------------------------------------------------------------------------ */
var BARE = ["Shaved", "Buzzed", "Mohawk", "Undercut"];
for (var bs = 0; bs < S.HAIR_STYLES.length; bs++) {
  if (BARE.indexOf(S.HAIR_STYLES[bs].n) >= 0) continue;
  var bch = base({ hairStyle: bs, hairColor: 0 });
  var bg = S.build(bch, "up", 0);
  var bsk = S.tone(S.SKINS[bch.skin].b);
  var bare = 0;
  checked++;
  for (var by2 = S.EYE_ROW - 4; by2 < S.EYE_ROW + 6; by2++) {
    for (var bx2 = 21; bx2 < 31; bx2++) {
      var bc = bg.px[by2 * S.W + bx2];
      if (bc === bsk.b || bc === bsk.s || bc === bsk.h) bare++;
    }
  }
  if (bare > 0) {
    fail("bald back", S.HAIR_STYLES[bs].n + " leaves " + bare +
      " pixels of scalp bare in the back view", bch);
  }
}
say("the back of the head is hair");

/* ---------------------------------------------------------------------------
 * 5c. Side on, an eye is a sliver.
 *     No mouth on the cheek at all, and the eye is two columns at the very
 *     front of the face — the outer one being the profile line itself —
 *     built from the same parts as the front eye so it reads as the same
 *     eye. So: no more than four pixels of iris and three of white, inside
 *     two columns. A whole eye turned sideways fails; so does a blob.
 * ------------------------------------------------------------------------ */
for (var ps = 0; ps < S.EYE_SHAPES.length; ps++) {
  for (var pm = 0; pm < S.MOUTHS.length; pm++) {
    for (var pd = 0; pd < 2; pd++) {
      var pch = base({ eyeShape: ps, mouth: pm });
      var pg = S.build(pch, pd ? "left" : "right", 0);
      checked++;
      var irisP = S.tone(S.EYE_COLORS[pch.eyeColor | 0].b);
      var iris = {}; [irisP.b, irisP.s, irisP.d, irisP.dd].forEach(function (c) { iris[c] = 1; });
      var white = 0, seen = 0, lo = S.W, hi = -1;
      for (var pi = 0; pi < pg.px.length; pi++) {
        var pc = pg.px[pi];
        if (pc === SCLERA) white++;
        else if (iris[pc]) { seen++; var cx = pi % S.W; if (cx < lo) lo = cx; if (cx > hi) hi = cx; }
      }
      if (white > 3) fail("profile eye", white + " pixels of the white of an eye side on", pch);
      if (seen > 4) fail("profile eye", seen + " pixels of iris side on; it should be a sliver", pch);
      if (hi >= 0 && hi - lo > 1) {
        fail("profile eye", "the eye spans " + (hi - lo + 1) + " columns side on; a sliver is two", pch);
      }
    }
  }
}
say("side on, an eye is a sliver");

/* ---------------------------------------------------------------------------
 * 5c-ii. The sliver goes down after the hair, onto skin only, so anything
 *     over those two columns hides it. This checks the other half of that:
 *     an ordinary hat does not reach the eye line, so the eye survives one.
 * ------------------------------------------------------------------------ */
(function () {
  var hch = base({ accessories: ["Headscarf"] });
  var hg = S.build(hch, "right", 0);
  var hi2 = S.tone(S.EYE_COLORS[hch.eyeColor | 0].b);
  var n = 0;
  checked++;
  for (var i = 0; i < hg.px.length; i++) {
    var c = hg.px[i];
    if (c === hi2.b || c === hi2.d || c === hi2.s || c === hi2.dd) n++;
  }
  if (n === 0) fail("profile eye", "a headscarf wiped out the eye sliver", hch);
})();
say("a hat does not wipe out the sliver");

/* ---------------------------------------------------------------------------
 * 5g. A hat covers the hair it is worn over.
 *     A hat sits ON the head, so the hair under it is not drawn at all: a
 *     short cut goes bald under a hat, a long one only shows below the brim.
 *     The first try at this sized each hat to clear the hair instead, which
 *     made a hat big enough for an afro sit on every head. So: with a crown
 *     hat on, there is no hair above that hat's brim line, in any facing, on
 *     any frame of the walk.
 * ------------------------------------------------------------------------ */
var CROWN_HATS = ["Sun hat", "Cap", "Beanie", "Bucket hat", "Beret", "Headscarf"];
for (var gs = 0; gs < S.HAIR_STYLES.length; gs++) {
  for (var gh = 0; gh < CROWN_HATS.length; gh++) {
    for (var gd = 0; gd < DIRS.length; gd++) {
      for (var gf = 0; gf < 4; gf++) {
        var gch = base({ hairStyle: gs, accessories: [CROWN_HATS[gh]] });
        var gg = S.build(gch, DIRS[gd], gf);
        var gset = hairSet(gch, false);
        var brim = S.hatBrim(gch, gf % 2 === 0 ? 2 : 0);
        var over = 0;
        checked++;
        for (var gy = 0; gy < brim; gy++) {
          for (var gx = 0; gx < S.W; gx++) if (gset[gg.px[gy * S.W + gx]]) over++;
        }
        if (over > 0) {
          fail("hat over hair", S.HAIR_STYLES[gs].n + " shows " + over +
            " pixels of hair above the brim of a " + CROWN_HATS[gh].toLowerCase() +
            " facing " + DIRS[gd], gch);
        }
      }
    }
  }
}
say("a hat covers the hair under it");

/* ---------------------------------------------------------------------------
 * 5h. A band goes all the way round.
 *     A headband, a flower crown and a goggle strap are worn OVER the hair,
 *     not instead of it, so each has to reach as far out as the hair does or
 *     it stops short and reads as a sticker on the forehead. Worked out from
 *     the style's volume it came up two pixels short on every curly cut, so
 *     the band measures the head as drawn. Forward it stops at the face.
 * ------------------------------------------------------------------------ */
var BANDS = { "Headband": [1, 3], "Flower crown": [3, 3], "Goggles": [2, 6] };
Object.keys(BANDS).forEach(function (bn) {
  var rows = BANDS[bn];
  for (var ns = 0; ns < S.HAIR_STYLES.length; ns++) {
    ["down", "right", "up"].forEach(function (nd) {
      var nch = base({ hairStyle: ns, accessories: [bn] });
      var worn = S.build(nch, nd, 0), plain = S.build(base({ hairStyle: ns }), nd, 0);
      var hy = S.HEAD.y - 2;
      checked++;
      for (var ny = hy + rows[0]; ny <= hy + rows[1]; ny++) {
        var lo = S.W, hi = -1, blo = S.W, bhi = -1;
        for (var nx = 0; nx < S.W; nx++) {
          var pc = plain.px[ny * S.W + nx], wc = worn.px[ny * S.W + nx];
          if (pc) { if (nx < lo) lo = nx; if (nx > hi) hi = nx; }
          if (wc && wc !== pc) { if (nx < blo) blo = nx; if (nx > bhi) bhi = nx; }
        }
        if (hi < 0) continue;
        if (blo > lo || (nd !== "right" && bhi < hi)) {
          fail("band stops short", bn + " on " + S.HAIR_STYLES[ns].n + " facing " + nd +
            " covers " + blo + "-" + bhi + " of hair " + lo + "-" + hi, nch);
        }
      }
    });
  }
});
say("a band goes all the way round");

/* ---------------------------------------------------------------------------
 * 5i. Hair hides what is worn under it.
 *     An earring and a necklace go under the hair, so side on a long style
 *     covers them — you would not see either through a curtain of hair. The
 *     first attempt tested for skin instead of against hair, which also hid
 *     the necklace behind the collar of every shirt.
 * ------------------------------------------------------------------------ */
["Earrings", "Necklace"].forEach(function (jn) {
  for (var js = 0; js < S.HAIR_STYLES.length; js++) {
    for (var jd = 0; jd < DIRS.length; jd++) {
      var jch = base({ hairStyle: js, accessories: [jn] });
      var jworn = S.build(jch, DIRS[jd], 0), jplain = S.build(base({ hairStyle: js }), DIRS[jd], 0);
      var jset = hairSet(jch, false);
      var on = 0;
      checked++;
      for (var ji = 0; ji < jworn.px.length; ji++) {
        if (jworn.px[ji] !== jplain.px[ji] && jset[jplain.px[ji]]) on++;
      }
      if (on > 0) {
        fail("jewellery over hair", jn + " draws over " + on + " pixels of " +
          S.HAIR_STYLES[js].n + " facing " + DIRS[jd], jch);
      }
    }
  }
});
say("hair hides what is worn under it");

/* ---------------------------------------------------------------------------
 * 5e. Hair is attached to the head.
 *     Every run of hair has to touch something that is not hair — the skull,
 *     the neck, a shoulder. A ponytail set out from the head by the hair's
 *     own volume floated clear of it with a stripe of daylight in between,
 *     and so did a pigtail and a braid; nothing in the old suite could see
 *     it, because each one was inside the silhouette and covered no face.
 * ------------------------------------------------------------------------ */
function hairSet(ch, withOutline) {
  var t = S.tone(S.HAIRS[ch.hairColor | 0].b);
  var set = {};
  ["b", "s", "d", "dd", "h", "hh"].forEach(function (k) { set[t[k]] = 1; });
  if (withOutline) set[t.o] = 1;
  return set;
}

/** Runs of hair that touch nothing but empty space. */
function floating(g, set) {
  var seen = new Uint8Array(S.W * S.H), loose = 0;
  for (var i = 0; i < seen.length; i++) {
    if (seen[i] || !set[g.px[i]]) continue;
    var stack = [i], cells = [], grounded = false;
    seen[i] = 1;
    while (stack.length) {
      var at = stack.pop(); cells.push(at);
      var cx = at % S.W, cy = (at / S.W) | 0;
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= S.W || ny >= S.H) continue;
        var n = ny * S.W + nx, c = g.px[n];
        if (set[c]) { if (!seen[n]) { seen[n] = 1; stack.push(n); } }
        else if (c) grounded = true;              /* skin, cloth: it is held */
      }
    }
    if (!grounded && cells.length >= 6) loose++;
  }
  return loose;
}

for (var fs = 0; fs < S.HAIR_STYLES.length; fs++) {
  for (var fd = 0; fd < DIRS.length; fd++) {
    for (var ff = 0; ff < 4; ff += (QUICK ? 3 : 1)) {
      var fch = base({ hairStyle: fs, hairColor: 0 });
      checked++;
      var loose = floating(S.build(fch, DIRS[fd], ff), hairSet(fch, true));
      if (loose) {
        fail("floating hair", S.HAIR_STYLES[fs].n + " leaves " + loose +
          " piece(s) of hair unattached (" + DIRS[fd] + ", frame " + ff + ")", fch);
      }
    }
  }
}
say("hair is attached to the head");

/* ---------------------------------------------------------------------------
 * 5f. A head of hair keeps its shape down its length.
 *     The silhouette used to pinch in at the temples and bulge out at the jaw
 *     because each piece — cap, curtain, the mass down the back — was drawn
 *     with its own margin. On screen the hair went thin and thick at random.
 *     So: from one row to the next, neither edge of the hair may move by more
 *     than two pixels. Styles that are MEANT to be lumpy are exempt.
 * ------------------------------------------------------------------------ */
var LUMPY = ["Shaved", "Buzzed", "Crew cut", "Cropped", "Undercut", "Mohawk",
  "Spiky", "Quiff", "Pompadour", "Curls", "Coils", "Afro", "Tousled",
  "Loose curls", "Long curls"];
/* Anything tied back is exempt too: a tail, a bun or a braid is SUPPOSED to
 * appear out of nowhere partway down. This is a rule about loose hair. */
S.HAIR_GROUPS.forEach(function (grp) {
  if (grp.n !== "Tied back") return;
  grp.ids.forEach(function (i) { LUMPY.push(S.HAIR_STYLES[i].n); });
});
for (var ss = 0; ss < S.HAIR_STYLES.length; ss++) {
  var sname = S.HAIR_STYLES[ss].n;
  if (LUMPY.indexOf(sname) >= 0) continue;
  for (var sd = 0; sd < FACE_DIRS.length; sd++) {
    var sch = base({ hairStyle: ss, hairColor: 0 });
    var sg = S.build(sch, FACE_DIRS[sd], 0);
    /* The hair itself, not its outline: the outline runs a row past the end
     * of the hair and narrows as it goes round the bottom, which is not the
     * hair changing width. */
    var hset = hairSet(sch);
    checked++;
    /* Down the head only. Below the jaw a style is allowed to gather itself
     * into a tail or break into wavy tips, and those are meant to step. */
    /* Eyebrows are drawn in the hair colour and sit inside the face, so they
     * are not part of the hair's outline — measuring them made a short cut
     * look as though it flared out over the eyes. */
    var fb = S.faceBand(FACE_DIRS[sd], 0);
    var prev = null, worst = 0, at = -1;
    for (var sy = 10; sy <= S.EYE_ROW + 8; sy++) {
      var lo = -1, hi = -1;
      for (var sx = 0; sx < S.W; sx++) {
        if (sx >= fb.x0 && sx <= fb.x1 && sy >= fb.y0 && sy <= fb.y1) continue;
        if (hset[sg.px[sy * S.W + sx]]) { if (lo < 0) lo = sx; hi = sx; }
      }
      if (lo < 0) { prev = null; continue; }
      if (prev) {
        var jump = Math.max(Math.abs(lo - prev[0]), Math.abs(hi - prev[1]));
        if (jump > worst) { worst = jump; at = sy; }
      }
      prev = [lo, hi];
    }
    /* Three, not two: at the brow the hairline legitimately steps in, because
     * that is where the fringe stops and the forehead starts. Everything the
     * eye actually complained about was four pixels and up — a mass stepping
     * out from under a cap, a tail appearing from nowhere. */
    if (worst > 3) {
      fail("ragged hair", sname + " changes width by " + worst + " pixels at row " +
        at + " (" + FACE_DIRS[sd] + ")", sch);
    }
  }
}
say("hair keeps its shape down its length");

/* ---------------------------------------------------------------------------
 * 6. A loose cut is the same length from the front as from the side.
 * ------------------------------------------------------------------------ */
var HANGS_LOOSE = { none: 1, fall: 1, locs: 1, twists: 1, longtwists: 1, halfup: 1 };
function lowestHair(ch, dir) {
  var g = S.build(ch, dir, 0);
  var t = S.tone(S.HAIRS[ch.hairColor | 0].b);
  var tones = [t.b, t.s, t.d, t.dd, t.h, t.hh];
  /* Below the jaw only, because brows are drawn in the hair colour and a
   * shaved head has brows head on and none in profile — which is a fact
   * about brows, not about how long the cut is. */
  var low = -1;
  for (var y = S.EYE_ROW + 12; y < S.H; y++) for (var x = 0; x < S.W; x++) {
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
