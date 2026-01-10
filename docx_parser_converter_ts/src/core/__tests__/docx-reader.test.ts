/**
 * Tests for docx-reader module.
 *
 * Matches Python: tests/unit/core/test_docx_reader.py
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

import {
  openDocx,
  validateDocx,
  isValidDocx,
  listDocxParts,
  hasPart,
} from '../docx-reader';
import {
  DocxNotFoundError,
  DocxReadError,
  DocxEncryptedError,
  DocxMissingPartError,
} from '../exceptions';

// Fixtures setup
const FIXTURES_DIR = path.resolve(__dirname, '../../../../fixtures/test_docx_files');

// Get first available DOCX file
function getSampleDocxPath(): string {
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.docx'));
  if (files.length === 0) {
    throw new Error('No sample DOCX files found in fixtures');
  }
  return path.join(FIXTURES_DIR, files[0]);
}

function getSampleDocxBytes(): Uint8Array {
  return new Uint8Array(fs.readFileSync(getSampleDocxPath()));
}

const invalidZipBytes = new TextEncoder().encode('This is not a ZIP file');
const emptyBytes = new Uint8Array(0);

describe('openDocx', () => {
  let sampleDocxPath: string;
  let sampleDocxBytes: Uint8Array;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
    sampleDocxBytes = getSampleDocxBytes();
  });

  it('opens from path string', async () => {
    const zip = await openDocx(sampleDocxPath);
    expect(zip).toBeInstanceOf(JSZip);
    expect(zip.file('word/document.xml')).not.toBeNull();
  });

  it('opens from Uint8Array', async () => {
    const zip = await openDocx(sampleDocxBytes);
    expect(zip).toBeInstanceOf(JSZip);
    expect(zip.file('word/document.xml')).not.toBeNull();
  });

  it('opens from ArrayBuffer', async () => {
    const buffer = sampleDocxBytes.buffer;
    const zip = await openDocx(buffer);
    expect(zip).toBeInstanceOf(JSZip);
    expect(zip.file('word/document.xml')).not.toBeNull();
  });

  it('opens from Blob', async () => {
    const blob = new Blob([sampleDocxBytes]);
    const zip = await openDocx(blob);
    expect(zip).toBeInstanceOf(JSZip);
    expect(zip.file('word/document.xml')).not.toBeNull();
  });

  it('throws DocxNotFoundError for nonexistent file', async () => {
    await expect(openDocx('/path/to/nonexistent/file.docx')).rejects.toThrow(
      DocxNotFoundError
    );
    try {
      await openDocx('/path/to/nonexistent/file.docx');
    } catch (e) {
      expect((e as Error).message).toContain('/path/to/nonexistent/file.docx');
    }
  });

  it('throws DocxReadError for invalid ZIP bytes', async () => {
    await expect(openDocx(invalidZipBytes)).rejects.toThrow(DocxReadError);
    try {
      await openDocx(invalidZipBytes);
    } catch (e) {
      expect((e as Error).message).toContain('Invalid ZIP');
    }
  });

  it('throws DocxReadError for empty bytes', async () => {
    await expect(openDocx(emptyBytes)).rejects.toThrow(DocxReadError);
    try {
      await openDocx(emptyBytes);
    } catch (e) {
      expect((e as Error).message).toContain('Empty');
    }
  });
});

describe('validateDocx', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('valid DOCX passes validation', async () => {
    const zip = await openDocx(sampleDocxPath);
    // Should not throw
    await expect(validateDocx(zip)).resolves.toBeUndefined();
  });

  it('DOCX without document.xml fails validation', async () => {
    // Create a ZIP without document.xml
    const zip = new JSZip();
    zip.file('[Content_Types].xml', '<Types/>');

    await expect(validateDocx(zip)).rejects.toThrow(DocxMissingPartError);
    try {
      await validateDocx(zip);
    } catch (e) {
      expect((e as Error).message).toContain('word/document.xml');
    }
  });

  it('DOCX without [Content_Types].xml fails validation', async () => {
    // Create a ZIP without content types
    const zip = new JSZip();
    zip.file('word/document.xml', '<document/>');

    await expect(validateDocx(zip)).rejects.toThrow(DocxMissingPartError);
    try {
      await validateDocx(zip);
    } catch (e) {
      expect((e as Error).message).toContain('[Content_Types].xml');
    }
  });

  it('encrypted DOCX fails validation', async () => {
    // Create a ZIP with encryption marker
    const zip = new JSZip();
    zip.file('EncryptedPackage', 'encrypted content');
    zip.file('[Content_Types].xml', '<Types/>');
    zip.file('word/document.xml', '<document/>');

    await expect(validateDocx(zip)).rejects.toThrow(DocxEncryptedError);
  });
});

describe('isValidDocx', () => {
  let sampleDocxPath: string;
  let sampleDocxBytes: Uint8Array;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
    sampleDocxBytes = getSampleDocxBytes();
  });

  it('valid DOCX returns true', async () => {
    expect(await isValidDocx(sampleDocxPath)).toBe(true);
  });

  it('valid DOCX bytes returns true', async () => {
    expect(await isValidDocx(sampleDocxBytes)).toBe(true);
  });

  it('invalid content returns false', async () => {
    expect(await isValidDocx(invalidZipBytes)).toBe(false);
  });

  it('nonexistent file returns false', async () => {
    expect(await isValidDocx('/nonexistent/file.docx')).toBe(false);
  });
});

describe('listDocxParts', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('lists all parts', async () => {
    const zip = await openDocx(sampleDocxPath);
    const parts = listDocxParts(zip);
    expect(parts).toContain('word/document.xml');
    expect(parts).toContain('[Content_Types].xml');
  });
});

describe('hasPart', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('existing part returns true', async () => {
    const zip = await openDocx(sampleDocxPath);
    expect(hasPart(zip, 'word/document.xml')).toBe(true);
  });

  it('nonexistent part returns false', async () => {
    const zip = await openDocx(sampleDocxPath);
    expect(hasPart(zip, 'word/nonexistent.xml')).toBe(false);
  });
});
