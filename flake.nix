{
  description = "Looma docs: the public user documentation site (Astro Starlight)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      inherit (nixpkgs) lib;

      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: lib.genAttrs systems (system: f {
        pkgs = import nixpkgs { inherit system; };
      });
    in
    {
      devShells = forAllSystems ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            # Node: the site (Astro Starlight), scripts/openspec (pnpm dlx), Prettier
            nodejs_22
            pnpm_11
            prettier

            # Checks in `just check`
            vale        # prose lint, vendored style in styles/Looma (no `vale sync`)
            gitleaks    # secrets, in scripts/check-public
            actionlint  # .github/workflows

            # The production server, so `just check` smoke-tests deploy/Caddyfile without Docker
            caddy

            # Scheduled external link check (.github/workflows/links.yml)
            lychee

            # Glue
            just
          ];

          shellHook = ''
            export PROJECT_ROOT="$PWD"
            export PATH="$PROJECT_ROOT/node_modules/.bin:$PROJECT_ROOT/scripts:$PATH"
            # Astro telemetry stays off for every contributor and in CI.
            export ASTRO_TELEMETRY_DISABLED=1
            echo "docs shell ready: node $(node --version), pnpm $(pnpm --version)"
          '';
        };
      });
    };
}
