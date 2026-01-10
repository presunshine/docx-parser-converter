/**
 * Tests for xml-extractor module.
 *
 * Matches Python: tests/unit/core/test_xml_extractor.py
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Constants imported for potential future use in tests
// import { WORD_NS } from '../constants';
import { openDocx } from '../docx-reader';
import {
  extractXml,
  extractXmlSafe,
  extractDocumentXml,
  extractStylesXml,
  extractNumberingXml,
  extractRelationships,
  extractExternalHyperlinks,
  getBodyElement,
  iterParagraphs,
  iterTables,
} from '../xml-extractor';

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

// Find a DOCX file with tables
function getTablesDocxPath(): string | null {
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.docx'));
  for (const file of files) {
    if (file.toLowerCase().includes('table')) {
      return path.join(FIXTURES_DIR, file);
    }
  }
  return null;
}

// Find a DOCX file with lists
function getListsDocxPath(): string | null {
  const files = fs.readdirSync(FIXTURES_DIR).filter((f) => f.endsWith('.docx'));
  for (const file of files) {
    if (file.toLowerCase().includes('list')) {
      return path.join(FIXTURES_DIR, file);
    }
  }
  return null;
}

describe('extractXml', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('extracts document.xml successfully', async () => {
    const zip = await openDocx(sampleDocxPath);
    const doc = await extractXml(zip, 'word/document.xml');
    expect(doc).toBeDefined();
    expect(doc.tagName).toBe('w:document');
  });

  it('extracting nonexistent part throws', async () => {
    const zip = await openDocx(sampleDocxPath);
    await expect(extractXml(zip, 'word/nonexistent.xml')).rejects.toThrow();
  });
});

describe('extractXmlSafe', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('extracts existing part returns element', async () => {
    const zip = await openDocx(sampleDocxPath);
    const doc = await extractXmlSafe(zip, 'word/document.xml');
    expect(doc).not.toBeNull();
    expect(doc).toBeDefined();
  });

  it('extract nonexistent returns null', async () => {
    const zip = await openDocx(sampleDocxPath);
    const result = await extractXmlSafe(zip, 'word/nonexistent.xml');
    expect(result).toBeNull();
  });
});

describe('extractDocumentXml', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('extracts document', async () => {
    const zip = await openDocx(sampleDocxPath);
    const doc = await extractDocumentXml(zip);
    expect(doc.tagName).toBe('w:document');
  });
});

describe('extractStylesXml', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('extracts styles if present', async () => {
    const zip = await openDocx(sampleDocxPath);
    const styles = await extractStylesXml(zip);
    // Most DOCX files have styles.xml
    if (styles !== null) {
      expect(styles.tagName).toBe('w:styles');
    }
  });
});

describe('extractNumberingXml', () => {
  it('extracts numbering if present', async () => {
    const listsPath = getListsDocxPath();
    if (listsPath) {
      const zip = await openDocx(listsPath);
      const numbering = await extractNumberingXml(zip);
      if (numbering !== null) {
        expect(numbering.tagName).toBe('w:numbering');
      }
    }
  });
});

describe('extractRelationships', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('returns object', async () => {
    const zip = await openDocx(sampleDocxPath);
    const rels = await extractRelationships(zip);
    expect(typeof rels).toBe('object');
  });

  it('relationships have rId keys', async () => {
    const zip = await openDocx(sampleDocxPath);
    const rels = await extractRelationships(zip);
    for (const key of Object.keys(rels)) {
      expect(key.startsWith('rId')).toBe(true);
    }
  });
});

describe('extractExternalHyperlinks', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('returns object', async () => {
    const zip = await openDocx(sampleDocxPath);
    const links = await extractExternalHyperlinks(zip);
    expect(typeof links).toBe('object');
  });
});

describe('getBodyElement', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('gets body from document', async () => {
    const zip = await openDocx(sampleDocxPath);
    const doc = await extractDocumentXml(zip);
    const body = getBodyElement(doc);
    expect(body).not.toBeNull();
    expect(body!.tagName).toBe('w:body');
  });
});

describe('iterParagraphs', () => {
  let sampleDocxPath: string;

  beforeAll(() => {
    sampleDocxPath = getSampleDocxPath();
  });

  it('iterates paragraphs', async () => {
    const zip = await openDocx(sampleDocxPath);
    const doc = await extractDocumentXml(zip);
    const body = getBodyElement(doc);
    expect(body).not.toBeNull();

    const paragraphs = iterParagraphs(body!);
    expect(Array.isArray(paragraphs)).toBe(true);
    expect(paragraphs.length).toBeGreaterThan(0);

    for (const p of paragraphs) {
      expect(p.tagName).toBe('w:p');
    }
  });
});

describe('iterTables', () => {
  it('iterates tables', async () => {
    const tablesPath = getTablesDocxPath();
    if (tablesPath) {
      const zip = await openDocx(tablesPath);
      const doc = await extractDocumentXml(zip);
      const body = getBodyElement(doc);
      expect(body).not.toBeNull();

      const tables = iterTables(body!);
      expect(Array.isArray(tables)).toBe(true);
      // Tables fixture should have at least one table
      expect(tables.length).toBeGreaterThan(0);

      for (const tbl of tables) {
        expect(tbl.tagName).toBe('w:tbl');
      }
    }
  });
});
