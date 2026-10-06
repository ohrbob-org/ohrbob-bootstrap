#!/bin/bash
# script to build and copy the theme to the Ohrbob ASP.NET Core project

set -e

# Build the theme
echo "Building the Ohrbob theme..."
npm run build

# Determine target directory (allow overriding via first argument)
# The expected argument is the path to the Ohrbob.Web project folder
TARGET_DIR="${1:-../ohrbob2/Ohrbob.Web}"
# Strip any trailing slashes
TARGET_DIR="${TARGET_DIR%/}"

TARGET_WWWROOT="$TARGET_DIR/wwwroot"
TARGET_DOCSROOT="$TARGET_DIR/docs"
TARGET_CSS_DIR="$TARGET_WWWROOT/css"

# Check if target directory exists
if [ ! -d "$TARGET_WWWROOT" ]; then
    echo "Error: Target directory $TARGET_WWWROOT does not exist."
    echo "Usage: npm run apply -- [path_to_ohrbob_web_project]"
    echo "Example: npm run apply -- ../ohrbob2/Ohrbob.Web/"
    exit 1
fi

SOURCE_CSS="css/theme.css"

mkdir -p "$TARGET_DOCSROOT"
cp "index.html" "$TARGET_DOCSROOT/bootstrap-theme.html"

# Ensure target CSS directory exists
mkdir -p "$TARGET_CSS_DIR"

# Copy the file
echo "Copying $SOURCE_CSS to $TARGET_CSS_DIR/"
cp "$SOURCE_CSS" "$TARGET_CSS_DIR/theme.css"

# Copy JS
TARGET_JS_DIR="$TARGET_WWWROOT/js"
echo "Copying js/audio-widget.js to $TARGET_JS_DIR/"
mkdir -p "$TARGET_JS_DIR"
cp "js/audio-widget.js" "$TARGET_JS_DIR/"

# Copy fonts if needed
if [ -d "fonts" ]; then
    echo "Copying fonts..."
    mkdir -p "$TARGET_WWWROOT/css/fonts"
    cp -r fonts/* "$TARGET_WWWROOT/css/fonts/"
elif [ -d "css/fonts" ]; then
    echo "Copying fonts from css/fonts..."
    mkdir -p "$TARGET_WWWROOT/css/fonts"
    cp -r css/fonts/* "$TARGET_WWWROOT/css/fonts/"
fi

# Copy images if needed
if [ -d "images" ]; then
    echo "Copying images directory..."
    mkdir -p "$TARGET_WWWROOT/images"
    cp -r images/* "$TARGET_WWWROOT/images/"
elif [ -d "img" ]; then
    echo "Copying img directory..."
    mkdir -p "$TARGET_WWWROOT/images"
    cp -r img/* "$TARGET_WWWROOT/images/"
fi

# Copy any root level image files if they exist
if ls *.png *.jpg *.jpeg *.gif *.svg *.ico 1> /dev/null 2>&1; then
    echo "Copying root level images..."
    mkdir -p "$TARGET_WWWROOT/images"
    cp *.png *.jpg *.jpeg *.gif *.svg *.ico "$TARGET_WWWROOT/images/" 2>/dev/null || true
fi

# Ensure ohrbob-logo.svg is converted to favicon and copied
if [ -f "ohrbob-logo.svg" ]; then
    echo "Handling favicons from ohrbob-logo.svg..."
    if command -v magick &> /dev/null; then
        # Use extremely high density and Lanczos filter for the sharpest possible downscaling
        magick -density 2048 -background none ohrbob-logo.svg -filter Lanczos -define icon:auto-resize=64,48,32,16 favicon.ico || true
        magick -density 2048 -background none ohrbob-logo.svg -filter Lanczos -resize 192x192 favicon.png || true
        magick -density 2048 -background none ohrbob-logo.svg -filter Lanczos -resize 180x180 apple-touch-icon.png || true
    fi
    # Copy favicons to the root of wwwroot as expected by most browsers
    cp favicon.ico favicon.png apple-touch-icon.png "$TARGET_WWWROOT/" 2>/dev/null || true
fi

# Ensure all logo files are also explicitly copied to images (in case the wildcard missed something)
if ls *logo* 1> /dev/null 2>&1; then
    echo "Ensuring all logos are copied..."
    mkdir -p "$TARGET_WWWROOT/images"
    cp -r *logo* "$TARGET_WWWROOT/images/" 2>/dev/null || true
fi

echo "Theme successfully updated in Ohrbob.Web!"
