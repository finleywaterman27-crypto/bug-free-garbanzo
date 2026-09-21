# Design brief

Written from the questionnaire answers of 14 September 2026, revised the same
day. This is the reference document — when a decision is contested, it gets
settled here first and built second.

---

## 1. The feeling

Warm, tidy, crafty. Solo — one island, one player, no multiplayer scaffolding.

**The destination is the finished place.** Not a finished *quest*, not a
finished collection, not an occasion — a house and an island that have slowly
become yours and are, at last, right. Everything in the game is either an input
to that or a reason to care about it.

Nearest neighbour is Animal Crossing, and only Animal Crossing — the others on
the list are unplayed, so we take our cues from AC directly rather than from
the genre's later habits.

**Must have:** relationships and homes.
**Never:** combat, losing.

### What events are for

Weddings, birthdays, cook-offs, fishing contests — these stay, and there are a
lot of them. But they are **not** what the game is building toward. They are
what a finished place is *for*.

That ordering matters in practice: an event is staged in a room you made, in a
town you shaped, among people who live in houses near yours. The better the
place, the better the occasion. Events are the payoff for the building, never
a substitute destination that runs alongside it.

### How much the island pushes you

Almost none. Bottom of the scale.

> **Nothing is ever missable. Nothing is ever on a deadline. The place you want
> to build is never gated behind a window you weren't there for.**

Seasons change how the island looks and what everyone is talking about, but
nothing leaves with them. If you want cherry blossom in your garden you can
have cherry blossom in your garden, in November, eight months after you first
thought of it. The loan has no due date and never will. Events recur, and
skipping one costs nothing.

### What that asks of the design

This is the most relaxed setting available, and it is a real design position
rather than an absence of one — but it does move work onto the rest of the
game. With no time pressure at all, nothing external brings the player back
tomorrow, so **the place itself has to.**

Which means the island must always be visibly offering a next thing: a room
half-decorated, a path half-laid, a neighbour who mentioned they liked
something, a project whose materials are already in your pocket. A cozy game
with no deadlines lives or dies on whether the player can always see what
they'd do next.

So this game needs a real surface for that — a projects board, a wishlist,
something in the house that shows what's underway — rather than leaving it to
the player's memory. In a game with deadlines that furniture is optional. Here
it is load-bearing, and it should go in early.

---

## 2. The island

A small island, **a handful of connected areas** — town, woods, beach, and so
on, rather than one square or a sprawling open map.

