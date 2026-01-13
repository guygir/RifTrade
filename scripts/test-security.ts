/**
 * Security Test Script
 * Tests the validation functions (works in Node.js)
 * Note: DOMPurify sanitization functions require a browser environment
 * and will be tested manually in the browser
 * 
 * Run with: npx tsx scripts/test-security.ts
 */

import { validateUsernameFromUrl } from '../lib/validate-username';

console.log('🔒 Security Functions Test (Node.js Compatible)');
console.log('='.repeat(60));
console.log('Note: DOMPurify functions require browser environment');
console.log('      See SECURITY_TESTING_GUIDE.md for manual browser testing\n');

// Test 1: Username Validation from URL
console.log('1. Testing Username Validation (URL Parameter)');
console.log('-'.repeat(60));

const usernameTests = [
  { input: 'validusername', shouldPass: true, description: 'Valid username' },
  { input: '../../../admin', shouldPass: false, description: 'Path traversal' },
  { input: 'username<script>alert("XSS")</script>', shouldPass: false, description: 'XSS attempt' },
  { input: 'username%2F..%2Ftest', shouldPass: false, description: 'URL-encoded path traversal' },
  { input: 'ab', shouldPass: false, description: 'Too short (2 chars)' },
  { input: 'a'.repeat(100), shouldPass: false, description: 'Too long (100 chars)' },
  { input: 'valid-username_123', shouldPass: true, description: 'Valid with hyphens and underscores' },
  { input: 'username%00', shouldPass: false, description: 'Null byte' },
  { input: 'user name', shouldPass: false, description: 'Space (invalid)' },
  { input: 'user%2ename', shouldPass: false, description: 'URL-encoded dot' },
  { input: 'user/name', shouldPass: false, description: 'Forward slash' },
  { input: 'user\\name', shouldPass: false, description: 'Backslash' },
];

let passed = 0;
let failed = 0;

usernameTests.forEach(test => {
  const result = validateUsernameFromUrl(test.input);
  const passedTest = (test.shouldPass && result.valid) || (!test.shouldPass && !result.valid);
  
  if (passedTest) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test: ${test.description}`);
  console.log(`  Input:  ${test.input.substring(0, 50)}${test.input.length > 50 ? '...' : ''}`);
  console.log(`  Expected: ${test.shouldPass ? 'VALID' : 'INVALID'}`);
  console.log(`  Got:      ${result.valid ? 'VALID' : 'INVALID'}`);
  if (!result.valid && result.error) {
    console.log(`  Error:    ${result.error}`);
  }
  if (result.valid && result.sanitized) {
    console.log(`  Output:   ${result.sanitized}`);
  }
  console.log(`  Result:   ${passedTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});

// Test 2: Edge Cases
console.log('\n2. Testing Edge Cases');
console.log('-'.repeat(60));

const edgeCases = [
  { input: null, description: 'Null input' },
  { input: undefined, description: 'Undefined input' },
  { input: '', description: 'Empty string' },
  { input: ['array'], description: 'Array input (should fail)' },
  { input: 'abc', description: 'Minimum length (3 chars)' },
  { input: 'a'.repeat(30), description: 'Maximum length (30 chars)' },
  { input: 'a'.repeat(31), description: 'Over maximum length (31 chars)' },
];

edgeCases.forEach(test => {
  const result = validateUsernameFromUrl(test.input as any);
  console.log(`Test: ${test.description}`);
  console.log(`  Input:  ${JSON.stringify(test.input)}`);
  console.log(`  Valid:  ${result.valid ? '✅' : '❌'}`);
  if (!result.valid && result.error) {
    console.log(`  Error:  ${result.error}`);
  }
  if (result.valid && result.sanitized) {
    console.log(`  Output: ${result.sanitized}`);
  }
  console.log('');
});

// Summary
console.log('='.repeat(60));
console.log('\n📊 Test Summary:');
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ All validation tests passed!');
} else {
  console.log('\n❌ Some tests failed. Please review the implementation.');
}

console.log('\n📝 Next Steps:');
console.log('   1. Test DOMPurify sanitization in browser (see SECURITY_TESTING_GUIDE.md)');
console.log('   2. Manually test XSS attacks in the application');
console.log('   3. Test path traversal attempts via URL');
console.log('   4. Verify security headers in browser DevTools');
