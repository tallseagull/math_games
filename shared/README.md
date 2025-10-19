# Shared Static Assets

This directory contains shared static assets (images and audio files) used across all games in the math games collection.

## Structure

```
shared/
└── static/
    ├── images/     # JPG image files used by games
    └── audio/      # MP3 audio files used by games
```

## Usage

Games reference these assets using relative paths:
- Images: `../shared/static/images/filename.jpg`
- Audio: `../shared/static/audio/filename.mp3`

## Available Assets

### Images
All images are in JPG format and include:
- Numbers: zero, one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve
- Colors: black, white, blue, red, green, yellow, orange
- People: girl, boy, mom, woman, man, baby
- Animals: cat, dog
- Objects: apple, box, book, bag
- Size concepts: big, small

### Audio
All audio files are in MP3 format and correspond to the image names above. Each audio file contains the spoken word for the corresponding image.

## Adding New Assets

1. Add new image files to `shared/static/images/` (use JPG format)
2. Add corresponding audio files to `shared/static/audio/` (use MP3 format)
3. Update the relevant game's JSON configuration file to include the new asset names
4. Ensure file names match exactly between images, audio, and JSON configurations
