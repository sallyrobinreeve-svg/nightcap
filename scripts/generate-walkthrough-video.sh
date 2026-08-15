#!/usr/bin/env bash
# Regenerates public/walkthrough.mp4 from scripts/walkthrough-assets/*.png
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS="$ROOT/scripts/walkthrough-assets"
OUT="$ROOT/public/walkthrough.mp4"
WORKDIR="$(mktemp -d)"

cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

mkdir -p "$ROOT/public"

shopt -s nullglob
frames=("$ASSETS"/walkthrough-*.png)
if [ ${#frames[@]} -eq 0 ]; then
  echo "No walkthrough-*.png files in $ASSETS" >&2
  exit 1
fi

i=1
for frame in "${frames[@]}"; do
  ffmpeg -y -loop 1 -i "$frame" -t 4.5 \
    -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x1E1B24,format=yuv420p,zoompan=z='min(zoom+0.0008,1.06)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=112:s=1280x720:fps=25" \
    -c:v libx264 -pix_fmt yuv420p -an "$WORKDIR/clip$(printf '%02d' "$i").mp4"
  i=$((i + 1))
done

clips=("$WORKDIR"/clip*.mp4)
n=${#clips[@]}

if [ "$n" -eq 1 ]; then
  cp "${clips[0]}" "$OUT"
  exit 0
fi

inputs=()
for clip in "${clips[@]}"; do inputs+=(-i "$clip"); done

filter="[0:v][1:v]xfade=transition=fade:duration=0.6:offset=3.9[v01]"
prev="v01"
for ((j=2; j<n; j++)); do
  offset=$(awk "BEGIN { print 3.9 + ($j - 1) * 3.9 }")
  next="v$(printf '%02d' "$j")"
  if [ "$j" -eq $((n - 1)) ]; then
    filter+=";[${prev}][${j}:v]xfade=transition=fade:duration=0.6:offset=${offset}[vout]"
    prev="vout"
  else
    filter+=";[${prev}][${j}:v]xfade=transition=fade:duration=0.6:offset=${offset}[${next}]"
    prev="$next"
  fi
done

ffmpeg -y "${inputs[@]}" -filter_complex "$filter" -map "[vout]" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$OUT"

echo "Wrote $OUT ($(du -h "$OUT" | cut -f1))"
