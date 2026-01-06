#!/bin/bash
# =============================================================================
# check.sh - Run all quality checks (pyright, ruff, pytest)
#
# Usage:
#   ./scripts/check.sh           # Run all checks
#   ./scripts/check.sh --quick   # Skip slow tests
#   ./scripts/check.sh --fix     # Auto-fix linting issues
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PYTHON_DIR="docx_parser_converter_python"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Parse arguments
QUICK_MODE=false
FIX_MODE=false
for arg in "$@"; do
    case $arg in
        --quick)
            QUICK_MODE=true
            ;;
        --fix)
            FIX_MODE=true
            ;;
    esac
done

# Change to project directory
cd "$PROJECT_DIR"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Running Quality Checks${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Track failures
FAILED=0

# =============================================================================
# 1. Ruff Linting
# =============================================================================
echo -e "${YELLOW}[1/3] Running Ruff Linter...${NC}"
cd "$PYTHON_DIR"

if $FIX_MODE; then
    if ruff check . --fix 2>&1; then
        echo -e "${GREEN}✓ Ruff: All issues fixed or no issues found${NC}"
    else
        echo -e "${RED}✗ Ruff: Some issues could not be auto-fixed${NC}"
        FAILED=1
    fi
else
    if ruff check . 2>&1; then
        echo -e "${GREEN}✓ Ruff: No linting errors${NC}"
    else
        echo -e "${RED}✗ Ruff: Linting errors found${NC}"
        FAILED=1
    fi
fi
echo ""

# =============================================================================
# 2. Pyright Type Checking
# =============================================================================
echo -e "${YELLOW}[2/3] Running Pyright Type Checker...${NC}"

if pyright 2>&1; then
    echo -e "${GREEN}✓ Pyright: No type errors${NC}"
else
    echo -e "${RED}✗ Pyright: Type errors found${NC}"
    FAILED=1
fi
echo ""

# =============================================================================
# 3. Pytest
# =============================================================================
echo -e "${YELLOW}[3/3] Running Pytest...${NC}"

if $QUICK_MODE; then
    echo -e "${BLUE}  (Quick mode: running with -x flag)${NC}"
    if pytest -x -q 2>&1; then
        echo -e "${GREEN}✓ Pytest: All tests passed${NC}"
    else
        echo -e "${RED}✗ Pytest: Tests failed${NC}"
        FAILED=1
    fi
else
    if pytest 2>&1; then
        echo -e "${GREEN}✓ Pytest: All tests passed${NC}"
    else
        echo -e "${RED}✗ Pytest: Tests failed${NC}"
        FAILED=1
    fi
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
cd "$PROJECT_DIR"
echo -e "${BLUE}============================================${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}  All checks passed!${NC}"
else
    echo -e "${RED}  Some checks failed${NC}"
fi
echo -e "${BLUE}============================================${NC}"

exit $FAILED
