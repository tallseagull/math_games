"""Regenerate debug-board-positions.png from src/data/stepPositions.json.

Run from escape_room/:
  python3 scripts/generate-debug-positions.py
"""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "src/data/stepPositions.json"
BOARD_PATH = ROOT / "src/assets/board-background.png"
OUTPUT_PATH = ROOT / "src/assets/debug-board-positions.png"


def load_config() -> dict:
    with CONFIG_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def main() -> None:
    config = load_config()
    positions = [(p["left"], p["top"]) for p in config["positions"]]

    img = Image.open(BOARD_PATH).convert("RGBA")
    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    try:
        font_big = ImageFont.truetype(
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf", 36
        )
        font_sm = ImageFont.truetype(
            "/System/Library/Fonts/Supplemental/Arial.ttf", 20
        )
    except OSError:
        font_big = ImageFont.load_default()
        font_sm = font_big

    corner_len = 36
    for i, (left_pct, top_pct) in enumerate(positions, start=1):
        x = int(w * left_pct / 100)
        y = int(h * top_pct / 100)
        # L-shaped marker: anchor = bottom-right of kid sprite
        draw.line(
            [(x - corner_len, y), (x, y)],
            fill=(255, 215, 0, 255),
            width=4,
        )
        draw.line(
            [(x, y - corner_len), (x, y)],
            fill=(255, 215, 0, 255),
            width=4,
        )
        draw.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(255, 0, 0, 255))
        label = str(i)
        bbox = draw.textbbox((0, 0), label, font=font_big)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        tx, ty = x - tw - 12, y - corner_len - th - 10
        draw.rectangle(
            [tx - 6, ty - 4, tx + tw + 6, ty + th + 4], fill=(0, 0, 0, 200)
        )
        draw.text((tx, ty), label, fill=(255, 255, 100, 255), font=font_big)
        coord = f"{left_pct}%, {top_pct}%"
        cb = draw.textbbox((0, 0), coord, font=font_sm)
        cw = cb[2] - cb[0]
        draw.text((x - cw - 8, y + 10), coord, fill=(255, 255, 255, 230), font=font_sm)

    Image.alpha_composite(img, overlay).convert("RGB").save(OUTPUT_PATH, quality=95)
    print(f"Wrote {OUTPUT_PATH}")
    print(f"Config: {CONFIG_PATH}")


if __name__ == "__main__":
    main()
