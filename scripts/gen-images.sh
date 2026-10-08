#!/bin/bash
# Generate all storefront imagery — parallel workers
set -u
DIR="/home/z/my-project/public/uploads"
mkdir -p "$DIR"

gen() {
  local prompt="$1"; local out="$2"; local size="$3"
  if [ -s "$DIR/$out" ]; then echo "SKIP $out"; return 0; fi
  echo "GEN  $out"
  z-ai image -p "$prompt" -o "$DIR/$out" -s "$size" >/dev/null 2>&1 \
    && echo "OK   $out" || echo "FAIL $out"
}

P="professional product photography, premium gift store item, deep navy blue studio background with warm golden light accents, elegant, high quality, detailed"

# worker 1
(
gen "luxury crystal ball sphere on dark navy silk, golden bokeh lights, cinematic still life, $P" "hero.jpg" "2048x1024"
gen "large clear glass crystal ball sphere on navy velvet cushion, $P" "product-crystal-ball.jpg" "1024x1024"
gen "large clear crystal ball with warm golden light reflections inside, navy velvet cushion, $P" "product-crystal-ball-2.jpg" "1024x1024"
gen "polished pink rose quartz heart stone on navy fabric, $P" "product-rose-heart.jpg" "1024x1024"
gen "deep purple amethyst crystal sphere with sparkle facets on navy velvet, $P" "product-amethyst-sphere.jpg" "1024x1024"
) > /tmp/imgs-w1.log 2>&1 &

# worker 2
(
gen "glowing 3D moon lamp on wooden stand, warm white light, dark navy background, magical, $P" "product-moon-lamp.jpg" "1024x1024"
gen "elegant brushed gold candle holder with lit candle, warm glow, navy background, bokeh, $P" "product-candle-holder.jpg" "1024x1024"
gen "vintage glass snow globe with golden castle inside and falling snow, navy background, $P" "product-snow-globe.jpg" "1024x1024"
gen "delicate crystal wind chime with golden accents and glass pendants hanging, navy background, $P" "product-wind-chime.jpg" "1024x1024"
) > /tmp/imgs-w2.log 2>&1 &

# worker 3
(
gen "crystal lotus flower figurine with rainbow light refractions on navy velvet, $P" "product-crystal-lotus.jpg" "1024x1024"
gen "elegant navy blue gift box with gold satin ribbon bow, dark navy background, golden bokeh, $P" "gift-box.jpg" "1024x1024"
) > /tmp/imgs-w3.log 2>&1 &

wait
echo "ALL DONE"
