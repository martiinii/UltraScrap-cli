# UltraStar CLI

![Local SQL](https://raw.githubusercontent.com/martiinii/UltraScrap-cli/main/media/demo.gif)

### What is this?
UltraStar CLI is the fastest way to build your UltraStar song library. Search the biggest UltraStar database, preview results, and download complete, ready-to-sing folders in one go — lyrics, cover, and video included. No manual stitching. No messy files. Just search, hit Enter, and sing.

Why it’s awesome:
- Blazing fast TUI powered by Ink (React for terminals)
- Pulls from the largest UltraStar DB and auto-fills YouTube links when needed
- Downloads video via `yt-dlp` with a smooth progress bar
- Writes proper UltraStar `song.txt` headers and saves `cover.jpg` + `video.mp4`
- Smart session: securely creates and stores credentials automatically
- Cross‑platform: Linux, macOS, Windows


## Requirements

- yt-dlp (for downloading videos + audio)
- Either npm (Node.js) or Bun (recommended)

### Install yt-dlp
- macOS: `brew install yt-dlp` or `pipx install yt-dlp`
- Windows: `winget install yt-dlp.yt-dlp` or `choco install yt-dlp` or `pipx install yt-dlp`
- Linux: Use your package manager (e.g. `apt install yt-dlp`, `dnf install yt-dlp`, `pacman -S yt-dlp`) or `pipx install yt-dlp`

If you need more options, see `https://github.com/yt-dlp/yt-dlp#installation`.

### Install a runtime
- Node.js (for npm): We recommend installing via nvm: `https://github.com/nvm-sh/nvm`
- Bun (recommended): `curl -fsSL https://bun.sh/install | bash` or see `https://bun.sh`


## Quick Start (no install)

Run directly with your favorite package runner:

### npm
```bash
npx ultrastar
```

### Bun (recommended)
```bash
bunx --bun ultrastar
```

The first run will check yt-dlp and initialize a session. Use the search form, pick a song, and press Enter to download. Your songs will be saved under `./songs/Artist - Title/`.


## Keyboard Shortcuts
- In search form: Tab = switch field, Enter = search, Esc = quit
- In results: ↑/↓ = select, Enter = download, ←/→ = page, e = edit search, r = refresh, Esc = back


## Links
- https://usdb.animux.de - The biggest database of UltraStar songs (lyrics only)
- https://ultrastar-es.org/ – Smaller database of songs, includes audio and video. You can download *UltraStar WorldParty* here.


## How it works (under the hood)
- Searches songs on USDB
- Resolves a YouTube link from USDB when available; otherwise searches YouTube
- Downloads the video with yt-dlp while showing progress
- Fetches cover art and lyrics, and writes a proper UltraStar `song.txt`
- Outputs a complete folder per song: `song.txt`, `cover.jpg`, `video.mp4`


## Develop

This project uses Bun. You can still run the built CLI with Node, but development is Bun-first.

### Setup
```bash
bun install
```

### Start the TUI in dev
```bash
bun run start
```

### Build the distributable CLI
```bash
bun run build
# Artifacts are written to ./build/dist
```

### Try the built CLI locally
```bash
node build/dist/index.js
# or
bun build/dist/index.js
# or on Unix systems (shebang-enabled):
./build/dist/index.js
```

### Lint & Format
```bash
bun run lint
bun run format
```

### Project structure (high level)
- `src/ui/` – TUI (Ink) components and interactions
- `src/api/` – USDB and YouTube integrations (search, download, auth)
- `src/storage/` – Local cache: credentials, downloaded song list
- `src/build.ts` – Build script (Bun bundler)


## Troubleshooting
- yt-dlp not found: Install it and ensure it’s on your PATH, then re-run the CLI
- No results: Try different keywords or fewer filters (artist/title)
- Permission issues writing songs: Run in a directory you own or adjust permissions
