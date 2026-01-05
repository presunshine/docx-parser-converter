#!/bin/bash
# =============================================================================
# post_session.sh - Run after each Claude Code session
#
# This script runs all verification steps to ensure changes are correct.
# Designed to be run manually or as a hook.
#
# Usage:
#   ./scripts/post_session.sh          # Run all checks
#   ./scripts/post_session.sh --quick  # Quick mode (fail-fast)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Parse arguments
QUICK_MODE=false
for arg in "$@"; do
    case $arg in
        --quick)
            QUICK_MODE=true
            ;;
    esac
done

cd "$PROJECT_DIR"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           POST-SESSION VERIFICATION                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

FAILED=0

# -----------------------------------------------------------------------------
# Step 1: Code Quality Checks
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Step 1: Code Quality ━━━${NC}"
cd "$PROJECT_DIR/docx_parser_converter_python"

echo -e "  ${BLUE}→${NC} Running ruff check..."
if ! ruff check . 2>&1 | head -20; then
    echo -e "  ${RED}✗ Ruff found issues${NC}"
    FAILED=1
else
    echo -e "  ${GREEN}✓ Ruff passed${NC}"
fi

echo ""
echo -e "  ${BLUE}→${NC} Running pyright..."
if ! pyright 2>&1 | tail -5; then
    echo -e "  ${RED}✗ Pyright found type errors${NC}"
    FAILED=1
else
    echo -e "  ${GREEN}✓ Pyright passed${NC}"
fi
echo ""

# -----------------------------------------------------------------------------
# Step 2: Unit Tests
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Step 2: Unit Tests ━━━${NC}"

if $QUICK_MODE; then
    echo -e "  ${BLUE}→${NC} Running pytest (quick mode)..."
    if ! pytest -x -q 2>&1 | tail -10; then
        echo -e "  ${RED}✗ Tests failed${NC}"
        FAILED=1
    else
        echo -e "  ${GREEN}✓ Tests passed${NC}"
    fi
else
    echo -e "  ${BLUE}→${NC} Running pytest..."
    if ! pytest 2>&1 | tail -15; then
        echo -e "  ${RED}✗ Tests failed${NC}"
        FAILED=1
    else
        echo -e "  ${GREEN}✓ Tests passed${NC}"
    fi
fi
echo ""

# -----------------------------------------------------------------------------
# Step 3: Output Verification (Close the Loop)
# -----------------------------------------------------------------------------
echo -e "${YELLOW}━━━ Step 3: Output Verification ━━━${NC}"
cd "$PROJECT_DIR"

echo -e "  ${BLUE}→${NC} Verifying outputs match expected..."
if ! python scripts/verify_outputs.py 2>&1 | tail -20; then
    echo -e "  ${RED}✗ Output verification failed${NC}"
    FAILED=1
else
    echo -e "  ${GREEN}✓ Outputs match expected${NC}"
fi
echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${BLUE}║${NC}  ${GREEN}✓ ALL CHECKS PASSED${NC}                                      ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}    Ready to commit!                                        ${BLUE}║${NC}"
else
    echo -e "${BLUE}║${NC}  ${RED}✗ SOME CHECKS FAILED${NC}                                      ${BLUE}║${NC}"
    echo -e "${BLUE}║${NC}    Please fix the issues before committing.                ${BLUE}║${NC}"
fi
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

exit $FAILED
