# Test Format

Create DOCX test files with the following format for each test:

## Format

```
Test #1: {Test Name}
{Description - what styles should appear}
Expected: {JSON object with expected properties}

[CONTENT TO TEST - table, paragraph, list item, etc.]

Test #2: {Next Test Name}
...
```

## Running Tests

```bash
# Run all tests
python scripts/verify_tests.py --all

# Run specific file
python scripts/verify_tests.py fixtures/tagged_tests/list_tests.docx

# Run with verbose output
python scripts/verify_tests.py -v fixtures/tagged_tests/formatting_tests.docx

# Debug: show generated HTML
python scripts/verify_tests.py --show-html fixtures/tagged_tests/table_tests_v2.docx
```

## Available Test Files

| File | Tests | Description |
|------|-------|-------------|
| `table_tests_v2.docx` | 20 | Table structure, borders, spans, cells |
| `list_tests.docx` | 6 | Numbered lists, nesting, markers |
| `formatting_tests.docx` | 12 | Bold, italic, underline, colors, fonts |
| `margin_tests.docx` | 6 | Paragraph alignment (left, right, center, justify) |

## Expected Properties

### Text Formatting
| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `text_bold` | bool | `true` | Text is bold |
| `text_italic` | bool | `true` | Text is italic |
| `text_underline` | bool/str | `true` or `"double"` | Underline style |
| `text_strike` | bool | `true` | Strikethrough |
| `text_color` | str | `"#FF0000"` | Text color (hex) |
| `text_size` | str | `"12pt"` | Font size |
| `text_font` | str | `"Arial"` | Font family |
| `text_highlight` | str | `"#FFFF00"` | Highlight color |

### List Properties
| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `list_marker` | str | `"1.\t"` or `"a.\t"` | List marker text |
| `list_indent` | str | `"36pt"` | Left margin (indentation) |
| `has_hanging_indent` | bool | `true` | Has negative text-indent |

### Table Structure
| Property | Type | Description |
|----------|------|-------------|
| `rows` | int | Number of table rows |
| `cols` | int | Number of columns |
| `cells` | list[str] | Cell text contents |
| `has_colspan` | bool | Any cell has colspan > 1 |
| `has_rowspan` | bool | Any cell has rowspan > 1 |

### Table/Cell Borders
| Property | Type | Example |
|----------|------|---------|
| `table_border_top` | str | `"1pt solid #000000"` or `"none"` |
| `cell_border_top` | str | `"1pt solid #000000"` or `"none"` |
| `cell_bg` | str | `"#FFFF00"` |
| `table_width` | str | `"100%"` |

## Creating New Tests

### Programmatically (recommended)
```bash
# See existing scripts in scripts/
python scripts/create_table_tests_docx.py
python scripts/create_list_tests_docx.py
python scripts/create_formatting_tests_docx.py
```

### Tips
1. **One test content per section** - Each `Test #N:` should have one table/paragraph/list after Expected:
2. **JSON must be valid** - Use double quotes, `true`/`false` for booleans
3. **Colors are uppercase hex** - `"#FF0000"` not `"red"`
4. **Borders format** - `"Xpt solid #COLOR"` e.g., `"1pt solid #000000"`
