# Verify Tests

Run verification on test cases using the `Test #N:` format.

## Pre-computed Context
```bash
ls fixtures/tagged_tests/*.docx 2>/dev/null | wc -l
```

## Instructions

1. **Run test verification**
   ```bash
   python scripts/verify_tests.py --all
   ```

2. **For failures**, analyze the diff:
   - Check if the Expected JSON matches the actual HTML output
   - Determine if it's a converter bug or outdated expectation

3. **Fix issues**:
   - If `BUG`: Fix the converter code
   - If `EXPECTED_OUTDATED`: Regenerate the test DOCX using the scripts

4. **Re-run verification** until all tests pass

## Options

- `--all`: Verify all *_tests.docx files
- `--verbose` or `-v`: Show detailed output
- `--show-html`: Display generated HTML for debugging
- Specific file: `python scripts/verify_tests.py fixtures/tagged_tests/list_tests.docx`

## Test Files

| File | Tests | Description |
|------|-------|-------------|
| `table_tests_v2.docx` | 20 | Table structure, borders, cells |
| `list_tests.docx` | 6 | Numbered lists, nesting |
| `formatting_tests.docx` | 12 | Bold, italic, colors, fonts |
