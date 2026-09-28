/*
 * Cozy game — the island's neighbours.
 *
 * Twenty-four people, hand-authored. Nothing here is randomised: each one is
 * a deliberate face, a fixed personality, and a line only they would say.
 * Per the brief they never move away, and everyone already likes you —
 * friendship is something you maintain, not a meter you fill to unlock basic
 * courtesy.
 *
 * NOBODY HAS A JOB TITLE EXCEPT THE SIX WHO KEEP A SHOP.
 *
 * The first cast gave all twenty-four one — postmistress, doctor, archivist,
 * lighthouse keeper — and it read as a staff list rather than as a place
 * people live. It also promised what the game has no intention of building:
 * a title is a door you expect to be able to open. A role here means one
 * thing, which is that you can buy something from them, so there are six
 * roles and eighteen neighbours. The eighteen lose nothing they were using:
 * Ambrose still talks about his bees and Hana still throws her pots in the
 * harbour, because that was always the personality doing the work and never
 * the title over it.
 *
 * `about` is what they do and where they are:
 *   haunt   the ground they are usually standing on — sand, grass or path
 *   shop    the name over the door, for the six who have one
 *   sells   what is inside it
 *
 * `look` is a partial character record; the rest comes from defaultChar().
 * Each one states its whole face and its whole frame, because what a partial
 * record leaves out the defaults fill in identically for everybody: the
 * first cast never set gender, build, nose, mouth or eyebrows, and so had
 * one slight frame and one button nose on the whole island.
 *
 * What a look is trying to carry, in rough order of how far off you read it:
 *   build + outfit   the silhouette from across the square
 *   hair             colour does the age: snow and ash for the old ones,
 *                    copper and black for the young
 *   face             nose, mouth, brows and eyes, which is where the
 *                    personality actually lives at this size
 *   accessory        one thing they always have on them
 *
 * Hair is named rather than numbered, so the style table can be reordered or
 * added to without silently giving someone a different haircut.
 *
 * The cast is spread on purpose: eight slight, eight average, eight broad;
 * eighteen of the twenty-two skin tones, none more than twice; two birthdays
 * in every month, so there is always one coming.
 */
