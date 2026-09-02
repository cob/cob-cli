{
  description = "cob-cli: command-line interface for COB";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ flake-parts, self, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];

      perSystem = { config, pkgs, ... }: {
        packages.default = pkgs.callPackage ./cob-cli.nix {
          src = self;
        };

        apps.default.program = "${config.packages.default}/bin/cob-cli";
      };
    };
}
