#!/bin/bash
# =============================================================================
# pre_session.sh - Run before each Claude Code session
#
# This script prepares the environment and shows the current state.
# Useful for context when starting a new session.
#
# Usage:
#   ./scripts/pre_session.sh
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           DOCX PARSER CONVERTER - Session Start            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# -----------------------------------------------------------------------------
# Git Status
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Git Status ━━━${NC}"
echo -e "  ${CYAN}Branch:${NC} $(git branch --show-current)"
echo -e "  ${CYAN}Status:${NC}"
git status --short | head -10 | sed 's/^/    /'
if [ $(git status --short | wc -l) -gt 10 ]; then
    echo "    ... and more"
fi
echo ""

# -----------------------------------------------------------------------------
# Recent Commits
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Recent Commits ━━━${NC}"
git log --oneline -5 | sed 's/^/  /'
echo ""

# -----------------------------------------------------------------------------
# Test Status (Quick Check)
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Quick Health Check ━━━${NC}"
cd "$PROJECT_DIR/docx_parser_converter_python"

# Pyright
echo -n "  Pyright: "
if pyright --outputjson 2>/dev/null | grep -q '"errorCount": 0'; then
    echo -e "${GREEN}✓ No errors${NC}"
else
    ERROR_COUNT=$(pyright --outputjson 2>/dev/null | grep -o '"errorCount": [0-9]*' | grep -o '[0-9]*')
    echo -e "${RED}✗ ${ERROR_COUNT:-?} errors${NC}"
fi

# Ruff
echo -n "  Ruff: "
if ruff check . --quiet 2>/dev/null; then
    echo -e "${GREEN}✓ No issues${NC}"
else
    ISSUE_COUNT=$(ruff check . 2>/dev/null | wc -l)
    echo -e "${RED}✗ ${ISSUE_COUNT} issues${NC}"
fi

# Tests (very quick - just check if they would run)
echo -n "  Tests: "
TEST_COUNT=$(pytest --collect-only -q 2>/dev/null | tail -1 | grep -o '[0-9]* test' | grep -o '[0-9]*')
echo -e "${CYAN}${TEST_COUNT:-0} tests available${NC}"

echo ""
cd "$PROJECT_DIR"

# -----------------------------------------------------------------------------
# Fixture Files
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Test Fixtures ━━━${NC}"
DOCX_COUNT=$(ls -1 fixtures/test_docx_files/*.docx 2>/dev/null | wc -l)
HTML_COUNT=$(ls -1 fixtures/outputs-python/*.html 2>/dev/null | wc -l)
TXT_COUNT=$(ls -1 fixtures/outputs-python/*.txt 2>/dev/null | wc -l)
echo -e "  Input DOCX files: ${CYAN}${DOCX_COUNT}${NC}"
echo -e "  Expected HTML outputs: ${CYAN}${HTML_COUNT}${NC}"
echo -e "  Expected TXT outputs: ${CYAN}${TXT_COUNT}${NC}"
echo ""

# -----------------------------------------------------------------------------
# Helpful Commands
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Helpful Commands ━━━${NC}"
echo -e "  ${CYAN}./scripts/check.sh${NC}         - Run all quality checks"
echo -e "  ${CYAN}./scripts/post_session.sh${NC}  - Verify after making changes"
echo -e "  ${CYAN}python scripts/verify_outputs.py${NC} - Check output correctness"
echo -e "  ${CYAN}python scripts/verify_outputs.py --update${NC} - Update expected outputs"
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Ready to go!                            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
