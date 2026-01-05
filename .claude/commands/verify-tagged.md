# Verify Tagged Tests

Run verification on tagged test cases and analyze failures with subagents.

## Pre-computed Context
```bash
ls fixtures/tagged_tests/*.docx 2>/dev/null | wc -l
```

## Instructions

1. **Check for tagged test files**
   ```bash
   ls -la fixtures/tagged_tests/
   ```

2. **Run tagged test verification**
   ```bash
   python scripts/verify_tagged_tests.py --verbose
   ```

3. **For each failure**, spawn a verification subagent:
   - Provide the test ID, description, XML content
   - Provide expected and actual outputs
   - Provide the diff
   - Use the `analyze-test-failure` command template

4. **Review subagent analyses**:
   - If `BUG`: Fix the converter code
   - If `EXPECTED_OUTDATED`: Update the expected output in the DOCX
   - If `EDGE_CASE`: Report to user for decision

5. **Re-run verification** until all tests pass

6. **Report summary**:
   - Total tests
   - Passed / Failed
   - Actions taken
   - Any remaining issues

## Options

- `--file <name>`: Verify specific DOCX file only
- `--category <cat>`: Verify specific category (fmt, para, list, tbl, font, style)
- `--test <id>`: Verify single test by ID
- `--no-subagents`: Skip subagent analysis, just report failures
