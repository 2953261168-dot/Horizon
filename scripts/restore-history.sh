#!/usr/bin/env bash
set -euo pipefail
# Restore posts only, so an obsolete generated index.html cannot override the homepage.
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git fetch origin gh-pages --depth=1
  if git cat-file -e origin/gh-pages:_posts 2>/dev/null; then
    mkdir -p history docs/_posts
    git archive origin/gh-pages _posts | tar -x -C history
    cp -rn history/_posts/. docs/_posts/
  fi
  if git cat-file -e origin/gh-pages:_data/coverage.json 2>/dev/null; then
    mkdir -p docs/_data
    if [ ! -f docs/_data/coverage.json ]; then
      git show origin/gh-pages:_data/coverage.json > docs/_data/coverage.json
    fi
  fi
fi
