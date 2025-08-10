export type Platform = "linux" | "mac" | "windows" | "unknown";

export function detectPlatform(): Platform {
  const p = process.platform;
  if (p === "linux") return "linux";
  if (p === "darwin") return "mac";
  if (p === "win32") return "windows";
  return "unknown";
}

export function ytDlpInstallHint(): string {
  const plat = detectPlatform();
  switch (plat) {
    case "mac":
      return "Install with `brew install yt-dlp` or `pipx install yt-dlp`.";
    case "windows":
      return "Install with `winget install yt-dlp.yt-dlp` or `choco install yt-dlp` or `pipx install yt-dlp`.";
    case "linux":
      return "Install with your package manager, e.g. `apt install yt-dlp` (Debian/Ubuntu), `dnf install yt-dlp` (Fedora), `pacman -S yt-dlp` (Arch), or `pipx install yt-dlp`.";
    default:
      return "Install with your package manager or `pipx install yt-dlp`. See https://github.com/yt-dlp/yt-dlp#installation";
  }
}
