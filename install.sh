#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Print commands and their arguments as they are executed
set -x

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

# Repository information
REPO="bunkerventure/zxb"
SSH_URL="git@github.com:$REPO.git"
HTTPS_URL="https://github.com/$REPO.git"

# Clone or copy the repository
if [ -d "$ZXB_LOCAL" ]; then
    echo "Using local runtime"
    cp -r "$ZXB_LOCAL" .zxb/.runtime
elif ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "Using SSH to clone"
    git clone "$SSH_URL" .zxb/.runtime --depth 1
else
    echo "SSH not available, using HTTPS"
    git clone "$HTTPS_URL" .zxb/.runtime --depth 1
fi

# Verify the runtime was cloned/copied successfully
if [ ! -d ".zxb/.runtime" ]; then
    echo "ERROR: Failed to clone or copy runtime"
    exit 1
fi

# Debug information
echo "Current directory: $(pwd)"
echo "Contents of .zxb/.runtime:"
ls -la .zxb/.runtime

# Copy entry point file
echo "Updating zxb entry point"
if [ -f ".zxb/.runtime/zxb-entry" ]; then
    # Create a temporary file first to ensure the copy works
    cp -v .zxb/.runtime/zxb-entry ./zxb.tmp
    # Move the temporary file to the final location
    mv -v ./zxb.tmp ./zxb
    # Make it executable
    chmod +x ./zxb
    echo "Successfully copied zxb-entry to ./zxb"
    ls -la ./zxb
else
    echo "ERROR: zxb-entry not found in .zxb/.runtime/"
    exit 1
fi

# Copy gitignore template
if [ -f ".zxb/.runtime/.gitignore.runtime-template" ]; then
    cp -v .zxb/.runtime/.gitignore.runtime-template .zxb/.runtime/.gitignore
    echo "Successfully copied gitignore template"
else
    echo "WARNING: .gitignore.runtime-template not found"
fi

echo "Installation completed successfully"
