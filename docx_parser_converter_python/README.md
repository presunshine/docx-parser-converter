# DOCX Parser Converter - Python

Python implementation of the DOCX parser and converter. Built with Python 3.10+, Pydantic models, and lxml.

For installation and quick start, see the [main README](../README.md).

## ⚠️ Breaking Changes in v1.0.0

Version 1.0.0 introduces a **completely rewritten API**. If you're upgrading from a previous version, please read the [CHANGELOG.md](CHANGELOG.md) for the full migration guide.

### Quick Migration

**Old API (deprecated):**
```python
from docx_parser_converter.docx_parsers.utils import read_binary_from_file_path
from docx_parser_converter.docx_to_html.docx_to_html_converter import DocxToHtmlConverter

docx_content = read_binary_from_file_path("document.docx")
converter = DocxToHtmlConverter(docx_content)
html = converter.convert_to_html()
```

**New API (recommended):**
```python
from docx_parser_converter import docx_to_html

html = docx_to_html("document.docx")
```

The old API still works but emits deprecation warnings. It will be removed in a future version.

## Configuration

Use `ConversionConfig` to customize the conversion:

```python
from docx_parser_converter import ConversionConfig, docx_to_html, docx_to_text

# HTML conversion options
config = ConversionConfig(
    # HTML-specific options
    title="My Document",           # Document title in <title> tag
    language="en",                 # HTML lang attribute
    style_mode="inline",           # "inline", "class", or "none"
    use_semantic_tags=False,       # Use CSS spans (False) vs <strong>, <em> (True)
    fragment_only=False,           # Output just content without HTML wrapper
    custom_css="body { margin: 2em; }",  # Custom CSS to include
    responsive=True,               # Include viewport meta tag

    # Text-specific options
    text_formatting="plain",       # "plain" or "markdown"
    table_mode="auto",             # "auto", "ascii", "tabs", or "plain"
    paragraph_separator="\n\n",    # Separator between paragraphs
)

html = docx_to_html("document.docx", config=config)
text = docx_to_text("document.docx", config=config)
```

### Configuration Options

#### HTML Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `style_mode` | `"inline"` \| `"class"` \| `"none"` | `"inline"` | How to output CSS styles |
| `use_semantic_tags` | `bool` | `False` | Use semantic tags (`<strong>`, `<em>`) vs CSS spans |
| `preserve_whitespace` | `bool` | `False` | Preserve whitespace in content |
| `title` | `str` | `""` | Document title for HTML output |
| `language` | `str` | `"en"` | HTML `lang` attribute |
| `fragment_only` | `bool` | `False` | Output only content, no HTML wrapper |
| `custom_css` | `str \| None` | `None` | Custom CSS to include |
| `css_files` | `list[str]` | `[]` | External CSS files to reference |
| `responsive` | `bool` | `True` | Include viewport meta tag |
| `include_print_styles` | `bool` | `False` | Include print media query styles |

#### Text Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `text_formatting` | `"plain"` \| `"markdown"` | `"plain"` | Output format |
| `table_mode` | `"auto"` \| `"ascii"` \| `"tabs"` \| `"plain"` | `"auto"` | Table rendering mode |
| `paragraph_separator` | `str` | `"\n\n"` | Separator between paragraphs |
| `preserve_empty_paragraphs` | `bool` | `True` | Preserve empty paragraphs |

### Table Rendering Modes

- **`auto`**: Automatically selects ASCII for tables with visible borders, tabs for others
- **`ascii`**: ASCII box drawing characters (`+`, `-`, `|`)
- **`tabs`**: Tab-separated columns
- **`plain`**: Space-separated columns

Example ASCII table output:
```
+----------+----------+
| Header 1 | Header 2 |
+----------+----------+
| Cell 1   | Cell 2   |
+----------+----------+
```

### Markdown Formatting

When using `text_formatting="markdown"`, formatting is preserved:

```python
config = ConversionConfig(text_formatting="markdown")
text = docx_to_text("document.docx", config=config)

# Output: "This is **bold** and *italic* text."
```

## Input Types

The library accepts multiple input types:

```python
from pathlib import Path
from io import BytesIO

# File path as string
html = docx_to_html("document.docx")

# File path as Path object
html = docx_to_html(Path("document.docx"))

# Bytes content
with open("document.docx", "rb") as f:
    content = f.read()
html = docx_to_html(content)

# File-like object
with open("document.docx", "rb") as f:
    html = docx_to_html(f)

# None returns empty output
html = docx_to_html(None)  # Returns empty HTML document
text = docx_to_text(None)  # Returns ""
```

## Supported DOCX Elements

### Text Formatting
- Bold, italic, underline, strikethrough
- Subscript, superscript
- Highlight colors
- Font family, size, and color
- All caps, small caps
- Various underline styles (single, double, dotted, dashed, wave, etc.) with color support

### Paragraph Formatting
- Alignment (left, center, right, justify)
- Indentation (left, right, first line, hanging)
- Spacing (before, after, line spacing)
- Borders and shading
- Keep with next, keep lines together, page break before

