#!/bin/bash

# Create necessary directories if they don't exist
mkdir -p android/app/src/main/res/mipmap-mdpi
mkdir -p android/app/src/main/res/mipmap-hdpi
mkdir -p android/app/src/main/res/mipmap-xhdpi
mkdir -p android/app/src/main/res/mipmap-xxhdpi
mkdir -p android/app/src/main/res/mipmap-xxxhdpi

# Copy and resize icons
magick static/icon2.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
magick static/icon2.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
magick static/icon2.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
magick static/icon2.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
magick static/icon2.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Create round icons
magick static/icon2.png -resize 48x48 \( +clone -alpha extract -draw 'circle 24,24 24,0' \) -alpha off -compose CopyOpacity -composite android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
magick static/icon2.png -resize 72x72 \( +clone -alpha extract -draw 'circle 36,36 36,0' \) -alpha off -compose CopyOpacity -composite android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
magick static/icon2.png -resize 96x96 \( +clone -alpha extract -draw 'circle 48,48 48,0' \) -alpha off -compose CopyOpacity -composite android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
magick static/icon2.png -resize 144x144 \( +clone -alpha extract -draw 'circle 72,72 72,0' \) -alpha off -compose CopyOpacity -composite android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
magick static/icon2.png -resize 192x192 \( +clone -alpha extract -draw 'circle 96,96 96,0' \) -alpha off -compose CopyOpacity -composite android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# Create foreground icons for splash screen
magick static/icon2.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png
magick static/icon2.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png
magick static/icon2.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png
magick static/icon2.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png
magick static/icon2.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png 