- **Time:** compressed days, roughly 20 minutes each. *(Not the real-world
  clock — so the game supplies its own seasons and festivals rather than
  borrowing the player's calendar.)*
- **Seasons:** four, plus weather. A change of look, mood, music and
  conversation — never a window that closes. Nothing is seasonal-only.
- **Ideal session:** about an hour.

### Visitors and contests

Outsiders come to the island for cook-offs, fishing challenges and similar
events. They recur, so nothing is ever missed by not being there — and they
are occasions held in your town, among the things you built, which is the
point.

### The family line — the headline feature

This is the part no other cozy game does:

1. You create yourself.
2. You play forward. After a while, you can create your **forever partner**.
3. You play forward again. Then **children**.

Every household member is made in the same character creator. There is a
**slight story**, the way New Horizons has one — structure and milestones, not
a plot to finish.

And it ties straight back to §1: **a growing household is the strongest reason
a home has to change.** A partner moves in and the house needs to hold two
people's things. A child arrives and needs a room. House expansion stops being
an abstract upgrade track and becomes making space for someone. This is the
single best mechanism the game has for keeping "finish the place" alive across
dozens of hours, and it should carry a lot of weight.

---

## 3. The neighbours

**Humans, 20 or more, all different, with fixed authored personalities.** They
**never move away**.

The social model is unusually generous and should be preserved exactly:

> **Everyone already likes you.** Friendship isn't a meter you fill to unlock
> being tolerated — it's a relationship you maintain because you want to.

You deepen it by: daily chats, gifts, small errands, letters, shared meals,
remembering birthdays, and simply showing up a lot.

### Errand cadence (specified precisely, so it's written down)

> A villager offers an errand roughly **once every five days**, and only if
> you've talked to them on **three of those five days**.

So errands are a reward for attention, not a chore queue. They cannot pile up
on a player who's been away.

### Voice

Sample line, to set the register — wandering, personal, unhurried, arriving at
a request sideways rather than opening with one:

> "Hello. Nice day we're having, *name*. This sun reminds me of the time I flew
> my kite the other month. I hated the wind but it was nice to watch it fly.
> Hey — that reminds me…"

Note the **use of the player's name**, which means the name field in the
creator is load-bearing dialogue data, not decoration.

Neighbours also have homes, and those homes are part of the finished place.
Visiting them, and their opinions on what you've built, are how the island
reflects your work back at you.

### The cast

Twenty-four of them are written and drawn, in `src/character/villagers.js`:
Marlow the fisherman, Perpetua the postmistress, Oyelaran the carpenter, Ilse
the baker, Teodor at the museum, Nkechi in the gardens, Bram in the shop,
Saoirse at the lighthouse, Idris the doctor, Hana the potter, Ambrose with the
bees, Elodie the tailor, Tomas the ferryman, Marguerite the schoolteacher,
Kofi the cook, Wren the herbalist, Gideon the blacksmith, Liesel the painter,
Rasheed the diver, Beatrix the archivist, Callum the farmer, Amara the weaver,
Stefan the brewer, Junko the musician.

Each has a fixed face, a fixed personality and a job that puts them somewhere
at a given hour — which is what schedules, and therefore "showing up a lot",
are built on.

---

## 4. Your days

**The core loop is island life, centred on decorating your home.** This is the
spine. Everything below feeds it.

Wanted, in full: fishing, bug catching, fossils, farming, foraging, cooking,
crafting, home decorating, house expansion, reshaping the land, a museum, a
shop, mail and letters, outfits, music, diving, photography, gardening.

Sorted by what they're *for*:

| | |
|---|---|
| **The place itself** | Decorating, house expansion, reshaping the land, gardening |
| **Materials for the place** | Fishing, bug catching, fossils, farming, foraging, diving, crafting |
| **Paying for the place** | The shop, selling, the debt |
| **Reasons to care about it** | Neighbours, letters, meals, events, photography, the museum |

- **Economy:** a debt you pay off. The Tom Nook engine — it points earning at
  the house, which is exactly where this game wants it pointed.
- **Collecting:** 4 of 10 — present, but this is not a fill-every-slot game.
  The museum is a place to visit, not a checklist to complete.

---

## 5. Look and sound

- **Pixel art**, **top-down**, **ambient nature only** for sound.
- **Palette: market morning.** The island in full daylight. Bright and
  saturated, and deliberately several accents rather than one, because a
  cheerful place is not a monochrome one.

  | | |
  |---|---|
  | sky | `#dff0ec` |
  | paper | `#fffdf5` |
  | ink | `#16322e` |
  | sea | `#12857c` |
  | marigold | `#f2a516` |
  | coral | `#ef6f52` |
  | leaf | `#5aa845` |
  | berry | `#d2467f` |

  Both themes keep the same accents; only the ground and the ink change, so
  the island reads the same at any hour. A bunting stripe runs along the top
  of every panel.

- **Lettering: a bitmap typeface drawn for this game**, in `src/ui/type.js` —
  74 glyphs, seven rows of cap height with real descenders, so it sets in
  sentence case instead of the shouty all-caps most pixel faces force. Used
  for titles, section names, labels and buttons; body copy stays a readable
  web face so phones don't suffer. It exists only as that glyph table.

Ambient-nature-only audio raises one flag: villager speech needs a sound, and
Animalese-style voice blips are the genre's answer. Voice pitch *was* chosen as
a character trait, so the creator includes it. If you want strictly no voices,
say so and it becomes soft UI clicks instead.

---

## 6. The build

- **Desktop app.**
- **Engine: my recommendation → Godot 4.** Free, excellent 2D pixel pipeline,
  exports desktop builds directly, and its scene/node model fits "a village
  full of independent little people with schedules" better than a web stack
  would. The character system is being prototyped on the web because that's the
  fastest way for you to *see and direct* it — the sprite code is written to
  port cleanly.
- **Art:** generated in code. No sprite sheets to draw or maintain.
- **Working style:** I write, you direct.
- **First milestone: a tiny walkable village** — move around, talk to one
  neighbour.

---

## 7. Character creation

- The player is **one of the villagers** — human, same as everyone else.
- **No personality type** for the player. The player is a blank you fill in;
  personality belongs to the neighbours.
- **Depth: 7 of 10** — generous, not endless.
- **Gender: two options**, which set pronouns for dialogue.
- **Build: three silhouettes** (slight, average, broad), changing the shape of
  the torso and hips. Everyone can wear everything.
- **Changed later at a mirror at home.** A small ritual, and a reason to go
  home — which is also a reason to have made home somewhere you like being.

**Customisable:** skin colour, hair style, hair colour, eyes, outfit,
accessories, voice pitch, name, birthday, star sign.

**Hometown is gone.** Nobody is from anywhere else any more — everyone in the
family line is of the island.

*(Star sign is derived from birthday automatically rather than picked — one
fewer decision, and it keeps the two consistent.)*

Added since, as detail rather than new categories: **facial hair** (twelve
options, following hair colour), **eyebrows** (fourteen), **face markings**
(freckles, blush, a beauty mark, dimples, a scar, tired eyes), **hair dye**
(tips, a streak, roots, ombre, in any of the hair colours), and an **accent
colour** driving aprons, dungarees, waistcoats, coats, the sundress sash and
every accessory independently of the trousers.

Current counts: 22 skin tones, **48 hair styles**, 32 hair colours,
**14 eyebrows**, 12 eye shapes, 16 eye colours, **12 noses**, 6 mouths,
12 facial hair options, 8 face markings, 5 dye patterns, **28 outfits**,
32 clothing colours, 18 accessories.

**No haircut may touch the face at all** — not the brows, not the eyes, not
the nose, not the mouth. This is enforced rather than drawn carefully: the
renderer holds a guard rectangle over the face while hair is being laid down,
and every write and every erase inside it is dropped. Fringes stop above the
brow line, and the heavy ones (blunt fringe, bowl cut, hime) were shortened
rather than removed, so all forty-eight cuts survive.

The guard has to know which way the character is facing, and it means three
different things in three directions.

**Head on** it fences off the face: brows, eyes, nose and mouth.

**On the back view it stands down entirely**, because there is no face there
and the whole skull should be hair. Left switched on, it punched a bald patch
of scalp out of the middle of every long cut.

**Side on it is inverted.** There is no face to keep clear, because hair
falling forward is *supposed* to hang over the side of the face — that is what
it does on a real head. Two things it must not do. It must not hang in front
of the face, out in the air past the nose, so everything forward of the skull
is fenced off down to the shoulders. And it must not swallow the profile line:
the front column of the face, from the brow down, is the
forehead-nose-lip-chin edge that makes a side view a side view. Cover it and
the nose is left stranded outside the hair like a stuck-on beak.

Where the near curtain of hair *sits* changes with the turn for the same
reason. Head on it hangs off the edge of the head; side on it moves back onto
the cheek, where hair falling forward actually lands, and stops a column short
of the line.

**A profile is an ear, a nose and a lip in the outline — nothing else.** Turn
your head to the side in a mirror: the eye is a lash at the very edge of the
silhouette, the brow is the shape of the brow ridge, and the mouth is a notch
in the line. Drawn as features on the cheek they read as a front face wearing
a side view. No mouth on the cheek. The eye is two columns at
the very front of the face — the outer one being the profile line itself —
built from the same parts as the front eye, so it reads as the same eye and
not as a coloured chip: lash, the white behind the iris (from the side, that
is the order you see them in), the iris on the line, a lash under it. Four
rows, the same as the front eye, so a face turning does not make its eye jump.
It goes down after the hair and only onto skin, so anything fallen over those
columns hides it. The ear does the rest of the work. Three pixels wide by six, a shade under the skin with a hollow, because
what makes it read as an ear is the contrast, not the size. (The four-by-seven
version read as a jug handle; the version drawn in the skin tone read as a
crack.) **Blush and freckles do appear side on**, on the one cheek you can see.

**Brows are mirrored, and they sit off the eye.** They used to be drawn
identically on both sides, which meant a face wore a worried brow on one side
and an angry one on the other at the same time, and came out stern. Each shape
is now authored from the outer end inward and flipped for the other side. And
there is a clear row between the brow and the eyelid: sitting straight on the
lid, even a level brow glowers.

**The hair has one outer edge.** Every piece of it — the cap on the crown,
the curtains down the sides, the mass down the back — used to be drawn with
its own margin: two pixels proud of the head here, four there. The silhouette
pinched in at the temples and bulged out at the jaw for no reason anyone could
see, and read as hair going thin and thick at random. They now share one edge,
and the mass *flares*: it starts flush with the crown and widens by a pixel
every other row, so hair gets fuller as it falls rather than stepping out all
at once.

**Strands are one pass over the finished shape**, not a patch drawn on each
piece. Every piece used to shade itself with its own spacing and its own
start, and the stripes never lined up: the result read as confetti. One pass
gives strands that run the whole length of the hair whatever shape it is, and
it touches only pixels the hair itself put down, so a beard in the same colour
is left alone.

**Every colour family has one outline tone.** The outline pass reads the
colour it is standing next to; deriving an outline from *that* gave a
different colour depending on whether the edge happened to border the base,
the shade or the highlight, so a single silhouette came out in three tones and
looked mottled.

**The back of the skull is curved into the head.** In profile it was a flat
two-by-eleven block bolted onto a rounded head, and it read as a lump with
corners the outline then traced.

**Side on, hair wraps in one piece.** Head on there are two curtains, one off
each edge of the head. Side on there is one: the hair comes from the back of
the head round over the ear and stops at the cheekbone, its front edge
sweeping back over six rows the way a hairline does. Drawn as two curtains it
put a band of hair across the middle of the face with cheek showing on either
side of it, and the face read as two slivers. It also runs as long down the
near side as the mass does down the back, or it stopped at the ear and left
the jaw bare.

**No make-up side on.** Blush is drawn head on only, and it was being drawn on
both cheeks in profile — a face turned edge-on has one.

**Anything that hangs off the side of the head moves round behind in profile**
— a ponytail, a low bun, one of a pair of braids — because from the side the
sides of the head are its front and its back. Left where they were, they came
out of the character's nose. A pair collapses to the near one: two tails side
by side is another front view turned sideways. Eyewear follows the same rule:
edge-on a lens is nearly a line, so what you see is the rim at the front of
the face and the arm running back over the ear.

**Nose and mouth each have shapes of their own**, twelve and six, drawn both
front-on and in profile, so two characters with the same hair still read as
two people.

**A skirt takes the trouser colour**, so the trousers section is never a dead
end for someone in a dress; six of the outfits are skirted.

**Everyone is drawn at double resolution** — about 36x90 pixels inside a
52x124 grid. What the extra pixels buy: eyes with a lid, sclera, iris, pupil
and a catchlight; a nose with a bridge, a tip and nostrils; two lips lit
differently; ears with a hollow; hair with strands through the mass; clothes
with collars, cuffs, hems, seams, buttons and folds; hands with thumbs; and
shoes with a sole, an upper and a lace line.

A silhouette rebuild was tried and reverted — the blockier version reads
better in the game's own style, which is the only test that counts.

**Not customisable:** height, fur pattern, ears and tail, favourite season,
personality.

*(Body shape was on this list. It moved: build is now a real choice, decided
after the questionnaire.)*

### Where the creator has got to

**Twelve short sections** — you, skin, eyes, nose, mouth, hair, hair colour,
beard, top, trousers, shoes, extras — so each one fits on a screen instead of
asking you to scroll. Jump to any of them, or walk through with back and next;
next becomes **finish** on the last one. **Undo and redo** sit beside the
character, fifty steps deep.

The character is pinned to the top-left and drawn large enough to actually
judge, and every option is drawn on that character rather than listed as text.
The neighbours have been taken out of it: they are introduced in the game, not
chosen at the mirror.

**The pickers are sorted so you can find things.** Every colour list —
hair, eyes, tops, trousers, shoes, accent — runs **pink, red, orange, yellow,
green, blue, violet, then the neutrals lightest to darkest**. Skin is the
exception and runs **lightest to darkest**, because a rainbow through twenty-two
skin tones is a worse way to find your own than a straight ramp.

Sorting by hue is fiddlier than it sounds. A colour can be too dark, too pale
or too grey to read as its hue at all — near-black Black measures 264 degrees
and sorted itself in among the lavenders — so anything that flat is treated as
a neutral whatever its hue says. And the wheel has to be cut somewhere: cut it
at red and the deep pinks just below it (Burgundy, Wine, Blossom) land at the
far end after the violets instead of beside the reds they belong with, so the
cut goes above the pinks instead.

**Hair is grouped by length** — shaved & buzzed, short, chin length, shoulder,
long, very long — with **tied back as a group of its own**, because a ponytail
is short at the front and long at the back and arguing about which bucket it
belongs in helps nobody.

**Two starting characters, one per gender** — a different build, hair, face
and outfit each, so the first thing you see when you pick is a person rather
than a form. Choosing the other gender before you have changed anything hands
you its starting character; once you have made the look yours, it only changes
the word.

**Roughly half-way to game-ready.** Still to do, at least: poses beyond the
walk cycle, the mirror-at-home flow, the partner and child creators the family
line needs, and a hand-off of the record into the game proper.

Every combination is tested rather than eyeballed. `src/character/sprite.test.js`
renders **4,338,588 combinations in fifteen minutes** — every cut against every
hat, every cut against every eyewear, every beard against every mouth on every
build, every outfit walking in all four directions, four thousand children, and
the authored cast — and asserts that nothing is clipped by the edge of the grid,
that no eyes are hidden behind hair or a hat (sunglasses and goggles excepted),
that no face is entirely swallowed, that **no hairstyle changes a single pixel
of the face** compared against the same character shaved, that the back of the
head is never left bare, and that a profile eye is edge-on rather than a front
eye turned sideways.

It found five real bugs on its first run — glasses drawing over the eyes,
handlebar moustache tips poking into them, a short-boxed beard doing the same,
and tall hair and hats running off the top of the sprite — and four more since:
a rounded corner biting a hole out of the temple, hair hanging over the nose in
profile, a bald patch on the back of the head, and a face-region check that had
drifted two rows off the head because it ignored the walk bob.

### The family line, decided

Three answers that shape the record rather than the screen:

**Clothes fit everyone.** One wardrobe, one drawing per garment, and every
item suits whatever build you have. Nothing is ever locked off because of your
shape, and adding a coat stays a one-drawing job rather than a three-drawing
one.

**Your partner: you choose their whole look, not their details.** Face, hair,
clothes and build are yours to pick — the same sections you get for yourself.
Their name, birthday and personality come from the game, so they arrive as
someone you met rather than a form you completed.

**Your children are inherited, then freely editable.** `inherit(a, b)` in
`sprite.js` mixes them: skin tends toward the midpoint of its parents, because
the palette runs light to dark and that is what mixing looks like; eyes, nose,
mouth and brows come *whole* from one parent or the other rather than being
averaged, which is how resemblance actually works — your mother's nose, your
father's eyes. Haircuts are not inherited, because nobody inherits a haircut.

Then the player can change any of it, with no limits. The inheritance is a
first offer, not a cage.

### Why this is where we started

Because of the family line, the character creator isn't a front-door menu you
pass through once — it's the **character system for the entire game**. The
player, the partner, the children, and all 20+ neighbours are the same record
drawn by the same code. Getting it right first means the village milestone has
its cast already.

---

## 8. Open questions

1. **Palette** — deferred until there are screens to judge.
2. **Villager voices** — blips, or strictly ambient? (§5)
3. **Working title** — none yet.
4. **The next-thing surface** — what shape should it take? A projects board, a
   wishlist, a notebook, something physical in the house? (§1)

---

## Decisions log

| Date | Decision |
|---|---|
| 2026-09-14 | Questionnaire answered; this brief written from it. |
| 2026-09-14 | Engine: Godot 4, on my recommendation. Prototyping the character system on the web first. |
| 2026-09-14 | Star sign derived from birthday rather than chosen separately. |
| 2026-09-14 | One character record + one renderer serves player, family and all villagers. |
| 2026-09-14 | **The finished place is the destination, not the occasion.** Events are what a finished place is for, not a parallel goal. Supersedes the first draft's reading. |
| 2026-09-14 | ~~Pressure re-read as seasonal windows.~~ Superseded below. |
| 2026-09-14 | **Pressure: almost none.** The 9/10 in the questionnaire was a slider slip. Nothing missable, no deadlines, no seasonal gating, no due date on the loan. |
| 2026-09-14 | Consequence of the above: the game needs an explicit "what's underway" surface, and it ships early rather than late. |
| 2026-09-14 | Sprite resolution raised to a ~18x45 figure at five head-heights. The first pass was three head-heights and read as a cartoon. |
| 2026-09-14 | Outlines and facial features derive per-colour, with near-black tones getting a rim light instead of a dark outline — without it, dark skin and black hair lost both silhouette and face. |
| 2026-09-14 | **The cast is authored, not generated.** 24 named neighbours with fixed faces, jobs, personalities and sample lines. Randomisation survives only as the player's "Surprise me", drawing from harmonised colour groups. |
| 2026-09-19 | Every option axis widened, and eyebrows, face markings and hair dye added as new ones. |
| 2026-09-19 | Villagers name their hair style rather than indexing it, so the style table can be reordered or extended without silently restyling someone. |
| 2026-09-19 | Left-facing frames are the right-facing ones mirrored. One profile to get right instead of two, and they can never drift apart. |
| 2026-09-19 | The profile has its own narrower torso, a nose in its silhouette, and no hair across the near eye — a front view with one arm removed is not a side view. |
| 2026-09-19 | Walk cycle rebuilt: the body rides highest at mid-stride, the side view takes a real stride with the far leg and arm in shadow. |
| 2026-09-19 | Creator split into steps with the character pinned on screen, and every picker previews on the character rather than naming an option in text. |
| 2026-09-19 | **Gender: two options**, setting pronouns. **Build: three silhouettes**, which reverses "body shape: not customisable" from the questionnaire. |
| 2026-09-19 | Nose and mouth get six shapes each, so faces vary below the eyes. |
| 2026-09-19 | **Palette: lantern dusk**, committed to one world rather than two themes. |
| 2026-09-19 | **The lettering is ours**: a 74-glyph bitmap typeface drawn in code, used for every display string. |
| 2026-09-19 | The profile has its own narrower head set forward, with the back of the skull drawn in, so a turn reads as a turn. |
| 2026-09-19 | Villagers removed from the creator — they are introduced in the game. |
| 2026-09-19 | Combination testing added, and it immediately found five overlap bugs. |
| 2026-09-19 | **One wardrobe for every build.** Garments are drawn once and suit any shape; nothing is locked off. |
| 2026-09-19 | **Partner: their look is yours to choose, their details are the game's.** Name, birthday and personality are authored, not filled in. |
| 2026-09-19 | **Children are inherited, then freely editable.** Skin mixes toward the midpoint; eyes, nose, mouth and brows come whole from one parent. The player may then change anything. |
| 2026-09-19 | **Palette redone as market morning** — bright daylight, several accents, both themes sharing them. Supersedes lantern dusk. |
| 2026-09-19 | **Everyone redrawn at double resolution**, with the detail to fill it rather than the same art made bigger. |
| 2026-09-19 | Undo added, fifty steps deep. |
| 2026-09-19 | ~~Bodies rebuilt from silhouette profiles.~~ Tried and reverted: the blockier version reads better in the game's own style. |
| 2026-09-19 | Creator split into twelve short sections, one screen each, with finish on the last. |
| 2026-09-19 | Undo and redo, fifty steps deep. |
| 2026-09-19 | **A starting character per gender**, rather than one default wearing a different label. |
| 2026-09-19 | **Hometown dropped.** Everyone in the family line is of the island. |
| 2026-09-19 | **No hair may cover an eye**, and each eye is now checked on its own. |
| 2026-09-19 | Hair falls the same length whichever way the character faces; long hair hangs in front of the shoulders as well as behind. |
| 2026-09-19 | Eight more long cuts, six more things to wear, five of them skirted. |
| 2026-09-19 | **The save button is gone.** Finishing is what saves. |
| 2026-09-19 | **No hair touches the face at all** — brows, eyes, nose and mouth. Enforced by a guard rectangle the renderer drops hair writes into, rather than by drawing each of the forty-eight cuts carefully. |
| 2026-09-19 | The guard stands down entirely on the back view, where the whole skull should be hair. |
| 2026-09-19 | ~~A profile keeps a narrowed eye and a shortened mouth.~~ Superseded below. |
| 2026-09-19 | **Side on, the guard is inverted.** Hair falling over the cheek is what hair does; what it must not do is hang in front of the face past the nose, or swallow the profile line — the forehead-nose-lip-chin edge that makes a side view a side view. |
| 2026-09-19 | **A profile is an ear, a nose and a lip in the outline.** No eye, no mouth on the cheek. An eye and a mouth drawn there read as a front face turned sideways. Supersedes the narrowed-eye compromise. |
| 2026-09-20 | **A two-column eye side on**, on the profile line, built from the same parts as the front eye. A single column inset on the cheek read as a mole; a whole eye turned sideways read as a front face. |
| 2026-09-20 | **Blush and freckles do show side on**, on the one cheek you can see. Reverses the day before, which had dropped them as make-up. |
| 2026-09-20 | **Brows are mirrored and lifted off the eyelid.** Drawn identically on both sides, a face wore a worried brow and an angry one at once and read as stern. |
| 2026-09-20 | In the creator: the masthead is teal rather than ink over a brown shadow, the walk toggle is gone, and every label is set in the bitmap face. Prose stays in the body face — a sentence in a nine-pixel bitmap is harder to read, not more characterful. |
| 2026-09-19 | The ear is three wide by six rather than four by seven, and reads by its hollow and its cast shadow rather than by its size. |
| 2026-09-19 | **Tails go behind in profile.** A ponytail, a low bun or one of a pair of braids sits on the side of the head, and from the side that side is the face — they were coming out of the nose. A pair collapses to the near one. |
| 2026-09-19 | Eyewear is drawn edge-on in profile: a rim at the front of the face and the arm back over the ear, not the front pair laid flat on the cheek. The rim and the arm are one unbroken line; drawn as a separate stub the arm floated on the cheek. |
| 2026-09-19 | **The hair has one outer edge**, and the mass flares as it falls instead of stepping out. Pieces drawn with their own margins made the silhouette pinch and bulge at random. |
| 2026-09-19 | **Strands are one pass over the finished hair**, not a patch per piece. A dozen little patches that never lined up read as confetti. |
| 2026-09-19 | **One outline tone per colour family.** Deriving it from whatever the edge bordered gave a mottled three-tone silhouette. |
| 2026-09-19 | The back of the skull is curved into the head; the flat block bolted on behind it read as a lump. |
| 2026-09-19 | **Side on the hair wraps in one piece** from the back of the head over the ear to the cheekbone, and runs as long down the near side as down the back. Two curtains split the face into two slivers; a short one left the jaw bare. |
| 2026-09-19 | Tails butt against the skull rather than standing off it by the hair's own volume, which left daylight between the two. |
| 2026-09-19 | **No blush in profile.** Make-up was being painted on both cheeks of a face that has one. |
| 2026-09-19 | Two more tests, both from defects the eye caught and the suite did not: **hair must be attached to the head** (a flood fill; every run of hair has to touch something that is not hair) and **hair keeps its shape down its length** (neither edge may move more than three pixels a row, down the head, for a cut that hangs loose). |
| 2026-09-19 | Erasing the face counts as covering it: rounded corners used to bite a hole out of the temple that the outline pass then filled in grey. |
| 2026-09-19 | **Heavy fringes shortened rather than dropped** — blunt fringe, bowl cut and hime keep their shape and show the brows. All forty-eight cuts survive. |
| 2026-09-19 | **A profile is an edge of a face**: narrowed eye, shortened mouth, ear drawn in full. Not an ear alone — still recognisably the same person from the side. |
| 2026-09-19 | **Colours sort as a rainbow, skin sorts by depth.** Pink to violet then neutrals for hair, eyes and cloth; lightest to darkest for skin, which is a better way to find your own tone. |
| 2026-09-19 | **Hair is grouped by length**, with tied-back as its own group. |
| 2026-09-19 | Twelve noses and fourteen brows, up from six and nine. |
| 2026-09-19 | **Testing is exhaustive, not sampled.** 3,762,057 combinations in eleven minutes: every hair against every brow, eye, beard and hat; every skin against every nose, mouth, beard and marking; every outfit on every build in every colour walking every way; every accessory against every other. The whole space is 7x10^20, which is four billion years of rendering, so the suite is exhaustive over the parts that can actually land on top of each other. |
| 2026-09-20 | **A hat covers the hair under it** rather than being sized to clear it. Short hair goes bald under a hat, long hair only shows below the brim, and every hat is a tight fit on the skull. Sized to clear the hair instead, a hat big enough for an afro sat on every head. |
| 2026-09-20 | **A band is the opposite of a hat**: worn over the hair, so a headband, flower crown and goggle strap measure the head as drawn and run the full width of it, stopping at the face in profile. |
| 2026-09-20 | **Four hats, not six.** Sun hat, cap, beanie, headscarf — a brim, a peak, a ribbed dome and a wrap, each one readable at a glance. The beret was a blob with no beret in it; the bucket hat was the sun hat's silhouette a second time. |
| 2026-09-20 | **The headscarf wraps rather than perches**: fitted over the crown, down past the ears, framing the face, falling behind, and covering the hair completely — which is the point of wearing one. |
| 2026-09-20 | **A hat is worn, not balanced.** Each one is pulled down onto the head with its hem just above the brow, and carries on round the back of the skull — both sides from the front, the whole skull from behind, the back half in profile. The beanie had been fifteen rows tall on a twenty-row head, nine of them clear of it. |
| 2026-09-20 | **Thirteen sections**: eyebrows moved out of Eyes into their own, and Beard is now Facial hair. |
| 2026-09-20 | **The whole page is in the pixel face**, the name box and the date dropdowns included. The real input still does the typing, the caret and the selection — only its own text is hidden, with the lettering painted over it. |
| 2026-09-20 | **One of each kind of extra at a time.** A second hat replaces the first, and every tile previews its own item rather than the one you already have on. |
| 2026-09-20 | **Every birthday is a day that exists.** The day list is as long as the month, a 31st carried into a thirty-day month becomes the 30th, and February keeps its 29th — there is no year on an island birthday. |
| 2026-09-20 | **Four facings, not eight — diagonal walking is dropped.** Not a movement-led game, and the paths and fences do the steering. Stardew Valley is four directions and walking is most of what you do in it. Eight would have doubled the exhaustive suite and taxed every future change to hair, hats and outfits with four more views to get right. Revisit only if the player ever moves on an analog stick, where pushing diagonally while facing square on would read as broken. |
| 2026-09-20 | **The island is built on the web, hand-authored, and starts as one screen you can walk around.** Godot stays on the table; nothing about the art or the design has to change to move there later. |
| 2026-09-20 | **Ground is painted once for a whole map, not tile by tile.** Blending two kinds where they meet is then just something you draw after the fill, rather than a tile set with a case for every corner. |
| 2026-09-20 | **A prop's footprint and its drawing are separate things.** A tree's trunk stands on one tile; its canopy hangs over four. Keeping them apart is what lets you walk behind a tree, which is the single thing that makes a top-down map read as a place. |
| 2026-09-20 | **Everything on the ground is drawn in order of how far down the screen its feet are** — and so nothing you can stand on may be inside a prop's footprint, or it gets drawn over the top of you. |
| 2026-09-21 | **A fence run ends on a post, and turns on one.** The corner post is a single piece of timber that both runs are nailed to: the rails die into it, the boards stop clear of it, and it is drawn last so it stands in front of both. Before this the run going away was simply stamped over the top of the run going across and the two touched nothing. A run that merely stops gets a post too — left bare, its two rails poked out into the gateway like a pair of sticks. |
| 2026-09-21 | **A fence going away from you is a line of POSTS overlapping one another, drawn face on — settled from a reference, not from first principles.** Stardew Valley's modding wiki: "In a vertical line of fences, the top 16 pixels of the bottom neighbor piece overlap the bottom 16 pixels of the top neighbor piece." So the games that have solved this do not draw the fence from a second angle at all — every piece is face on and the run reads because each post leans over the one behind it. Ours is a post every sixteen pixels, the same board two pixels taller, cut level with the top of the fence at the far end. Everything that tried to draw the true side view failed: two thin rails was a ladder, one fat rail a plank, the whole panel turned on its side a trellis, and a bar with the tone wandering along it a stack of crates. |
| 2026-09-21 | **No nail heads and no caps on the pickets.** At this size a nail is a dot and a cap is a little hat, and four of each to a tile is a rash across the whole run. |
| 2026-09-21 | **Reversed: the picket stays five wide with three of daylight, in the timber it was.** Four wide with a four-pixel gap, a pale face and a dark cut head was tried and put straight back — the gap read as the fence being thin rather than as light coming through it, and the pale face lost the wood. The only thing kept from the attempt is that a post is now the picket's own width, two pixels taller: stouter than that and every corner read as a bollard. The run going away is that same width too, and on the same eight-pixel pitch. |

## The art pass the island still needs

The first island build got the machinery right and left the art as
placeholder. Parked deliberately, to come back to. What is wrong with it,
worst first:

Done: the sea (flat bands with crisp streaks, from a reference), the
leaves (their own ramp — sunlight on foliage goes yellower, not paler),
the canopy (clusters with seams, lit in one pass), the path (laid
cobblestone, from a reference), the fence (lean, knots, a slipped rail),
undergrowth at the foot of things, bark, and palms in place of the pines,
which looked bad and had no business on a tropical island anyway.

Still to do:

1. **The house is one house.** Every building on the island will be this
   shape unless it learns some variation.
2. **More path variants** — the stone one is laid; dirt, boards and brick
   are the same code with a different palette.
3. **More density still.** Driftwood on the sand, shells, a rock pool.
4. **Grass could vary by area** — longer at the edges of the map, mown
   near the house.

Done in the first pass and worth keeping: a warmer, more saturated
palette; grass varied at three scales with smooth noise rather than
stepped, so the field has light and dark areas without square patches;
tufts and the occasional daisy drawn as shapes rather than speckles; foam
where the sea meets the sand; a warm light falling across the map from
the top left; and every prop nudged a few pixels off the grid, which is
most of what stopped it looking machine-made.

| Date | Decision |
|---|---|
| 2026-09-20 | **A walking speed is not a free number.** Between one frame of the walk and the next the sprite drags a planted foot `STRIDE` pixels back under the body, so the ground may move by exactly that much and not a pixel more, or the feet skate. The sprite publishes its own stride and the game moves by it; how briskly the legs go round is then the only thing left to choose. |
| 2026-09-20 | **The stride is eight pixels, up from six**, so the walk can stay brisk without the legs whirling. Under a skirt the legs swing half as far, because a full swing threw feet out from under the hem — stepping less far than the ground moves is fine, stepping further is the thing that shows. |

## Version one

Not the finished game. The first version worth playing for half an hour.

**The unit of cost is a PLACE, not a feature.** Every place is about four
things: somebody who runs it, an outside, an inside, and a reason to go.
Count places. The museum went into a first draft of this plan as though it
were one line, and it is four — and the expensive one of the four is the
inside.

An inside is a whole second world: its own map, a door that leads
somewhere, walls and floors instead of grass, furniture that collides, and
state that lasts. Built once, every interior after it is cheap. Built for
the museum, the biggest cost in the project is spent on the least personal
room in the game.

So version one has **no interiors at all**:

| | |
|---|---|
| The island | the art pass, day and night, ambience, big enough to wander |
| Something to do | net and rod, bugs and fish that come out by time and place |
| Somewhere it goes | the phone — what you have caught, and what you have not |
| Somebody there | two or three villagers who walk about, talk, and have moods |

Villager houses get exteriors only. You cannot walk into every house in
Animal Crossing on the first day either.

The museum was cut from version one. What it was there for — a reason to
catch things — the phone does on its own for a fraction of the cost: a
catch that goes nowhere is pointless, and the empty slots in a collection
pull you back out of the door just as well as a display case does.

**Version two opens with interiors, and the first door that works is your
own front door** — that is where decorating happens, it is the room that
will be cared about most, and it is the honest test of the system. The
museum follows immediately, and by then it costs a curator and a building
rather than a curator, a building and a whole new world.

After that, in rough order: furniture and placing it, crafting, the shop
and the tailor, and a storyline threaded through the lot rather than
standing as a block of its own.

**Ordering rule: the art pass comes before bulk content.** Everything made
from here is drawn in whatever style we land on, and two hundred pieces of
furniture in a style we later abandon is two hundred things to redo.
