#!/usr/bin/env node

/**
 * Run all backend tests
 * Usage: node run-all-tests.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.startsWith('test-') && file.endsWith('.js'))
  .sort();

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║           MIRA Backend Test Suite                              ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log(`Found ${testFiles.length} test files\n`);

let passed = 0;
let failed = 0;

testFiles.forEach((file, index) => {
  console.log(`\n[${ index + 1}/${testFiles.length}] Running: ${file}`);
  console.log('─'.repeat(70));
  
  try {
    execSync(`node "${path.join(testsDir, file)}"`, {
      stdio: 'inherit',
      cwd: testsDir
    });
    passed++;
    console.log(`✅ PASSED: ${file}`);
  } catch (error) {
    failed++;
    console.log(`❌ FAILED: ${file}`);
  }
});

console.log('\n' + '═'.repeat(70));
console.log('TEST SUMMARY');
console.log('═'.repeat(70));
console.log(`Total:  ${testFiles.length}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log('═'.repeat(70));

if (failed > 0) {
  process.exit(1);
}
