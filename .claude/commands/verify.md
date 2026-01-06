# Verify Output Correctness

Close-the-loop verification: ensure converter outputs match expected results.

## Pre-computed Context
```bash
ls fixtures/test_docx_files/*.docx | wc -l
ls fixtures/outputs-python/*.html | wc -l
```

## Instructions

1. Run the output verification script:
   ```bash
   python scripts/verify_outputs.py --verbose
   ```

2. For each **failed** verification:
   - Analyze the diff to understand what changed
   - Determine if the change is:
     - **Bug**: Fix the converter code, re-verify
     - **Intentional improvement**: Update expected output with `--update` flag
   - Re-run verification until all pass

3. If updating expected outputs:
   ```bash
   python scripts/verify_outputs.py --file <filename> --update
   ```

4. Final verification:
   ```bash
   python scripts/verify_outputs.py
   ```

Report which files passed/failed and any actions taken.
