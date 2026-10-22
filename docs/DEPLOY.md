# Deploying with AWS Amplify Hosting

Every push to `master` triggers an Amplify build. Amplify reads `amplify.yml` from the repo, installs a pinned Hugo 0.168.0 (checksum verified), runs the publish-gate test and `scripts/prepublish-check.sh`, builds with `hugo --minify --gc`, and publishes `public/`. If any check fails the build fails and nothing is deployed. `.github/workflows/ci.yml` runs the same checks in GitHub so pull requests show a pass or fail.

## Console settings
- Repository: `apswood/apswooduk`, branch `master`, not a monorepo.
- Framework: None. Leave the console build command alone. `amplify.yml` overrides it.
- Build image: default. Instance: Standard. No environment variables are needed.
- SSR: disabled. Cookies in cache key: not enabled.

## Rewrites and redirects (set in the console)
Under Hosting, then Rewrites and redirects, add one rule so unknown URLs show the site's own 404 page:

| Source | Target | Type |
|---|---|---|
| `/<*>` | `/404.html` | `404 (Rewrite)` |

Hugo already writes `/404.html`, and it is a fully standalone page.

## Headers
`customHttp.yml` sets HSTS, nosniff, frame, referrer and permissions headers, a same-origin-only content security policy, and long cache lifetimes for fingerprinted CSS and JS. After the first deploy, open the site with the browser console open and confirm there are no CSP errors.

## Custom domain
1. In Amplify, open Hosting, then Custom domains, and add `apswood.uk`, with `www` as a subdomain.
2. Amplify issues the certificate and shows DNS records. If the domain is in Route 53 it can create them for you. Otherwise add the records at the registrar.
3. Cut over last, once the `*.amplifyapp.com` address looks right. The S3 bucket keeps serving until DNS changes, and you can switch back by restoring the old record.

## Previews
Turn on pull request previews in the Amplify console if you want one URL per pull request. They are not required.

## Rolling back
In Amplify, open the app, then the branch, and redeploy an earlier build. Or revert the commit on `master` and push.

## If a build fails
Open the build log in Amplify. The `prepublish checks FAILED` lines list each blocker, such as visible placeholder text, an em dash, a banned term or a third-party script.
