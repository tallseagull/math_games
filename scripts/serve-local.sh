#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8080}"

echo "Building escape room..."
(cd "$ROOT/escape_room" && npm run build)

echo ""
echo "Serving entire repo at http://localhost:${PORT}/"
echo "  Homepage:     http://localhost:${PORT}/index.html"
echo "  Escape room:  http://localhost:${PORT}/escape_room/"
echo ""
cd "$ROOT"
exec python3 -m http.server "$PORT"
