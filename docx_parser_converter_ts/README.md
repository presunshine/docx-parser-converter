# DOCX Parser and Converter - TypeScript/JavaScript

TypeScript/JavaScript implementation of the DOCX parser and converter. Designed for browser environments with ES Modules, UMD, and IIFE builds available.

For installation and quick start, see the [main README](../README.md).

## Environment Compatibility

**This package is primarily designed and tested for browser environments.**

While efforts are underway to ensure full Node.js compatibility, using this version in a Node.js environment might lead to errors (such as `document is not defined` or `Buffer is not defined`) because some underlying dependencies currently rely on browser-specific APIs.

Node.js support will be improved in future releases.

## Module Formats

### ES Modules (Recommended)
```javascript
import { DocxToHtmlConverter, DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';
```

### UMD (Browser `<script>` tag)
```html
<script src="path/to/dist/docx-parser-converter.umd.js"></script>
<script>
  const { DocxToHtmlConverter, DocxToTxtConverter } = window.DocxParserConverter;
</script>
```

## Browser Usage Example

```html
<input type="file" id="docxFile" accept=".docx" />
<button onclick="handleConvert()">Convert</button>
<div id="htmlOutput"></div>
<pre id="textOutput"></pre>

<script type="module">
import { DocxToHtmlConverter, DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';

window.handleConvert = async function() {
    const fileInput = document.getElementById('docxFile');
    if (!fileInput.files?.length) {
        alert('Please select a DOCX file.');
        return;
    }

    const arrayBuffer = await fileInput.files[0].arrayBuffer();

    // Convert to HTML
    const htmlConverter = await DocxToHtmlConverter.create(arrayBuffer, { useDefaultValues: true });
    document.getElementById('htmlOutput').innerHTML = htmlConverter.convertToHtml();

    // Convert to Plain Text
    const txtConverter = await DocxToTxtConverter.create(arrayBuffer, { useDefaultValues: true });
    document.getElementById('textOutput').textContent = txtConverter.convertToTxt({ indent: true });
}
</script>
```

## Architecture

The library follows a three-phase conversion process:

1. **Parse**: Unzip DOCX and parse XML parts (`document.xml`, `styles.xml`, `numbering.xml`) into structured models
2. **Resolve**: Apply hierarchical style inheritance (direct formatting > character style > paragraph style > defaults)
3. **Convert**: Transform models to HTML or plain text output

## TypeScript-Specific Limitations

The TypeScript implementation does **not** currently support:
- Images (inline or floating)
- Headers and footers
- Footnotes and endnotes
- Comments
- Custom XML parts

See the [main README](../README.md) for the full feature comparison.

## API Reference

### DocxToHtmlConverter

```typescript
// Create converter from DOCX data
static async create(
  docxFile: ArrayBuffer | Uint8Array | File | Blob,
  options?: DocxToHtmlOptions
): Promise<DocxToHtmlConverter>

// Convert to HTML string
convertToHtml(): string
```

### DocxToTxtConverter

```typescript
// Create converter from DOCX data
static async create(
  docxFile: ArrayBuffer | Uint8Array | File | Blob,
  options?: DocxToTxtOptions
): Promise<DocxToTxtConverter>

// Convert to plain text
convertToTxt(options?: { indent?: boolean }): string
```

### Options Interfaces

```typescript
interface DocxToHtmlOptions {
  useDefaultValues?: boolean;
}

interface DocxToTxtOptions {
  useDefaultValues?: boolean;
}
```

## Related Documentation

- [XML to CSS Conversion](../docs/xml_to_css_conversion.md) - XML to CSS conversion reference
- [XML Structure Guide](../docs/XML_STRUCTURE_GUIDE.md) - OOXML structure reference