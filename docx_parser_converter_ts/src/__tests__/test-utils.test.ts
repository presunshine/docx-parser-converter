/**
 * Tests for test utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  makeElement,
  parseXml,
  normalizeWhitespace,
  normalizeHtml,
  normalizeText,
  getAttr,
  findChild,
  findChildren,
  getText,
  WORD_NS,
} from './helpers/test-utils';

describe('Test Utils', () => {
  describe('makeElement', () => {
    it('should create element from XML snippet', () => {
      const xml = '<w:p><w:r><w:t>Hello</w:t></w:r></w:p>';
      const element = makeElement(xml);
      expect(element).toBeDefined();
      expect(element.localName).toBe('p');
    });

    it('should handle nested elements', () => {
      const xml = '<w:p><w:pPr><w:jc w:val="center"/></w:pPr></w:p>';
      const element = makeElement(xml);
      expect(element.localName).toBe('p');
      expect(element.childNodes.length).toBeGreaterThan(0);
    });

    it('should preserve namespace', () => {
      const xml = '<w:p/>';
      const element = makeElement(xml);
      expect(element.namespaceURI).toBe(WORD_NS);
    });
  });

  describe('parseXml', () => {
    it('should parse full XML document', () => {
      const xml = '<?xml version="1.0"?><root><child>text</child></root>';
      const doc = parseXml(xml);
      expect(doc).toBeDefined();
      expect(doc.documentElement.tagName).toBe('root');
    });
  });

  describe('normalizeWhitespace', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(normalizeWhitespace('  hello  ')).toBe('hello');
    });

    it('should normalize line endings', () => {
      expect(normalizeWhitespace('a\r\nb\rc')).toBe('a\nb\nc');
    });

    it('should remove trailing whitespace from lines', () => {
      expect(normalizeWhitespace('hello   \nworld   ')).toBe('hello\nworld');
    });
  });

  describe('normalizeHtml', () => {
    it('should collapse multiple blank lines', () => {
      const html = 'line1\n\n\n\nline2';
      expect(normalizeHtml(html)).toBe('line1\n\nline2');
    });
  });

  describe('normalizeText', () => {
    it('should normalize text output', () => {
      const text = '  Hello World  \n\n  Test  ';
      expect(normalizeText(text)).toBe('Hello World\n\n  Test');
    });
  });

  describe('getAttr', () => {
    it('should get attribute value', () => {
      const xml = '<w:jc w:val="center"/>';
      const element = makeElement(xml);
      expect(getAttr(element, 'w:val')).toBe('center');
    });

    it('should return null for missing attribute', () => {
      const xml = '<w:p/>';
      const element = makeElement(xml);
      expect(getAttr(element, 'w:val')).toBeNull();
    });
  });

  describe('findChild', () => {
    it('should find child element', () => {
      const xml = '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r/></w:p>';
      const element = makeElement(xml);
      const pPr = findChild(element, 'w:pPr');
      expect(pPr).not.toBeNull();
      expect(pPr!.localName).toBe('pPr');
    });

    it('should return null for missing child', () => {
      const xml = '<w:p/>';
      const element = makeElement(xml);
      expect(findChild(element, 'w:pPr')).toBeNull();
    });
  });

  describe('findChildren', () => {
    it('should find all matching children', () => {
      const xml = '<w:p><w:r/><w:r/><w:r/></w:p>';
      const element = makeElement(xml);
      const runs = findChildren(element, 'w:r');
      expect(runs.length).toBe(3);
    });

    it('should return empty array for no matches', () => {
      const xml = '<w:p/>';
      const element = makeElement(xml);
      expect(findChildren(element, 'w:r')).toEqual([]);
    });
  });

  describe('getText', () => {
    it('should get text content', () => {
      const xml = '<w:t>Hello World</w:t>';
      const element = makeElement(xml);
      expect(getText(element)).toBe('Hello World');
    });

    it('should return empty string for empty element', () => {
      const xml = '<w:t/>';
      const element = makeElement(xml);
      expect(getText(element)).toBe('');
    });
  });
});
