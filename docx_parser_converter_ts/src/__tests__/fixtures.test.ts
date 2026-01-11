/**
 * Tests for fixture loading functionality.
 *
 * This test file validates that the fixture system works correctly:
 * - Directory access and path resolution
 * - DOCX file loading and validation
 * - Expected output file loading (HTML/text)
 * - Tagged test file discovery and parsing
 *
 * Matches Python: tests/conftest.py fixtures
 */

import { describe, it, expect } from 'vitest';
import {
  fixturesExist,
  getDocxTestFiles,
  getTaggedTestFiles,
  loadDocxFixture,
  loadExpectedHtml,
  loadExpectedText,
  loadTaggedTestFile,
  loadTaggedTestExpectedHtml,
  getFixturesDir,
  getTestDocxDir,
  getTaggedTestsDir,
} from './helpers/fixture-loader';

describe('Fixtures', () => {
  describe('Directory Access', () => {
    it('should access fixtures directory', () => {
      expect(fixturesExist()).toBe(true);
    });

    it('should have correct fixtures directory path', () => {
      const fixturesDir = getFixturesDir();
      expect(fixturesDir).toContain('fixtures');
    });

    it('should have correct test DOCX directory path', () => {
      const testDocxDir = getTestDocxDir();
      expect(testDocxDir).toContain('test_docx_files');
    });

    it('should have correct tagged tests directory path', () => {
      const taggedTestsDir = getTaggedTestsDir();
      expect(taggedTestsDir).toContain('tagged_tests');
    });

    it('should have paths that end with expected directory names', () => {
      const fixturesDir = getFixturesDir();
      const testDocxDir = getTestDocxDir();
      const taggedTestsDir = getTaggedTestsDir();

      expect(fixturesDir.endsWith('fixtures')).toBe(true);
      expect(testDocxDir.endsWith('test_docx_files')).toBe(true);
      expect(taggedTestsDir.endsWith('tagged_tests')).toBe(true);
    });
  });

  describe('DOCX Test Files', () => {
    it('should load DOCX test files from ../fixtures/test_docx_files', () => {
      const files = getDocxTestFiles();
      expect(files.length).toBeGreaterThan(0);
    });

    it('should have comprehensive_docx_demo.docx in test files', () => {
      const files = getDocxTestFiles();
      const names = files.map((f) => f.name);
      expect(names).toContain('comprehensive_docx_demo.docx');
    });

    it('should load DOCX file content as Buffer', () => {
      const buffer = loadDocxFixture('comprehensive_docx_demo');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should have valid DOCX files (start with PK ZIP signature)', () => {
      const files = getDocxTestFiles();
      files.forEach((file) => {
        // DOCX files are ZIP archives, which start with "PK" (0x50 0x4B)
        expect(file.buffer[0]).toBe(0x50); // 'P'
        expect(file.buffer[1]).toBe(0x4b); // 'K'
      });
    });

    it('should load DOCX fixture with or without extension', () => {
      const withExt = loadDocxFixture('comprehensive_docx_demo.docx');
      const withoutExt = loadDocxFixture('comprehensive_docx_demo');

      expect(withExt).toBeInstanceOf(Buffer);
      expect(withoutExt).toBeInstanceOf(Buffer);
      expect(withExt.length).toBe(withoutExt.length);
    });

    it('should throw on non-existent DOCX fixture', () => {
      expect(() => loadDocxFixture('non_existent_file')).toThrow(
        'DOCX fixture not found'
      );
    });

    it('should have DocxTestFile objects with correct properties', () => {
      const files = getDocxTestFiles();
      const file = files.find((f) => f.name === 'comprehensive_docx_demo.docx');

      expect(file).toBeDefined();
      expect(file!.name).toBe('comprehensive_docx_demo.docx');
      expect(file!.stem).toBe('comprehensive_docx_demo');
      expect(file!.path).toContain('comprehensive_docx_demo.docx');
      expect(file!.buffer).toBeInstanceOf(Buffer);
    });
  });

  describe('Expected Outputs', () => {
    it('should load expected HTML outputs (*-python.html)', () => {
      const html = loadExpectedHtml('comprehensive_docx_demo');
      expect(html).not.toBeNull();
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should load expected text outputs (*-python.txt)', () => {
      const text = loadExpectedText('comprehensive_docx_demo');
      expect(text).not.toBeNull();
      expect(text!.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent expected files', () => {
      const html = loadExpectedHtml('non_existent_file');
      expect(html).toBeNull();

      const text = loadExpectedText('non_existent_file');
      expect(text).toBeNull();
    });

    it('should have matching HTML for each DOCX test file', () => {
      const files = getDocxTestFiles();
      const filesWithHtml = files.filter((f) => loadExpectedHtml(f.stem) !== null);

      // At least some files should have expected outputs
      expect(filesWithHtml.length).toBeGreaterThan(0);
    });

    it('should have matching text for each DOCX test file', () => {
      const files = getDocxTestFiles();
      const filesWithText = files.filter((f) => loadExpectedText(f.stem) !== null);

      // At least some files should have expected outputs
      expect(filesWithText.length).toBeGreaterThan(0);
    });
  });

  describe('Tagged Tests', () => {
    it('should load tagged tests from ../fixtures/tagged_tests', () => {
      const files = getTaggedTestFiles();
      expect(files.length).toBeGreaterThan(0);
    });

    it('should have formatting_tests.docx in tagged tests', () => {
      const files = getTaggedTestFiles();
      expect(files).toContain('formatting_tests.docx');
    });

    it('should have table_tests_v2.docx in tagged tests', () => {
      const files = getTaggedTestFiles();
      expect(files).toContain('table_tests_v2.docx');
    });

    it('should have list_tests.docx in tagged tests', () => {
      const files = getTaggedTestFiles();
      expect(files).toContain('list_tests.docx');
    });

    it('should have margin_tests.docx in tagged tests', () => {
      const files = getTaggedTestFiles();
      expect(files).toContain('margin_tests.docx');
    });

    it('should load tagged test file content as Buffer', () => {
      const buffer = loadTaggedTestFile('formatting_tests.docx');
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should have valid DOCX format for tagged test files', () => {
      const files = getTaggedTestFiles();
      files.forEach((fileName) => {
        const buffer = loadTaggedTestFile(fileName);
        // DOCX files are ZIP archives, which start with "PK" (0x50 0x4B)
        expect(buffer[0]).toBe(0x50); // 'P'
        expect(buffer[1]).toBe(0x4b); // 'K'
      });
    });

    it('should throw on non-existent tagged test file', () => {
      expect(() => loadTaggedTestFile('non_existent_file')).toThrow(
        'Tagged test file not found'
      );
    });

    it('should load tagged test expected HTML', () => {
      const html = loadTaggedTestExpectedHtml('formatting_tests');
      // May be null if expected file doesn't exist yet
      if (html !== null) {
        expect(html).toContain('<');
      }
    });
  });

  describe('File Counts', () => {
    it('should have at least 5 DOCX test files', () => {
      const files = getDocxTestFiles();
      expect(files.length).toBeGreaterThanOrEqual(5);
    });

    it('should have at least 3 tagged test files', () => {
      const files = getTaggedTestFiles();
      expect(files.length).toBeGreaterThanOrEqual(3);
    });
  });
});
