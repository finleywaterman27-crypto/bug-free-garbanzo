/*
 * Cozy game — the island's neighbours.
 *
 * Twenty-four people, hand-authored. Nothing here is randomised: each one is
 * a deliberate face, a fixed personality, and a job that gives them a reason
 * to be somewhere at a given hour. Per the brief they never move away, and
 * everyone already likes you — friendship is something you maintain, not a
 * meter you fill to unlock basic courtesy.
 *
 * `look` is a partial character record; the rest comes from defaultChar().
 * Hair style indices: 0 Cropped, 1 Buzzed, 2 Shaved, 3 Fringe, 4 Side part,
 * 5 Swept, 6 Tousled, 7 Undercut, 8 Bob, 9 Waves, 10 Long, 11 Curls,
 * 12 Afro, 13 Locs, 14 Ponytail, 15 High bun, 16 Low bun, 17 Braids.
 */
(function (root) {
  "use strict";

  function V(name, job, personality, line, birth, look) {
    return {
      name: name, job: job, personality: personality, line: line,
      birthMonth: birth[0], birthDay: birth[1], look: look
    };
  }

  var VILLAGERS = [
    V("Marlow", "Fisherman", "Weathered, unhurried, secretly sentimental",
      "Tide's wrong for the good ones. Sit a while, they'll come round.",
      [2, 19],
      { skin: 5, hairStyle: 0, hairColor: 14, eyeShape: 3, eyeColor: 5, details: 1, beard: 4,
        outfit: 3, topColor: 16, bottomColor: 19, shoeColor: 18, accColor: 15,
        accessories: ["Beanie"], voice: 2 }),

    V("Perpetua", "Postmistress", "Brisk, nosy, fiercely loyal",
      "Three letters for you. One's from someone with lovely handwriting — I didn't look.",
      [9, 3],
      { skin: 2, hairStyle: 16, hairColor: 5, eyeShape: 5, eyeColor: 0, details: 0,
        outfit: 11, topColor: 0, bottomColor: 16, shoeColor: 19, accColor: 16,
        accessories: ["Glasses"], voice: 7 }),

    V("Oyelaran", "Carpenter", "Precise, patient, talks through his hands",
      "Measure it twice. Then leave it overnight and measure it once more.",
      [6, 30],
      { skin: 11, hairStyle: 1, hairColor: 0, eyeShape: 2, eyeColor: 1, details: 0, beard: 3,
        outfit: 4, topColor: 1, bottomColor: 15, shoeColor: 18, accColor: 18,
        accessories: [], voice: 3 }),

    V("Ilse", "Baker", "Warm, blunt, up before everyone",
      "You look like someone who skipped breakfast. Sit down, I'll not have it.",
      [11, 12],
      { skin: 1, hairStyle: 15, hairColor: 11, eyeShape: 1, eyeColor: 6, details: 3,
        outfit: 6, topColor: 4, bottomColor: 0, shoeColor: 18, accColor: 0,
        accessories: [], voice: 6 }),

    V("Teodor", "Museum curator", "Delighted by everything, terrible at small talk",
      "Do you know what this is? Neither did I, for eleven years. Marvellous, isn't it.",
      [4, 8],
      { skin: 3, hairStyle: 6, hairColor: 13, eyeShape: 4, eyeColor: 2, details: 0, beard: 5,
        outfit: 9, topColor: 10, bottomColor: 18, shoeColor: 19, accColor: 10,
        accessories: ["Round glasses"], voice: 5 }),

    V("Nkechi", "Gardener", "Calm, observant, always half-covered in soil",
      "That patch by your door gets the morning sun. I'd put something that likes waking up there.",
      [5, 21],
      { skin: 10, hairStyle: 12, hairColor: 2, eyeShape: 0, eyeColor: 0, details: 0,
        outfit: 0, topColor: 11, bottomColor: 2, shoeColor: 18, accColor: 8,
        accessories: ["Satchel"], voice: 5 }),

    V("Bram", "Shopkeeper", "Cheerful, incorrigible, always selling",
      "For you? Cost price. Well — near it. Well — I'll think about it.",
      [1, 27],
      { skin: 4, hairStyle: 4, hairColor: 8, eyeShape: 7, eyeColor: 3, details: 1, beard: 2,
        outfit: 11, topColor: 0, bottomColor: 7, shoeColor: 18, accColor: 7,
        accessories: [], voice: 8 }),

    V("Saoirse", "Lighthouse keeper", "Solitary, dry, good in a crisis",
      "Fog's coming in off the point. You've an hour, maybe less. Don't dawdle.",
      [10, 30],
      { skin: 0, hairStyle: 10, hairColor: 9, eyeShape: 2, eyeColor: 4, details: 1,
        outfit: 7, topColor: 9, bottomColor: 19, shoeColor: 19, accColor: 16,
        accessories: [], voice: 4 }),

    V("Idris", "Doctor", "Gentle, exacting, worries about everyone",
      "You've been out in that wind all afternoon. Come in. No — come in.",
      [8, 14],
      { skin: 8, hairStyle: 0, hairColor: 1, eyeShape: 1, eyeColor: 1, details: 0, beard: 3,
        outfit: 1, topColor: 14, bottomColor: 16, shoeColor: 19, accColor: 14,
        accessories: ["Glasses"], voice: 4 }),

    V("Hana", "Potter", "Quiet, funny once she trusts you, ruthless about her own work",
      "Sixth one this week. The first five are at the bottom of the harbour where they belong.",
      [3, 7],
      { skin: 2, hairStyle: 8, hairColor: 0, eyeShape: 2, eyeColor: 1, details: 0,
        outfit: 6, topColor: 13, bottomColor: 1, shoeColor: 18, accColor: 2,
        accessories: [], voice: 6 }),

    V("Ambrose", "Beekeeper", "Slow-speaking, wry, entirely unbothered",
      "They're in a mood today. So am I. We're managing.",
      [7, 2],
      { skin: 6, hairStyle: 13, hairColor: 3, eyeShape: 3, eyeColor: 9, details: 0, beard: 1,
        outfit: 1, topColor: 8, bottomColor: 10, shoeColor: 18, accColor: 1,
        accessories: ["Sun hat"], voice: 3 }),

    V("Elodie", "Tailor", "Theatrical, generous, a menace about your hemline",
      "Stand still. Whoever cut that sleeve owes you an apology and I intend to collect.",
      [12, 5],
      { skin: 3, hairStyle: 9, hairColor: 19, eyeShape: 5, eyeColor: 8, details: 2,
        outfit: 5, topColor: 17, bottomColor: 17, shoeColor: 19, accColor: 9,
        accessories: ["Earrings"], voice: 8 }),

    V("Tomas", "Ferryman", "Taciturn, dependable, knows everyone's business",
      "Mainland at six. You've time for a cup of something, not two.",
      [2, 4],
      { skin: 7, hairStyle: 7, hairColor: 4, eyeShape: 6, eyeColor: 0, details: 0, beard: 1,
        outfit: 2, topColor: 16, bottomColor: 15, shoeColor: 18, accColor: 19,
        accessories: [], voice: 2 }),

    V("Marguerite", "Schoolteacher", "Endlessly patient, quietly mischievous",
      "They asked me today why the sea is salty. I told them it's been crying since Tuesday.",
      [9, 22],
      { skin: 1, hairStyle: 16, hairColor: 15, eyeShape: 1, eyeColor: 2, details: 1,
        outfit: 9, topColor: 12, bottomColor: 18, shoeColor: 19, accColor: 12,
        accessories: ["Round glasses"], voice: 6 }),

    V("Kofi", "Cook", "Loud, competitive, softest man on the island",
      "Cook-off's Saturday. I've won four. I'm not counting, but it's four.",
      [6, 11],
      { skin: 12, hairStyle: 1, hairColor: 0, eyeShape: 4, eyeColor: 1, details: 0, beard: 1,
        outfit: 6, topColor: 5, bottomColor: 19, shoeColor: 19, accColor: 0,
        accessories: [], voice: 7 }),

    V("Wren", "Herbalist", "Dreamy, precise about plants and nothing else",
      "Take this one. Not for anything in particular. You'll know when.",
      [4, 29],
      { skin: 0, hairStyle: 17, hairColor: 16, eyeShape: 0, eyeColor: 4, details: 3,
        outfit: 5, topColor: 11, bottomColor: 11, shoeColor: 18, accColor: 9,
        accessories: ["Satchel"], voice: 9 }),

    V("Gideon", "Blacksmith", "Gruff, meticulous, secretly reads poetry",
      "Leave it on the bench. I'll look at it when I'm done being annoyed about it.",
      [1, 9],
      { skin: 9, hairStyle: 2, hairColor: 0, eyeShape: 6, eyeColor: 1, details: 0, beard: 4,
        outfit: 6, topColor: 19, bottomColor: 19, shoeColor: 18, accColor: 18,
        accessories: [], voice: 1 }),

    V("Liesel", "Painter", "Distracted, opinionated, generous with praise",
      "The light does something to the harbour at about four that I have never once caught.",
      [5, 3],
      { skin: 2, hairStyle: 15, hairColor: 6, eyeShape: 7, eyeColor: 6, details: 1,
        outfit: 10, topColor: 0, bottomColor: 15, shoeColor: 18, accColor: 5,
        accessories: [], voice: 7 }),

    V("Rasheed", "Diver", "Fearless, teasing, allergic to sitting down",
      "Water's cold. That's the whole trick — you just decide it isn't.",
      [7, 26],
      { skin: 8, hairStyle: 11, hairColor: 2, eyeShape: 4, eyeColor: 0, details: 0, beard: 1,
        outfit: 8, topColor: 13, bottomColor: 16, shoeColor: 19, accColor: 13,
        accessories: ["Neckerchief"], voice: 6 }),

    V("Beatrix", "Archivist", "Whispery, exact, delighted by paperwork",
      "Nineteen years of harvest records. You may borrow one. You may not borrow two.",
      [11, 1],
      { skin: 1, hairStyle: 16, hairColor: 12, eyeShape: 3, eyeColor: 7, details: 0,
        outfit: 9, topColor: 3, bottomColor: 18, shoeColor: 19, accColor: 3,
        accessories: ["Glasses"], voice: 9 }),

    V("Callum", "Farmer", "Plain-spoken, early to bed, never once hurried",
      "Rain's due Thursday. Everything else can wait for it.",
      [3, 18],
      { skin: 3, hairStyle: 0, hairColor: 10, eyeShape: 0, eyeColor: 5, details: 1, beard: 1,
        outfit: 4, topColor: 1, bottomColor: 10, shoeColor: 18, accColor: 2,
        accessories: ["Cap"], voice: 3 }),

    V("Amara", "Weaver", "Watchful, kind, says less than she knows",
      "You've been working on that house a long while. It's starting to look like you.",
      [10, 7],
      { skin: 13, hairStyle: 17, hairColor: 0, eyeShape: 2, eyeColor: 1, details: 0,
        outfit: 5, topColor: 8, bottomColor: 8, shoeColor: 18, accColor: 6,
        accessories: ["Earrings"], voice: 5 }),

    V("Stefan", "Brewer", "Grandiose, warm, wildly unreliable about time",
      "Ready Friday. Possibly the Friday after. It's a living thing, you can't rush it.",
      [8, 30],
      { skin: 4, hairStyle: 6, hairColor: 7, eyeShape: 7, eyeColor: 3, details: 1, beard: 5,
        outfit: 10, topColor: 2, bottomColor: 18, shoeColor: 18, accColor: 7,
        accessories: [], voice: 4 }),

    V("Junko", "Musician", "Nocturnal, teasing, plays through conversations",
      "Don't stop talking. It's better when there's something to play around.",
      [12, 21],
      { skin: 2, hairStyle: 14, hairColor: 17, eyeShape: 5, eyeColor: 8, details: 0,
        outfit: 2, topColor: 17, bottomColor: 19, shoeColor: 19, accColor: 14,
        accessories: ["Scarf"], voice: 8 })
  ];

  /** Full character records, ready to draw. */
  function roster(defaults) {
    return VILLAGERS.map(function (v) {
      var rec = Object.assign({}, defaults, v.look, {
        name: v.name, birthMonth: v.birthMonth, birthDay: v.birthDay, hometown: "the island"
      });
      return { name: v.name, job: v.job, personality: v.personality, line: v.line, record: rec };
    });
  }

  root.CozyVillagers = { list: VILLAGERS, roster: roster };
})(typeof window !== "undefined" ? window : this);
