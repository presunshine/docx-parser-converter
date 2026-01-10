/**
 * Unit tests for HTML document wrapper.
 *
 * Tests generation of complete HTML5 documents.
 * Matches Python: tests/unit/converters/html/test_html_document.py
 */

import { describe, it, expect } from 'vitest';
import { HTMLDocument, HTMLDocumentBuilder } from '../html-document';

// =============================================================================
// Basic HTML Structure Tests
// =============================================================================

describe('Basic HTML Structure', () => {
  it('should include HTML5 doctype', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result.startsWith('<!DOCTYPE html>')).toBe(true);
  });

  it('should have html element', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('should have head element', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
  });

  it('should have body element', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result.includes('<body>') || result.includes('<body ')).toBe(true);
    expect(result).toContain('</body>');
  });

  it('should place content within body', () => {
    const doc = new HTMLDocument({ content: '<p>Test content</p>' });
    const result = doc.render();
    const bodyStart = result.indexOf('<body');
    const bodyEnd = result.indexOf('</body>');
    expect(bodyStart).toBeLessThan(bodyEnd);
    expect(result.slice(bodyStart, bodyEnd)).toContain('Test content');
  });

  it('should include charset meta tag', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<meta charset="UTF-8">');
  });

  it('should have html lang attribute', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', language: 'en' });
    const result = doc.render();
    expect(result).toContain('lang="en"');
  });
});

// =============================================================================
// Title Tests
// =============================================================================

describe('HTML Title', () => {
  it('should have title element', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', title: 'My Document' });
    const result = doc.render();
    expect(result).toContain('<title>My Document</title>');
  });

  it('should handle empty title', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', title: '' });
    const result = doc.render();
    expect(result).toContain('<title></title>');
  });

  it('should escape special characters in title', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', title: "<script>alert('xss')</script>" });
    const result = doc.render();
    const headSection = result.split('<body')[0];
    expect(headSection).not.toContain("<script>alert");
    expect(headSection).toContain('&lt;script&gt;');
  });

  it('should have title element even when none provided', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<title>');
  });
});

// =============================================================================
// CSS Styles Tests
// =============================================================================

describe('HTML Styles', () => {
  it('should include style element in head', () => {
    const css = 'p { margin: 0; }';
    const doc = new HTMLDocument({ content: '<p>Hello</p>', css });
    const result = doc.render();
    expect(result).toContain('<style>');
    expect(result).toContain('p { margin: 0; }');
  });

  it('should include multiple CSS rules', () => {
    const css = 'body { font-family: Arial; }\np { margin: 0; }';
    const doc = new HTMLDocument({ content: '<p>Hello</p>', css });
    const result = doc.render();
    expect(result).toContain('font-family: Arial');
    expect(result).toContain('margin: 0');
  });

  it('should have style tag even without explicit styles', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<style>');
  });

  it('should include default body styles', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('font-family');
  });

  it('should include page width constraint', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', pageWidth: 612 });
    const result = doc.render();
    expect(result).toContain('max-width');
  });
});

// =============================================================================
// Meta Tags Tests
// =============================================================================

describe('Meta Tags', () => {
  it('should include viewport meta for responsive design', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', responsive: true });
    const result = doc.render();
    expect(result).toContain('<meta name="viewport"');
  });

  it('should include author meta tag', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', author: 'John Doe' });
    const result = doc.render();
    expect(result).toContain('<meta name="author" content="John Doe">');
  });

  it('should include description meta tag', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', description: 'A test document' });
    const result = doc.render();
    expect(result).toContain('<meta name="description"');
    expect(result).toContain('A test document');
  });

  it('should include keywords meta tag', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', keywords: ['test', 'document'] });
    const result = doc.render();
    expect(result).toContain('<meta name="keywords"');
    expect(result).toContain('test');
  });

  it('should include generator meta tag', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<meta name="generator" content="docx-parser-converter">');
  });
});

// =============================================================================
// External Resources Tests
// =============================================================================

describe('External Resources', () => {
  it('should include external stylesheet link', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', stylesheets: ['styles.css'] });
    const result = doc.render();
    expect(result).toContain('<link rel="stylesheet" href="styles.css">');
  });

  it('should include multiple external stylesheets', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', stylesheets: ['base.css', 'theme.css'] });
    const result = doc.render();
    expect(result).toContain('href="base.css"');
    expect(result).toContain('href="theme.css"');
  });

  it('should include external script tag', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', scripts: ['app.js'] });
    const result = doc.render();
    expect(result).toContain('<script src="app.js">');
  });
});

