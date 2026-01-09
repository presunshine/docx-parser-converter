/**
 * Tests for fixture loading functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  fixturesExist,
  getDocxTestFiles,
  getTaggedTestFiles,
  loadDocxFixture,
  loadExpectedHtml,
  loadExpectedText,
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
  });
});
