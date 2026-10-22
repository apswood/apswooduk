# Deploying with Cloudflare

Every push to `master` triggers a Cloudflare build. It runs the publish-gate test and `scripts/prepublish-check.sh`, then builds with Hugo. If a check fails the build fails and nothing is deployed. `.github/workflows/ci.yml` runs the same checks in GitHub so pull requests show a pass or fail.

## Settings (Workers Builds)
- **Repository / branch:** `apswood/apswooduk`, branch `master`.
- **Build command:** `bash scripts/ci-build.sh`
- **Deploy command:** `npx wrangler deploy` (reads `wrangler.jsonc`, which serves `public/` as static assets). Non-production branches run `npx wrangler preview` instead, which needs the empty `previews` block that `wrangler.jsonc` already has.
- **Environment variable:** none needed. `scripts/ci-build.sh` installs the pinned Hugo (0.168.0, checksum verified) itself.

If you use Cloudflare Pages instead, there is no deploy command. Use the same build command, set the output directory to `public`, and set `HUGO_VERSION`. In that case `wrangler.jsonc` is not needed.

## What the repo provides
- `static/_headers` becomes `public/_headers`: security headers, a same-origin-only content security policy, and long caching for fingerprinted CSS and JS.
- `wrangler.jsonc`: serves `public/` and returns the standalone `404.html` for unknown URLs.
- After the first deploy, open the site with the browser console open and check for CSP errors.

## Custom domain
- Add `www.apswood.uk` under the project's Domains. If DNS is not on Cloudflare, add the CNAME it shows at your DNS host.
- The bare `apswood.uk` needs the domain's DNS on Cloudflare, so use `www` first.
- Switch DNS last, after the `*.workers.dev` or `*.pages.dev` address looks right. The old S3 site keeps serving until DNS changes.

## Rolling back
Use the deployment history in Cloudflare to roll back, or revert the commit on `master` and push.

## If a build fails
Open the build log. `prepublish checks FAILED` lines list each blocker: visible placeholder text, an em dash, a banned term or a third-party script. If `hugo: command not found` appears, set `HUGO_VERSION`.
