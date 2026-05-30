# חדר בריחה — Escape Room (Grade 3)

Hebrew escape room for elementary students. Help Danny complete 12 tasks to unlock summer vacation.

## Development

```bash
cd escape_room
npm install
npm run dev
```

## Production build

```bash
npm run build
```

Build writes `index.html` and `assets/` in this folder (same layout as other games in the repo). The root site links to `escape_room/index.html`.

## Test with the full site locally

From the repo root:

```bash
./scripts/serve-local.sh
```

This builds the escape room, then serves the whole repo (homepage + all mini-sites) on port 8080.

## Editing answers

Edit `src/data/tasks.ts` — each task has `acceptedAnswers`.

## Editing Danny’s position on the board

Edit **`src/data/stepPositions.json`**. Each step has `left` and `top` as **percentages of the board image** (0–100), not the browser window. The point is the **bottom-right corner** of the kid sprite (`anchor: bottom-right`).

After changing coordinates, regenerate the review image:

```bash
python3 scripts/generate-debug-positions.py
```

Preview in the browser: open `debug-positions.html` (loads the same JSON).

Output: `src/assets/debug-board-positions.png` — numbered markers overlaid on the board for alignment checks.

## Deploy

Netlify runs `cd escape_room && npm ci && npm run build` before publishing the repo root (see `netlify.toml`).
