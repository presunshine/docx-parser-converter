#!/bin/bash
#
# Post-edit verification hook for Claude Code
# Runs after Python files are modified (Write/Edit)
#
# Usage: Called automatically by Claude Code PostToolUse hook
#        Expects CLAUDE_FILE_PATH environment variable to be set
#

FILE="${CLAUDE_FILE_PATH:-}"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PYTHON_PKG="$PROJECT_DIR/docx_parser_converter_python"

# Only run for Python files
if [[ "$FILE" != *.py ]]; then
    exit 0
fi

cd "$PROJECT_DIR"

# Get all uncommitted Python files (modified, staged, and untracked)
UNCOMMITTED_FILES=$(git diff --name-only HEAD 2>/dev/null | grep '\.py$' || true)
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null | grep '\.py$' || true)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null | grep '\.py$' || true)

# Combine and deduplicate
ALL_PY_FILES=$(echo -e "$UNCOMMITTED_FILES\n$STAGED_FILES\n$UNTRACKED_FILES" | sort -u | grep -v '^$' || true)

if [ -n "$ALL_PY_FILES" ]; then
    echo ""
    echo "Formatting and linting uncommitted Python files..."

    cd "$PYTHON_PKG"
    for f in $ALL_PY_FILES; do
        FULL_PATH="$PROJECT_DIR/$f"
        if [ -f "$FULL_PATH" ]; then
            ruff format "$FULL_PATH" 2>/dev/null || true
            ruff check "$FULL_PATH" --fix 2>/dev/null || true
        fi
    done
fi

# Run full verification
cd "$PROJECT_DIR"
python scripts/session_end_verify.py
