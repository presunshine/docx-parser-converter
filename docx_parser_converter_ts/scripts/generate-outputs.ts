/**
 * Generate HTML and text outputs for all DOCX fixtures.
 *
 * This script processes all DOCX files in the fixtures directory and generates
 * corresponding -ts.html and -ts.txt output files.
 *
 * Usage: npx tsx scripts/generate-outputs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { docxToHtml, docxToText } from '../src/api';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories containing DOCX files
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures');
const TEST_DOCX_DIR = path.join(FIXTURES_DIR, 'test_docx_files');
const TAGGED_TESTS_DIR = path.join(FIXTURES_DIR, 'tagged_tests');

/**
 * Get all DOCX files from a directory.
 */
function getDocxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return [];
  }

  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.docx'))
    .map(file => path.join(dir, file));
}

/**
 * Generate outputs for a single DOCX file.
 */
async function generateOutputs(docxPath: string): Promise<void> {
  const baseName = path.basename(docxPath, '.docx');
  const dir = path.dirname(docxPath);

  const htmlPath = path.join(dir, `${baseName}-ts.html`);
  const txtPath = path.join(dir, `${baseName}-ts.txt`);

  console.log(`Processing: ${baseName}.docx`);

  try {
    // Read the DOCX file as Uint8Array (more compatible with JSZip)
    const buffer = fs.readFileSync(docxPath);
    const uint8Array = new Uint8Array(buffer);

    // Convert to HTML
    const html = await docxToHtml(uint8Array);
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`  Created: ${baseName}-ts.html`);

    // Convert to text
    const text = await docxToText(uint8Array);
    fs.writeFileSync(txtPath, text, 'utf-8');
    console.log(`  Created: ${baseName}-ts.txt`);

  } catch (error) {
    console.error(`  Error processing ${baseName}.docx:`, error);
  }
}

/**
 * Main function.
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Generating TypeScript outputs for DOCX fixtures');
  console.log('='.repeat(60));
  console.log();

  // Collect all DOCX files
  const testDocxFiles = getDocxFiles(TEST_DOCX_DIR);
  const taggedTestFiles = getDocxFiles(TAGGED_TESTS_DIR);
  const allFiles = [...testDocxFiles, ...taggedTestFiles];

  console.log(`Found ${testDocxFiles.length} files in test_docx_files/`);
  console.log(`Found ${taggedTestFiles.length} files in tagged_tests/`);
  console.log(`Total: ${allFiles.length} DOCX files`);
  console.log();

  // Process each file
  for (const docxPath of allFiles) {
    await generateOutputs(docxPath);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('Done!');
  console.log('='.repeat(60));
}

// Run
main().catch(console.error);
