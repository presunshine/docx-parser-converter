# Fix Type Errors

Find and fix all pyright type errors in the codebase.

## Pre-computed Context
```bash
cd docx_parser_converter_python && pyright --outputjson 2>/dev/null | head -50
```

## Instructions

1. Run pyright to get all errors:
   ```bash
   cd docx_parser_converter_python && pyright
   ```

2. For each error:
   - Read the relevant code
   - Understand the type mismatch
   - Fix with proper typing:
     - Use `Optional[X]` for nullable values
     - Use `Union[X, Y]` for multiple types
     - Avoid `Any` unless absolutely necessary
     - Add type guards where needed

3. Common fixes:
   - Missing return type → Add `-> ReturnType`
   - None check → Add `if x is not None:` guard
   - Incompatible types → Use proper Union or fix logic
   - Missing attribute → Check for None first

4. Re-run pyright after each fix to verify

5. Continue until zero errors

Report the number of errors fixed and the final status.
