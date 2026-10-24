# apswood.uk

Interactive CV and portfolio, built with Hugo (extended). Deployed by Cloudflare, see `docs/DEPLOY.md`. `TICKETS.md` and `REVIEW.md` are the historical build plan and review.

```
hugo server                    # local preview
bash scripts/check-content.sh  # lint content and regenerate OPEN_ITEMS.md
hugo --minify                  # build into public/
```

## Adding a case study or thought post
`hugo new experience/my-case-study.md`, fill in the front matter, write prose. For a thought post set `kind: "thought"` and a `summary`; it needs no attribution. Both appear as cards on the Experience page (themes are defined in `data/themes.yaml`; `highlight: true` puts a card in the default Highlights theme). Keep `publish` and `build.render` in step (`publish: true` means remove the `build:` block).

## Approving a claim
In `data/experience.yaml`, set `publish: true` on an outcome that has a valid `attribution` (Led, Co-led, Contributed, Supported). Unpublished items are never rendered. A role can also carry `learnt` items (`kind: lesson` or `kind: skill`, plus `lenses`, `capabilities` and `publish`). They have no attribution, render under the outcomes as "What I took away", join themes by capability and lens, and can join Highlights with `highlight: true` (at most one per role).

## Easter eggs (Stage 4a)
All eggs are lazy-loaded from `static/js/eggs/`, switched off when Easter Egg mode is turned off (footer toggle) and hidden in print. The egg list is `data/eggs.yaml`.

- **Add a terminal command:** in `static/js/eggs/terminal.js`, add its name to `COMMANDS` and a `case` in `run()`. Data it needs goes in `layouts/partials/egg-data.html`, which publishes `/terminal.json`.
- **Add a dig find:** append to `finds` in `data/dig.yaml` (stratum id, x and y percentages, name, caption). If it needs a new icon, add an entry to `icons` in `static/js/eggs/dig.js`.
- **Status page:** edit `data/status.yaml`.
- **404 page:** `layouts/404.html` is fully standalone (inline CSS and JS). Hugo builds it to `404.html`. Set that as the bucket's error document. Do not change the bucket setting from this repository.
- **Reset your own progress:** clear the `aw-found` key in the browser's local storage.

## Stretch eggs (Stage 4b)
Rehearsal flowchart: `data/rehearsal.yaml`. Notice text: `data/notice.yaml`. Connections graph: `data/connections.yaml`. Retro mode (Konami code), the keyboard, the awkward pause and the inner monologue asides live in `static/js/eggs/`. The ASCII note at the top of the page source is in `layouts/_default/baseof.html` and needs `keepComments` in the Hugo minify settings, which `hugo.toml` sets.

## Before publishing
Run `bash scripts/prepublish-check.sh`. It reports every blocker (visible placeholders, em dashes, banned terms, third-party scripts, cookies). `REVIEW.md` holds the Stage 5 review. `OPEN_ITEMS.md` lists every `TODO(andrew)`.

To publish a role summary set `publish_summary: true` on the role in `data/experience.yaml`. To publish an outcome set `publish: true` on it. Both need your approval first. Deployment is by Cloudflare, see `docs/DEPLOY.md`.

## Deployment
Deployed by Cloudflare on every push to `master`. Headers: `static/_headers`. Asset config: `wrangler.jsonc`. Setup, rollback and settings: `docs/DEPLOY.md`.
