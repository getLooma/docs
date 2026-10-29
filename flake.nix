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
      # Minimal shell so `openspec` runs; change `docs-site` adds the site's tooling.
      devShells = forAllSystems ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            # Node: scripts/openspec (pnpm dlx), Prettier
            nodejs_22
            pnpm_11
            prettier

            # Glue
            just
          ];

          shellHook = ''
            export PROJECT_ROOT="$PWD"
            export PATH="$PROJECT_ROOT/scripts:$PATH"   # scripts/openspec wrapper
            echo "docs shell ready: node $(node --version), pnpm $(pnpm --version)"
          '';
        };
      });
    };
}
