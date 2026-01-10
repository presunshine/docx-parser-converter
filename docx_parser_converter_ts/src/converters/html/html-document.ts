/**
 * HTML document wrapper for generating complete HTML5 documents.
 *
 * Handles document structure, meta tags, styles, and rendering.
 * Matches Python: converters/html/html_document.py
 */

export interface HTMLDocumentOptions {
  content: string;
  title?: string;
  language?: string;
  css?: string;
  stylesheets?: string[];
  scripts?: string[];
  pageWidth?: number;
  responsive?: boolean;
  author?: string;
  description?: string;
  keywords?: string[];
  direction?: 'ltr' | 'rtl';
  minify?: boolean;
  pretty?: boolean;
  includePrintStyles?: boolean;
  includeSkipLink?: boolean;
  pageMargins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTML document wrapper for generating complete HTML5 documents.
 */
export class HTMLDocument {
  private content: string;
  private title: string;
  private language: string;
  private css: string;
  private stylesheets: string[];
  private scripts: string[];
  private pageWidth: number | null;
  private responsive: boolean;
  private author: string | null;
  private description: string | null;
  private keywords: string[];
  private direction: 'ltr' | 'rtl';
  private minify: boolean;
  private _pretty: boolean;
  private includePrintStyles: boolean;
  private includeSkipLink: boolean;
  private pageMargins: { top: number; right: number; bottom: number; left: number } | null;

  constructor(options: HTMLDocumentOptions) {
    this.content = options.content || '';
    this.title = options.title ?? '';
    this.language = options.language ?? 'en';
    this.css = options.css ?? '';
    this.stylesheets = options.stylesheets ?? [];
    this.scripts = options.scripts ?? [];
    this.pageWidth = options.pageWidth ?? null;
    this.responsive = options.responsive ?? true;
    this.author = options.author ?? null;
    this.description = options.description ?? null;
    this.keywords = options.keywords ?? [];
    this.direction = options.direction ?? 'ltr';
    this.minify = options.minify ?? false;
    this._pretty = options.pretty ?? true;
    this.includePrintStyles = options.includePrintStyles ?? false;
    this.includeSkipLink = options.includeSkipLink ?? false;
    this.pageMargins = options.pageMargins ?? null;
    // Suppress unused variable warning
    void this._pretty;
  }

  /**
   * Render the complete HTML document.
   */
  render(): string {
    const parts: string[] = [];

    // Doctype
    parts.push('<!DOCTYPE html>');
    parts.push(this.getNewline());

    // HTML element
    const htmlAttrs = [`lang="${this.language}"`];
    if (this.direction === 'rtl') {
      htmlAttrs.push('dir="rtl"');
    }
    parts.push(`<html ${htmlAttrs.join(' ')}>`);
    parts.push(this.getNewline());

    // Head
    parts.push('<head>');
    parts.push(this.getNewline());
    parts.push(this.renderHead());
    parts.push('</head>');
    parts.push(this.getNewline());

    // Body
    parts.push('<body>');
    parts.push(this.getNewline());

    // Skip link for accessibility
    if (this.includeSkipLink) {
      parts.push('<a href="#content" class="skip-link">Skip to content</a>');
      parts.push(this.getNewline());
    }

    // Main content wrapped in <main>
    parts.push('<main id="content" role="main">');
    parts.push(this.getNewline());
    parts.push(this.content);
    parts.push(this.getNewline());
    parts.push('</main>');
    parts.push(this.getNewline());

    parts.push('</body>');
    parts.push(this.getNewline());
    parts.push('</html>');

    return parts.join('');
  }

  /**
   * Render only the content fragment without HTML wrapper.
   */
  renderFragment(): string {
    return this.content;
  }

