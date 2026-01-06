# DOCX Parser and Converter

Convert Microsoft Word DOCX files to HTML and plain text. Available for both **Python** and **TypeScript/JavaScript**.

## Features

- **High-fidelity HTML conversion** with CSS styling
- **Plain text extraction** with optional Markdown formatting
- **Rich text formatting**: bold, italic, underline, strikethrough, subscript, superscript, highlight
- **Images**: inline and floating images (Python only)
- **Tables**: cell merging, borders, shading
- **Lists**: bullets, numbered, multi-level
- **Hyperlinks**: resolved from document relationships
- **Style inheritance**: follows Word's style chain

## Installation

### Python

```bash
pip install docx-parser-converter
```

### TypeScript/JavaScript

```bash
npm install @omer-go/docx-parser-converter-ts
# or
yarn add @omer-go/docx-parser-converter-ts
```

## Quick Start

### Python

```python
from docx_parser_converter import docx_to_html, docx_to_text

# Convert to HTML
html = docx_to_html("document.docx")

# Convert to plain text
text = docx_to_text("document.docx")

# Save directly to file
docx_to_html("document.docx", output_path="output.html")
```

### TypeScript/JavaScript

```typescript
import { DocxToHtmlConverter, DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';

// In browser with file input
const file = document.getElementById('fileInput').files[0];
const arrayBuffer = await file.arrayBuffer();

// Convert to HTML
const htmlConverter = await DocxToHtmlConverter.create(arrayBuffer);
const html = htmlConverter.convertToHtml();

// Convert to plain text
const txtConverter = await DocxToTxtConverter.create(arrayBuffer);
const text = txtConverter.convertToTxt();
```

## Configuration

### Python

```python
from docx_parser_converter import docx_to_html, ConversionConfig

config = ConversionConfig(
    title="My Document",
    style_mode="inline",       # "inline", "class", or "none"
    use_semantic_tags=False,   # CSS spans vs <strong>, <em>
    text_formatting="plain",   # "plain" or "markdown"
    table_mode="auto",         # "auto", "ascii", "tabs", "plain"
)

html = docx_to_html("document.docx", config=config)
```

### TypeScript/JavaScript

```typescript
const converter = await DocxToHtmlConverter.create(arrayBuffer, {
    useDefaultValues: true
});
const html = converter.convertToHtml();

const txtConverter = await DocxToTxtConverter.create(arrayBuffer);
const text = txtConverter.convertToTxt({ indent: true });
```

## Supported Elements

| Element | Python | TypeScript |
|---------|--------|------------|
| **Text formatting** (bold, italic, underline, etc.) | ✅ | ✅ |
| **Paragraph formatting** (alignment, spacing, indentation) | ✅ | ✅ |
| **Lists** (bullets, numbered, multi-level) | ✅ | ✅ |
| **Tables** (borders, merging, shading) | ✅ | ✅ |
| **Hyperlinks** | ✅ | ✅ |
| **Images** (inline and floating) | ✅ | ❌ |
| **Style inheritance** | ✅ | ✅ |

## Known Limitations

**Not supported in either implementation:**
- Headers and footers
- Footnotes and endnotes
- Comments and track changes
- OLE objects (embedded Excel, etc.)
- Text boxes and shapes
- Password-protected files

## Implementation Details

For detailed documentation specific to each implementation:

- **[Python Documentation](docx_parser_converter_python/README.md)** - Configuration options, API reference, development setup
- **[TypeScript Documentation](docx_parser_converter_ts/README.md)** - Browser usage, API reference, build options

## Technical Reference

- [XML to CSS Conversion](docs/xml_to_css_conversion.md) - Mapping of DOCX XML elements to CSS
- [XML Structure Guide](docs/XML_STRUCTURE_GUIDE.md) - OOXML structure reference

## Development

```bash
# Clone repository
git clone https://github.com/omer-go/docx-parser-converter.git

# Python development
cd docx_parser_converter_python
pip install pdm && pdm install -G dev
pdm run pytest

# TypeScript development
cd docx_parser_converter_ts
npm install
npm run build
```

## License

MIT License

## Contributing

Contributions welcome! See the implementation-specific READMEs for development setup.
