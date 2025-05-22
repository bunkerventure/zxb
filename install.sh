#!/bin/bash

# Exit on error, print commands as they execute
set -e
set -x
mkdir -p .zxb

if [ -d ".zxb/.runtime" ] && [ "$ZXB_REINSTALL" != "true" ]; then
    echo "ZXB_REINSTALL: $ZXB_REINSTALL"
    echo "Runtime already installed"
    exit 0
fi

if [ "$ZXB_REINSTALL" = "true" ]; then
    echo "Reinstalling runtime. Cleaning up local ./.zxb/.runtime"
    rm -rf .zxb/.runtime
fi

REPO="bunkerventure/zxb"
SSH_URL="git@github.com:$REPO.git"
HTTPS_URL="https://github.com/$REPO.git"


if [ -d "$ZXB_LOCAL" ]; then
    echo "Using local runtime"
    cp -r "$ZXB_LOCAL" .zxb/.runtime
# Try SSH
elif ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
    echo "Using SSH to clone"
    git clone "$SSH_URL" .zxb/.runtime --depth 1
else
    echo "SSH not available, using HTTPS"
    git clone "$HTTPS_URL" .zxb/.runtime --depth 1
fi

echo "Updating zxb entry point"

# Print debug information
echo "DEBUG: Current directory: $(pwd)"
echo "DEBUG: Contents of .zxb/.runtime:"
ls -la .zxb/.runtime

if [ -f ".zxb/.runtime/zxb-entry" ]; then
  # Force the copy to be verbose
  cp -v .zxb/.runtime/zxb-entry ./zxb
  COPY_RESULT=$?
  echo "DEBUG: Copy result code: $COPY_RESULT"
  
  if [ $COPY_RESULT -eq 0 ]; then
    echo "Successfully copied zxb-entry to ./zxb"
    # Verify the file exists and show its permissions
    ls -la ./zxb
  else
    echo "Error: Failed to copy zxb-entry to ./zxb"
  fi
else
  echo "Error: zxb-entry not found in .zxb/.runtime/"
  exit 1
fi

# Copy gitignore template - also with debugging
if [ -f ".zxb/.runtime/.gitignore.runtime-template" ]; then
  cp -v .zxb/.runtime/.gitignore.runtime-template .zxb/.runtime/.gitignore
  COPY_RESULT=$?
  echo "DEBUG: Gitignore copy result code: $COPY_RESULT"
  
  if [ $COPY_RESULT -eq 0 ]; then
    echo "Successfully copied gitignore template"
  else
    echo "Error: Failed to copy gitignore template"
  fi
else
  echo "Warning: .gitignore.runtime-template not found"
fi

echo "Installation completed successfully"
