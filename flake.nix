{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
    prisma-utils = {
      url = "github:VanCoding/nix-prisma-utils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    prisma-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};

      prisma =
        (prisma-utils.lib.prisma-factory {
          nixpkgs = pkgs;
          prisma-fmt-hash = "sha256-iOJW0KK/yWIu5VpuLrq+EC5S7n5ygu1xfiHTttYfq+A=";
          schema-engine-hash = "sha256-RwmJu8Qm+ugpxWituK/k5DxdijJBesi82bop7ZWQ9p0=";
          libquery-engine-hash = "sha256-P/lxd05Naf8ghTSJoIaJOMqlihhQelRwnbAPtwrAS8w=";
          query-engine-hash = "sha256-kxhSxYFKXtIzqm0UxSu68d00n8jXj6t1Bq6X+1QAJ1E=";
        })
        .fromNpmLock
        ./package-lock.json;
    in {
      devShell = pkgs.mkShell {
        inherit (prisma) shellHook;
      };
    });
}
