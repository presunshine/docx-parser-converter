# Changelog

All notable changes to the Python implementation of docx-parser-converter will be documented in this file.

## [1.0.1] - 2025-01-06

### Documentation
- Added migration guide for users upgrading from pre-1.0 versions
- Updated README with backwards compatibility information

## [1.0.0] - 2025-01-06

### Breaking Changes

This release introduces a **completely rewritten Python implementation** with a new, simplified API. If you were using the previous version, please read the migration guide below.

#### API Changes

| Old API | New API |
|---------|---------|
| `DocxToHtmlConverter` class | `docx_to_html()` function |
| `DocxToTxtConverter` class | `docx_to_text()` function |
| `read_binary_from_file_path()` | Not needed (pass file path directly) |
| `converter.convert_to_html()` | `docx_to_html(source)` |
| `converter.convert_to_txt()` | `docx_to_text(source)` |

### Migration Guide

#### Old API (deprecated)

```python
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter
from docx_parser_converter.docx_to_txt.docx_to_txt_converter import DocxToTxtConverter

# Read file
docx_content = read_binary_from_file_path("document.docx")

# Convert to HTML
html_converter = DocxToHtmlConverter(docx_content, use_default_values=True)
html = html_converter.convert_to_html()
html_converter.save_html_to_file(html, "output.html")

# Convert to text
txt_converter = DocxToTxtConverter(docx_content, use_default_values=True)
text = txt_converter.convert_to_txt(indent=True)
txt_converter.save_txt_to_file(text, "output.txt")
```

#### New API (recommended)

```python
from docx_parser_converter import docx_to_html, docx_to_text, ConversionConfig

# Convert to HTML (file path, bytes, or file object)
html = docx_to_html("document.docx")

# Convert to text
text = docx_to_text("document.docx")

# With configuration options
config = ConversionConfig(
    title="My Document",
    include_images=True,
    text_formatting="markdown"
)
html = docx_to_html("document.docx", config=config)

# Save to file
html = docx_to_html("document.docx", output_path="output.html")
text = docx_to_text("document.docx", output_path="output.txt")
```

### Backwards Compatibility

The old API is still available but **deprecated**. Using the old classes will emit `DeprecationWarning`:

```
DeprecationWarning: DocxToHtmlConverter is deprecated. Use docx_to_html() instead:
  from docx_parser_converter import docx_to_html
  html = docx_to_html("document.docx")
```

The old API will be removed in a future major version. We recommend migrating to the new API.

### New Features

- **Simplified API**: Single function calls instead of class instantiation
- **Flexible input**: Accept file paths, bytes, or file objects directly
- **Built-in file saving**: Optional `output_path` parameter
- **Configuration object**: `ConversionConfig` for all conversion options
- **Better error handling**: Descriptive exceptions with clear messages
- **Type hints**: Full type annotations for IDE support
- **Improved formatting**: Better preservation of styles, lists, and tables

### Improvements

- Complete rewrite with modern Python practices
- Pydantic v2 models for data validation
- Comprehensive test suite (1,705 tests)
- Type checking with pyright
- Linting with ruff

---

## Pre-1.0 Versions

Previous versions used a different package structure and class-based API. See the migration guide above for upgrading.