  /**
   * Render the head section.
   */
  private renderHead(): string {
    const parts: string[] = [];

    // Charset
    parts.push('<meta charset="UTF-8">');
    parts.push(this.getNewline());

    // Viewport for responsive
    if (this.responsive) {
      parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
      parts.push(this.getNewline());
    }

    // Title
    parts.push(`<title>${escapeHtml(this.title)}</title>`);
    parts.push(this.getNewline());

    // Generator
    parts.push('<meta name="generator" content="docx-parser-converter">');
    parts.push(this.getNewline());

    // Author
    if (this.author) {
      parts.push(`<meta name="author" content="${escapeHtml(this.author)}">`);
      parts.push(this.getNewline());
    }

    // Description
    if (this.description) {
      parts.push(`<meta name="description" content="${escapeHtml(this.description)}">`);
      parts.push(this.getNewline());
    }

    // Keywords
    if (this.keywords.length > 0) {
      parts.push(`<meta name="keywords" content="${escapeHtml(this.keywords.join(', '))}">`);
      parts.push(this.getNewline());
    }

    // External stylesheets
    for (const stylesheet of this.stylesheets) {
      parts.push(`<link rel="stylesheet" href="${stylesheet}">`);
      parts.push(this.getNewline());
    }

    // Inline styles
    parts.push('<style>');
    parts.push(this.getNewline());
    parts.push(this.getDefaultStyles());
    if (this.css) {
      parts.push(this.css);
      parts.push(this.getNewline());
    }
    if (this.includePrintStyles) {
      parts.push(this.getPrintStyles());
    }
    parts.push('</style>');
    parts.push(this.getNewline());

    // External scripts
    for (const script of this.scripts) {
      parts.push(`<script src="${script}"></script>`);
      parts.push(this.getNewline());
    }

    return parts.join('');
  }

  /**
   * Get default body styles.
   */
  private getDefaultStyles(): string {
    const styles: string[] = [];

    // Base body styles - matches Python defaults
    styles.push(`body {
    font-family: 'Calibri', 'Arial', sans-serif;
    line-height: 1.5;
    margin: 0 auto;
}`);

    // Paragraph reset
    styles.push(`p { margin: 0; }`);

    // Remove first/last child margins in main
    styles.push(`main > *:first-child { margin-top: 0; }`);
    styles.push(`main > *:last-child { margin-bottom: 0; }`);

    // Page margins - applied separately to body
    if (this.pageMargins) {
      styles.push(`body { padding: ${this.pageMargins.top}pt ${this.pageMargins.right}pt ${this.pageMargins.bottom}pt ${this.pageMargins.left}pt; }`);
    }

    // Page break styles - matches Python
    styles.push(`.page-break {
    page-break-after: always;
    break-after: page;
}`);

    // Print media query for page break
    styles.push(`@media print {
    .page-break {
        page-break-after: always;
    }
}`);

    // Page width constraint
    if (this.pageWidth) {
      const maxWidthPt = this.pageWidth;
      styles.push(`main {
  max-width: ${maxWidthPt}pt;
  margin: 0 auto;
}`);
    }

    // Skip link styles for accessibility
    if (this.includeSkipLink) {
      styles.push(`.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}`);
    }

    let result = styles.join('\n');

    // If minifying, compress CSS by removing newlines and extra spaces
    if (this.minify) {
      result = result
        .replace(/\n\s*/g, ' ')  // Replace newlines + whitespace with single space
        .replace(/\s*{\s*/g, '{')  // Remove spaces around {
        .replace(/\s*}\s*/g, '}')  // Remove spaces around }
        .replace(/;\s*/g, ';')  // Remove spaces after ;
        .replace(/:\s*/g, ':')  // Remove spaces after :
        .replace(/,\s*/g, ',');  // Remove spaces after ,
    }

    return result;
  }

  /**
   * Get print-specific styles.
   */
  private getPrintStyles(): string {
    const css = `
@page {
  size: letter;
  margin: 1in;
}
@media print {
  body {
    margin: 0;
    padding: 0;
  }
  .page-break {
    page-break-after: always;
  }
}
`;

    // If minifying, compress CSS
    if (this.minify) {
      return css
        .replace(/\n\s*/g, ' ')
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/;\s*/g, ';')
        .replace(/:\s*/g, ':')
        .trim();
    }

