/*
 * The cast, checked as data.
 *
 * The sprite suite already draws all twenty-four in four facings and four
 * frames, so what is NOT covered there is everything about the twenty-four
 * that never reaches a pixel: whether they index the tables they claim to,
 * whether they are twenty-four different people or four people wearing
 * twenty-four hats, and whether the spread the file promises in its own
 * comment is actually there.
 *
 * That last one is the point. Hand-authoring twenty-four of anything drifts
 * towards whatever sits near the front of each list, and it drifts quietly:
 * the first cast had one build and one nose across the whole island and
 * nobody noticed until they stood in a row. A comment claiming a spread is
 * a wish. This is the spread.
 *
 * Run: node src/character/villagers.test.js
 */
"use strict";
global.window = {};
require("./sprite.js");
require("./villagers.js");
var S = global.window.CozySprite;
var V = global.window.CozyVillagers;

var checked = 0, failures = [];
function fail(what, why) { failures.push({ what: what, why: why }); }
function say(label) {
  process.stdout.write("  " + label.padEnd(46) + checked.toLocaleString().padStart(9) + "\n");
}

console.log("The island's neighbours");

/* ---------------------------------------------------------------------------
 * 1. Every number points at something that exists.
 * ------------------------------------------------------------------------ */
var RANGE = {
  gender: S.GENDERS.length, build: S.BUILDS.length, nose: S.NOSES.length,
  mouth: S.MOUTHS.length, skin: S.SKINS.length, hairColor: S.HAIRS.length,
  eyeShape: S.EYE_SHAPES.length, eyeColor: S.EYE_COLORS.length,
  eyebrows: S.EYEBROWS.length, hairAccent: S.HAIR_ACCENT.length,
  hairAccentColor: S.HAIRS.length, details: S.DETAILS.length,
  beard: S.FACIAL_HAIR.length, outfit: S.OUTFITS.length,
  topColor: S.CLOTH.length, bottomColor: S.CLOTH.length,
  shoeColor: S.CLOTH.length, accColor: S.CLOTH.length
};
/* The fields a look must state for itself. What a partial record leaves out,
 * the defaults fill in IDENTICALLY for everybody — which is how the first
 * cast ended up with one frame and one nose on the whole island. */
var MUST = ["gender", "build", "nose", "mouth", "skin", "hairStyle", "hairColor",
  "eyeShape", "eyeColor", "eyebrows", "details", "beard", "outfit",
  "topColor", "bottomColor", "shoeColor", "accColor", "accessories", "voice"];

var HEAD = ["Sun hat", "Cap", "Beanie", "Headscarf", "Headband", "Flower crown"];
var FACE = ["Glasses", "Round glasses", "Sunglasses", "Goggles"];
var HAUNTS = ["sand", "grass", "path"];

V.list.forEach(function (v) {
  var L = v.look;
  MUST.forEach(function (k) {
    checked++;
    if (!(k in L)) fail("look", v.name + " never says " + k + ", so the default decides it");
  });
  Object.keys(L).forEach(function (k) {
    checked++;
    if (k in RANGE) {
      if (typeof L[k] !== "number" || L[k] < 0 || L[k] >= RANGE[k]) {
        fail("look", v.name + "." + k + " = " + L[k] + ", outside 0.." + (RANGE[k] - 1));
      }
    } else if (k === "hairStyle") {
      if (S.HAIR_STYLES[S.styleIndex(L[k])].n !== L[k]) {
        fail("look", v.name + " wants a haircut called '" + L[k] + "', which does not exist");
      }
    } else if (k === "accessories") {
      L[k].forEach(function (a) {
        if (S.ACCESSORIES.indexOf(a) < 0) fail("look", v.name + " wears '" + a + "', which is not a thing");
      });
      if (L[k].filter(function (a) { return HEAD.indexOf(a) >= 0; }).length > 1) {
        fail("look", v.name + " is wearing two things on one head");
      }
      if (L[k].filter(function (a) { return FACE.indexOf(a) >= 0; }).length > 1) {
        fail("look", v.name + " is wearing two things on one nose");
      }
    } else if (k === "voice") {
      if (L[k] < 0 || L[k] > 10) fail("look", v.name + ".voice = " + L[k] + ", outside 0..10");
    } else {
      fail("look", v.name + " has a field nobody reads: " + k);
    }
  });
  checked++;
  if (L.hairAccent && L.hairAccentColor === undefined) {
    fail("look", v.name + " has a hair accent with no colour to put in it");
  }
});
say("every number points at something that exists");

