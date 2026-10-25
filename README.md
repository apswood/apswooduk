# apswood.uk

This repository is the source for [www.apswood.uk](https://www.apswood.uk/), my interactive CV
and portfolio. The site's content is personal. This README is for anyone interested in what's
under the bonnet: how the site is built, checked, and deployed, and how AI agents contribute to it.

This repository isn't intended as a template. A reusable version with the architecture and
checks but none of the personal content may follow.

## Purpose

The project has three aims:

1.  Make a CV that's more fun than a traditional one, with things to discover along the way,
    while stating plainly whether I led, co-led, contributed to, or supported each outcome.
2.  Serve as a working exercise in scripting, static-site tooling, and AI-assisted development.
3.  Keep the overhead low enough that an AI agent can make, check, and commit a change safely.

To meet the third aim, the site has no server, database, framework, third-party scripts, or
cookies. Everything is plain text that standard tools can read and check.

## Architecture

```
data/*.yaml, content/**/*.md       Single source of content
            |
            v
Hugo templates (layouts/)  ---->  public/  (HTML, CSS, JS, fonts)
            |
scripts/    checks run before and after the build
            |
            v
push to master --> GitHub Actions: checks and CodeQL
               --> Cloudflare Workers Builds: checks, build, deploy as static assets
```

| Layer | What it does | Location |
|---|---|---|
| Content data | Roles, outcomes, lessons, skills, certifications, and profile | `data/*.yaml` |
| Pages | Case studies, thought posts, and section introductions | `content/` |
| Templates | Plain Hugo layouts and partials, with no theme dependency | `layouts/` |
| Styles and scripts | Plain CSS and small vanilla JavaScript files, minified and fingerprinted by Hugo Pipes | `assets/` |
| Static files | Self-hosted fonts, optional easter egg scripts, headers, and redirects | `static/` |
| Checks | Content lint, publish gate test, and a scan of the built site | `scripts/` |
| Hosting | Cloudflare serves `public/` as static assets | `wrangler.jsonc`, `static/_headers` |

The design has these properties:

-   **One source, several views.** The same YAML drives the Experience page, the theme filters,
    and the printable CV, so changing a claim updates all of them.
-   **Progressive enhancement.** The site works without JavaScript. The route map, carousels,
    themes, and lens toggle are layered on top of plain lists and links.
-   **Same-origin only.** The content security policy in `static/_headers` allows only the site's
    own scripts, styles, fonts, and images.
-   **Pinned toolchain.** `scripts/ci-build.sh` installs Hugo 0.168.0 and verifies its checksum,
    so every build uses the same version.

The site also has optional easter eggs. They're lazy-loaded from `static/js/eggs/`, listed in
`data/eggs.yaml`, hidden in print, and switched off by the toggle in the footer.

## Content workflow

### Add a case study or thought post

1.  Run `hugo new experience/SLUG.md`.
2.  Fill in the front matter and write the body as prose.
3.  For a thought post, set `kind: "thought"` and add a `summary`. Thought posts don't need an
    attribution.
4.  Set `weight` to place the card. Lower numbers appear first, and each page has a unique weight.
5.  Keep `publish` and `build.render` in step. To publish, set `publish: true` and delete the
    `build:` block.

Themes are defined in `data/themes.yaml`. To add a card to the default Highlights theme, set
`highlight: true`.

### Approve a claim

Every outcome in `data/experience.yaml` needs an `attribution` of `Led`, `Co-led`,
`Contributed`, or `Supported`. An outcome renders only when it has `publish: true`. A role
summary renders only when the role has `publish_summary: true`.

A role can also list `learnt` items, with `kind: lesson` or `kind: skill`, plus `lenses`,
`capabilities`, and `publish`. These items have no attribution, render under the outcomes as
"What I took away", and join themes by capability and lens. To add one item per role to
Highlights, set `highlight: true` on it.

New content defaults to `publish: false`, and nothing is published until I approve it.

## Quality gates

The checks are code that runs on every build. A build fails if any of the following is true:

-   An outcome or case study has a missing or invalid attribution.
-   A `learnt` item has an invalid `kind`, has an attribution, or is the second highlighted item
    in its role.
-   A page's `publish` flag and build settings disagree.
-   The source or the built site contains an em dash, banned filler words, or banned brand terms.
-   Placeholder text such as `TODO(andrew)` would be visible to a visitor.
-   An unpublished outcome, lesson, or case study appears anywhere in the built site.
-   The built site loads a third-party script or stylesheet, or uses cookies.

## Working with AI agents

The repository is designed to run on a local clone linked to a Claude session. A change can be
requested from anywhere, including a phone, and the agent edits the files, runs the checks in
`scripts/`, commits, and pushes. Every push then goes through the same quality gates before
Cloudflare deploys it, and the repository holds no credentials or deploy keys.

Agents can draft content, but I review every change and approve anything that goes live.

For transparency, every commit an agent contributes to carries a `Co-Authored-By` trailer that
names the model. The commit history keeps that attribution, in the same way the site attributes
each outcome. Commits I made alone carry no trailer.

## Deployment

Cloudflare builds and deploys the site on every push to `master`. If a check fails, the build
fails and nothing is deployed. For settings, custom domains, and rollback, see
[docs/DEPLOY.md](docs/DEPLOY.md).

## Project history

-   `TICKETS.md` and `REVIEW.md`: the original build plan and review.
-   `IMPROVEMENTS.md`: an earlier improvement list from when the site was hosted on S3.
-   `OPEN_ITEMS.md`: every `TODO(andrew)` in the source, regenerated by
    `scripts/check-content.sh`.

## Licence

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).
