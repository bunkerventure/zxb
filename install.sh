#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Check if runtime is already installed and not reinstalling
if [ -d ".zxb/node_modules" ] && [ "$ZXB_REINSTALL" != "true" ]; then
    echo "Runtime already installed"
    exit 0
fi

# Clean up existing runtime if reinstalling
if [ "$ZXB_REINSTALL" = "true" ]; then
    echo "Reinstalling runtime. Cleaning up local ./.zxb/node_modules"
    rm -rf .zxb/node_modules
fi

# Repository information
REPO="bunkerventure/zxb"
RAW_URL="https://raw.githubusercontent.com/$REPO/main"

# Check if npm is available
NPM_AVAILABLE=false
if command -v npm >/dev/null 2>&1; then
    NPM_AVAILABLE=true
fi

# Check if zxb is globally linked via npm
LINKED_ZXB_PATH=""
USING_LINKED_ZXB=false
if [ "$NPM_AVAILABLE" = true ]; then
    LINKED_PATH=$(npm prefix -g 2>/dev/null)/lib/node_modules/zxb
    if [ -L "$LINKED_PATH" ]; then
        echo "zxb is linked globally at: $LINKED_PATH"
        REAL_PATH=$(realpath "$LINKED_PATH")
        echo "Actual path: $REAL_PATH"
        LINKED_ZXB_PATH="$REAL_PATH"
        USING_LINKED_ZXB=true
    fi
fi

# Create .zxb directory if it doesn't exist
mkdir -p .zxb

# Download template files
echo "Downloading template files"

if [ "$USING_LINKED_ZXB" = true ]; then
echo "Using linked templates from: $LINKED_ZXB_PATH"
    function downloadTemplateFile() {
        cp "$LINKED_ZXB_PATH/templates/$1" $2
    }
else
    function downloadTemplateFile() {
        curl -s "$RAW_URL/templates/$1" -o $2
    }
fi

downloadTemplateFile "zxb" "./zxb"
downloadTemplateFile ".gitignore" ".zxb/.gitignore"
downloadTemplateFile "mise.toml" ".zxb/mise.toml"
downloadTemplateFile "zxb.ts" ".zxb/zxb.ts"

chmod +x ./zxb
echo "Successfully downloaded templates"

# Create package.json in .zxb directory if not existing
if [ ! -f ".zxb/package.json" ]; then
cat > .zxb/package.json << EOF
{
  "name": "zxb-local",
  "version": "0.1.0",
  "description": "zxb local package definition",
  "scripts": {},
  "author": "",
  "license": "ISC",
  "dependencies": {
    "zxb": "latest"
  }
}
EOF
echo "Successfully created package.json"
fi

# Install zxb package using npm
cd .zxb
if [ "$USING_LINKED_ZXB" = true ]; then
    echo "Using npm link for local development"
    npm link zxb    
fi

echo "Installing using npm"
npm install

cd ..

echo "Installation completed successfully"