/* ---------------------------------------------------------------------------
 * 2. Twenty-four people, not four people repeated.
 * ------------------------------------------------------------------------ */
(function () {
  var faces = {}, names = {};
  V.list.forEach(function (v) {
    var L = v.look;
    checked++;
    if (names[v.name]) fail("cast", "two neighbours called " + v.name);
    names[v.name] = true;
    var f = [L.skin, L.hairStyle, L.hairColor, L.eyeShape, L.eyeColor, L.nose, L.mouth].join("/");
    checked++;
    if (faces[f]) fail("cast", v.name + " has " + faces[f] + "'s face");
    faces[f] = v.name;
  });
  checked++;
  if (V.list.length !== 24) fail("cast", "the island has " + V.list.length + " neighbours, not 24");
})();
say("nobody wears anybody else's face");

/* ---------------------------------------------------------------------------
 * 3. The spread the file promises.
 * ------------------------------------------------------------------------ */
(function () {
  var build = {}, skin = {}, cut = {}, month = {};
  V.list.forEach(function (v) {
    build[v.look.build] = (build[v.look.build] || 0) + 1;
    skin[v.look.skin] = (skin[v.look.skin] || 0) + 1;
    cut[v.look.hairStyle] = (cut[v.look.hairStyle] || 0) + 1;
    month[v.birthMonth] = (month[v.birthMonth] || 0) + 1;
  });
  /* Even across the three builds, or the island has a shape it did not
   * choose. */
  S.BUILDS.forEach(function (b, i) {
    checked++;
    if ((build[i] || 0) !== 8) {
      fail("spread", "there are " + (build[i] || 0) + " " + b.n + " neighbours, not 8");
    }
  });
  checked++;
  if (Object.keys(skin).length < 18) {
    fail("spread", "only " + Object.keys(skin).length + " skin tones are used, of " + S.SKINS.length);
  }
  Object.keys(skin).forEach(function (k) {
    checked++;
    if (skin[k] > 2) fail("spread", S.SKINS[k].n + " skin is used " + skin[k] + " times");
  });
  checked++;
  if (Object.keys(cut).length < 18) {
    fail("spread", "only " + Object.keys(cut).length + " haircuts are used");
  }
  Object.keys(cut).forEach(function (k) {
    checked++;
    if (cut[k] > 3) fail("spread", "the " + k + " is used " + cut[k] + " times");
  });
  /* Two birthdays a month, so there is always one coming. */
  for (var m = 1; m <= 12; m++) {
    checked++;
    if ((month[m] || 0) !== 2) {
      fail("spread", "month " + m + " has " + (month[m] || 0) + " birthdays, not 2");
    }
  }
})();
say("the spread the file promises is there");

/* ---------------------------------------------------------------------------
 * 4. Every birthday is a day that exists.
 * ------------------------------------------------------------------------ */
V.list.forEach(function (v) {
  checked++;
  if (v.birthDay < 1 || v.birthDay > S.daysIn(v.birthMonth)) {
    fail("born", v.name + " is born on " + v.birthMonth + "/" + v.birthDay +
      ", a day that month does not have");
  }
});
say("every birthday is a day that exists");

/* ---------------------------------------------------------------------------
 * 5. A role means you can buy something.
 *     Everyone used to have a job title, and a title is a door you expect to
 *     open. This is the rule that keeps it from creeping back: if somebody
 *     has a shop they sell something, and if they do not, they are simply a
 *     neighbour with no title at all.
 * ------------------------------------------------------------------------ */
