/**
 * Fixture loading utilities for tests.
 *
 * Provides functions to load DOCX test files, expected outputs,
 * and tagged test definitions from the shared fixtures directory.
 */

import * as fs from 'fs';
import * as path from 'path';

// Path to the shared fixtures directory (relative to this file)
const FIXTURES_DIR = path.resolve(__dirname, '../../../../fixtures');
const TEST_DOCX_DIR = path.join(FIXTURES_DIR, 'test_docx_files');
const TAGGED_TESTS_DIR = path.join(FIXTURES_DIR, 'tagged_tests');

/**
 * Information about a DOCX test file.
 */
export interface DocxTestFile {
  /** File name without path */
  name: string;
  /** File name without extension */
  stem: string;
  /** Full path to the file */
  path: string;
  /** File buffer */
  buffer: Buffer;
}

/**
 * Information about a tagged test.
 */
export interface TaggedTest {
  /** Test number (from "Test #N" format) */
  number: number;
  /** Test name/description */
  name: string;
  /** Expected properties as JSON object */
  expected: Record<string, unknown>;
  /** Raw description text */
  description: string;
}

/**
 * Check if a file exists.
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Check if the fixtures directory exists.
 */
export function fixturesExist(): boolean {
  return fileExists(FIXTURES_DIR);
}

/**
 * Get all DOCX test files from the test_docx_files directory.
 *
 * @returns Array of DocxTestFile objects
 */
export function getDocxTestFiles(): DocxTestFile[] {
  if (!fileExists(TEST_DOCX_DIR)) {
    return [];
  }

  const files = fs.readdirSync(TEST_DOCX_DIR);
  const docxFiles = files.filter((f) => f.endsWith('.docx'));

  return docxFiles.map((name) => {
    const filePath = path.join(TEST_DOCX_DIR, name);
    return {
      name,
      stem: name.replace('.docx', ''),
      path: filePath,
      buffer: fs.readFileSync(filePath),
    };
  });
}

/**
 * Get all tagged test DOCX files from the tagged_tests directory.
 *
 * @returns Array of file names
 */
export function getTaggedTestFiles(): string[] {
  if (!fileExists(TAGGED_TESTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(TAGGED_TESTS_DIR);
  return files.filter((f) => f.endsWith('.docx'));
}

/**
 * Load a specific DOCX test file by name (without extension).
 *
 * @param name - File name without extension (e.g., 'comprehensive_docx_demo')
 * @returns Buffer containing file contents
 * @throws Error if file not found
 */
export function loadDocxFixture(name: string): Buffer {
  const fileName = name.endsWith('.docx') ? name : `${name}.docx`;
  const filePath = path.join(TEST_DOCX_DIR, fileName);

  if (!fileExists(filePath)) {
    throw new Error(`DOCX fixture not found: ${fileName}`);
  }

  return fs.readFileSync(filePath);
}

/**
 * Load a tagged test DOCX file.
 *
 * @param name - File name (e.g., 'formatting_tests.docx')
 * @returns Buffer containing file contents
 * @throws Error if file not found
 */
export function loadTaggedTestFile(name: string): Buffer {
  const fileName = name.endsWith('.docx') ? name : `${name}.docx`;
  const filePath = path.join(TAGGED_TESTS_DIR, fileName);

  if (!fileExists(filePath)) {
    throw new Error(`Tagged test file not found: ${fileName}`);
  }

  return fs.readFileSync(filePath);
}

/**
 * Load expected HTML output for a test file.
 *
 * @param stem - File stem (e.g., 'comprehensive_docx_demo')
 * @returns Expected HTML content or null if not found
 */
export function loadExpectedHtml(stem: string): string | null {
  const fileName = `${stem}-python.html`;
  const filePath = path.join(TEST_DOCX_DIR, fileName);

  if (!fileExists(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Load expected text output for a test file.
 *
 * @param stem - File stem (e.g., 'comprehensive_docx_demo')
 * @returns Expected text content or null if not found
 */
export function loadExpectedText(stem: string): string | null {
  const fileName = `${stem}-python.txt`;
  const filePath = path.join(TEST_DOCX_DIR, fileName);

  if (!fileExists(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Load expected HTML output for a tagged test file.
 *
 * @param stem - File stem (e.g., 'formatting_tests')
 * @returns Expected HTML content or null if not found
 */
export function loadTaggedTestExpectedHtml(stem: string): string | null {
  const fileName = `${stem}-python.html`;
  const filePath = path.join(TAGGED_TESTS_DIR, fileName);

  if (!fileExists(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Parse tagged test definitions from text content.
 *
 * Tagged tests follow the format:
 * ```
 * Test #N: {Test Name}
 * {Description}
 * Expected: {JSON object}
 *
 * [CONTENT]
 * ```
 *
 * @param textContent - Plain text content containing test definitions
 * @returns Array of parsed TaggedTest objects
 */
export function parseTaggedTests(textContent: string): TaggedTest[] {
  const tests: TaggedTest[] = [];

  // Match test definitions: "Test #N: Name"
  const testPattern = /Test #(\d+):\s*(.+?)(?:\n|$)([\s\S]*?)(?=Test #\d+:|$)/gi;

  let match;
  while ((match = testPattern.exec(textContent)) !== null) {
    const number = parseInt(match[1], 10);
    const name = match[2].trim();
    const body = match[3].trim();

    // Extract expected JSON from body
    let expected: Record<string, unknown> = {};
    const expectedMatch = body.match(/Expected:\s*(\{[\s\S]*?\})/i);
    if (expectedMatch) {
      try {
        expected = JSON.parse(expectedMatch[1]);
      } catch {
        // Invalid JSON, skip
      }
    }

    // Get description (everything before "Expected:")
    const descriptionMatch = body.match(/^([\s\S]*?)(?=Expected:|$)/i);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    tests.push({
      number,
      name,
      expected,
      description,
    });
  }

  return tests;
}

/**
 * Get absolute path to a file in the fixtures directory.
 *
 * @param relativePath - Path relative to fixtures directory
 * @returns Absolute path
 */
export function getFixturePath(relativePath: string): string {
  return path.join(FIXTURES_DIR, relativePath);
}

/**
 * Get the fixtures directory path.
 */
export function getFixturesDir(): string {
  return FIXTURES_DIR;
}

/**
 * Get the test DOCX files directory path.
 */
export function getTestDocxDir(): string {
  return TEST_DOCX_DIR;
}

/**
 * Get the tagged tests directory path.
 */
export function getTaggedTestsDir(): string {
  return TAGGED_TESTS_DIR;
}
