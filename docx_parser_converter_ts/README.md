# DOCX Parser Converter - TypeScript/JavaScript

TypeScript/JavaScript implementation of the DOCX parser and converter. Works in both **browser** and **Node.js** environments with ES Modules, UMD, and IIFE builds available.

**[🚀 Try the Live Demo →](https://omer-go.github.io/docx-parser-converter/)**

For installation and quick start, see the [main README](../README.md).

## Quick Start

```typescript
import { docxToHtml, docxToText } from '@omer-go/docx-parser-converter-ts';

// Convert to HTML
const html = await docxToHtml(buffer);

// Convert to plain text
const text = await docxToText(buffer);
```

## Environment Compatibility

### Browser

The library is fully browser-compatible using standard Web APIs:

```typescript
// From file input
const file = document.getElementById('fileInput').files[0];
const html = await docxToHtml(file);

// From ArrayBuffer
const arrayBuffer = await file.arrayBuffer();
const html = await docxToHtml(arrayBuffer);

// From Blob
const blob = new Blob([data]);
const html = await docxToHtml(blob);
```

### Node.js

In Node.js, you can also use file paths:

```typescript
import { docxToHtml, docxToText } from '@omer-go/docx-parser-converter-ts';

// File path (Node.js only)
const html = await docxToHtml('document.docx');

// Save directly to file (Node.js only)
await docxToHtml('document.docx', undefined, { outputPath: 'output.html' });

// Bytes also work
import { readFileSync } from 'fs';
const bytes = readFileSync('document.docx');
const html = await docxToHtml(bytes);
```

## Configuration

Use `ConversionConfig` to customize the conversion:

```typescript
import { docxToHtml, docxToText, ConversionConfig } from '@omer-go/docx-parser-converter-ts';

const config: ConversionConfig = {
  // HTML-specific options
  title: 'My Document',           // Document title in <title> tag
  language: 'en',                 // HTML lang attribute
  styleMode: 'inline',            // "inline", "class", or "none"
  useSemanticTags: false,         // Use CSS spans (false) vs <strong>, <em> (true)
  fragmentOnly: false,            // Output just content without HTML wrapper
  customCss: 'body { margin: 2em; }',  // Custom CSS to include
  responsive: true,               // Include viewport meta tag

  // Text-specific options
  textFormatting: 'plain',        // "plain" or "markdown"
  tableMode: 'auto',              // "auto", "ascii", "tabs", or "plain"
  paragraphSeparator: '\n\n',     // Separator between paragraphs
};

const html = await docxToHtml(buffer, config);
const text = await docxToText(buffer, config);
```

### Configuration Options

#### HTML Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `styleMode` | `"inline"` \| `"class"` \| `"none"` | `"inline"` | How to output CSS styles |
| `useSemanticTags` | `boolean` | `false` | Use semantic tags (`<strong>`, `<em>`) vs CSS spans |
| `preserveWhitespace` | `boolean` | `false` | Preserve whitespace in content |
| `includeDefaultStyles` | `boolean` | `true` | Include default CSS styles |
| `title` | `string` | `""` | Document title for HTML output |
| `language` | `string` | `"en"` | HTML `lang` attribute |
| `fragmentOnly` | `boolean` | `false` | Output only content, no HTML wrapper |
| `customCss` | `string \| null` | `null` | Custom CSS to include |
| `cssFiles` | `string[]` | `[]` | External CSS files to reference |
| `useCssVariables` | `boolean` | `false` | Use CSS custom properties |
| `responsive` | `boolean` | `true` | Include viewport meta tag |
| `includePrintStyles` | `boolean` | `false` | Include print media query styles |

#### Text Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `textFormatting` | `"plain"` \| `"markdown"` | `"plain"` | Output format |
| `tableMode` | `"auto"` \| `"ascii"` \| `"tabs"` \| `"plain"` | `"auto"` | Table rendering mode |
| `paragraphSeparator` | `string` | `"\n\n"` | Separator between paragraphs |
| `preserveEmptyParagraphs` | `boolean` | `true` | Preserve empty paragraphs |

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

When using `textFormatting: "markdown"`, formatting is preserved:

```typescript
const config: ConversionConfig = { textFormatting: 'markdown' };
const text = await docxToText(buffer, config);

// Output: "This is **bold** and *italic* text."
```

## Module Formats

### ES Modules (Recommended)

```typescript
import { docxToHtml, docxToText } from '@omer-go/docx-parser-converter-ts';
```

### UMD (Browser `<script>` tag)

```html
<script src="path/to/dist/docx-parser-converter.umd.js"></script>
<script>
  const { docxToHtml, docxToText } = window.DocxParserConverter;
</script>
```

### IIFE (Browser global)

```html
<script src="path/to/dist/docx-parser-converter.iife.js"></script>
<script>
  const { docxToHtml, docxToText } = DocxParserConverter;
</script>
```

## Browser Usage Example

```html
<input type="file" id="docxFile" accept=".docx" />
<button onclick="handleConvert()">Convert</button>
<div id="htmlOutput"></div>
<pre id="textOutput"></pre>

<script type="module">
import { docxToHtml, docxToText } from '@omer-go/docx-parser-converter-ts';

window.handleConvert = async function() {
    const fileInput = document.getElementById('docxFile');
    if (!fileInput.files?.length) {
        alert('Please select a DOCX file.');
        return;
    }

    const file = fileInput.files[0];

    // Convert to HTML
    const html = await docxToHtml(file, { title: 'Converted Document' });
    document.getElementById('htmlOutput').innerHTML = html;

    // Convert to Plain Text
    const text = await docxToText(file);
    document.getElementById('textOutput').textContent = text;
}
</script>
```

## Input Types

The library accepts multiple input types:

```typescript
// ArrayBuffer
const arrayBuffer = await file.arrayBuffer();
const html = await docxToHtml(arrayBuffer);

// Uint8Array
const uint8 = new Uint8Array(arrayBuffer);
const html = await docxToHtml(uint8);

// Blob
const blob = new Blob([data]);
const html = await docxToHtml(blob);

// File (from input element)
const file = inputElement.files[0];
const html = await docxToHtml(file);

// File path (Node.js only)
const html = await docxToHtml('document.docx');

// null/undefined returns empty output
const html = await docxToHtml(null);  // Returns empty HTML document
const text = await docxToText(null);  // Returns ""
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

### Images
- Inline images with dimensions and alt text
- Floating/anchored images with positioning (left, right, center)
- Embedded as base64 data URLs in HTML output

### Hyperlinks
- External URLs resolved from relationships

## TypeScript-Specific Limitations

The TypeScript implementation does **not** currently support:
- Headers and footers
- Footnotes and endnotes
- Comments
- Custom XML parts

See the [main README](../README.md) for the full feature comparison.

## Error Handling

The library provides specific exceptions for different error cases:

```typescript
import { 
  docxToHtml,
  DocxNotFoundError,
  DocxReadError,
  DocxValidationError 
} from '@omer-go/docx-parser-converter-ts';

try {
  const html = await docxToHtml('document.docx');
} catch (e) {
  if (e instanceof DocxNotFoundError) {
    console.error('File not found');
  } else if (e instanceof DocxReadError) {
    console.error('Cannot read file:', e.message);
  } else if (e instanceof DocxValidationError) {
    console.error('Invalid DOCX:', e.message);
  }
}
```

### Exception Types

| Exception | Description |
|-----------|-------------|
| `DocxParserError` | Base class for all DOCX errors |
| `DocxNotFoundError` | File not found (Node.js only) |
| `DocxReadError` | Cannot read file |
| `DocxValidationError` | Invalid DOCX structure |
| `DocxEncryptedError` | Password-protected file |
| `DocxMissingPartError` | Required part missing (e.g., document.xml) |
| `XmlParseError` | XML parsing failed |

## Advanced API

For more control, use `parseDocx` directly:

```typescript
import { parseDocx, HTMLConverter, TextConverter } from '@omer-go/docx-parser-converter-ts';

// Parse DOCX to get document model and metadata
const [document, metadata] = await parseDocx(buffer);

if (document) {
  // Use converters directly
  const htmlConverter = new HTMLConverter(document, {
    styles: metadata.styles,
    numbering: metadata.numbering,
    relationships: metadata.relationships,
    imageData: metadata.imageData,
  });

  const html = htmlConverter.convert({
    styleMode: 'class',
    title: 'My Document',
  });
}
```

## Architecture

The library follows a three-phase conversion process:

1. **Parse**: Unzip DOCX and parse XML parts (`document.xml`, `styles.xml`, `numbering.xml`) into typed models
2. **Resolve**: Apply hierarchical style inheritance (direct formatting > character style > paragraph style > defaults)
3. **Convert**: Transform models to HTML or plain text output

## Project Structure

```
docx_parser_converter_ts/
├── src/
│   ├── index.ts           # Public exports
│   ├── api.ts             # Main API (docxToHtml, docxToText, parseDocx)
│   ├── config.ts          # ConversionConfig interface
│   ├── core/              # Core utilities
│   │   ├── docx-reader.ts # DOCX file opening and validation
│   │   ├── xml-extractor.ts # XML content extraction
│   │   ├── constants.ts   # XML namespaces
│   │   └── exceptions.ts  # Custom exceptions
│   ├── models/            # TypeScript interfaces
│   │   ├── common/        # Shared models (Color, Border, Spacing, etc.)
│   │   ├── document/      # Document models (Paragraph, Run, Table, etc.)
│   │   ├── numbering/     # Numbering definitions
│   │   └── styles/        # Style definitions
│   ├── parsers/           # XML to model conversion
│   │   ├── document/      # Document element parsers
│   │   ├── numbering/     # Numbering parsers
│   │   └── styles/        # Style parsers
│   └── converters/        # Model to output conversion
│       ├── common/        # Style resolution, numbering tracking
│       ├── html/          # HTML conversion
│       └── text/          # Text conversion
└── tests/                 # Test suite
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/omer-go/docx-parser-converter.git
cd docx-parser-converter/docx_parser_converter_ts

# Install dependencies (using pnpm)
pnpm install
```

### Build

```bash
# Build all formats (ES, UMD, IIFE)
pnpm build

# Type checking
pnpm tsc --noEmit
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test src/__tests__/api.test.ts
```

### Linting

```bash
# Run ESLint
pnpm lint
```

## Known Limitations

### Not Currently Supported
- **Headers and footers**: Document headers/footers are not included
- **Footnotes and endnotes**: These are not extracted
- **Comments and track changes**: Revision marks are not processed
- **OLE objects**: Embedded Excel charts, etc. are not supported
- **Text boxes**: Floating text boxes and shapes are not extracted
- **RTL/BiDi text**: Right-to-left text may not render correctly
- **Password-protected files**: Encrypted documents cannot be opened

### Partial Support
- **Themes**: Theme colors and fonts are not resolved
- **Custom XML**: Custom document properties are not extracted

## License

MIT License

## Related Documentation

- [XML to CSS Conversion](../docs/xml_to_css_conversion.md) - XML to CSS conversion reference
- [XML Structure Guide](../docs/XML_STRUCTURE_GUIDE.md) - OOXML structure reference