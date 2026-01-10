# TDD Plan: TypeScript DOCX Library Refactor for Python Feature Parity

> **Status**: In Progress (Phase 1 Complete)
> **Created**: 2026-01-09
> **Last Updated**: 2026-01-09

## Overview

Refactor the TypeScript DOCX parser/converter library to achieve **exact output parity** with the Python implementation. The TypeScript library will use TypeScript conventions while matching the Python API pattern and all configuration options.

### Key Decisions
- **Structure**: TypeScript conventions (kebab-case files, logical equivalence)
- **Validation**: TypeScript types only (no runtime validation like Zod)
- **API**: Match Python's simple function API (`docxToHtml()`, `docxToText()`)
- **Testing**: Migrate to Vitest

### Current vs Target State

| Aspect | Current TypeScript | Target (Python Parity) |
|--------|-------------------|------------------------|
| Files | 46 | ~80-100 |
| Test Framework | Custom runner | Vitest |
| API | Factory pattern | Simple async functions |
| Config Options | 2 options | 16+ options |
| Image Support | No | Yes (base64) |
| Test Coverage | ~23 suites | ~1000+ tests |

---

## Phase Progress

| Phase | Status | Tests Added | Files Changed |
|-------|--------|-------------|---------------|
| Phase 1: Foundation | **Complete** | 35 | 7 |
| Phase 2: Models | Not Started | 0 | 0 |
| Phase 3: Parsers | Not Started | 0 | 0 |
| Phase 4: Converters | Not Started | 0 | 0 |
| Phase 5: Public API | Not Started | 0 | 0 |
| Phase 6: Verification | Not Started | 0 | 0 |

---

## Phase 1: Foundation (Testing Infrastructure)

**Status**: Complete

### 1.1 Migrate to Vitest

- [x] Install Vitest: `npm install -D vitest @vitest/coverage-v8`
- [x] Create `vitest.config.ts`
- [x] Update `package.json` scripts
- [x] Create test utilities (`src/__tests__/helpers/`)

**Tests First:**
```typescript
// src/__tests__/setup.test.ts
describe('Vitest Setup', () => {
  it('should run basic tests');
  it('should access fixtures directory');
});
```

**Files to Create:**
- [x] `vitest.config.ts`
- [x] `src/__tests__/helpers/test-utils.ts`
- [x] `src/__tests__/helpers/fixture-loader.ts`
- [x] `src/__tests__/helpers/index.ts` (barrel export)

### 1.2 Fixture Integration

- [x] Create fixture loader for shared `fixtures/` directory
- [x] Create output comparison utilities with whitespace normalization
- [x] Create tagged test parser for `Test #N` format

**Tests First:**
```typescript
// src/__tests__/fixtures.test.ts
describe('Fixtures', () => {
  it('should load DOCX test files from ../fixtures/test_docx_files');
  it('should load expected HTML outputs (*-python.html)');
  it('should load tagged tests from ../fixtures/tagged_tests');
});
```

### 1.3 New Directory Structure

- [x] Create `src/core/` directory
- [x] Create `src/models/` directory structure
- [x] Create `src/parsers/` directory structure
- [x] Create `src/converters/` directory structure

**Target Structure:**
```
src/
├── core/                        # Infrastructure
│   ├── constants.ts
│   ├── exceptions.ts
│   ├── docx-reader.ts
│   ├── xml-extractor.ts
│   ├── xml-helpers.ts
│   └── unit-conversion.ts
├── models/                      # TypeScript interfaces
│   ├── types.ts                 # All literal types
│   ├── common/
│   ├── document/
│   ├── styles/
│   └── numbering/
├── parsers/                     # XML → Model conversion
│   ├── common/
│   ├── document/
│   ├── styles/
│   └── numbering/
├── converters/                  # Model → Output conversion
│   ├── common/
│   ├── html/
│   └── text/
├── api.ts                       # Public API
└── index.ts                     # Exports
```

### Phase 1 Completion Checklist
- [x] Vitest running with basic test
- [x] All fixture types loadable
- [x] Directory structure created
- [x] Old test runner disabled/removed (test script now uses vitest)

