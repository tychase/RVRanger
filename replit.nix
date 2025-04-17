{pkgs}: {
  deps = [
    pkgs.libxcrypt
    pkgs.postgresql
    pkgs.zlib
    pkgs.xcodebuild
    pkgs.jq
  ];
}