(function (root) {
  "use strict";

  function V(name, about, personality, line, birth, look) {
    return {
      name: name, haunt: about.haunt,
      shop: about.shop || null, sells: about.sells || null,
      personality: personality, line: line,
      birthMonth: birth[0], birthDay: birth[1], look: look
    };
  }

  var VILLAGERS = [

    /* ---------------------------------------------------------- the old --- */

    V("Marlow", { haunt: "sand", shop: "The Tackle Hut",
        sells: "Rods, nets, line, and bait he will not give you the recipe for" },
      "Weathered, unhurried, secretly sentimental",
      "Tide's wrong for the good ones. Sit a while, they'll come round.",
      [2, 19],
      { gender: 1, build: 2, nose: 7, mouth: 0,
        skin: 18, hairStyle: "Cropped", hairColor: 14,
        eyeShape: 3, eyeColor: 5, eyebrows: 7, details: 6, beard: 5,
        outfit: 3, topColor: 16, bottomColor: 28, shoeColor: 19, accColor: 6,
        accessories: ["Beanie"], voice: 1 }),

    V("Teodor", { haunt: "path" },
      "Delighted by everything, terrible at small talk",
      "Do you know what this is? Neither did I, for eleven years. Marvellous, isn't it.",
      [4, 8],
      { gender: 1, build: 0, nose: 11, mouth: 5,
        skin: 3, hairStyle: "Tousled", hairColor: 15,
        eyeShape: 4, eyeColor: 2, eyebrows: 7, details: 0, beard: 4,
        outfit: 19, topColor: 18, bottomColor: 1, shoeColor: 18, accColor: 8,
        accessories: ["Round glasses"], voice: 5 }),

    V("Ilse", { haunt: "path", shop: "The Bakehouse",
        sells: "Bread from five in the morning, and cake if you are quick about it" },
      "Warm, blunt, up before everyone",
      "You look like someone who skipped breakfast. Sit down, I'll not have it.",
      [11, 12],
      { gender: 0, build: 2, nose: 10, mouth: 2,
        skin: 14, hairStyle: "High bun", hairColor: 13,
        eyeShape: 1, eyeColor: 6, eyebrows: 6, details: 2, beard: 0,
        outfit: 6, topColor: 5, bottomColor: 1, shoeColor: 18, accColor: 0,
        accessories: [], voice: 6 }),

    V("Ambrose", { haunt: "grass" },
      "Slow-speaking, wry, entirely unbothered",
      "They're in a mood today. So am I. We're managing.",
      [7, 2],
      { gender: 1, build: 2, nose: 4, mouth: 0,
        skin: 6, hairStyle: "Locs", hairColor: 13,
        eyeShape: 9, eyeColor: 9, eyebrows: 13, details: 0, beard: 4,
        outfit: 20, topColor: 31, bottomColor: 2, shoeColor: 18, accColor: 9,
        accessories: ["Sun hat"], voice: 2 }),

    V("Marguerite", { haunt: "grass" },
      "Endlessly patient, quietly mischievous",
      "They asked me today why the sea is salty. I told them it's been crying since Tuesday.",
      [9, 22],
      { gender: 0, build: 1, nose: 6, mouth: 1,
        skin: 15, hairStyle: "Low bun", hairColor: 14,
        eyeShape: 1, eyeColor: 2, eyebrows: 12, details: 5, beard: 0,
        outfit: 26, topColor: 17, bottomColor: 1, shoeColor: 19, accColor: 22,
        accessories: ["Round glasses"], voice: 6 }),

    /* ------------------------------------------------------- the middle --- */

    V("Perpetua", { haunt: "path" },
      "Brisk, nosy, fiercely loyal",
      "Three letters for you. One's from someone with lovely handwriting — I didn't look.",
      [9, 3],
      { gender: 0, build: 1, nose: 9, mouth: 3,
        skin: 1, hairStyle: "Low bun", hairColor: 13,
        eyeShape: 5, eyeColor: 7, eyebrows: 5, details: 0, beard: 0,
        outfit: 11, topColor: 0, bottomColor: 16, shoeColor: 19, accColor: 16,
        accessories: ["Glasses", "Satchel"], voice: 8 }),

    V("Oyelaran", { haunt: "path", shop: "The Workshop",
        sells: "Furniture, and the work the house itself needs doing to it" },
      "Precise, patient, talks through his hands",
      "Measure it twice. Then leave it overnight and measure it once more.",
      [6, 30],
      { gender: 1, build: 2, nose: 8, mouth: 0,
        skin: 10, hairStyle: "Buzzed", hairColor: 0,
        eyeShape: 2, eyeColor: 0, eyebrows: 1, details: 0, beard: 10,
        outfit: 4, topColor: 1, bottomColor: 18, shoeColor: 18, accColor: 7,
        accessories: ["Tool belt"], voice: 3 }),

    V("Bram", { haunt: "path", shop: "The Long Shelf",
        sells: "Tools, rope, lamp oil, and whatever it is you have run out of" },
      "Cheerful, incorrigible, always selling",
      "For you? Cost price. Well — near it. Well — I'll think about it.",
      [1, 27],
      { gender: 1, build: 2, nose: 10, mouth: 5,
        skin: 4, hairStyle: "Slicked back", hairColor: 5,
        eyeShape: 7, eyeColor: 3, eyebrows: 4, details: 0, beard: 9,
        outfit: 11, topColor: 0, bottomColor: 18, shoeColor: 18, accColor: 5,
        accessories: [], voice: 9 }),

    V("Saoirse", { haunt: "sand" },
      "Solitary, dry, good in a crisis",
      "Fog's coming in off the point. You've an hour, maybe less. Don't dawdle.",
      [10, 30],
      { gender: 0, build: 0, nose: 6, mouth: 0,
        skin: 0, hairStyle: "Past shoulder", hairColor: 6,
        eyeShape: 2, eyeColor: 4, eyebrows: 8, details: 1, beard: 0,
        outfit: 19, topColor: 12, bottomColor: 19, shoeColor: 19, accColor: 2,
        accessories: [], voice: 4 }),

    V("Idris", { haunt: "path" },
      "Gentle, exacting, worries about everyone",
      "You've been out in that wind all afternoon. Come in. No — come in.",
      [8, 14],
      { gender: 1, build: 0, nose: 1, mouth: 1,
        skin: 8, hairStyle: "Cropped", hairColor: 1,
        eyeShape: 1, eyeColor: 0, eyebrows: 11, details: 0, beard: 3,
        outfit: 13, topColor: 0, bottomColor: 28, shoeColor: 19, accColor: 13,
        accessories: ["Glasses", "Satchel"], voice: 4 }),

    V("Hana", { haunt: "path" },
      "Quiet, funny once she trusts you, ruthless about her own work",
      "Sixth one this week. The first five are at the bottom of the harbour where they belong.",
      [3, 7],
      { gender: 0, build: 0, nose: 0, mouth: 3,
        skin: 2, hairStyle: "Bob", hairColor: 0,
        eyeShape: 10, eyeColor: 1, eyebrows: 1, details: 0, beard: 0,
        outfit: 6, topColor: 13, bottomColor: 18, shoeColor: 18, accColor: 3,
        accessories: [], voice: 6 }),

    V("Nkechi", { haunt: "grass", shop: "The Potting Shed",
        sells: "Seeds, saplings, cuttings, and bulbs for a year you cannot picture yet" },
      "Calm, observant, always half-covered in soil",
      "That patch by your door gets the morning sun. I'd put something that likes waking up there.",
      [5, 21],
      { gender: 0, build: 1, nose: 8, mouth: 1,
        skin: 11, hairStyle: "Coils", hairColor: 0,
        eyeShape: 0, eyeColor: 0, eyebrows: 2, details: 0, beard: 0,
        outfit: 4, topColor: 25, bottomColor: 18, shoeColor: 18, accColor: 5,
        accessories: ["Headscarf", "Satchel"], voice: 5 }),

    V("Elodie", { haunt: "path", shop: "Elodie's",
        sells: "Cloth by the yard, and everything she has already made of it" },
      "Theatrical, generous, a menace about your hemline",
      "Stand still. Whoever cut that sleeve owes you an apology and I intend to collect.",
      [12, 5],
      { gender: 0, build: 1, nose: 9, mouth: 4,
        skin: 5, hairStyle: "Waves", hairColor: 21,
        hairAccent: 1, hairAccentColor: 18,
        eyeShape: 8, eyeColor: 8, eyebrows: 4, details: 4, beard: 0,
        outfit: 24, topColor: 4, bottomColor: 27, shoeColor: 26, accColor: 9,
        accessories: ["Earrings", "Necklace"], voice: 8 }),

    V("Tomas", { haunt: "sand" },
      "Taciturn, dependable, knows everyone's business",
      "Mainland at six. You've time for a cup of something, not two.",
      [2, 4],
      { gender: 1, build: 1, nose: 3, mouth: 0,
        skin: 17, hairStyle: "Undercut", hairColor: 2,
        eyeShape: 11, eyeColor: 11, eyebrows: 9, details: 0, beard: 1,
        outfit: 18, topColor: 28, bottomColor: 16, shoeColor: 19, accColor: 30,
        accessories: [], voice: 2 }),

    V("Kofi", { haunt: "path" },
      "Loud, competitive, softest man on the island",
      "Cook-off's Saturday. I've won four. I'm not counting, but it's four.",
      [6, 11],
      { gender: 1, build: 2, nose: 4, mouth: 5,
        skin: 12, hairStyle: "Buzzed", hairColor: 0,
        eyeShape: 4, eyeColor: 0, eyebrows: 2, details: 5, beard: 3,
        outfit: 6, topColor: 5, bottomColor: 19, shoeColor: 19, accColor: 0,
        accessories: [], voice: 9 }),

    V("Gideon", { haunt: "path" },
      "Gruff, meticulous, secretly reads poetry",
      "Leave it on the bench. I'll look at it when I'm done being annoyed about it.",
      [1, 9],
      { gender: 1, build: 2, nose: 7, mouth: 0,
        skin: 7, hairStyle: "Shaved", hairColor: 0,
        eyeShape: 9, eyeColor: 1, eyebrows: 2, details: 6, beard: 5,
        outfit: 6, topColor: 30, bottomColor: 19, shoeColor: 18, accColor: 7,
        accessories: ["Tool belt"], voice: 1 }),

    V("Beatrix", { haunt: "path" },
      "Whispery, exact, delighted by paperwork",
      "Nineteen years of harvest records. You may borrow one. You may not borrow two.",
      [11, 1],
      { gender: 0, build: 0, nose: 6, mouth: 3,
        skin: 1, hairStyle: "Low bun", hairColor: 2,
        eyeShape: 3, eyeColor: 2, eyebrows: 3, details: 7, beard: 0,
        outfit: 27, topColor: 31, bottomColor: 26, shoeColor: 19, accColor: 1,
        accessories: ["Glasses"], voice: 10 }),

    V("Callum", { haunt: "grass" },
      "Plain-spoken, early to bed, never once hurried",
      "Rain's due Thursday. Everything else can wait for it.",
      [3, 18],
      { gender: 1, build: 1, nose: 5, mouth: 1,
        skin: 3, hairStyle: "Crew cut", hairColor: 10,
        eyeShape: 0, eyeColor: 6, eyebrows: 0, details: 1, beard: 1,
        outfit: 4, topColor: 14, bottomColor: 3, shoeColor: 18, accColor: 18,
        accessories: ["Cap"], voice: 3 }),

    V("Amara", { haunt: "grass" },
      "Watchful, kind, says less than she knows",
      "You've been working on that house a long while. It's starting to look like you.",
      [10, 7],
      { gender: 0, build: 1, nose: 8, mouth: 1,
        skin: 13, hairStyle: "Twists", hairColor: 0,
        eyeShape: 2, eyeColor: 1, eyebrows: 11, details: 4, beard: 0,
        outfit: 25, topColor: 8, bottomColor: 8, shoeColor: 18, accColor: 12,
        accessories: ["Earrings"], voice: 5 }),

    V("Stefan", { haunt: "grass" },
      "Grandiose, warm, wildly unreliable about time",
      "Ready Friday. Possibly the Friday after. It's a living thing, you can't rush it.",
      [8, 30],
      { gender: 1, build: 2, nose: 10, mouth: 5,
        skin: 4, hairStyle: "Tousled", hairColor: 8,
        eyeShape: 7, eyeColor: 3, eyebrows: 7, details: 2, beard: 11,
        outfit: 11, topColor: 1, bottomColor: 18, shoeColor: 18, accColor: 7,
        accessories: [], voice: 4 }),

    /* -------------------------------------------------------- the young --- */

    V("Liesel", { haunt: "sand" },
      "Distracted, opinionated, generous with praise",
      "The light does something to the harbour at about four that I have never once caught.",
      [5, 3],
      { gender: 0, build: 0, nose: 2, mouth: 2,
        skin: 2, hairStyle: "Space buns", hairColor: 7,
        eyeShape: 7, eyeColor: 14, eyebrows: 10, details: 3, beard: 0,
        outfit: 10, topColor: 0, bottomColor: 15, shoeColor: 18, accColor: 21,
        accessories: [], voice: 7 }),

    V("Rasheed", { haunt: "sand" },
      "Fearless, teasing, allergic to sitting down",
      "Water's cold. That's the whole trick — you just decide it isn't.",
      [7, 26],
      { gender: 1, build: 1, nose: 1, mouth: 5,
        skin: 8, hairStyle: "Curls", hairColor: 2,
        eyeShape: 5, eyeColor: 0, eyebrows: 5, details: 0, beard: 1,
        outfit: 14, topColor: 13, bottomColor: 16, shoeColor: 19, accColor: 23,
        accessories: ["Goggles", "Neckerchief"], voice: 6 }),

    V("Wren", { haunt: "grass" },
      "Dreamy, precise about plants and nothing else",
      "Take this one. Not for anything in particular. You'll know when.",
      [4, 29],
      { gender: 0, build: 0, nose: 0, mouth: 1,
        skin: 14, hairStyle: "Long braid", hairColor: 22,
        eyeShape: 0, eyeColor: 10, eyebrows: 8, details: 1, beard: 0,
        outfit: 21, topColor: 1, bottomColor: 29, shoeColor: 18, accColor: 9,
        accessories: ["Flower crown", "Satchel"], voice: 10 }),

    V("Junko", { haunt: "grass" },
      "Nocturnal, teasing, plays through conversations",
      "Don't stop talking. It's better when there's something to play around.",
      [12, 21],
      { gender: 0, build: 0, nose: 9, mouth: 4,
        skin: 16, hairStyle: "High ponytail", hairColor: 0,
        hairAccent: 2, hairAccentColor: 19,
        eyeShape: 8, eyeColor: 15, eyebrows: 5, details: 0, beard: 0,
        outfit: 12, topColor: 30, bottomColor: 26, shoeColor: 19, accColor: 22,
        accessories: ["Scarf"], voice: 8 })
  ];

  /** Full character records, ready to draw. */
  function roster(defaults) {
    return VILLAGERS.map(function (v) {
      var rec = Object.assign({}, defaults, v.look, {
        name: v.name, birthMonth: v.birthMonth, birthDay: v.birthDay, hometown: "the island"
      });
      if (typeof rec.hairStyle === "string") rec.hairStyle = root.CozySprite.styleIndex(rec.hairStyle);
      return { name: v.name, haunt: v.haunt, shop: v.shop, sells: v.sells,
        personality: v.personality, line: v.line, record: rec };
    });
  }

  root.CozyVillagers = { list: VILLAGERS, roster: roster };
})(typeof window !== "undefined" ? window : this);