**Completion Notes:**
> **Completed: 2026-01-09**
>
> **Files Created/Modified:**
> - `vitest.config.ts` - Vitest configuration with coverage, path aliases
> - `package.json` - Updated scripts: `test`, `test:watch`, `test:coverage`
> - `src/__tests__/helpers/test-utils.ts` - XML element creation, normalization utilities
> - `src/__tests__/helpers/fixture-loader.ts` - DOCX/HTML/TXT fixture loading
> - `src/__tests__/helpers/index.ts` - Barrel export
> - `src/__tests__/setup.test.ts` - Basic Vitest validation (3 tests)
> - `src/__tests__/fixtures.test.ts` - Fixture loading tests (15 tests)
> - `src/__tests__/test-utils.test.ts` - Test utility tests (17 tests)
>
> **Directory Structure Created:**
> - `src/core/`
> - `src/models/common/`, `src/models/document/`, `src/models/styles/`, `src/models/numbering/`
> - `src/parsers/common/`, `src/parsers/document/`, `src/parsers/styles/`, `src/parsers/numbering/`
> - `src/converters/common/`, `src/converters/html/`, `src/converters/text/`
> - `src/__tests__/helpers/`, `src/__tests__/tagged-tests/`
>
> **Test Results:** 35 tests passing

---

## Phase 2: Models (TypeScript Interfaces)

**Status**: Not Started

### 2.1 Type Definitions

- [ ] Create `src/models/types.ts` with all literal types

