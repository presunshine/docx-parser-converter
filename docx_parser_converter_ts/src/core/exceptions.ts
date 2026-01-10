/**
 * Custom exceptions for DOCX parsing.
 *
 * Matches Python: core/exceptions.py
 */

/**
 * Base exception for all DOCX parsing errors.
 */
export class DocxParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocxParserError';
    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Raised when DOCX validation fails.
 */
export class DocxValidationError extends DocxParserError {
  readonly details: string | null;

  constructor(message: string, details: string | null = null) {
    const fullMessage = details ? `${message}: ${details}` : message;
    super(fullMessage);
    this.name = 'DocxValidationError';
    this.details = details;
  }
}

/**
 * Raised when a DOCX file cannot be found.
 */
export class DocxNotFoundError extends DocxParserError {
  readonly path: string;

  constructor(path: string) {
    super(`DOCX file not found: ${path}`);
    this.name = 'DocxNotFoundError';
    this.path = path;
  }
}

/**
 * Raised when a DOCX file cannot be read.
 */
export class DocxReadError extends DocxParserError {
  readonly originalError: Error | null;

  constructor(message: string, originalError: Error | null = null) {
    const fullMessage = originalError ? `${message}: ${originalError.message}` : message;
    super(fullMessage);
    this.name = 'DocxReadError';
    this.originalError = originalError;
  }
}

/**
 * Raised when a DOCX file is encrypted.
 */
export class DocxEncryptedError extends DocxValidationError {
  constructor() {
    super('Encrypted DOCX files are not supported');
    this.name = 'DocxEncryptedError';
  }
}

/**
 * Raised when a required DOCX part is missing.
 */
export class DocxMissingPartError extends DocxValidationError {
  readonly partName: string;

  constructor(partName: string) {
    super(`Required DOCX part missing: ${partName}`);
    this.name = 'DocxMissingPartError';
    this.partName = partName;
  }
}

/**
 * Raised when content type validation fails.
 */
export class DocxInvalidContentTypeError extends DocxValidationError {
  readonly expected: string;
  readonly actual: string | null;

  constructor(expected: string, actual: string | null) {
    const actualStr = actual ?? 'none';
    super(`Invalid content type: expected ${expected}, got ${actualStr}`);
    this.name = 'DocxInvalidContentTypeError';
    this.expected = expected;
    this.actual = actual;
  }
}

/**
 * Raised when XML parsing fails.
 */
export class XmlParseError extends DocxParserError {
  readonly partName: string;
  readonly originalError: Error;

  constructor(partName: string, originalError: Error) {
    super(`Failed to parse XML in ${partName}: ${originalError.message}`);
    this.name = 'XmlParseError';
    this.partName = partName;
    this.originalError = originalError;
  }
}
