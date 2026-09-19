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
accessories, voice pitch, name, birthday, star sign, hometown.

*(Star sign is derived from birthday automatically rather than picked — one
fewer decision, and it keeps the two consistent.)*

Added since, as detail rather than new categories: **facial hair** (twelve
options, following hair colour), **eyebrows** (nine), **face markings**
(freckles, blush, a beauty mark, dimples, a scar, tired eyes), **hair dye**
(tips, a streak, roots, ombre, in any of the hair colours), and an **accent
colour** driving aprons, dungarees, waistcoats, coats, the sundress sash and
every accessory independently of the trousers.

Current counts: 22 skin tones, 40 hair styles, 32 hair colours, 9 eyebrows,
12 eye shapes, 16 eye colours, 12 facial hair options, 8 face markings, 5 dye
patterns, 22 outfits, 32 clothing colours, 18 accessories. Roughly 3x10^14
combinations before names and birthdays.

Nose and mouth each have six shapes of their own, so two characters with the
same hair still read as two people.

**Everyone is drawn at double resolution** — about 36x90 pixels inside a
52x124 grid. What the extra pixels buy: eyes with a lid, sclera, iris, pupil
and a catchlight; a nose with a bridge, a tip and nostrils; two lips lit
differently; ears with a hollow; hair with strands through the mass; clothes
with collars, cuffs, hems, seams, buttons and folds; hands with thumbs; and
shoes with a sole, an upper and a lace line.

**Bodies are built from a width per row, not from rectangles**, which is what
stopped them reading as furniture. The profiles live in `FORM` in `sprite.js`:
shoulders that slope, a chest that narrows to a waist and flares at the hip,
limbs that taper toward wrist and ankle, and a skull widest at the temples
that narrows through the cheek to the chin. One light source, upper left, with
a highlight down the lit edge and a two-pixel core shadow down the other.

Detailing is painted *through* a garment rather than over the body — a seam
only lands where the shirt already is. That is what lets rectangular detail
sit on a tapered silhouette without spilling onto skin or air, and it means a
new outfit never has to know the shape of the body underneath it.

**Not customisable:** height, fur pattern, ears and tail, favourite season,
personality.

*(Body shape was on this list. It moved: build is now a real choice, decided
after the questionnaire.)*

### Where the creator has got to

Six sections — you, skin, face, hair, clothes, extras — with the character
pinned to the top-left of the screen and every option drawn on that character
rather than listed as text. The neighbours have been taken out of it: they are
introduced in the game, not chosen at the mirror.

**Roughly half-way to game-ready.** Still to do, at least: poses beyond the
walk cycle, the mirror-at-home flow, the partner and child creators the family
line needs, and a hand-off of the record into the game proper.

Every combination is tested rather than eyeballed. `src/character/sprite.test.js`
renders around 5,500 combinations — every cut against every hat, every cut
against every eyewear, every beard against every mouth on every build, every
outfit walking in all four directions, a thousand random characters, and the
authored cast — and asserts that nothing is clipped by the edge of the grid,
that no eyes are hidden behind hair or a hat (sunglasses and goggles excepted)
and that no face is entirely swallowed. It found five real bugs on its first
run: glasses drawing over the eyes, handlebar moustache tips poking into them,
a short-boxed beard doing the same, and tall hair and hats running off the top
of the sprite.

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
| 2026-09-19 | **Bodies rebuilt from silhouette profiles rather than rectangles** — sloped shoulders, a waist, tapering limbs, a tapered skull. The boxes were what made the detailed pass look unreal. |
| 2026-09-19 | Garment detail is painted through a mask of the garment's own colours, so detail follows whatever shape the body is. |
