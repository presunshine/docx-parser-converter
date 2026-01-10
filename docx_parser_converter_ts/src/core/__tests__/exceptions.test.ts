/**
 * Tests for exceptions module.
 *
 * Matches Python: tests/unit/core/test_exceptions.py
 */

import { describe, it, expect } from 'vitest';

import {
  DocxParserError,
  DocxValidationError,
  DocxNotFoundError,
  DocxReadError,
  DocxEncryptedError,
  DocxMissingPartError,
  DocxInvalidContentTypeError,
  XmlParseError,
} from '../exceptions';

describe('DocxParserError', () => {
  it('is an Error', () => {
    const error = new DocxParserError('test');
    expect(error).toBeInstanceOf(Error);
  });

  it('can be raised and caught', () => {
    expect(() => {
      throw new DocxParserError('test error');
    }).toThrow(DocxParserError);
  });
});

describe('DocxValidationError', () => {
  it('inherits from DocxParserError', () => {
    const error = new DocxValidationError('test');
    expect(error).toBeInstanceOf(DocxParserError);
  });

  it('message only', () => {
    const error = new DocxValidationError('Test message');
    expect(error.message).toBe('Test message');
    expect(error.details).toBeNull();
  });

  it('message with details', () => {
    const error = new DocxValidationError('Test message', 'More details');
    expect(error.toString()).toContain('Test message');
    expect(error.toString()).toContain('More details');
    expect(error.details).toBe('More details');
  });
});

describe('DocxNotFoundError', () => {
  it('inherits from DocxParserError', () => {
    const error = new DocxNotFoundError('/path/to/file.docx');
    expect(error).toBeInstanceOf(DocxParserError);
  });

  it('includes path in message', () => {
    const error = new DocxNotFoundError('/path/to/file.docx');
    expect(error.message).toContain('/path/to/file.docx');
    expect(error.path).toBe('/path/to/file.docx');
  });
});

describe('DocxReadError', () => {
  it('inherits from DocxParserError', () => {
    const error = new DocxReadError('test');
    expect(error).toBeInstanceOf(DocxParserError);
  });

  it('message only', () => {
    const error = new DocxReadError('Cannot read file');
    expect(error.message).toBe('Cannot read file');
    expect(error.originalError).toBeNull();
  });

  it('message with original error', () => {
    const original = new Error('original');
    const error = new DocxReadError('Cannot read file', original);
    expect(error.message).toContain('Cannot read file');
    expect(error.message).toContain('original');
    expect(error.originalError).toBe(original);
  });
});

describe('DocxEncryptedError', () => {
  it('inherits from DocxValidationError', () => {
    const error = new DocxEncryptedError();
    expect(error).toBeInstanceOf(DocxValidationError);
  });

  it('has descriptive message', () => {
    const error = new DocxEncryptedError();
    const message = error.message.toLowerCase();
    expect(message).toContain('encrypted');
  });
});

describe('DocxMissingPartError', () => {
  it('inherits from DocxValidationError', () => {
    const error = new DocxMissingPartError('word/document.xml');
    expect(error).toBeInstanceOf(DocxValidationError);
  });

  it('includes part name', () => {
    const error = new DocxMissingPartError('word/document.xml');
    expect(error.message).toContain('word/document.xml');
    expect(error.partName).toBe('word/document.xml');
  });
});

describe('DocxInvalidContentTypeError', () => {
  it('inherits from DocxValidationError', () => {
    const error = new DocxInvalidContentTypeError('expected/type', 'actual/type');
    expect(error).toBeInstanceOf(DocxValidationError);
  });

  it('includes expected and actual', () => {
    const error = new DocxInvalidContentTypeError('expected/type', 'actual/type');
    expect(error.message).toContain('expected/type');
    expect(error.message).toContain('actual/type');
    expect(error.expected).toBe('expected/type');
    expect(error.actual).toBe('actual/type');
  });

  it('handles null actual', () => {
    const error = new DocxInvalidContentTypeError('expected/type', null);
    expect(error.message).toContain('expected/type');
    expect(error.message.toLowerCase()).toContain('none');
  });
});

describe('XmlParseError', () => {
  it('inherits from DocxParserError', () => {
    const error = new XmlParseError('word/document.xml', new Error('bad xml'));
    expect(error).toBeInstanceOf(DocxParserError);
  });

  it('includes part name and error', () => {
    const original = new Error('bad xml');
    const error = new XmlParseError('word/document.xml', original);
    expect(error.message).toContain('word/document.xml');
    expect(error.message).toContain('bad xml');
    expect(error.partName).toBe('word/document.xml');
    expect(error.originalError).toBe(original);
  });
});

describe('Exception Hierarchy', () => {
  it('all custom exceptions can be caught with DocxParserError', () => {
    const exceptions = [
      new DocxParserError('test'),
      new DocxValidationError('test'),
      new DocxNotFoundError('/path'),
      new DocxReadError('test'),
      new DocxEncryptedError(),
      new DocxMissingPartError('part'),
      new DocxInvalidContentTypeError('a', 'b'),
      new XmlParseError('part', new Error('test')),
    ];

    for (const exc of exceptions) {
      expect(() => {
        throw exc;
      }).toThrow(DocxParserError);
    }
  });
});
