# Vendored design skills

Third-party Claude Code skills, copied in so every session on this project
picks them up. Both sources are MIT licensed.

| Skill | Triggers as | Source |
|---|---|---|
| `ui-ux-pro-max` | `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) @ `7f69fed` |
| `design-system` | `design-system` | same |
| `taste-skill` | `design-taste-frontend` | [leonxlnx/taste-skill](https://github.com/leonxlnx/taste-skill) @ `ccbc156` |
| `soft-skill` | `high-end-visual-design` | same |
| `minimalist-skill` | `minimalist-ui` | same |
| `redesign-skill` | `redesign-existing-projects` | same |

## What they are

`ui-ux-pro-max` is the substantial one: a searchable local corpus — 79 styles,
192 product palettes with reasoning profiles, 74 font pairings, 119 UX
guidelines, 105 icons, 17 GSAP presets, 25 chart types and 22 stacks — plus
Python search scripts over it. Everything is local; nothing is fetched at use
time.

The taste skills are prose: opinionated direction on spacing, type scale,
motion and the specific defaults that make generated UI look generated.

## What was deliberately left out

Both repos ship more than this. The rest was skipped because a dozen
overlapping "design" descriptions compete to auto-trigger and make each other
worse, not because anything was wrong with them:

- **from ui-ux-pro-max** — `design`, `brand`, `banner-design`, `slides`,
  `ui-styling`. `design` additionally calls third-party AI image APIs
  (`api.muapi.ai`, `api.atlascloud.ai`) for logo and icon generation, which
  needs your own keys and sends prompts off-box. `ui-styling` is 5.5 MB of
  canvas poster fonts and shadcn guidance, and this project uses neither.
- **from taste-skill** — `brandkit`, `image-to-code`, `imagegen-frontend-web`,
  `imagegen-frontend-mobile`, `stitch-skill`, `gpt-tasteskill`, `output-skill`,
  `brutalist-skill`, `taste-skill-v1`. Several target other tools (Google
  Stitch, Codex, GPT) or the wrong aesthetic for a wedding.

Adding any of them back is a copy from the upstream repo into this folder.

## Before trusting them further

Both were read and scanned before installing: no credential access, no
instruction-override phrasing, no outbound calls from the skills installed
here. Re-check on any upgrade — a skill's text steers the agent, so a diff
here deserves the same scrutiny as a diff in `app/`.