**Types to Define (from Python's `models/types.py`):**
- [ ] `JustificationType` (7 values)
- [ ] `VAlignType` (3 values)
- [ ] `VertAlignType` (3 values)
- [ ] `BorderStyleType` (28 values)
- [ ] `ShadingPatternType` (38 values)
- [ ] `ThemeColorType` (16 values)
- [ ] `HighlightType` (17 values)
- [ ] `UnderlineType` (17 values)
- [ ] `NumFmtType` (64 values)
- [ ] `TabType`, `TabLeaderType`
- [ ] `BreakType`, `BreakClearType`
- [ ] `TableLayoutType`, `VMergeType`
- [ ] `SectionType`, `OrientType`
- [ ] `FieldCharType`
- [ ] `StyleType`, `TableStyleConditionType`
- [ ] All others (~25 total)

### 2.2 Common Models

**Files to Create:**
- [ ] `src/models/common/border.ts` - `Border`, `ParagraphBorders`, `TableBorders`
- [ ] `src/models/common/color.ts` - `Color`
- [ ] `src/models/common/shading.ts` - `Shading`
- [ ] `src/models/common/spacing.ts` - `Spacing`
- [ ] `src/models/common/indentation.ts` - `Indentation`
- [ ] `src/models/common/width.ts` - `Width`
- [ ] `src/models/common/index.ts` - barrel export

### 2.3 Document Models

**Files to Create:**
- [ ] `src/models/document/document.ts` - `Document`, `Body`
- [ ] `src/models/document/paragraph.ts` - `Paragraph`, `ParagraphProperties`, `NumberingProperties`, `FrameProperties`, `TabStop`
- [ ] `src/models/document/run.ts` - `Run`, `RunProperties`, `RunFonts`, `Underline`, `Language`
- [ ] `src/models/document/run-content.ts` - `TextContent`, `BreakContent`, `TabContent`, `SymbolContent`, `DrawingContent`, `FieldCharContent`, `RunContentItem`
- [ ] `src/models/document/table.ts` - `Table`, `TableProperties`, `TableGrid`, `TableLook`
- [ ] `src/models/document/table-row.ts` - `TableRow`, `TableRowProperties`
- [ ] `src/models/document/table-cell.ts` - `TableCell`, `TableCellProperties`, `TableCellMargins`
- [ ] `src/models/document/hyperlink.ts` - `Hyperlink`
- [ ] `src/models/document/drawing.ts` - `Drawing`, `InlineDrawing`, `AnchorDrawing`, `Extent`, `DocPr`, `Blip`, `Picture`
- [ ] `src/models/document/section.ts` - `SectionProperties`, `PageMargins`, `PageSize`, `PageBorders`, `Columns`
- [ ] `src/models/document/index.ts` - barrel export

### 2.4 Style Models

**Files to Create:**
- [ ] `src/models/styles/styles.ts` - `Styles`
- [ ] `src/models/styles/style.ts` - `Style`, `TableStyleProperties`
- [ ] `src/models/styles/document-defaults.ts` - `DocumentDefaults`, `RPrDefault`, `PPrDefault`
- [ ] `src/models/styles/latent-styles.ts` - `LatentStyles`, `LatentStyleException`
- [ ] `src/models/styles/index.ts` - barrel export

### 2.5 Numbering Models

**Files to Create:**
- [ ] `src/models/numbering/numbering.ts` - `Numbering`, `NumberingInstance`, `LevelOverride`
- [ ] `src/models/numbering/abstract-numbering.ts` - `AbstractNumbering`
- [ ] `src/models/numbering/level.ts` - `Level`
- [ ] `src/models/numbering/index.ts` - barrel export

### Phase 2 Completion Checklist
- [ ] All ~25 literal types defined
- [ ] All common model interfaces defined
- [ ] All document model interfaces defined
- [ ] All style model interfaces defined
- [ ] All numbering model interfaces defined
- [ ] Type tests passing

**Completion Notes:**
> _To be filled when phase is complete_

---

## Phase 3: Parsers

**Status**: Not Started

### 3.1 Core Utilities

**Files to Create:**
- [ ] `src/core/constants.ts` - `WORD_NS`, `REL_NS`, `DRAWING_NS`, namespace map, file paths
- [ ] `src/core/exceptions.ts` - `DocxParserError`, `DocxReadError`, `DocxValidationError`, `DocxEncryptedError`, `DocxMissingPartError`
- [ ] `src/core/docx-reader.ts` - `openDocx()`, `validateDocx()`, `isValidDocx()`, `listDocxParts()`
- [ ] `src/core/xml-extractor.ts` - `extractDocumentXml()`, `extractStylesXml()`, `extractNumberingXml()`, `extractExternalHyperlinks()`, `extractImageRelationships()`, `readMediaFile()`, `getMediaContentType()`
- [ ] `src/core/xml-helpers.ts` - `findChild()`, `findText()`, `getAttr()`
- [ ] `src/core/unit-conversion.ts` - `twipsToPoints()`, `halfPointsToPoints()`, `emuToPixels()`, `twipsToPixels()`

### 3.2 Common Parsers

**Files to Create:**
- [ ] `src/parsers/common/border-parser.ts` - `parseBorder()`, `parseParagraphBorders()`, `parseTableBorders()`
- [ ] `src/parsers/common/color-parser.ts` - `parseColor()`
- [ ] `src/parsers/common/shading-parser.ts` - `parseShading()`
- [ ] `src/parsers/common/spacing-parser.ts` - `parseSpacing()`
- [ ] `src/parsers/common/indentation-parser.ts` - `parseIndentation()`
- [ ] `src/parsers/common/width-parser.ts` - `parseWidth()`
- [ ] `src/parsers/common/index.ts` - barrel export

### 3.3 Document Parsers

**Files to Create:**
- [ ] `src/parsers/document/document-parser.ts` - `parseDocument()`
- [ ] `src/parsers/document/body-parser.ts` - `parseBody()`
- [ ] `src/parsers/document/paragraph-parser.ts` - `parseParagraph()`
- [ ] `src/parsers/document/paragraph-properties-parser.ts` - `parseParagraphProperties()`
- [ ] `src/parsers/document/run-parser.ts` - `parseRun()`
- [ ] `src/parsers/document/run-properties-parser.ts` - `parseRunProperties()`
- [ ] `src/parsers/document/run-content-parser.ts` - `parseRunContent()`
- [ ] `src/parsers/document/table-parser.ts` - `parseTable()`
- [ ] `src/parsers/document/table-row-parser.ts` - `parseTableRow()`
- [ ] `src/parsers/document/table-cell-parser.ts` - `parseTableCell()`
- [ ] `src/parsers/document/table-properties-parser.ts` - `parseTableProperties()`
- [ ] `src/parsers/document/hyperlink-parser.ts` - `parseHyperlink()`
- [ ] `src/parsers/document/drawing-parser.ts` - `parseDrawing()` **[CRITICAL for images]**
- [ ] `src/parsers/document/section-parser.ts` - `parseSectionProperties()`
- [ ] `src/parsers/document/index.ts` - barrel export

### 3.4 Style Parsers

**Files to Create:**
- [ ] `src/parsers/styles/styles-parser.ts` - `parseStyles()`
- [ ] `src/parsers/styles/style-parser.ts` - `parseStyle()`
- [ ] `src/parsers/styles/document-defaults-parser.ts` - `parseDocumentDefaults()`
- [ ] `src/parsers/styles/index.ts` - barrel export

### 3.5 Numbering Parsers

**Files to Create:**
- [ ] `src/parsers/numbering/numbering-parser.ts` - `parseNumbering()`
- [ ] `src/parsers/numbering/abstract-numbering-parser.ts` - `parseAbstractNumbering()`
- [ ] `src/parsers/numbering/level-parser.ts` - `parseLevel()`
- [ ] `src/parsers/numbering/numbering-instance-parser.ts` - `parseNumberingInstance()`
- [ ] `src/parsers/numbering/index.ts` - barrel export

### Phase 3 Completion Checklist
- [ ] All core utilities implemented and tested
- [ ] All common parsers implemented and tested
- [ ] All document parsers implemented and tested
- [ ] Drawing parser working for images
- [ ] All style parsers implemented and tested
- [ ] All numbering parsers implemented and tested

**Completion Notes:**
> _To be filled when phase is complete_

---

## Phase 4: Converters

**Status**: Not Started

### 4.1 Style Resolver

- [ ] `src/converters/common/style-resolver.ts`

Port from Python's `converters/common/style_resolver.py`:
- Build style lookup map
- Resolve `basedOn` inheritance recursively
- Merge with document defaults
- Cache resolved properties for performance

### 4.2 Numbering Tracker

- [ ] `src/converters/common/numbering-tracker.ts`

Port all 64 numbering formats:
- [ ] `decimal`, `decimalZero`, `decimalEnclosedCircle`
- [ ] `lowerLetter`, `upperLetter`
- [ ] `lowerRoman`, `upperRoman`
- [ ] `bullet`
- [ ] Japanese: `aiueo`, `iroha`, `japaneseCounting`, etc.
- [ ] Chinese: `chineseCounting`, `taiwaneseCounting`, etc.
- [ ] Korean: `koreanDigital`, `koreanCounting`, etc.
- [ ] Hebrew: `hebrew1`, `hebrew2`
- [ ] Arabic: `arabicAlpha`, `arabicAbjad`
- [ ] Hindi, Thai, Russian, etc.

### 4.3 HTML Converter

**Files to Create:**
- [ ] `src/converters/html/html-converter.ts` - Main `HTMLConverter` class
- [ ] `src/converters/html/html-document.ts` - `HTMLDocumentBuilder`
- [ ] `src/converters/html/css-generator.ts` - `runPropertiesToCss()`, `paragraphPropertiesToCss()`
- [ ] `src/converters/html/paragraph-to-html.ts` - `paragraphToHtml()`
- [ ] `src/converters/html/run-to-html.ts` - `runToHtml()`
- [ ] `src/converters/html/table-to-html.ts` - `tableToHtml()`
- [ ] `src/converters/html/numbering-to-html.ts` - List marker generation
- [ ] `src/converters/html/image-to-html.ts` - `drawingToHtml()` with base64 encoding
- [ ] `src/converters/html/index.ts` - barrel export

### 4.4 Text Converter

**Files to Create:**
- [ ] `src/converters/text/text-converter.ts`
- [ ] `src/converters/text/paragraph-to-text.ts`
- [ ] `src/converters/text/run-to-text.ts`
- [ ] `src/converters/text/table-to-text.ts` - with all 4 modes (ascii, tabs, plain, auto)
- [ ] `src/converters/text/numbering-to-text.ts`
- [ ] `src/converters/text/index.ts` - barrel export

### Phase 4 Completion Checklist
- [ ] Style resolver working with inheritance
- [ ] Numbering tracker supporting all 64 formats
- [ ] HTML converter with all style modes
- [ ] Image support working with base64
- [ ] Text converter with all table modes

**Completion Notes:**
> _To be filled when phase is complete_

---

## Phase 5: Public API & Configuration

**Status**: Not Started

### 5.1 ConversionConfig Interface

- [ ] `src/config.ts`

```typescript
export interface ConversionConfig {
  // HTML options
  styleMode?: 'inline' | 'class' | 'none';
  useSemanticTags?: boolean;
  preserveWhitespace?: boolean;
  includeDefaultStyles?: boolean;
  title?: string;
  language?: string;
  fragmentOnly?: boolean;
  customCss?: string | null;
  cssFiles?: string[];
  useCssVariables?: boolean;
  responsive?: boolean;
  includePrintStyles?: boolean;

  // Text options
  textFormatting?: 'plain' | 'markdown';
  tableMode?: 'auto' | 'ascii' | 'tabs' | 'plain';
  paragraphSeparator?: string;
  preserveEmptyParagraphs?: boolean;
}
```

### 5.2 Public API Functions

- [ ] `src/api.ts`

```typescript
export async function docxToHtml(
  source: ArrayBuffer | Uint8Array | File | Blob | null,
  config?: ConversionConfig
): Promise<string>;

export async function docxToText(
  source: ArrayBuffer | Uint8Array | File | Blob | null,
  config?: ConversionConfig
): Promise<string>;
```

### 5.3 Error Handling

- [ ] Proper error types exported
- [ ] Helpful error messages

### 5.4 Exports

- [ ] `src/index.ts` - Public API exports

### Phase 5 Completion Checklist
- [ ] ConversionConfig with all 16 options
- [ ] docxToHtml() working with all input types
- [ ] docxToText() working with all input types
- [ ] All error types exported
- [ ] Package exports clean

**Completion Notes:**
> _To be filled when phase is complete_

---

## Phase 6: Verification & Output Parity

**Status**: Not Started

### 6.1 Golden Standard Tests

- [ ] Create `src/__tests__/golden-standards.test.ts`
- [ ] All 12 DOCX test files passing HTML verification
- [ ] All 12 DOCX test files passing text verification

**Test Files:**
- [ ] `comprehensive_docx_demo.docx`
- [ ] `docx_formatting_demo_combinations_paragraphs_fonts.docx`
- [ ] `docx_inline_formatting_demo.docx`
- [ ] `docx_list_formatting_demo.docx`
- [ ] `docx_list_numbering_text_styling_demo.docx`
- [ ] `formatting_and_styles_demo.docx`
- [ ] `fonts_and_sizes_demo.docx`
- [ ] `lists_demo.docx`
- [ ] `paragraph_control_demo.docx`
- [ ] `run_effects_demo.docx`
- [ ] `table_advanced_demo.docx`
- [ ] `tables_demo.docx`
- [ ] `underline_styles_examples.docx`

### 6.2 Tagged Tests

- [ ] `src/__tests__/tagged-tests/formatting.test.ts` (12 tests)
- [ ] `src/__tests__/tagged-tests/tables.test.ts` (20 tests)
- [ ] `src/__tests__/tagged-tests/lists.test.ts` (6 tests)
- [ ] `src/__tests__/tagged-tests/margins.test.ts` (6 tests)
- [ ] `src/__tests__/tagged-tests/images.test.ts` (8 tests - if image tests exist)

**Tagged Test Progress:**
- [ ] 0/44 tagged tests passing

### 6.3 Verification Scripts

- [ ] `scripts/verify-outputs.ts`
- [ ] `scripts/verify-tests.ts`

### Phase 6 Completion Checklist
- [ ] All 12 golden standard files produce matching output
- [ ] All 44 tagged tests passing
- [ ] Verification scripts working

**Completion Notes:**
> _To be filled when phase is complete_

---

## Implementation Order & Dependencies

```
Phase 1 ──┬──> Phase 2 ──> Phase 3.1 (Common Parsers)
          │                     │
          │                     ├──> Phase 3.2 (Document Parsers)
          │                     │
          │                     └──> Phase 3.3 (Style/Numbering Parsers)
          │                               │
          │                               ├──> Phase 4.1 (Style Resolver)
          │                               │
          │                               └──> Phase 4.2 (Numbering Tracker)
          │                                         │
          │                                         ├──> Phase 4.3 (HTML Converter)
          │                                         │
          │                                         └──> Phase 4.4 (Text Converter)
          │                                                   │
          └─────────────────────────────────────────────────> Phase 5 (API)
                                                              │
                                                              └──> Phase 6 (Verification)
```

---

## Critical Files to Reference

| TypeScript Target | Python Reference |
|-------------------|------------------|
| `src/api.ts` | `docx_parser_converter/api.py` |
| `src/models/types.ts` | `models/types.py` |
| `src/converters/common/numbering-tracker.ts` | `converters/common/numbering_tracker.py` |
| `src/converters/common/style-resolver.ts` | `converters/common/style_resolver.py` |
| `src/parsers/document/drawing-parser.ts` | `parsers/document/drawing_parser.py` |
| `src/converters/html/css-generator.ts` | `converters/html/css_generator.py` |

---

## Estimated Scope

| Phase | New Tests | New/Modified Files |
|-------|-----------|-------------------|
| Phase 1 | ~20 | ~10 |
| Phase 2 | ~100 | ~25 |
| Phase 3 | ~400 | ~30 |
| Phase 4 | ~300 | ~15 |
| Phase 5 | ~50 | ~5 |
| Phase 6 | ~200 | ~5 |
| **Total** | **~1,070** | **~90** |

---

## Success Criteria

- [ ] All 44 tagged tests pass
- [ ] All 12 golden standard DOCX files produce identical HTML/text outputs
- [ ] Public API matches Python: `docxToHtml()`, `docxToText()`, `ConversionConfig`
- [ ] All 16 configuration options work correctly
- [ ] Image support works with base64 embedding
- [ ] All 64 numbering formats supported
- [ ] Vitest coverage > 80%
