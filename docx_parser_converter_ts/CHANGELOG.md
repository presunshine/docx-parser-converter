# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-11

### Added
- Initial stable release
- `docxToHtml()` - Convert DOCX files to semantic HTML with full formatting support
- `docxToText()` - Convert DOCX files to plain text with smart list numbering
- Browser and Node.js support (ESM + CommonJS builds)
- Full TypeScript type definitions
- Configurable output options:
  - Style modes: inline, class-based, or no styles
  - Semantic HTML tags option
  - Customizable paragraph/line separators
  - Table rendering modes for text output
  - Image handling with base64 embedding
- Comprehensive parsing support:
  - Paragraphs with full formatting (fonts, sizes, colors, alignment)
  - Text runs with inline styles (bold, italic, underline, etc.)
  - Tables with cell merging, borders, and shading
  - Ordered and unordered lists with proper numbering
  - Images (inline and anchored)
  - Hyperlinks
