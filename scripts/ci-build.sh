#!/usr/bin/env bash
# Build entry point for Cloudflare (and anywhere else). Installs the pinned Hugo if the one on PATH is
# not that version, runs the checks, then builds. Does not rely on a HUGO_VERSION setting in the host.
set -euo pipefail
cd "$(dirname "$0")/.."

HUGO_VERSION=0.168.0
HUGO_SHA256=787f100057328824f38c6ad7c87ff10d6451ae0a7bc39cedaad0dd2bcde17e53

if ! hugo version 2>/dev/null | grep -q "v${HUGO_VERSION}"; then
  echo "Installing Hugo ${HUGO_VERSION}"
  mkdir -p .hugo-bin
  curl -sSL -o .hugo-bin/hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"
  echo "${HUGO_SHA256}  .hugo-bin/hugo.tar.gz" | sha256sum -c -
  tar -xzf .hugo-bin/hugo.tar.gz -C .hugo-bin hugo
  rm .hugo-bin/hugo.tar.gz
  export PATH="$PWD/.hugo-bin:$PATH"
fi
hugo version

bash scripts/test-publish-gate.sh
bash scripts/prepublish-check.sh
hugo --minify --gc