    return css;
  }

  /**
   * Get newline character based on minify setting.
   */
  private getNewline(): string {
    return this.minify ? '' : '\n';
  }
}

/**
 * Builder pattern for constructing HTML documents.
 */
export class HTMLDocumentBuilder {
  private content: string = '';
  private title: string = '';
  private language: string = 'en';
  private css: string = '';
  private stylesheets: string[] = [];
  private scripts: string[] = [];
  private pageWidth: number | null = null;
  private responsive: boolean = true;
  private author: string | null = null;
  private description: string | null = null;
  private keywords: string[] = [];
  private direction: 'ltr' | 'rtl' = 'ltr';
  private minify: boolean = false;
  private pretty: boolean = true;
  private includePrintStyles: boolean = false;
  private includeSkipLink: boolean = false;
  private pageMargins: { top: number; right: number; bottom: number; left: number } | null = null;

  setContent(content: string): HTMLDocumentBuilder {
    this.content = content;
    return this;
  }

  setTitle(title: string): HTMLDocumentBuilder {
    this.title = title;
    return this;
  }

  setLanguage(language: string): HTMLDocumentBuilder {
    this.language = language;
    return this;
  }

  addCss(css: string): HTMLDocumentBuilder {
    this.css += css;
    return this;
  }

  addStylesheet(stylesheet: string): HTMLDocumentBuilder {
    this.stylesheets.push(stylesheet);
    return this;
  }

  addScript(script: string): HTMLDocumentBuilder {
    this.scripts.push(script);
    return this;
  }

  setPageWidth(width: number): HTMLDocumentBuilder {
    this.pageWidth = width;
    return this;
  }

  setResponsive(responsive: boolean): HTMLDocumentBuilder {
    this.responsive = responsive;
    return this;
  }

  setAuthor(author: string): HTMLDocumentBuilder {
    this.author = author;
    return this;
  }

  setDescription(description: string): HTMLDocumentBuilder {
    this.description = description;
    return this;
  }

  setKeywords(keywords: string[]): HTMLDocumentBuilder {
    this.keywords = keywords;
    return this;
  }

  setDirection(direction: 'ltr' | 'rtl'): HTMLDocumentBuilder {
    this.direction = direction;
    return this;
  }

  setMinify(minify: boolean): HTMLDocumentBuilder {
    this.minify = minify;
    return this;
  }

  setPretty(pretty: boolean): HTMLDocumentBuilder {
    this.pretty = pretty;
    return this;
  }

  setIncludePrintStyles(include: boolean): HTMLDocumentBuilder {
    this.includePrintStyles = include;
    return this;
  }

  setIncludeSkipLink(include: boolean): HTMLDocumentBuilder {
    this.includeSkipLink = include;
    return this;
  }

  setPageMargins(top: number, right: number, bottom: number, left: number): HTMLDocumentBuilder {
    this.pageMargins = { top, right, bottom, left };
    return this;
  }

  enablePrintStyles(): HTMLDocumentBuilder {
    this.includePrintStyles = true;
    return this;
  }

  build(): HTMLDocument {
    return new HTMLDocument({
      content: this.content,
      title: this.title,
      language: this.language,
      css: this.css,
      stylesheets: this.stylesheets,
      scripts: this.scripts,
      pageWidth: this.pageWidth ?? undefined,
      responsive: this.responsive,
      author: this.author ?? undefined,
      description: this.description ?? undefined,
      keywords: this.keywords,
      direction: this.direction,
      minify: this.minify,
      pretty: this.pretty,
      includePrintStyles: this.includePrintStyles,
      includeSkipLink: this.includeSkipLink,
      pageMargins: this.pageMargins ?? undefined,
    });
  }
}