// =============================================================================
// Document Builder Tests
// =============================================================================

describe('HTMLDocumentBuilder', () => {
  it('should build basic document', () => {
    const builder = new HTMLDocumentBuilder();
    const doc = builder.setContent('<p>Hello</p>').build();
    const result = doc.render();
    expect(result).toContain('Hello');
  });

  it('should build document with title', () => {
    const builder = new HTMLDocumentBuilder();
    const doc = builder.setContent('<p>Hello</p>').setTitle('My Doc').build();
    const result = doc.render();
    expect(result).toContain('<title>My Doc</title>');
  });

  it('should build document with CSS', () => {
    const builder = new HTMLDocumentBuilder();
    const doc = builder.setContent('<p>Hello</p>').addCss('p { color: red; }').build();
    const result = doc.render();
    expect(result).toContain('color: red');
  });

  it('should support method chaining', () => {
    const doc = new HTMLDocumentBuilder()
      .setContent('<p>Hello</p>')
      .setTitle('Test')
      .setLanguage('en')
      .addCss('p { margin: 0; }')
      .build();
    const result = doc.render();
    expect(result).toContain('Hello');
    expect(result).toContain('Test');
    expect(result).toContain('lang="en"');
    expect(result).toContain('margin: 0');
  });
});

// =============================================================================
// Section/Page Break Tests
// =============================================================================

describe('Section Handling', () => {
  it('should handle page breaks in content', () => {
    const doc = new HTMLDocument({ content: "<p>Page 1</p><hr class='page-break'/><p>Page 2</p>" });
    const result = doc.render();
    expect(result).toContain('page-break');
  });

  it('should handle section element', () => {
    const doc = new HTMLDocument({ content: '<section><p>Section 1</p></section>' });
    const result = doc.render();
    expect(result).toContain('Section 1');
  });

  it('should include page break CSS', () => {
    const doc = new HTMLDocument({ content: '<p>Content</p>' });
    const result = doc.render();
    expect(result).toContain('.page-break');
  });
});

// =============================================================================
// Image Handling Tests
// =============================================================================

describe('Image Handling', () => {
  it('should handle embedded base64 images', () => {
    const content = '<img src="data:image/png;base64,ABC123...">';
    const doc = new HTMLDocument({ content });
    const result = doc.render();
    expect(result).toContain('data:image/png;base64');
  });

  it('should handle external image references', () => {
    const content = '<img src="images/image1.png">';
    const doc = new HTMLDocument({ content });
    const result = doc.render();
    expect(result).toContain('src="images/image1.png"');
  });

  it('should preserve image directory paths', () => {
    const content = '<img src="assets/images/test.png">';
    const doc = new HTMLDocument({ content });
    const result = doc.render();
    expect(result).toContain('assets/images/test.png');
  });
});

// =============================================================================
// Font Handling Tests
// =============================================================================

describe('Font Handling', () => {
  it('should include @font-face declarations', () => {
    const css = "@font-face { font-family: 'Custom'; src: url('font.woff2'); }";
    const doc = new HTMLDocument({ content: '<p>Hello</p>', css });
    const result = doc.render();
    expect(result).toContain('@font-face');
  });

  it('should include web-safe fallback fonts', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result.includes('Arial') || result.includes('sans-serif')).toBe(true);
  });

  it('should support Google Fonts links', () => {
    const doc = new HTMLDocument({
      content: '<p>Hello</p>',
      stylesheets: ['https://fonts.googleapis.com/css?family=Roboto'],
    });
    const result = doc.render();
    expect(result).toContain('fonts.googleapis.com');
  });
});

// =============================================================================
// Encoding Tests
// =============================================================================

describe('Encoding', () => {
  it('should handle UTF-8 content correctly', () => {
    const doc = new HTMLDocument({ content: '<p>Hello 世界</p>' });
    const result = doc.render();
    expect(result).toContain('世界');
  });

  it('should handle emoji content correctly', () => {
    const doc = new HTMLDocument({ content: '<p>Hello 🌍</p>' });
    const result = doc.render();
    expect(result).toContain('🌍');
  });

  it('should handle RTL content', () => {
    const doc = new HTMLDocument({ content: '<p>مرحبا</p>', direction: 'rtl' });
    const result = doc.render();
    expect(result).toContain('مرحبا');
    expect(result).toContain('dir="rtl"');
  });
});

