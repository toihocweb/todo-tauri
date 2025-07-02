#!/bin/bash
set -e

VERSION=$1
REPO="toihocweb/todo-tauri"

if [ -z "$VERSION" ]; then
  echo "Usage: ./build.sh v1.0.0"
  exit 1
fi

# Check if signing key is set
if [ -z "$TAURI_SIGNING_PRIVATE_KEY" ]; then
  echo "Error: TAURI_SIGNING_PRIVATE_KEY environment variable is not set"
  echo "Run: export TAURI_SIGNING_PRIVATE_KEY=\"your-private-key-content\""
  exit 1
fi

# Remove 'v' prefix from version
VERSION_NUMBER=${VERSION#v}

echo "Updating version to $VERSION_NUMBER..."

# Update version in tauri.conf.json
jq --arg version "$VERSION_NUMBER" '.version = $version' src-tauri/tauri.conf.json > tmp.json && mv tmp.json src-tauri/tauri.conf.json

# Update version in Cargo.toml
sed -i.bak "s/^version = \".*\"/version = \"$VERSION_NUMBER\"/" src-tauri/Cargo.toml
rm src-tauri/Cargo.toml.bak

echo "Building version $VERSION..."

# Build the app (this will create signed artifacts)
npm run tauri build

echo "Detecting built files..."

BUNDLE_DIR="src-tauri/target/release/bundle"

# Find updater artifacts (these are what the updater needs)
MACOS_APP_TAR=$(find $BUNDLE_DIR -name "*.app.tar.gz" | head -1)
MACOS_APP_SIG=$(find $BUNDLE_DIR -name "*.app.tar.gz.sig" | head -1)
LINUX_APPIMAGE=$(find $BUNDLE_DIR -name "*.AppImage" | head -1)
LINUX_APPIMAGE_SIG=$(find $BUNDLE_DIR -name "*.AppImage.sig" | head -1)
WINDOWS_EXE=$(find $BUNDLE_DIR -name "*setup.exe" -o -name "*.msi" | head -1)
WINDOWS_EXE_SIG=$(find $BUNDLE_DIR -name "*setup.exe.sig" -o -name "*.msi.sig" | head -1)

echo "Found updater files:"
echo "  macOS: $MACOS_APP_TAR"
echo "  macOS sig: $MACOS_APP_SIG"
echo "  Linux: $LINUX_APPIMAGE"
echo "  Linux sig: $LINUX_APPIMAGE_SIG"
echo "  Windows: $WINDOWS_EXE"
echo "  Windows sig: $WINDOWS_EXE_SIG"

# Find all files to upload (including installers)
ALL_FILES=$(find $BUNDLE_DIR -type f \( \
  -name "*.dmg" -o \
  -name "*.app.tar.gz" -o \
  -name "*.app.tar.gz.sig" -o \
  -name "*.AppImage" -o \
  -name "*.AppImage.sig" -o \
  -name "*.exe" -o \
  -name "*.exe.sig" -o \
  -name "*.msi" -o \
  -name "*.msi.sig" \
\))

echo "Creating release $VERSION..."

# Create tag and release
git tag $VERSION
git push origin $VERSION

# Create GitHub release
gh release create $VERSION \
  --title "Release $VERSION" \
  --notes "Built $(date)"

echo "Uploading all artifacts..."

# Upload all found files
for file in $ALL_FILES; do
  if [ -f "$file" ]; then
    echo "Uploading $(basename $file)..."
    gh release upload $VERSION "$file"
  fi
done

echo "Generating latest.json with signatures..."

DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Read signature files
MACOS_SIGNATURE=""
LINUX_SIGNATURE=""
WINDOWS_SIGNATURE=""

if [ -f "$MACOS_APP_SIG" ]; then
  MACOS_SIGNATURE=$(cat "$MACOS_APP_SIG")
fi

if [ -f "$LINUX_APPIMAGE_SIG" ]; then
  LINUX_SIGNATURE=$(cat "$LINUX_APPIMAGE_SIG")
fi

if [ -f "$WINDOWS_EXE_SIG" ]; then
  WINDOWS_SIGNATURE=$(cat "$WINDOWS_EXE_SIG")
fi

# Build platforms JSON
PLATFORMS_JSON=""

if [ -n "$MACOS_APP_TAR" ] && [ -n "$MACOS_SIGNATURE" ]; then
  PLATFORMS_JSON="$PLATFORMS_JSON    \"darwin-aarch64\": {
      \"signature\": \"$MACOS_SIGNATURE\",
      \"url\": \"https://github.com/$REPO/releases/download/$VERSION/$(basename "$MACOS_APP_TAR")\"
    }"
fi

if [ -n "$LINUX_APPIMAGE" ] && [ -n "$LINUX_SIGNATURE" ]; then
  [ -n "$PLATFORMS_JSON" ] && PLATFORMS_JSON="$PLATFORMS_JSON,"
  PLATFORMS_JSON="$PLATFORMS_JSON    \"linux-x86_64\": {
      \"signature\": \"$LINUX_SIGNATURE\",
      \"url\": \"https://github.com/$REPO/releases/download/$VERSION/$(basename "$LINUX_APPIMAGE")\"
    }"
fi

if [ -n "$WINDOWS_EXE" ] && [ -n "$WINDOWS_SIGNATURE" ]; then
  [ -n "$PLATFORMS_JSON" ] && PLATFORMS_JSON="$PLATFORMS_JSON,"
  PLATFORMS_JSON="$PLATFORMS_JSON    \"windows-x86_64\": {
      \"signature\": \"$WINDOWS_SIGNATURE\",
      \"url\": \"https://github.com/$REPO/releases/download/$VERSION/$(basename "$WINDOWS_EXE")\"
    }"
fi

# Write JSON
printf '{
  "version": "%s",
  "notes": "See the release page for full changelog",
  "pub_date": "%s",
  "platforms": {
%s
  }
}' "$VERSION" "$DATE" "$PLATFORMS_JSON" > latest.json

echo "Generated latest.json:"
cat latest.json

echo "Uploading latest.json..."
gh release upload $VERSION latest.json

echo "Cleaning up..."
rm latest.json

echo "Release $VERSION created successfully!"
echo "Update manifest available at:"
echo "https://github.com/$REPO/releases/latest/download/latest.json"