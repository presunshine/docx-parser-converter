# Test Specific DOCX File

Test the converter with a specific DOCX file and verify the output.

## Instructions

Ask for the DOCX file name if not provided.

1. Convert the file to HTML:
   ```python
   from docx_parser_converter_python import docx_to_html
   html = docx_to_html("fixtures/test_docx_files/<filename>.docx")
   print(html)
   ```

2. Convert to text:
   ```python
   from docx_parser_converter_python import docx_to_text
   text = docx_to_text("fixtures/test_docx_files/<filename>.docx")
   print(text)
   ```

3. Compare against expected output:
   ```bash
   python scripts/verify_outputs.py --file <filename> --verbose
   ```

4. If differences found:
   - Show the diff
   - Explain what's different
   - Ask if this is expected or a bug

Report the verification result and any findings.
