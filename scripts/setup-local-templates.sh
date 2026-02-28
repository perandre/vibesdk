#!/usr/bin/env bash
# Seed local R2 with template catalog and template zips for local development.
# Run once after cloning, or any time you want to update templates.
#
# Usage: bash scripts/setup-local-templates.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure bun and wrangler (from local node_modules) are on PATH
export PATH="$HOME/.bun/bin:$REPO_ROOT/node_modules/.bin:$PATH"

TEMPLATES_DIR="$REPO_ROOT/.templates-repo"
TEMPLATES_REPO="https://github.com/cloudflare/vibesdk-templates"
BUCKET_NAME="vibesdk-templates"
WRANGLER_CONFIG="$REPO_ROOT/wrangler.local.jsonc"

cd "$REPO_ROOT"

echo "==> Setting up local R2 templates"

# 1. Clone or update the templates repo
if [ -d "$TEMPLATES_DIR/.git" ]; then
  echo "==> Updating templates repo..."
  git -C "$TEMPLATES_DIR" pull --ff-only origin main 2>/dev/null || \
    git -C "$TEMPLATES_DIR" pull --ff-only origin master 2>/dev/null || \
    echo "    (Could not pull, continuing with existing)"
else
  echo "==> Cloning templates repo..."
  git clone --depth=1 "$TEMPLATES_REPO" "$TEMPLATES_DIR"
fi

# 2. Check Python is available (needed for template generation)
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Install Python 3 to generate template zips."
  exit 1
fi

# 3. Install PyYAML if not present
python3 -c "import yaml" 2>/dev/null || pip3 install pyyaml --quiet

# 4. Run deploy_templates.sh with LOCAL_R2=true
echo "==> Generating and uploading templates to local R2..."
cd "$TEMPLATES_DIR"
LOCAL_R2=true \
  R2_BUCKET_NAME="$BUCKET_NAME" \
  BUCKET_NAME="$BUCKET_NAME" \
  WRANGLER_CONFIG_PATH="$WRANGLER_CONFIG" \
  bash deploy_templates.sh

echo ""
echo "==> Done. Local R2 is seeded with templates."
echo "    Start the dev server with: bun run dev"
