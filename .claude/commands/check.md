# Run Quality Checks

Run all code quality checks for the Python implementation.

## Pre-computed Context
```bash
cd docx_parser_converter_python && git status --short | head -5
```

## Instructions

1. Run **ruff** linter:
   ```bash
   cd docx_parser_converter_python && ruff check .
   ```
   - If errors found, fix them (use `ruff check . --fix` for auto-fixable issues)

2. Run **pyright** type checker:
   ```bash
   cd docx_parser_converter_python && pyright
   ```
   - If type errors found, fix them with proper typing (avoid `Any`)

3. Run **pytest** tests:
   ```bash
   cd docx_parser_converter_python && pytest -v
   ```
   - If tests fail, analyze and fix the failures

4. Continue until ALL checks pass with zero errors.

Report the final status of each check.
