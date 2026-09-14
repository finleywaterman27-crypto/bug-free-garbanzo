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
- **Palette:** undecided. Deferred — easier to choose against real screens than
  in the abstract.

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
- **Changed later at a mirror at home.** A small ritual, and a reason to go
  home — which is also a reason to have made home somewhere you like being.

**Customisable:** skin colour, hair style, hair colour, eyes, outfit,
accessories, voice pitch, name, birthday, star sign, hometown.

*(Star sign is derived from birthday automatically rather than picked — one
fewer decision, and it keeps the two consistent.)*

**Not customisable:** body shape, height, fur pattern, ears and tail, face
shape, favourite season, personality.

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
