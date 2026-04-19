#!/bin/sh
set -e

REPO="yataktyni/decky-ukr-badge"
PLUGIN_DIR="$HOME/homebrew/plugins"
INSTALL_DIR="$PLUGIN_DIR/decky-ukr-badge"

# Check Decky Loader
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "Error: Decky Loader not found ($PLUGIN_DIR does not exist)"
  echo "Install Decky Loader first: https://decky.xyz"
  exit 1
fi

# Get latest release download URL
echo "Fetching latest release..."
DOWNLOAD_URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep -o '"browser_download_url":\s*"[^"]*release\.zip"' \
  | head -1 \
  | sed 's/"browser_download_url":\s*"//;s/"$//')

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Error: could not find release.zip in latest release"
  exit 1
fi

# Download to temp dir
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
echo "Downloading $DOWNLOAD_URL ..."
curl -fSL -o "$TMPDIR/release.zip" "$DOWNLOAD_URL"

# Install
echo "Installing to $INSTALL_DIR..."
sudo rm -rf "$INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR"

# Extract to a temporary folder to handle potential top-level wrappers
sudo unzip -q -o "$TMPDIR/release.zip" -d "$TMPDIR/extracted"

# If there is exactly one folder inside, move its contents, otherwise move all
if [ $(ls -1 "$TMPDIR/extracted" | wc -l) -eq 1 ] && [ -d "$TMPDIR/extracted/$(ls -1 "$TMPDIR/extracted")" ]; then
  TOP_DIR=$(ls -1 "$TMPDIR/extracted")
  sudo mv "$TMPDIR/extracted/$TOP_DIR"/* "$INSTALL_DIR/"
else
  sudo mv "$TMPDIR/extracted"/* "$INSTALL_DIR/"
fi

sudo chown -R "$USER:$USER" "$INSTALL_DIR"

# Restart plugin loader
echo "Restarting Decky plugin loader..."
sudo systemctl restart plugin_loader

echo "decky-ukr-badge installed successfully!"