(function () {
  var shops = 0, names = {};
  V.list.forEach(function (v) {
    checked++;
    if (HAUNTS.indexOf(v.haunt) < 0) {
      fail("role", v.name + " haunts '" + v.haunt + "', which is not ground the island has");
    }
    checked++;
    if (v.shop) {
      shops++;
      if (!v.sells) fail("role", v.name + " keeps " + v.shop + " but sells nothing");
      if (names[v.shop]) fail("role", "two shops called " + v.shop);
      names[v.shop] = true;
    } else if (v.sells) {
      fail("role", v.name + " sells something with no shop to sell it from");
    }
    /* Whatever they say, they have to be able to say it: the island's
     * typeface is a hand-drawn one and a line written with a curly quote
     * would come out as a row of empty boxes. */
    checked++;
    if (!v.line || v.line.length < 12) fail("role", v.name + " has nothing to say");
    checked++;
    if (!v.personality) fail("role", v.name + " has no personality");
  });
  checked++;
  if (shops !== 6) fail("role", "there are " + shops + " shops on the island, not 6");
  checked++;
  if (V.list.length - shops !== 18) fail("role", "the neighbour count is wrong");
})();
say("a role means you can buy something");

/* ---------------------------------------------------------------------------
 * 6. Everybody can actually be said out loud.
 *     The island's typeface has 75 glyphs. Anything outside them draws as an
 *     empty box, which is a silly way to lose a joke.
 * ------------------------------------------------------------------------ */
(function () {
  var T = null;
  try { require("../ui/type.js"); T = global.window.CozyType; } catch (e) { /* not here */ }
  if (!T) { say("(no typeface to check against)"); return; }
  V.list.forEach(function (v) {
    [["line", v.line], ["name", v.name], ["shop", v.shop], ["sells", v.sells]]
      .forEach(function (pair) {
        if (!pair[1]) return;
        checked++;
        /* Asked of the typeface itself, and asked AFTER it has done what it
         * can: an em-dash is fine to write, because the typeface turns it
         * into a hyphen. What this catches is a character it has no answer
         * for at all. */
        var lost = T.unsayable(pair[1]);
        if (lost.length) {
          fail("speech", v.name + "'s " + pair[0] + " uses " +
            lost.map(function (c) {
              return "'" + c + "' (U+" + c.charCodeAt(0).toString(16).toUpperCase() + ")";
            }).join(", ") + ", which the island's typeface cannot draw");
        }
      });
  });
})();
say("everybody can be said out loud");

/* ---------------------------------------------------------------------------
 * 7. The roster hands over records that are ready to draw.
 * ------------------------------------------------------------------------ */
V.roster(S.defaultChar(0)).forEach(function (v) {
  checked++;
  if (typeof v.record.hairStyle !== "number") {
    fail("roster", v.name + " comes out of the roster with a haircut still named");
  }
  checked++;
  if (v.record.name !== v.name) fail("roster", v.name + " comes out under another name");
  checked++;
  if (!Array.isArray(v.record.accessories)) fail("roster", v.name + " has no accessory list");
});
say("the roster hands over records ready to draw");

/* --------------------------------------------------------------- report --- */
console.log("");
if (!failures.length) {
  console.log(checked.toLocaleString() + " checks");
  console.log("PASS — twenty-four people, six shops, and nothing pointing at a table that has no such row");
} else {
  var kinds = {};
  failures.forEach(function (f) { (kinds[f.what] = kinds[f.what] || []).push(f); });
  console.log("FAIL — " + failures.length + " problems");
  Object.keys(kinds).forEach(function (k) {
    kinds[k].slice(0, 8).forEach(function (f) { console.log("  " + k + ": " + f.why); });
    if (kinds[k].length > 8) console.log("  " + k + ": ...and " + (kinds[k].length - 8) + " more");
  });
  process.exit(1);
}
