# Improvement list

> Historical document, written when the site was hosted on S3 and deployed from a workflow. Hosting is now Cloudflare, so ignore the S3, Amplify and workflow-deploy items here. See `docs/DEPLOY.md`.

Done in this pass: new Hugo layouts (no theme dependency), Boska typography, work ledger driven by `data/projects.yaml`, credited imagery, dark contact section, reduced-motion support, GitHub Actions deploy (`.github/workflows/deploy.yml`).

## CI / deployment (set up once)
1. Create an IAM OIDC identity provider for `token.actions.githubusercontent.com` and a role limited to `s3:ListBucket`, `s3:PutObject`, `s3:DeleteObject` on `www.apswood.uk` (plus `cloudfront:CreateInvalidation`). Trust only `repo:apswood/apswooduk:ref:refs/heads/master`.
2. In the GitHub repo add secret `AWS_ROLE_ARN` and (optional) variable `CLOUDFRONT_DISTRIBUTION_ID`. Check the region in the workflow matches the bucket.
3. Push to `master`: the workflow builds, then syncs to S3. Pull requests build only.

## Infrastructure
- Put CloudFront in front of the bucket for HTTPS (the site is currently `http://` only), HTTP/2, caching and a custom 404. Use an ACM certificate in us-east-1.
- Set long `Cache-Control` for fingerprinted CSS and short for HTML (two `aws s3 sync` passes with `--cache-control`).
- Define the bucket, CloudFront and IAM role as code (Terraform or CDK) so the setup is reproducible.
- Add a security-headers response policy (HSTS, `X-Content-Type-Options`, a CSP).

## Site
- Replace the placeholder Work entries in `data/projects.yaml` with real projects, screenshots and write-ups.
- Self-host Boska (Fontshare licence permitting) to remove the third-party font request.
- Add a real photo set of your own cycling and photography work; the current pictures are open-licence stand-ins.
- Add an `og:image`, a sitemap check and a link checker (`lychee`) in CI; add Lighthouse CI with a budget.
- Write more posts; add tag pages and an RSS link in the footer.
- Add a 404 design and a `now` page.
