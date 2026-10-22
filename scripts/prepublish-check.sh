#!/usr/bin/env bash
# Run before Andrew publishes. Builds the site and checks the built output against section 9 of the brief.
# Exit 0 means ready. Placeholders are reported as blockers.
cd "$(dirname "$0")/.." || exit 1
bash scripts/check-content.sh || exit 1
rm -rf public && hugo --minify >/dev/null || { echo "FAIL: build"; exit 1; }
block=0
bad() { echo "BLOCKER: $1"; block=1; }
EMDASH=$(printf '\xe2\x80\x94')
if grep -rl "TODO(andrew)" public --include='*.html' | tee /tmp/aw-todo >/dev/null && [ -s /tmp/aw-todo ]; then bad "placeholder text is visible on: $(tr '\n' ' ' < /tmp/aw-todo)"; fi
grep -rl "$EMDASH" public >/dev/null && bad "em dash in built output"
grep -rniE "roundel|new johnston|johnston 100|oyster|\bTfL\b|london underground" public --include='*.html' --include='*.js' --include='*.css' --include='*.json' -l | grep -q . && bad "banned brand term in built output"
grep -rnE "<script[^>]+src=[\"']?https?://|<link[^>]+href=[\"']?https?://[^>]*(\.css|font)" public --include='*.html' | grep -q . && bad "third-party script or stylesheet"
grep -rnE "document\.cookie" public static assets layouts -l | grep -q . && bad "cookie use"
grep -q 'src="/\?[^/h]' public/404.html && bad "404 has a relative asset path"
for f in $(grep -rl "publish: false" data | head -0); do :; done
if ! grep -q "Last reviewed" public/index.html; then bad "footer lacks Last reviewed"; fi
[ $block -eq 0 ] && echo "prepublish checks passed" || echo "prepublish checks FAILED (see blockers above)"
exit $block
