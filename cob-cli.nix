{ lib, pkgs, src }:
let nodejs = pkgs.nodejs_24; in
pkgs.buildNpmPackage {
  pname = "cob-cli";
  version = (lib.importJSON "${src}/package.json").version;
  inherit src nodejs;

  # Derive deps straight from package-lock.json
  npmDeps = pkgs.importNpmLock { npmRoot = src; };
  npmConfigHook = pkgs.importNpmLock.npmConfigHook;

  dontNpmBuild = true;

  # Skip --setup, we use nix's installShellCompletion.
  npmFlags = [ "--ignore-scripts" ];

  nativeBuildInputs = [ pkgs.makeWrapper pkgs.installShellFiles ];

  postInstall = ''
    # Wrap the exe so rsync, git, and node are on PATH at runtime.
    wrapProgram $out/bin/cob-cli \
      --prefix PATH : ${lib.makeBinPath [ pkgs.rsync pkgs.git nodejs ]}

    # Versioned alias
    ln -s cob-cli $out/bin/cob-cli-$version

    # Shell completion
    installShellCompletion --cmd cob-cli \
      --bash <($out/bin/cob-cli --completion) \
      --zsh <($out/bin/cob-cli --completion) \
      --fish <($out/bin/cob-cli --completion-fish)
  '';
}
