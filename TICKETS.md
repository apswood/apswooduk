# Tickets: interactive CV and portfolio

> Historical document, written when the site was hosted on S3 and deployed from a workflow. Hosting is now Cloudflare, so ignore the S3, Amplify and workflow-deploy items here. See `docs/DEPLOY.md`.

Source: the "Andrew Wood interactive CV and portfolio" brief (section numbers below refer to it).
Status key: `todo`, `blocked` (needs Andrew's answer), `done`.
Agent key: **content** (data, copy, placeholders), **frontend** (Hugo templates, CSS), **js** (vanilla JS, no deps), **a11y** (WCAG 2.2 AA review), **art** (original SVG/illustration), **qa** (review against section 9).

Review stops after each stage. Nothing is published. Hosting, bucket, DNS and deployment are not touched.

## Decisions needed before Stage 1 (see "Open questions")

## Stage 0: Carry-over from the earlier pass
| ID | Ticket | Agent | Status |
|---|---|---|---|
| T-001 | Re-run the inspector and fix: tablet blank gap, focal point at 768px, phone hero headline, measure cap, body size. Note: T-020 restyles the site, so only fix what survives the restyle. | frontend | blocked on Q1 |
| T-002 | Decide the fate of `.github/workflows/deploy.yml`. The brief says keep deployment exactly as is and that Andrew deploys. The workflow was added earlier at the user's request. Options: keep as manual-only (`workflow_dispatch`), move to `docs/`, or delete. | content | blocked on Q2 |
| T-003 | Remove the placeholder Work entries and the invented "Software engineer, United Kingdom" line. Replace with `TODO(andrew)` markers. | content | todo |

## Stage 1: Content structure and placeholders (sections 2, 3, 7, 8)
| ID | Ticket | Agent | Depends |
|---|---|---|---|
| T-101 | Data schema in `data/`: `profile.yaml`, `experience.yaml`, `certifications.yaml`, `skills.yaml`, `interests.yaml`. Outcomes carry `text`, `attribution`, `lenses`, `capabilities`, `publish`. Certifications carry `status`. | content | Q3 |
| T-102 | Case-study archetype (`archetypes/case-study.md`) with the front matter from section 3, plus the four-part body shape (situation, what was Andrew's, what changed, lesson). Add placeholder case studies only, all `publish: false`. | content | T-101 |
| T-103 | Hugo build guard: a partial that renders only `publish: true` items, and fails the build or prints a warning for any outcome missing `attribution`. | frontend | T-101 |
| T-104 | Page skeletons: Home, Experience, Work, Approach, Off the clock, Contact, printed CV route. Hidden pages `/status/`, 404, egg index excluded from nav, sitemap and search (`noindex`). | frontend | T-101 |
| T-105 | Draft Approach page (three themes: two-way service transition seam, data first then automation, people in the loop on AI). Marked `TODO(andrew): review`. | content | T-104 |
| T-106 | Draft Off the clock from section 7 facts only. Marked `TODO(andrew)`. Never claim Spanish fluency or a level. | content | T-104 |
| T-107 | Placeholder policy: `OPEN_ITEMS.md` generated or maintained listing every `TODO(andrew)`. Add a script that greps for them and for em dashes and banned filler words. | content | T-101 |
| T-108 | Obfuscated email and LinkedIn link on Contact, working without JS where possible. No forms. | js | T-104 |
| T-109 | "Last reviewed" date in the footer, read from data. | frontend | T-101 |
| T-110 | Confidentiality lint: fail on a configurable blocklist of customer and colleague names (blocklist kept outside the repo or git-ignored). | content | T-107 |

Stage 1 report: what changed, open placeholders, decisions needed.

## Stage 2: Visual style and core pages (sections 4, 5.4 to 5.6, 2.5)
| ID | Ticket | Agent | Depends |
|---|---|---|---|
| T-201 | Design tokens: Midsummer (light) and Polar night (dark), system default, manual override, remembered in `localStorage` with try/catch. AA contrast checked for every pairing. | frontend | Q1 |
| T-202 | Typography: Railway Sans (self-hosted, open licence, reserved name "Railway" kept), a humanist sans for body, a monospace for the terminal only. 60 to 75 character measure. | frontend | Q4 |
| T-203 | Layout: single column on mobile, restrained two-column on wide, no horizontal scroll at 320px. Optional faint timber or original moquette-style pattern on footer and dividers. | frontend, art | T-201 |
| T-204 | Career line diagram as SVG: Beck-style horizontal, vertical and 45-degree lines, station ticks, an interchange for the Carrenza to Six Degrees integration, enamel-style nameboards on hover and focus. No-JS fallback is an ordered list. Original artwork only, no Tube map or roundel. | art, js | T-101 |
| T-205 | Hero: headline, three-sentence summary (placeholder), and departure board "Calling at: Cloud, Data, Connectivity, Unified Comms, Workplace". Static under reduced motion. | frontend | T-104 |
| T-206 | Experience and Work pages with attribution tags and status labels plus the one-line explainer for each tag. | frontend | T-103 |
| T-207 | Print stylesheet and print route: two clean pages, no humour, no eggs. | frontend | T-206 |
| T-208 | Serious mode switch (visible, remembered, gates every egg at load time). Provide the shared `eggs.js` loader contract: lazy-load, `data-egg` registry, found-counter API. | js | T-104 |
| T-209 | Accessibility baseline: focus states, skip link, landmarks, reduced-motion media query tokens, JS-off reading test. | a11y | T-206 |
| T-210 | Page titles, meta descriptions and link previews are plain and humour-free. | content | T-104 |

## Stage 3: Core interactive features (section 5)
| ID | Ticket | Agent | Depends |
|---|---|---|---|
| T-301 | Lens toggle: Balanced (default), Operating model, Hands-on. Reorders only; same claims. Reflected in `?lens=` and shareable. Works without JS (default order). | js | T-206 |
| T-302 | Capability filter on Work, keyboard accessible, URL-reflected, no-JS shows all. | js | T-206 |
| T-303 | Printed CV reads from the same data and honours lens via query at build or print time. | frontend | T-207, T-301 |
| T-304 | Hugo test pass: build with all data `publish: false`, then with sample data, confirm nothing unpublished leaks into HTML, RSS, sitemap or JSON. | qa | T-103 |

## Stage 4a: Must-have easter eggs (section 6a). Each: trigger, behaviour, exit, keyboard, reduced motion, Serious-mode off.
| ID | Ticket | Agent | Depends |
|---|---|---|---|
| T-401 | Terminal: backtick and footer `>_`, history, tab completion, `Esc` to close, full command table from 6a, reads profile and experience data. `integrity-check` counts real tags from the DOM or data. | js | T-208 |
| T-402 | Signal box on the career line: four aspects with pedantic captions, green message "Route set. Points locked. Proceed." | js, art | T-204 |
| T-403 | Departure board announcements (timed and on hover), static under reduced motion, pause control for anything over five seconds. | js | T-205 |
| T-404 | Dig: original strata illustrations (paving, ducts, Victorian sewer, River Fleet with a factual caption, deep tunnel, London Clay), detector cursor, opt-in low-volume tone, finds log, closing line. Finds defined in data so README can document adding one. Verify the Fleet caption facts before use. | art, js | T-208 |
| T-405 | `/status/` page: components table, deadpan harmless incident history, 25 May towel logic (date-checked client side). | frontend, content | T-104 |
| T-406 | 404 page as standalone (no shared JS dependency for core text), "Signal failure at this location.", home link, "Don't panic.", Spanish line with "Babel fish not installed" toggle, Alert Storm game (30 seconds, P1 to P4 or noise, pause, no timer under reduced motion). Flag the S3 error-document setting, do not change it. | frontend, js | T-208 |
| T-407 | "Improve this CV" plan page: hand-drawn chart, single-risk register, escalating plan, ends "Status: Approved by me. Implementation pending." Linked from the footer. | content, art | T-104 |
| T-408 | Eggs-found counter (browser storage with a fallback when unavailable), egg index unlocked after three finds, polite screen-reader announcements for discoverable eggs and `aria-hidden` for decorative ones. | js, a11y | T-208 |

Stage 4a report, then review.

## Stage 4b: Stretch eggs (section 6b)
| ID | Ticket | Agent |
|---|---|---|
| T-501 | The rehearsal flowchart and "Run it again" (five runs, then "We are now over-prepared.") | js, content |
| T-502 | Awkward pause on first Contact open (once per session, off under reduced motion and Serious mode) | js |
| T-503 | Laminated notice (`cat notice.txt` and Approach pin icon), original text, no borrowed catchphrase | content, js |
| T-504 | Interconnectedness map, with a no-JS list fallback | art, js |
| T-505 | Retro mode via the Konami code, original design, `Esc` restores, AA contrast, "Ask Andrew" page | frontend, js |
| T-506 | Keyboard piano with the ii-V-I unlock, opt-in sound, mute button, original synthesised voices only | js |
| T-507 | View-source ASCII comment and first-find timestamp in the egg index | js |
| T-508 | Inner monologue mode on Approach (off by default, up to five asides) | content, js |

## Stage 5: Review against section 9
| ID | Ticket | Agent |
|---|---|---|
| T-601 | Claims audit: every claim from data, tagged, `publish: true` | qa |
| T-602 | Banned-content scan: em dashes, filler words, roundel, New Johnston, Tube map, TfL moquette, Oyster, reproduced dialogue, third-party scripts, cookies | qa |
| T-603 | WCAG 2.2 AA audit of every egg, keyboard-only run, reduced-motion run, JS-off run, 320px run | a11y |
| T-604 | Confirm eggs are absent from print and from Serious mode, and that first-page weight is unaffected by egg code | qa |
| T-605 | 404 works as the S3 error document (test via `hugo server` 404 and a note on bucket settings) | qa |
| T-606 | `README.md`: add a case study, approve a claim, add a terminal command, add a dig find. Final `OPEN_ITEMS.md` | content |

## Open questions (answers needed before Stage 1)
1. **Visual direction.** The current site uses the taste skill's "Boska on white, mint and orange" look. The brief wants calm Nordic (birch, soft charcoal, one fjord or moss accent) with Railway Sans. I propose replacing the current look and reusing only the large-type hero idea and layout discipline. Agree?
2. **Deploy workflow.** The brief says keep deployment as is and that Andrew deploys. The existing `.github/workflows/deploy.yml` auto-deploys on push to `master`. Make it manual-only, move it out of `.github/`, or delete it?
3. **Source data.** Please supply (or confirm I leave as `TODO(andrew)`): role history with dates (Carrenza, Six Degrees and earlier), approved headline and three-sentence summary, customer descriptions, and which metrics are `publish: true`. The September 2013 start date for `uptime` is in the brief.
4. **Fonts.** Railway Sans must be self-hosted with its reserved name intact. Do you have a preferred source or licence file, or should I locate the open-licence release myself and record its licence in the repo?
5. **Sound.** Detector tones and the piano voice would be synthesised in the browser (Web Audio), with no audio files. OK?
6. **Branching.** Work each stage on a branch (`stage-1-content`, and so on) and leave `master` untouched until you approve?
7. **Existing content.** The old "First post" and About text were placeholder-level. Keep, or replace with the new pages?

## Status after Stage 5
Stages 1 to 5 are built on branches `stage-1-content` to `stage-5-review`, each branched from the previous one. See `REVIEW.md`. Remaining work is Andrew's: approve content, clear `OPEN_ITEMS.md`, confirm the S3 error document, and merge and deploy.
