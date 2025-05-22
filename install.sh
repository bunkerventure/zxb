#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Create .zxb directory if it doesn't exist
mkdir -p .zxb

# Check if runtime is already installed and not reinstalling
if [ -d ".zxb/.runtime" ] && [ "$ZXB_REINSTALL" != "true" ]; then
    echo "Runtime already installed"
    exit 0
fi

# Clean up existing runtime if reinstalling
if [ "$ZXB_REINSTALL" = "true" ]; then
    echo "Reinstalling runtime. Cleaning up local ./.zxb/.runtime"
    rm -rf .zxb/.runtime
fi

# Repository information (always use HTTPS for public repo)
REPO="bunkerventure/zxb"
HTTPS_URL="https://github.com/$REPO.git"

# Clone or copy the repository
if [ -d "$ZXB_LOCAL" ]; then
    echo "Using local runtime"
    cp -r "$ZXB_LOCAL" .zxb/.runtime
else
    echo "Cloning repository using HTTPS"
    # Temporarily disable URL rewriting to ensure HTTPS is used
    GIT_CONFIG_COUNT=1 \
    GIT_CONFIG_KEY_0="url.git@github.com:.insteadOf" \
    GIT_CONFIG_VALUE_0="none" \
    git clone "$HTTPS_URL" .zxb/.runtime --depth 1
fi

cp .zxb/.runtime/zxb-entry ./zxb
chmod +x ./zxb
echo "Successfully copied zxb-entry to ./zxb"

cp .zxb/.runtime/.gitignore.runtime-template .zxb/.gitignore
echo "Successfully copied gitignore template"

echo "Installation completed successfully"
