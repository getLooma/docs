default:
    @just --list

# --- Repository administration (needs a gh login with admin access to getLooma/docs) ---
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