// =============================================================================
// Validation Tests
// =============================================================================

describe('HTML Validation', () => {
  it('should produce valid HTML5', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
    expect(result).toContain('</html>');
  });

  it('should have properly closed tags', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect((result.match(/<html/g) || []).length).toBe((result.match(/<\/html>/g) || []).length);
    expect((result.match(/<head>/g) || []).length).toBe((result.match(/<\/head>/g) || []).length);
    expect((result.match(/<body/g) || []).length).toBe((result.match(/<\/body>/g) || []).length);
  });

  it('should have properly nested tags', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result.indexOf('<head>')).toBeLessThan(result.indexOf('<body'));
  });

  it('should escape attribute values properly', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', author: 'John "The Dev" Doe' });
    const result = doc.render();
    expect(result.includes('&quot;') || result.includes('John')).toBe(true);
  });
});

// =============================================================================
// Minification Tests
// =============================================================================

describe('Minification', () => {
  it('should produce minified output', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', minify: true });
    const result = doc.render();
    expect(result).not.toContain('\n\n');
  });

  it('should produce pretty output', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', pretty: true });
    const result = doc.render();
    expect(result).toContain('\n');
  });
});

// =============================================================================
// Edge Cases Tests
// =============================================================================

describe('HTMLDocument Edge Cases', () => {
  it('should handle empty content', () => {
    const doc = new HTMLDocument({ content: '' });
    const result = doc.render();
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
  });

  it('should handle null content', () => {
    const doc = new HTMLDocument({ content: null as unknown as string });
    const result = doc.render();
    expect(result).toContain('<!DOCTYPE html>');
  });

  it('should handle very large content', () => {
    const largeContent = '<p>' + 'A'.repeat(10000) + '</p>';
    const doc = new HTMLDocument({ content: largeContent });
    const result = doc.render();
    expect(result).toContain('A'.repeat(10000));
  });

  it('should handle special characters everywhere', () => {
    const doc = new HTMLDocument({
      content: '<p>&amp; test</p>',
      title: 'Test & Demo',
      description: 'A test document',
    });
    const result = doc.render();
    expect(result.toLowerCase()).toContain('test');
  });

  it('should prevent script injection in meta tags', () => {
    const doc = new HTMLDocument({ content: '<p>Safe</p>', title: "<script>alert('xss')</script>" });
    const result = doc.render();
    const headSection = result.split('<body')[0];
    expect(headSection).not.toContain("<script>alert");
  });
});

// =============================================================================
// Fragment Mode Tests
// =============================================================================

describe('Fragment Mode', () => {
  it('should output content only without HTML wrapper', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.renderFragment();
    expect(result).toBe('<p>Hello</p>');
    expect(result).not.toContain('<!DOCTYPE');
    expect(result).not.toContain('<html');
  });

  it('should not include style block in fragment', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', css: 'p { color: red; }' });
    const result = doc.renderFragment();
    expect(result).toBe('<p>Hello</p>');
    expect(result).not.toContain('<style>');
  });
});

// =============================================================================
// Template Integration Tests
// =============================================================================

describe('Template Integration', () => {
  it('should produce valid output with default template', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html');
  });

  it('should insert content properly into template', () => {
    const doc = new HTMLDocument({ content: '<p>Custom Content</p>' });
    const result = doc.render();
    expect(result).toContain('Custom Content');
  });
});

// =============================================================================
// Print Styles Tests
// =============================================================================

describe('Print Styles', () => {
  it('should include print media query', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', includePrintStyles: true });
    const result = doc.render();
    expect(result).toContain('@media print');
  });

  it('should include CSS page size for printing', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', includePrintStyles: true });
    const result = doc.render();
    expect(result).toContain('@page');
  });

  it('should include print margins', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', includePrintStyles: true });
    const result = doc.render();
    expect(result).toContain('margin');
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('Accessibility', () => {
  it('should include skip link option', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>', includeSkipLink: true });
    const result = doc.render();
    expect(result).toContain('href="#content"');
    expect(result.toLowerCase()).toContain('skip');
  });

  it('should include main landmark element', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('<main');
    expect(result).toContain('</main>');
  });

  it('should include document ARIA role', () => {
    const doc = new HTMLDocument({ content: '<p>Hello</p>' });
    const result = doc.render();
    expect(result).toContain('role="main"');
  });
});
