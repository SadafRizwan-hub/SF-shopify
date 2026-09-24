#!/usr/bin/env bash
#
# Packages theme/ into a ZIP that Shopify's "Upload zip file" accepts.
#
# Shopify expects layout/, templates/, sections/ … at the ZIP's ROOT, so this
# zips the *contents* of theme/, not the directory itself.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/dist/sf-shopi-theme.zip"

if [ ! -f "$root/theme/layout/theme.liquid" ]; then
  echo "theme/layout/theme.liquid is missing — is this the repository root?" >&2
  exit 1
fi

mkdir -p "$root/dist"
rm -f "$out"

cd "$root/theme"
zip -r -q "$out" . \
  -x '*.DS_Store' \
  -x '__MACOSX/*' \
  -x 'README.md'

echo "wrote $out"
unzip -l "$out" | tail -n 1
