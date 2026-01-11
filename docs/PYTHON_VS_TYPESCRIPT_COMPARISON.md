# Python vs TypeScript Library Comparison

This document provides a detailed comparison between the Python and TypeScript implementations of the DOCX Parser Converter library.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Directory Structure Comparison](#directory-structure-comparison)
3. [Core Modules Comparison](#core-modules-comparison)
4. [Models Comparison](#models-comparison)
5. [Parsers Comparison](#parsers-comparison)
6. [Converters Comparison](#converters-comparison)
7. [Test Coverage Comparison](#test-coverage-comparison)
8. [Public API Comparison](#public-api-comparison)
9. [Scripts Comparison](#scripts-comparison)
10. [Inconsistencies Summary](#inconsistencies-summary)

---

## Executive Summary

Both libraries provide equivalent functionality for converting DOCX files to HTML and plain text. The TypeScript implementation follows the Python structure closely but with language-appropriate idioms (camelCase vs snake_case, interfaces vs Pydantic models, async/await patterns, etc.).

### Key Differences:
- **Async vs Sync**: TypeScript uses async/await throughout; Python uses synchronous operations
- **File I/O**: Python supports `BinaryIO` streams; TypeScript works with `ArrayBuffer`, `Uint8Array`, and `Blob`
- **Output Path**: Python API supports `output_path` parameter; TypeScript requires manual file writing
- **Legacy Modules**: Python has deprecated `docx_to_html/` and `docx_to_txt/` wrappers; TypeScript has `-legacy/` folder
- **Configuration**: Python uses `dataclass`; TypeScript uses `interface` with separate defaults

---

## Directory Structure Comparison

### Root Level Comparison

| Python (`docx_parser_converter/`) | TypeScript (`src/`) | Match Status |
|-----------------------------------|---------------------|--------------|
| `__init__.py` | `index.ts` | ✅ Equivalent |
| `api.py` | `api.ts` | ✅ Equivalent |
| N/A | `config.ts` | ⚠️ TS separates config from API |
| `converters/` | `converters/` | ✅ Equivalent |
| `core/` | `core/` | ✅ Equivalent |
| `models/` | `models/` | ✅ Equivalent |
| `parsers/` | `parsers/` | ✅ Equivalent |
| `docx_parsers/` | N/A | ⚠️ Python-only (deprecated) |
| `docx_to_html/` | N/A | ⚠️ Python-only (deprecated) |
| `docx_to_txt/` | N/A | ⚠️ Python-only (deprecated) |
| N/A | `-legacy/` | ⚠️ TS-only legacy folder |

---

## Core Modules Comparison

### `core/` Directory

| Python File | TypeScript File | Match Status | Notes |
|-------------|-----------------|--------------|-------|
| `constants.py` | `constants.ts` | ✅ Equivalent | Same namespaces and paths |
| `docx_reader.py` | `docx-reader.ts` | ✅ Equivalent | TS is async, uses JSZip |
| `exceptions.py` | `exceptions.ts` | ✅ Equivalent | All exceptions match |
| `model_utils.py` | `model-utils.ts` | ✅ Equivalent | Same merge functions |
| `xml_extractor.py` | `xml-extractor.ts` | ✅ Equivalent | Same extraction functions |
| `xml_helpers.py` | N/A | ⚠️ Empty in Python |
| `unit_conversion.py` | N/A | ⚠️ Empty in Python |

### Core Functions Comparison

| Python Function | TypeScript Function | Match Status |
|-----------------|---------------------|--------------|
| `open_docx()` | `openDocx()` | ✅ Equivalent |
| `validate_docx()` | `validateDocx()` | ✅ Equivalent |
| N/A | `isValidDocx()` | ⚠️ TS-only helper |
| N/A | `listDocxParts()` | ⚠️ TS-only helper |
| N/A | `hasPart()` | ⚠️ TS-only helper |

### Exceptions Comparison

| Python Exception | TypeScript Exception | Match Status |
|------------------|----------------------|--------------|
| `DocxParserError` | `DocxParserError` | ✅ Equivalent |
| `DocxValidationError` | `DocxValidationError` | ✅ Equivalent |
| `DocxNotFoundError` | `DocxNotFoundError` | ✅ Equivalent |
| `DocxReadError` | `DocxReadError` | ✅ Equivalent |
| `DocxEncryptedError` | `DocxEncryptedError` | ✅ Equivalent |
| `DocxMissingPartError` | `DocxMissingPartError` | ✅ Equivalent |
| `DocxInvalidContentTypeError` | `DocxInvalidContentTypeError` | ✅ Equivalent |
| `XmlParseError` | `XmlParseError` | ✅ Equivalent |

---

## Models Comparison

### `models/` Directory Structure

| Python Subdirectory | TypeScript Subdirectory | Match Status |
|---------------------|-------------------------|--------------|
| `common/` | `common/` | ✅ Equivalent |
| `document/` | `document/` | ⚠️ Different file count |
| `numbering/` | `numbering/` | ✅ Equivalent |
| `styles/` | `styles/` | ✅ Equivalent |
| `types.py` | `types.ts` | ✅ Equivalent |

### `models/common/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `border.py` | `border.ts` | ✅ Equivalent |
| `color.py` | `color.ts` | ✅ Equivalent |
| `indentation.py` | `indentation.ts` | ✅ Equivalent |
| `shading.py` | `shading.ts` | ✅ Equivalent |
| `spacing.py` | `spacing.ts` | ✅ Equivalent |
| `width.py` | `width.ts` | ✅ Equivalent |

### `models/document/` Comparison

| Python File | TypeScript File | Match Status | Notes |
|-------------|-----------------|--------------|-------|
| `document.py` | `document.ts` | ✅ Equivalent | |
| `drawing.py` | `drawing.ts` | ✅ Equivalent | |
| `frame.py` | N/A | ❌ **MISSING in TS** | Frame properties not in TS |
| `hyperlink.py` | `hyperlink.ts` | ✅ Equivalent | |
| `paragraph.py` | `paragraph.ts` | ✅ Equivalent | |
| `run.py` | `run.ts` | ✅ Equivalent | |
| `run_content.py` | `run-content.ts` | ✅ Equivalent | |
| `section.py` | `section.ts` | ✅ Equivalent | |
| `table.py` | `table.ts` | ✅ Equivalent | |
| `table_cell.py` | N/A | ⚠️ Merged into `table.ts` | |
| `table_row.py` | N/A | ⚠️ Merged into `table.ts` | |

### `models/numbering/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `abstract_numbering.py` | `abstract-numbering.ts` | ✅ Equivalent |
| `level.py` | `level.ts` | ✅ Equivalent |
| `level_override.py` | `level-override.ts` | ✅ Equivalent |
| `numbering.py` | `numbering.ts` | ✅ Equivalent |
| `numbering_instance.py` | `numbering-instance.ts` | ✅ Equivalent |

### `models/styles/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `document_defaults.py` | `document-defaults.ts` | ✅ Equivalent |
| `latent_styles.py` | `latent-styles.ts` | ✅ Equivalent |
| `style.py` | `style.ts` | ✅ Equivalent |
| `styles.py` | `styles.ts` | ✅ Equivalent |
| `table_style.py` | `table-style.ts` | ✅ Equivalent |

### Type Definitions Comparison (`types.py` vs `types.ts`)

All literal types are equivalent. TypeScript additionally exports runtime arrays for validation:
- `JustificationTypes[]`
- `BorderStyleTypes[]`
- `NumFmtTypes[]`
- `UnderlineTypes[]`

---

## Parsers Comparison

### `parsers/` Directory Structure

| Python Subdirectory | TypeScript Subdirectory | Match Status |
|---------------------|-------------------------|--------------|
| `common/` | `common/` | ✅ Equivalent |
| `document/` | `document/` | ✅ Equivalent |
| `numbering/` | `numbering/` | ✅ Equivalent |
| `styles/` | `styles/` | ✅ Equivalent |
| `mapper.py` | `mapper.ts` | ✅ Equivalent |
| `utils.py` | `utils.ts` | ✅ Equivalent |

### `parsers/common/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `border_parser.py` | `border-parser.ts` | ✅ Equivalent |
| `color_parser.py` | `color-parser.ts` | ✅ Equivalent |
| `indentation_parser.py` | `indentation-parser.ts` | ✅ Equivalent |
| `shading_parser.py` | `shading-parser.ts` | ✅ Equivalent |
| `spacing_parser.py` | `spacing-parser.ts` | ✅ Equivalent |
| `width_parser.py` | `width-parser.ts` | ✅ Equivalent |

### `parsers/document/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `body_parser.py` | `body-parser.ts` | ✅ Equivalent |
| `document_parser.py` | `document-parser.ts` | ✅ Equivalent |
| `drawing_parser.py` | `drawing-parser.ts` | ✅ Equivalent |
| `hyperlink_parser.py` | `hyperlink-parser.ts` | ✅ Equivalent |
| `paragraph_parser.py` | `paragraph-parser.ts` | ✅ Equivalent |
| `paragraph_properties_parser.py` | `paragraph-properties-parser.ts` | ✅ Equivalent |
| `run_content_parser.py` | `run-content-parser.ts` | ✅ Equivalent |
| `run_parser.py` | `run-parser.ts` | ✅ Equivalent |
| `run_properties_parser.py` | `run-properties-parser.ts` | ✅ Equivalent |
| `section_parser.py` | `section-parser.ts` | ✅ Equivalent |
| `table_cell_parser.py` | `table-cell-parser.ts` | ✅ Equivalent |
| `table_cell_properties_parser.py` | `table-cell-properties-parser.ts` | ✅ Equivalent |
| `table_grid_parser.py` | `table-grid-parser.ts` | ✅ Equivalent |
| `table_parser.py` | `table-parser.ts` | ✅ Equivalent |
| `table_properties_parser.py` | `table-properties-parser.ts` | ✅ Equivalent |
| `table_row_parser.py` | `table-row-parser.ts` | ✅ Equivalent |
| `table_row_properties_parser.py` | `table-row-properties-parser.ts` | ✅ Equivalent |

### `parsers/numbering/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `abstract_numbering_parser.py` | `abstract-numbering-parser.ts` | ✅ Equivalent |
| `level_parser.py` | `level-parser.ts` | ✅ Equivalent |
| `numbering_instance_parser.py` | `numbering-instance-parser.ts` | ✅ Equivalent |
| `numbering_parser.py` | `numbering-parser.ts` | ✅ Equivalent |

### `parsers/styles/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `document_defaults_parser.py` | `document-defaults-parser.ts` | ✅ Equivalent |
| `latent_styles_parser.py` | `latent-styles-parser.ts` | ✅ Equivalent |
| `style_parser.py` | `style-parser.ts` | ✅ Equivalent |
| `styles_parser.py` | `styles-parser.ts` | ✅ Equivalent |

---

## Converters Comparison

### `converters/` Directory Structure

| Python Subdirectory | TypeScript Subdirectory | Match Status |
|---------------------|-------------------------|--------------|
| `common/` | `common/` | ✅ Equivalent |
| `html/` | `html/` | ✅ Equivalent |
| `text/` | `text/` | ✅ Equivalent |

### `converters/common/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `numbering_tracker.py` | `numbering-tracker.ts` | ✅ Equivalent |
| `style_resolver.py` | `style-resolver.ts` | ✅ Equivalent |

### `converters/html/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `css_generator.py` | `css-generator.ts` | ✅ Equivalent |
| `html_converter.py` | `html-converter.ts` | ✅ Equivalent |
| `html_document.py` | `html-document.ts` | ✅ Equivalent |
| `image_to_html.py` | `image-to-html.ts` | ✅ Equivalent |
| `numbering_to_html.py` | `numbering-to-html.ts` | ✅ Equivalent |
| `paragraph_to_html.py` | `paragraph-to-html.ts` | ✅ Equivalent |
| `run_to_html.py` | `run-to-html.ts` | ✅ Equivalent |
| `table_to_html.py` | `table-to-html.ts` | ✅ Equivalent |

### `converters/text/` Comparison

| Python File | TypeScript File | Match Status |
|-------------|-----------------|--------------|
| `numbering_to_text.py` | `numbering-to-text.ts` | ✅ Equivalent |
| `paragraph_to_text.py` | `paragraph-to-text.ts` | ✅ Equivalent |
| `run_to_text.py` | `run-to-text.ts` | ✅ Equivalent |
| `table_to_text.py` | `table-to-text.ts` | ✅ Equivalent |
| `text_converter.py` | `text-converter.ts` | ✅ Equivalent |

---

## Test Coverage Comparison

### Python Test Structure (`tests/`)

```
tests/
├── conftest.py
├── integration/
│   ├── test_configuration_options.py
│   ├── test_docx_to_html.py
│   ├── test_docx_to_text.py
│   ├── test_golden_standards.py
│   ├── test_public_api.py
│   └── test_tagged_format.py
└── unit/
    ├── converters/
    │   ├── html/
    │   │   ├── test_css_generator.py
    │   │   ├── test_html_converter.py
    │   │   ├── test_html_document.py
    │   │   ├── test_image_to_html.py
    │   │   ├── test_numbering_to_html.py
    │   │   ├── test_paragraph_to_html.py
    │   │   ├── test_run_to_html.py
    │   │   └── test_table_to_html.py
    │   └── text/
    │       ├── test_numbering_to_text.py
    │       ├── test_paragraph_to_text.py
    │       ├── test_run_to_text.py
    │       ├── test_table_to_text.py
    │       └── test_text_converter.py
    ├── core/
    │   ├── test_docx_reader.py
    │   ├── test_exceptions.py
    │   ├── test_model_utils.py
    │   └── test_xml_extractor.py
    ├── models/
    │   └── test_model_validation.py
    ├── parsers/
    │   ├── conftest.py
    │   ├── test_common_parsers.py
    │   ├── test_drawing_parser.py
    │   ├── test_numbering_parser.py
    │   ├── test_paragraph_parser.py
    │   ├── test_run_parser.py
    │   ├── test_styles_parser.py
    │   └── test_table_parser.py
    ├── test_api.py
    └── test_backwards_compatibility.py
```

### TypeScript Test Structure

```
src/
├── __tests__/
│   ├── api.test.ts
│   ├── fixtures.test.ts
│   ├── setup.test.ts
│   ├── test-utils.test.ts
│   └── helpers/
│       ├── fixture-loader.ts
│       ├── index.ts
│       └── test-utils.ts
├── converters/
│   ├── common/__tests__/
│   │   ├── numbering-tracker.test.ts
│   │   └── style-resolver.test.ts
│   ├── html/__tests__/
│   │   ├── css-generator.test.ts
│   │   ├── html-converter.test.ts
│   │   ├── html-document.test.ts
│   │   ├── image-to-html.test.ts
│   │   ├── numbering-to-html.test.ts
│   │   ├── paragraph-to-html.test.ts
│   │   ├── run-to-html.test.ts
│   │   └── table-to-html.test.ts
│   └── text/__tests__/
│       ├── numbering-to-text.test.ts
│       ├── paragraph-to-text.test.ts
│       ├── run-to-text.test.ts
│       ├── table-to-text.test.ts
│       └── text-converter.test.ts
├── core/__tests__/
│   ├── docx-reader.test.ts
│   ├── exceptions.test.ts
│   ├── model-utils.test.ts
│   └── xml-extractor.test.ts
├── models/__tests__/
│   ├── common.test.ts
│   ├── document.test.ts
│   ├── numbering.test.ts
│   ├── styles.test.ts
│   └── types.test.ts
└── parsers/__tests__/
    ├── common-parsers.test.ts
    ├── drawing-parser.test.ts
    ├── numbering-parser.test.ts
    ├── paragraph-parser.test.ts
    ├── run-parser.test.ts
    ├── styles-parser.test.ts
    └── table-parser.test.ts

tests/
└── suites/
    ├── commonHelpers.test.ts
    ├── documentNumberingParser.test.ts
    ├── documentParser.test.ts
    ├── docxProcessorIntegration.test.ts
    ├── docxToHtmlIntegration.test.ts
    ├── docxToTxtIntegration.test.ts
    ├── marginsParser.test.ts
    ├── numberingParser.test.ts
    ├── paragraphParser.test.ts
    ├── paragraphPropertiesParser.test.ts
    ├── runParser.test.ts
    ├── runPropertiesParser.test.ts
    ├── stylesMerger.test.ts
    ├── stylesParser.test.ts
    ├── tableCellParser.test.ts
    ├── tableCellPropertiesParser.test.ts
    ├── tableGridParser.test.ts
    ├── tablePropertiesParser.test.ts
    ├── tableRowParser.test.ts
    ├── tableRowPropertiesParser.test.ts
    ├── tablesParser.test.ts
    └── utils.test.ts
```

### Test File Comparison

| Python Test | TypeScript Equivalent | Match Status |
|-------------|----------------------|--------------|
| **Unit - Core** | | |
| `test_docx_reader.py` | `docx-reader.test.ts` | ✅ Equivalent |
| `test_exceptions.py` | `exceptions.test.ts` | ✅ Equivalent |
| `test_model_utils.py` | `model-utils.test.ts` | ✅ Equivalent |
| `test_xml_extractor.py` | `xml-extractor.test.ts` | ✅ Equivalent |
| **Unit - Parsers** | | |
| `test_common_parsers.py` | `common-parsers.test.ts` | ✅ Equivalent |
| `test_drawing_parser.py` | `drawing-parser.test.ts` | ✅ Equivalent |
| `test_numbering_parser.py` | `numbering-parser.test.ts` | ✅ Equivalent |
| `test_paragraph_parser.py` | `paragraph-parser.test.ts` | ✅ Equivalent |
| `test_run_parser.py` | `run-parser.test.ts` | ✅ Equivalent |
| `test_styles_parser.py` | `styles-parser.test.ts` | ✅ Equivalent |
| `test_table_parser.py` | `table-parser.test.ts` | ✅ Equivalent |
| **Unit - HTML Converters** | | |
| `test_css_generator.py` | `css-generator.test.ts` | ✅ Equivalent |
| `test_html_converter.py` | `html-converter.test.ts` | ✅ Equivalent |
| `test_html_document.py` | `html-document.test.ts` | ✅ Equivalent |
| `test_image_to_html.py` | `image-to-html.test.ts` | ✅ Equivalent |
| `test_numbering_to_html.py` | `numbering-to-html.test.ts` | ✅ Equivalent |
| `test_paragraph_to_html.py` | `paragraph-to-html.test.ts` | ✅ Equivalent |
| `test_run_to_html.py` | `run-to-html.test.ts` | ✅ Equivalent |
| `test_table_to_html.py` | `table-to-html.test.ts` | ✅ Equivalent |
| **Unit - Text Converters** | | |
| `test_numbering_to_text.py` | `numbering-to-text.test.ts` | ✅ Equivalent |
| `test_paragraph_to_text.py` | `paragraph-to-text.test.ts` | ✅ Equivalent |
| `test_run_to_text.py` | `run-to-text.test.ts` | ✅ Equivalent |
| `test_table_to_text.py` | `table-to-text.test.ts` | ✅ Equivalent |
| `test_text_converter.py` | `text-converter.test.ts` | ✅ Equivalent |
| **Unit - Common Converters** | | |
| `test_numbering_tracker.py` | `numbering-tracker.test.ts` | ✅ Equivalent |
| `test_style_resolver.py` | `style-resolver.test.ts` | ✅ Equivalent |
| **Unit - Models** | | |
| `test_model_validation.py` | `common.test.ts`, `document.test.ts`, `numbering.test.ts`, `styles.test.ts`, `types.test.ts` | ✅ Split but equivalent |
| **Unit - API** | | |
| `test_api.py` | `api.test.ts` | ✅ Equivalent |
| `test_backwards_compatibility.py` | N/A | ⚠️ Python-only (deprecated) |
| **Integration** | | |
| `test_configuration_options.py` | N/A | ❌ **MISSING in TS** |
| `test_docx_to_html.py` | `docxToHtmlIntegration.test.ts` | ✅ Equivalent |
| `test_docx_to_text.py` | `docxToTxtIntegration.test.ts` | ✅ Equivalent |
| `test_golden_standards.py` | N/A | ❌ **MISSING in TS** |
| `test_public_api.py` | N/A | ❌ **MISSING in TS** |
| `test_tagged_format.py` | `fixtures.test.ts` | ⚠️ Partial equivalent |
| **TS-only Tests** | | |
| N/A | `setup.test.ts` | ⚠️ TS-only |
| N/A | `test-utils.test.ts` | ⚠️ TS-only |
| N/A | `tests/suites/*.test.ts` | ⚠️ Additional TS integration tests |

---

## Public API Comparison

### Main Entry Points

| Python | TypeScript | Match Status |
|--------|------------|--------------|
| `docx_to_html()` | `docxToHtml()` | ✅ Equivalent (TS is async) |
| `docx_to_text()` | `docxToText()` | ✅ Equivalent (TS is async) |
| `_parse_docx()` (private) | `parseDocx()` (exported) | ⚠️ TS exports parsing function |
| `ConversionConfig` | `ConversionConfig` | ✅ Equivalent |

### API Function Signatures

#### Python
```python
def docx_to_html(
    source: str | Path | bytes | BinaryIO | Document | None,
    *,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None,
) -> str:

def docx_to_text(
    source: str | Path | bytes | BinaryIO | Document | None,
    *,
    output_path: str | Path | None = None,
    config: ConversionConfig | None = None,
) -> str:
```

#### TypeScript
```typescript
async function docxToHtml(
  source: DocxInput,
  config?: ConversionConfig
): Promise<string>;

async function docxToText(
  source: DocxInput,
  config?: ConversionConfig
): Promise<string>;
```

### API Differences

| Feature | Python | TypeScript | Inconsistency |
|---------|--------|------------|---------------|
| Async/Sync | Synchronous | Async (Promise) | ⚠️ Expected difference |
| Output Path | `output_path` parameter | Not supported | ❌ **MISSING in TS** |
| File I/O | Supports `BinaryIO` | No stream support | ⚠️ Expected difference |
| Input Types | `str\|Path\|bytes\|BinaryIO\|Document\|None` | `string\|ArrayBuffer\|Uint8Array\|Blob\|Document\|null\|undefined` | ✅ Platform-appropriate |
| Parse Export | Private `_parse_docx()` | Public `parseDocx()` | ⚠️ TS exports more |

### ConversionConfig Comparison

| Python Field | TypeScript Field | Match Status |
|--------------|------------------|--------------|
| `style_mode` | `styleMode` | ✅ Equivalent |
| `use_semantic_tags` | `useSemanticTags` | ✅ Equivalent |
| `preserve_whitespace` | `preserveWhitespace` | ✅ Equivalent |
| `include_default_styles` | `includeDefaultStyles` | ✅ Equivalent |
| `title` | `title` | ✅ Equivalent |
| `language` | `language` | ✅ Equivalent |
| `fragment_only` | `fragmentOnly` | ✅ Equivalent |
| `custom_css` | `customCss` | ✅ Equivalent |
| `css_files` | `cssFiles` | ✅ Equivalent |
| `use_css_variables` | `useCssVariables` | ✅ Equivalent |
| `responsive` | `responsive` | ✅ Equivalent |
| `include_print_styles` | `includePrintStyles` | ✅ Equivalent |
| `text_formatting` | `textFormatting` | ✅ Equivalent |
| `table_mode` | `tableMode` | ✅ Equivalent |
| `paragraph_separator` | `paragraphSeparator` | ✅ Equivalent |
| `preserve_empty_paragraphs` | `preserveEmptyParagraphs` | ✅ Equivalent |

### Exported Types/Interfaces

| Python Export | TypeScript Export | Match Status |
|---------------|-------------------|--------------|
| `docx_to_html` | `docxToHtml` | ✅ |
| `docx_to_text` | `docxToText` | ✅ |
| `ConversionConfig` | `ConversionConfig` | ✅ |
| N/A | `parseDocx` | ⚠️ TS-only |
| N/A | `DEFAULT_CONFIG` | ⚠️ TS-only |
| N/A | `toHtmlConfig` | ⚠️ TS-only |
| N/A | `toTextConfig` | ⚠️ TS-only |
| N/A | All model types exported | ⚠️ TS exports more |
| N/A | All parser functions exported | ⚠️ TS exports more |
| N/A | All core utilities exported | ⚠️ TS exports more |

---

## Scripts Comparison

### Root Scripts (`scripts/`)

| Python Script | Purpose | TypeScript Equivalent | Match Status |
|---------------|---------|----------------------|--------------|
| `check.sh` | Pre-commit checks | N/A | ❌ Missing |
| `create_formatting_tests_docx.py` | Create test fixtures | N/A | ❌ Missing |
| `create_image_tests_docx.py` | Create test fixtures | N/A | ❌ Missing |
| `create_list_tests_docx.py` | Create test fixtures | N/A | ❌ Missing |
| `create_margin_tests_docx.py` | Create test fixtures | N/A | ❌ Missing |
| `create_table_tests_docx.py` | Create test fixtures | N/A | ❌ Missing |
| `post_edit_verify.py` | Post-edit verification | N/A | ❌ Missing |
| `post_edit_verify.sh` | Post-edit verification | N/A | ❌ Missing |
| `post_session.sh` | Session cleanup | N/A | ❌ Missing |
| `pre_commit_verify.py` | Pre-commit checks | N/A | ❌ Missing |
| `pre_session.sh` | Session setup | N/A | ❌ Missing |
| `session_end_verify.py` | Session verification | N/A | ❌ Missing |
| `test_config_options.py` | Test config options | N/A | ❌ Missing |
| `verify_outputs.py` | Verify outputs | N/A | ❌ Missing |
| `verify_tests.py` | Verify tests | N/A | ❌ Missing |

### TypeScript-Only Scripts (`docx_parser_converter_ts/scripts/`)

| Script | Purpose |
|--------|---------|
| `generate-outputs.ts` | Generate HTML/text outputs from fixtures |

---

## Inconsistencies Summary

### Critical Inconsistencies (Require Action)

| Category | Issue | Recommendation |
|----------|-------|----------------|
| Models | `frame.py` missing in TypeScript | Add `frame.ts` if frame properties needed |
| API | `output_path` not supported in TypeScript | Consider adding file writing utility |
| Tests | `test_configuration_options.py` missing | Port configuration tests to TS |
| Tests | `test_golden_standards.py` missing | Port golden standard tests to TS |
| Tests | `test_public_api.py` missing | Port public API tests to TS |
| Scripts | All Python verification scripts missing | Consider porting key scripts |

### Minor Inconsistencies (Acceptable Differences)

| Category | Issue | Reason |
|----------|-------|--------|
| API | TypeScript is async | Platform requirement (browser + Node) |
| API | Input types differ | Platform-appropriate (ArrayBuffer vs bytes) |
| API | TypeScript exports more | Better for library consumers |
| Config | Separate `config.ts` file | Better code organization |
| Models | `table_cell.py`/`table_row.py` merged | Consolidated in TS for simplicity |
| Core | Empty `xml_helpers.py`/`unit_conversion.py` | Placeholder files |
| Tests | TypeScript has additional test suites | More thorough testing |

### Deprecated/Legacy Code

| Library | Deprecated Code | Notes |
|---------|-----------------|-------|
| Python | `docx_parsers/utils.py` | Wrapper for file reading |
| Python | `docx_to_html/docx_to_html_converter.py` | Use `docx_to_html()` instead |
| Python | `docx_to_txt/docx_to_txt_converter.py` | Use `docx_to_text()` instead |
| TypeScript | `src/-legacy/` folder | Old implementation kept for reference |

### Feature Comparison

| Feature | Python | TypeScript | Parity |
|---------|--------|------------|--------|
| HTML conversion | ✅ | ✅ | ✅ |
| Text conversion | ✅ | ✅ | ✅ |
| Markdown output | ✅ | ✅ | ✅ |
| ASCII tables | ✅ | ✅ | ✅ |
| Images (base64) | ✅ | ✅ | ✅ |
| Lists/numbering | ✅ | ✅ | ✅ |
| Tables | ✅ | ✅ | ✅ |
| Styles | ✅ | ✅ | ✅ |
| Hyperlinks | ✅ | ✅ | ✅ |
| Semantic tags | ✅ | ✅ | ✅ |
| CSS classes | ✅ | ✅ | ✅ |
| Inline styles | ✅ | ✅ | ✅ |
| File output | ✅ | ❌ | ⚠️ |
| Stream input | ✅ | ❌ | ⚠️ |
| Frame properties | ✅ | ❌ | ⚠️ |

---

## Action Items

### High Priority
1. **Add `output_path` support or file writing utility to TypeScript**
2. **Port `test_configuration_options.py` to TypeScript**
3. **Port `test_golden_standards.py` to TypeScript**
4. **Port `test_public_api.py` to TypeScript**

### Medium Priority
5. Add `frame.ts` model if frame properties are needed
6. Port key verification scripts to TypeScript
7. Consider adding stream input support (Node.js streams)

### Low Priority
8. Remove deprecated Python modules (`docx_to_html/`, `docx_to_txt/`, `docx_parsers/`)
9. Evaluate removing TypeScript `-legacy/` folder
10. Standardize test file naming conventions

---

*Document generated: January 10, 2026*
*Comparison covers: Python and TypeScript implementations of docx-parser-converter*
