# Stage 5 review against section 9

Run `bash scripts/prepublish-check.sh` for the automated part. It builds the site and checks the built output.
Status: **not ready to publish**, only because placeholders are still visible (see blockers). Nothing else failed.

## Checklist

| Item | Result | How it was checked |
|---|---|---|
| Every claim comes from data or a case study, has an attribution tag and `publish: true` | Pass (nothing is published yet) | `check-content.sh` validates attribution on every outcome and case study, published or not. The build fails on a bad attribution for a published item. `test-publish-gate.sh` proves unpublished items never reach the HTML, sitemap or JSON. |
| Role summaries are claims too | Fixed in this stage | Role summaries rendered regardless of `publish`. They now render only when the role has `publish_summary: true`. |
| No placeholder text visible | **Blocker** | `prepublish-check.sh` finds `TODO(andrew)` on Home, Approach, Off the clock and CV. `OPEN_ITEMS.md` lists all of them. |
| No customer or colleague names, no unapproved internal metrics, no personal data | Pass | Figures and team sizes were generalised before the repository was made public. No email, phone or postcode anywhere. LinkedIn is the only contact route. |
| No em dashes | Pass | Source scan and built-output scan. |
| No roundel, New Johnston, Tube map, TfL moquette, Oyster, reproduced dialogue, characters or music | Pass | Term scan of built output and source. The font licence note was reworded so it no longer names a TfL typeface. Sounds are generated in the browser. No audio files. |
| Every egg works by keyboard | Pass in code and spot checks | All egg controls are buttons or links. The graph nodes and board gain `tabindex` only when their egg starts. Detector is pointer-only, finds are reachable by keyboard. |
| Eggs respect reduced motion | Pass in code | Global `prefers-reduced-motion` rule, plus JS checks in the board, pause, terminal `answer`, Alert Storm, dig scroll and Retro badge. Not tested with a real OS setting. |
| Nothing flashes more than three times a second, moving content over five seconds has a pause | Fixed in this stage | Retro mode blinks stopped after about four seconds. Alert Storm has a pause control. |
| Serious mode turns every egg off | Pass | Eggs do not load in Serious mode. Loaded eggs stop on the `aw:serious` event. Egg pages, the 404 extras and the egg index show a notice instead. |
| Eggs absent from the printed CV | Pass in CSS, not visually checked | Print rules hide every egg surface, including the dig, terminal, piano, notice, thoughts and Retro elements. |
| Professional content reads with JavaScript off | Pass | Built HTML contains every role and the career line. Lens, filter and controls are hidden without JS and everything shows in default order. |
| 404 works as the S3 error document | Pass | Standalone page with inline CSS and JS, absolute `/fonts/` path, tested at a path that does not exist. Andrew must set the bucket error document to `404.html`. |
| WCAG 2.2 AA | Pass on automated scan | axe-core 4.10.2 with WCAG 2 A, AA, 2.1 and 2.2 AA rules: no violations on Home, Experience, Work, Approach (monologue on), Off the clock (piano open), Status, Improve, Connections, Rehearsal, 404 (Alert Storm running), Experience in the light theme with the Dig and terminal open, and Home in Retro mode after the fix below. |
| No cookies, trackers or third-party scripts | Pass | Built-output scan. The only external link is LinkedIn. The Railway Sans files are self-hosted. |
| Eggs load only when needed | Pass | First page carries footer markup and two small scripts. Egg code and JSON load on demand. |
| Egg counter works if storage is unavailable | Pass in code | In-memory fallback. |
| `README.md` explains the four tasks | Pass | Case study, approving a claim, terminal command, dig find. |

## Fixed in this stage
- Role summaries were visible regardless of `publish`. Added `publish_summary`.
- Retro "NEW!" badge dipped below AA contrast mid-blink, and blinked without end. Now two high-contrast colours, four seconds.
- Print CSS did not cover the dig, terminal, piano, notice and Retro elements.
- Hugo generated empty tag and category pages and put them in the sitemap. Disabled.
- The improvement plan page title read as a joke. Now "Proposal".
- Font licence note named a TfL typeface. Reworded.

## Not verified
- Real screen reader behaviour, keyboard-only walkthrough by a person, and the OS reduced-motion setting.
- Print output and page count. The CV is two pages only once real content replaces the placeholders.
- Audio output (detector tone, tenor voice).
- The S3 bucket setting itself.
- History: no check could prove that a customer or colleague name was never committed. Search git history before publishing if that matters.

## Decisions for Andrew
1. Approve or rewrite every `TODO(andrew)`, then set `publish: true` (outcomes) and `publish_summary: true` (roles).
2. Team sizes and exact figures are kept generic in this public repository. Keep it that way when you edit.
3. Confirm the S3 error document is `404.html`.
4. Run your AI-writing audit over the copy, including the humour pages.
5. Read the Dig's River Fleet caption against a source.
