# Table Test Format

Create a DOCX file in Microsoft Word with the following format for each test:

## Format

```
Test #1: {Test Name}
{Description - what styles should appear}
Expected: {JSON object with expected properties}

[TABLE HERE]

Test #2: {Next Test Name}
...
```

## Example Tests

### Test #1: Basic 2x2 Table
```
Test #1: Basic 2x2 Table
A simple 2x2 table with no special formatting. First cell contains bold text "A1".
Expected: {"rows": 2, "cols": 2, "cells": ["A1", "A2", "B1", "B2"], "text_bold": true}

| A1 | A2 |
| B1 | B2 |
```

### Test #2: Table with Borders
```
Test #2: Table with Cell Borders
Table with visible cell borders (1pt solid black).
Expected: {"rows": 2, "cols": 2, "cell_border_top": "1pt solid #000000"}

| C1 | C2 |
| D1 | D2 |
```

### Test #3: Colored Background
```
Test #3: Cell Background Color
First cell has yellow background (#FFFF00).
Expected: {"rows": 1, "cols": 2, "cell_bg": "#FFFF00"}

| Yellow | Normal |
```

### Test #4: Column Span
```
Test #4: Column Span
First row has single cell spanning 2 columns.
Expected: {"rows": 2, "cols": 2, "has_colspan": true}

| Header (spans 2) |
| Left    | Right  |
```

### Test #5: Row Span
```
Test #5: Row Span
First cell spans 2 rows vertically.
Expected: {"rows": 2, "cols": 2, "has_rowspan": true}

| Spans 2 rows | Top    |
|              | Bottom |
```

### Test #6: Text Styling
```
Test #6: Bold and Colored Text
First cell has bold red text.
Expected: {"text_bold": true, "text_color": "#FF0000"}

| Bold Red | Normal |
```

## Available Expected Properties

### Structure
| Property | Type | Description |
|----------|------|-------------|
| `rows` | int | Number of table rows |
| `cols` | int | Number of columns (first row) |
| `cells` | list[str] | Cell text contents in order |
| `has_colspan` | bool | Any cell has colspan > 1 |
| `has_rowspan` | bool | Any cell has rowspan > 1 |

### Table Styles
| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `table_border_top` | str | `"0.5pt solid #000000"` or `"none"` | Table top border |
| `table_border_bottom` | str | `"0.5pt solid #000000"` or `"none"` | Table bottom border |
| `table_border_left` | str | `"0.5pt solid #000000"` or `"none"` | Table left border |
| `table_border_right` | str | `"0.5pt solid #000000"` or `"none"` | Table right border |
| `table_width` | str | `"100%"` or `"500pt"` | Table width |

### Cell Styles (First Cell)
| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `cell_border_top` | str | `"1pt solid #000000"` or `"none"` | First cell top border |
| `cell_border_bottom` | str | `"1pt solid #000000"` or `"none"` | First cell bottom border |
| `cell_border_left` | str | `"1pt solid #000000"` or `"none"` | First cell left border |
| `cell_border_right` | str | `"1pt solid #000000"` or `"none"` | First cell right border |
| `cell_bg` | str | `"#FFFF00"` | First cell background color |
| `cell_valign` | str | `"top"`, `"middle"`, `"bottom"` | First cell vertical alignment |
| `cell_width` | str | `"200pt"` | First cell width |

### Text Styles (First Text in First Cell)
| Property | Type | Example | Description |
|----------|------|---------|-------------|
| `text_bold` | bool | `true` | First cell text is bold |
| `text_italic` | bool | `true` | First cell text is italic |
| `text_underline` | bool/str | `true` or `"double"` | Underline style |
| `text_color` | str | `"#FF0000"` | First cell text color |
| `text_size` | str | `"12pt"` | First cell font size |
| `text_font` | str | `"Arial"` | First cell font family |

## Running Tests

```bash
# Run on specific file
python scripts/verify_table_tests.py fixtures/tagged_tests/my_table_tests.docx

# Run with verbose output
python scripts/verify_table_tests.py -v fixtures/tagged_tests/my_table_tests.docx

# Run all table test files
python scripts/verify_table_tests.py --all

# Debug: show generated HTML
python scripts/verify_table_tests.py --show-html fixtures/tagged_tests/my_table_tests.docx
```

## Tips for Creating Test Files

1. **One table per test** - Each `Test #N:` section should have exactly one table after it
2. **JSON must be valid** - Use double quotes for strings, `true`/`false` for booleans
3. **Colors are hex** - Use uppercase hex format: `"#FF0000"` not `"red"`
4. **Borders format** - Format is `"Xpt style #COLOR"` e.g., `"1pt solid #000000"`
5. **Test order matters** - Tests are matched to tables in document order
