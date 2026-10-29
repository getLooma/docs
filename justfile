default:
    @just --list

# --- Site ---

# The site with live reload on http://localhost:4321
dev:
    pnpm dev

# Build the static site into dist/ (fails on a schema error or a broken internal link)
build:
    pnpm build

# Serve dist/ with the production Caddyfile on http://localhost:8080 (after `just build`)
serve:
    node scripts/routes.mjs --caddy dist
    PORT=8080 SITE_ROOT="$PWD/dist" caddy run --config deploy/Caddyfile --adapter caddyfile

# Record new pages in published-routes.txt (append-only; run after adding a page)
routes:
    node scripts/routes.mjs

# The production image, smoke-tested (needs Docker)
image:
    just build
    node scripts/routes.mjs --caddy dist
    docker build -t looma-docs:local .
    docker rm -f looma-docs-smoke >/dev/null 2>&1 || true
    docker run -d --name looma-docs-smoke -p 18080:8080 looma-docs:local
    scripts/smoke http://127.0.0.1:18080; status=$?; docker rm -f looma-docs-smoke >/dev/null; exit $status

# --- Formatting ---

# Rewrite every file Prettier understands
fmt:
    prettier --write . --log-level warn

# Fail if any file is not formatted (part of `just check`)
fmt-check:
    prettier --check .

# --- Checks ---

# Tests of the check scripts
test *args:
    pnpm vitest run {{args}}

# Everything CI runs (openspec change docs-site, design.md D9)
check: fmt-check
    actionlint .github/workflows/*.yml
    node scripts/check-workflows.mjs
    node scripts/check-repo.mjs
    pnpm vitest run
    just build
    node scripts/check-site.mjs dist
    node scripts/check-routes.mjs
    scripts/check-public
    vale src/content
    scripts/smoke --local dist

# --- Repository administration (needs a gh login with admin access to getLooma/docs) ---

# Apply or verify scripts/repo-settings.json on GitHub: just repo-settings apply|check
repo-settings action:
    scripts/repo-settings {{action}}

# .github/rulesets/main.json is the source of truth for the `main` ruleset (openspec change
# docs-site, design.md D19). Edit the file, review it in a pull request, then apply it.

repo := "getLooma/docs"

# Create or update the `main` ruleset on GitHub from .github/rulesets/main.json
ruleset-apply:
    #!/usr/bin/env bash
    set -euo pipefail
    id="$(gh api "repos/{{repo}}/rulesets" --jq '.[] | select(.name == "main") | .id')"
    if [ -n "$id" ]; then
      gh api -X PUT "repos/{{repo}}/rulesets/$id" --input .github/rulesets/main.json --silent
      echo "updated ruleset main ($id)"
    else
      gh api -X POST "repos/{{repo}}/rulesets" --input .github/rulesets/main.json --silent
      echo "created ruleset main"
    fi

# Fail if the live `main` ruleset differs from .github/rulesets/main.json
ruleset-check:
    #!/usr/bin/env bash
    set -euo pipefail
    id="$(gh api "repos/{{repo}}/rulesets" --jq '.[] | select(.name == "main") | .id')"
    [ -n "$id" ] || { echo "no ruleset named main on {{repo}}"; exit 1; }
    live="$(gh api "repos/{{repo}}/rulesets/$id" --jq '{name,target,enforcement,conditions,rules,bypass_actors}')"
    LIVE="$live" node -e '
      const fs = require("fs");
      const sort = (v) => Array.isArray(v) ? v.map(sort) : v && typeof v === "object"
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;
      const want = JSON.stringify(sort(JSON.parse(fs.readFileSync(".github/rulesets/main.json", "utf8"))), null, 2);
      const have = JSON.stringify(sort(JSON.parse(process.env.LIVE)), null, 2);
      if (want !== have) { console.error("ruleset main differs from .github/rulesets/main.json\n--- file\n" + want + "\n--- live\n" + have); process.exit(1); }
      console.log("ruleset main matches .github/rulesets/main.json");
    '
