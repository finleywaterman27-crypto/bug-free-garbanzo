# Design brief

Written from the questionnaire answers of 14 September 2026. This is the
reference document — when a decision is contested, it gets settled here first
and built second.

---

## 1. The feeling

Warm, tidy, crafty. Solo — one island, one player, no multiplayer scaffolding.

The remembered moment is **an event**: a wedding, a birthday. That is unusual
and it is the most useful thing in the whole questionnaire. Most cozy games
build toward a *place* being finished; this one builds toward *occasions*. The
calendar is the spine, not the decorating.

Nearest neighbour is Animal Crossing, and only Animal Crossing — the others on
the list are unplayed, so we take our cues from AC directly rather than from
the genre's later habits.

**Must have:** relationships and homes.
**Never:** combat, losing.

### The one tension worth naming

Pressure was set to **9 of 10** ("real deadlines and stakes"), alongside
"never: losing" and a mood of *warm, tidy, crafty*. Those pull against each
other, so here is the reading I'm building to:

> **Things happen whether or not you show up, and you can miss them forever.
> But you can never fail, lose, or be punished.**

A festival runs on Saturday; if you don't come, it happened without you and it
won't happen again until next year. A neighbour's birthday passes unmarked.
The loan sits there. That's real stakes with no fail state — pressure made of
*occasions*, not of danger. Tell me if you meant something sharper (actual
deadlines with consequences) and I'll adjust.

---

## 2. The island

A small island, **a handful of connected areas** — town, woods, beach, and so
on, rather than one square or a sprawling open map.

- **Time:** compressed days, roughly 20 minutes each. *(Not the real-world
  clock — so the game supplies its own seasons and festivals rather than
  borrowing the player's calendar.)*
- **Seasons:** four, plus weather.
- **Ideal session:** about an hour.

### Visitors and contests

Outsiders come to the island for **cook-offs, fishing challenges and similar
events**. These are the pressure system in practice: scheduled, missable,
competitive but harmless.

### The family line — the headline feature

This is the part no other cozy game does, and it should be the thing the game
is known for:

1. You create yourself.
2. You play forward. After a while, you can create your **forever partner**.
3. You play forward again. Then **children**.

Every household member is made in the same character creator. There is a
**slight story**, the way New Horizons has one — structure and milestones, not
a plot to finish.

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

---

## 4. Your days

**The core loop is island life, centred on decorating your home.** Everything
else feeds it.

Wanted, in full: fishing, bug catching, fossils, farming, foraging, cooking,
crafting, home decorating, house expansion, reshaping the land, a museum, a
shop, mail and letters, outfits, music, diving, photography, gardening.

- **Economy:** a debt you pay off. The Tom Nook engine — it gives every day a
  reason and every activity a destination.
- **Collecting:** 4 of 10 — present, but this is not a fill-every-slot game.
  The museum is a place to visit, not a checklist to complete.

---

## 5. Look and sound

- **Pixel art**, **top-down**, **ambient nature only** for sound.
- **Palette:** undecided. Deferred — it'll be easier to choose against real
  screens than in the abstract.

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
  home.

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

1. **Pressure at 9/10** — is the "missable occasions, no failure" reading
   right, or did you mean harder deadlines? (§1)
2. **Palette** — deferred until there are screens to judge.
3. **Villager voices** — blips, or strictly ambient? (§5)
4. **Working title** — none yet.

---

## Decisions log

| Date | Decision |
|---|---|
| 2026-09-14 | Questionnaire answered; this brief written from it. |
| 2026-09-14 | Engine: Godot 4, on my recommendation. Prototyping the character system on the web first. |
| 2026-09-14 | Star sign derived from birthday rather than chosen separately. |
| 2026-09-14 | One character record + one renderer serves player, family and all villagers. |
