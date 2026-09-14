# Cozy game (working title pending)

A solo, top-down, pixel-art island life sim in the Animal Crossing tradition —
about slowly making a house and an island into somewhere that is finally
right — with a family line, and twenty-odd human neighbours who never move
away.

No combat. No losing.

## Where things are

| Path | What it is |
|---|---|
| `docs/design/brief.md` | **The design brief.** Read this first. |
| `docs/design/questionnaire.html` | The questionnaire the brief was written from |
| `docs/design/character-creator.html` | Character creator prototype |
| `src/character/sprite.js` | The character record + pixel renderer. Draws the player, their family, and every villager |
| `src/character/villagers.js` | The 24 neighbours — authored faces, jobs, personalities and lines |

## Status

Character system prototyped and playable. Next milestone: a tiny walkable
village — move around, talk to one neighbour.

Target engine is Godot 4; `sprite.js` is a web prototype written to port.