### Lists and Numbering
- Bullet lists
- Numbered lists (decimal, roman, letters, ordinal)
- Multi-level lists with various formats
- List restart and override support

### Tables
- Simple and complex tables
- Cell merging (horizontal and vertical)
- Full border support (outer borders, inside grid lines, per-cell borders)
- Cell-level border overrides (tcBorders override tblBorders)
- Cell shading and backgrounds
- Column widths and table alignment

### Other Elements
- Hyperlinks (external URLs resolved from relationships)
- Line breaks and page breaks
- Tab characters
- Special characters (soft hyphen, non-breaking hyphen)

## Error Handling

The library provides specific exceptions for different error cases:

```python
from docx_parser_converter import docx_to_html

try:
    html = docx_to_html("document.docx")
except FileNotFoundError:
    print("File not found")
except ValueError as e:
    print(f"Invalid DOCX: {e}")
except Exception as e:
    print(f"Error: {e}")
```

## Image Format Support

Images are extracted from DOCX files and embedded in HTML as base64 data URLs. Browser rendering support varies by format:

| Format | Extensions | Browser Support |
|--------|------------|-----------------|
| PNG | `.png` | ✅ Full |
| JPEG | `.jpg`, `.jpeg` | ✅ Full |
| GIF | `.gif` | ✅ Full (including animation) |
| WebP | `.webp` | ✅ Full |
| SVG | `.svg` | ✅ Full |
| BMP | `.bmp` | ✅ Full |
| TIFF | `.tif`, `.tiff` | ⚠️ Safari only |
| EMF | `.emf` | ❌ Not supported |
| WMF | `.wmf` | ❌ Not supported |

**Notes:**
- TIFF images will only display in Safari; other browsers will show a broken image
- EMF/WMF are Windows vector formats that browsers cannot render natively
- Images in plain text output are skipped (no alt text placeholders)

## Known Limitations

### Not Currently Supported
- **Headers and footers**: Document headers/footers are not included
- **Footnotes and endnotes**: These are not extracted
- **Comments and track changes**: Revision marks are not processed
- **OLE objects**: Embedded Excel charts, etc. are not supported
- **Text boxes**: Floating text boxes and shapes are not extracted
- **Complex field codes**: Most field codes besides hyperlinks
- **RTL/BiDi text**: Right-to-left text may not render correctly
- **Password-protected files**: Encrypted documents cannot be opened

### Partial Support
- **Styles**: Style inheritance works but complex conditional formatting is limited
- **Themes**: Theme colors and fonts are not resolved
- **Custom XML**: Custom document properties are not extracted
- **Sections**: Section properties (columns, page size) affect content but aren't fully rendered

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/omer-go/docx-parser-converter.git
cd docx-parser-converter/docx_parser_converter_python

# Install PDM (if not already installed)
pip install pdm

# Install dependencies
pdm install

# Install dev dependencies
pdm install -G dev
```

### Running Tests

```bash
# Run all tests
pdm run pytest

# Run with coverage
pdm run pytest --cov

# Run specific test file
pdm run pytest tests/unit/test_api.py
```

### Type Checking

```bash
pdm run pyright
```

### Linting

```bash
pdm run ruff check .
pdm run ruff format .
```

## Project Structure

```
docx_parser_converter_python/
├── api.py              # Public API (docx_to_html, docx_to_text, ConversionConfig)
├── core/               # Core utilities
│   ├── docx_reader.py  # DOCX file opening and validation
│   ├── xml_extractor.py # XML content extraction
│   ├── constants.py    # XML namespaces and paths
│   └── exceptions.py   # Custom exceptions
├── models/             # Pydantic models
│   ├── common/         # Shared models (Color, Border, Spacing, etc.)
│   ├── document/       # Document models (Paragraph, Run, Table, etc.)
│   ├── numbering/      # Numbering definitions
│   └── styles/         # Style definitions
├── parsers/            # XML to Pydantic conversion
│   ├── common/         # Common element parsers
│   ├── document/       # Document element parsers
│   ├── numbering/      # Numbering parsers
│   └── styles/         # Style parsers
├── converters/         # Model to output conversion
│   ├── common/         # Style resolution, numbering tracking
│   ├── html/           # HTML conversion
│   └── text/           # Text conversion
└── tests/              # Test suite
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── fixtures/       # Test DOCX files
```

## Architecture

The library follows a three-phase conversion process:

1. **Parse**: DOCX XML → Pydantic models
   - Open and validate DOCX file
   - Extract document.xml, styles.xml, numbering.xml
   - Parse XML to strongly-typed Pydantic models

2. **Resolve**: Apply style inheritance
   - Merge document defaults → style chain → direct formatting
   - Track numbering counters for lists

3. **Convert**: Models → Output format
   - HTML: Generate semantic HTML with CSS
   - Text: Extract plain text with optional Markdown

## License

MIT License

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Related Documentation

- [XML to CSS Conversion](../docs/xml_to_css_conversion.md) - XML to CSS conversion reference
- [XML Structure Guide](../docs/XML_STRUCTURE_GUIDE.md) - OOXML structure reference
