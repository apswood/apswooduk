#!/usr/bin/env bash
# Publish gate test. Uses temporary sample case studies, so it does not depend on what is currently published.
# 1. A published sample must render on the Experience page.
# 2. An unpublished sample (with the hidden build settings) must appear nowhere in the output.
cd "$(dirname "$0")/.." || exit 1
T=$(mktemp -d); trap 'rm -rf "$T" content/experience/zz-test-pub.md content/experience/zz-test-unpub.md' EXIT
cat > content/experience/zz-test-pub.md <<'SAMPLE'
---
title: "Zz sentinel published"
attribution: "Led"
role_line: "Sample role line"
lenses: [hands-on]
capabilities: [zz-test-capability]
sector: "Test"
status: "Complete"
lesson: "Sample lesson"
publish: true
---
Sample body.
SAMPLE
cat > content/experience/zz-test-unpub.md <<'SAMPLE'
---
title: "Zz sentinel unpublished"
attribution: "Led"
role_line: "Hidden sample"
lenses: [hands-on]
capabilities: [zz-hidden-capability]
sector: "Test"
status: "Complete"
lesson: "Hidden"
publish: false
build:
  render: never
  list: never
---
Hidden body.
SAMPLE
hugo --destination "$T/out" >/dev/null || { echo "FAIL: build with samples"; exit 1; }
grep -q "Zz sentinel published" "$T/out/experience/index.html" || { echo "FAIL: published case study not rendered"; exit 1; }
if grep -rqE "Zz sentinel unpublished|zz-hidden-capability" "$T/out"; then echo "FAIL: unpublished content leaked"; exit 1; fi
echo "publish gate test passed"
