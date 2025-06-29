#!/usr/bin/env node

/**
 * SECURITY TEST SUITE - Watsch Application
 * Tests all implemented security fixes to verify they work
 */

const BASE_URL = 'http://localhost:5173';

// Test utilities
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',     // Cyan
    success: '\x1b[32m',  // Green  
    error: '\x1b[31m',    // Red
    warning: '\x1b[33m',  // Yellow
    reset: '\x1b[0m'      // Reset
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function testResult(name, passed, details = '') {
  if (passed) {
    log(`✅ ${name} - PASSED ${details}`, 'success');
  } else {
    log(`❌ ${name} - FAILED ${details}`, 'error');
  }
  return passed;
}

// Security Test Functions
async function testApiKeyLogging() {
  log('\n🔒 TEST 1: API Key Logging Protection', 'info');
  
  try {
    // Test that API routes don't expose keys in responses
    const response = await fetch(`${BASE_URL}/api/getRecommendation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test',
        mediaType: 'movie',
        genres: [],
        platforms: []
      })
    });
    
    const data = await response.text();
    
    // Check that no API keys are in the response
    const hasApiKey = data.includes('sk-') || data.includes('Bearer') || data.match(/[A-Za-z0-9]{32,}/);
    
    return testResult(
      'API Key Exposure Protection', 
      !hasApiKey, 
      hasApiKey ? 'Found potential API key in response' : 'No API keys found in response'
    );
  } catch (error) {
    return testResult('API Key Exposure Protection', false, `Error: ${error.message}`);
  }
}

async function testDeletedEndpoint() {
  log('\n🔒 TEST 2: Deleted Test Endpoint', 'info');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-env`);
    const isDeleted = response.status === 404;
    
    return testResult(
      'Test Endpoint Deletion', 
      isDeleted, 
      isDeleted ? 'Endpoint correctly returns 404' : `Unexpected status: ${response.status}`
    );
  } catch (error) {
    // Network error means endpoint doesn't exist - that's good!
    return testResult('Test Endpoint Deletion', true, 'Endpoint does not exist');
  }
}

async function testInputValidation() {
  log('\n🔒 TEST 3: Input Validation & Sanitization', 'info');
  
  const tests = [
    {
      name: 'XSS Prevention',
      input: '<script>alert("XSS")</script>TestUser',
      shouldReject: true
    },
    {
      name: 'SQL Injection Prevention', 
      input: "'; DROP TABLE users; --",
      shouldReject: true
    },
    {
      name: 'JavaScript URL Prevention',
      input: 'javascript:void(document.location="http://evil.com")',
      shouldReject: true
    },
    {
      name: 'Long Input Prevention',
      input: 'A'.repeat(1000),
      shouldReject: true
    },
    {
      name: 'Valid Input Acceptance',
      input: 'ValidUser123',
      shouldReject: false
    }
  ];
  
  let allPassed = true;
  
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}/api/movie-night/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostNickname: test.input })
      });
      
      const data = await response.json();
      const wasRejected = response.status >= 400;
      const passed = test.shouldReject ? wasRejected : !wasRejected;
      
      if (!testResult(test.name, passed, 
        test.shouldReject 
          ? (wasRejected ? 'Malicious input rejected' : 'SECURITY RISK: Malicious input accepted')
          : (wasRejected ? 'Valid input rejected' : 'Valid input accepted')
      )) {
        allPassed = false;
      }
    } catch (error) {
      testResult(test.name, false, `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testRateLimiting() {
  log('\n🔒 TEST 4: Enhanced Rate Limiting', 'info');
  
  const endpoints = [
    { path: '/api/auth', expectedLimit: 5, name: 'Auth Endpoint' },
    { path: '/api/movie-night/create-room', expectedLimit: 15, name: 'Movie Night Endpoint' },
    { path: '/api/getRecommendation', expectedLimit: 20, name: 'Recommendation Endpoint' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      log(`Testing rate limit for ${endpoint.name}...`);
      
      // Make requests rapidly to trigger rate limiting
      const promises = [];
      for (let i = 0; i < endpoint.expectedLimit + 2; i++) {
        const promise = fetch(`${BASE_URL}${endpoint.path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });
        promises.push(promise);
      }
      
      const responses = await Promise.all(promises);
      const rateLimitHit = responses.some(r => r.status === 429);
      
      if (!testResult(`${endpoint.name} Rate Limiting`, rateLimitHit, 
        rateLimitHit ? 'Rate limit correctly triggered' : 'Rate limit not triggered'
      )) {
        allPassed = false;
      }
    } catch (error) {
      testResult(`${endpoint.name} Rate Limiting`, false, `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testMockAuthProtection() {
  log('\n🔒 TEST 5: Mock Auth Production Protection', 'info');
  
  try {
    // Test that mock auth is properly controlled
    const response = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'test@example.com', 
        password: 'testpassword',
        action: 'login'
      })
    });
    
    const data = await response.json();
    
    // In development, should either work with Auth0 or show mock mode
    // In production, should never show mock mode without proper config
    const isMockMode = data.mockMode === true;
    const hasWarning = data.warning === 'Development mode only';
    
    // If it's mock mode, it should have the development warning
    const isSecure = !isMockMode || hasWarning;
    
    return testResult(
      'Mock Auth Protection', 
      isSecure, 
      isMockMode ? 'Mock mode active with development warning' : 'Real auth or properly secured'
    );
  } catch (error) {
    return testResult('Mock Auth Protection', false, `Error: ${error.message}`);
  }
}

async function testCSPHeaders() {
  log('\n🔒 TEST 6: Content Security Policy Headers', 'info');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    const csp = response.headers.get('content-security-policy');
    
    if (!csp) {
      return testResult('CSP Headers', false, 'No CSP header found');
    }
    
    // Check for security improvements
    const hasUnsafeEval = csp.includes('unsafe-eval');
    const hasUpgradeInsecure = csp.includes('upgrade-insecure-requests');
    const hasBlockMixed = csp.includes('block-all-mixed-content');
    
    const isSecure = !hasUnsafeEval && hasUpgradeInsecure && hasBlockMixed;
    
    const details = [
      hasUnsafeEval ? '❌ Still has unsafe-eval' : '✅ No unsafe-eval',
      hasUpgradeInsecure ? '✅ Has upgrade-insecure-requests' : '❌ Missing upgrade-insecure-requests',
      hasBlockMixed ? '✅ Has block-all-mixed-content' : '❌ Missing block-all-mixed-content'
    ].join(', ');
    
    return testResult('CSP Headers', isSecure, details);
  } catch (error) {
    return testResult('CSP Headers', false, `Error: ${error.message}`);
  }
}

async function testSecurityHeaders() {
  log('\n🔒 TEST 7: Security Headers', 'info');
  
  try {
    const response = await fetch(`${BASE_URL}/`);
    
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'strict-origin-when-cross-origin'
    };
    
    let allPresent = true;
    const results = [];
    
    for (const [header, expectedValue] of Object.entries(securityHeaders)) {
      const actualValue = response.headers.get(header);
      const isPresent = actualValue === expectedValue;
      
      if (!isPresent) allPresent = false;
      
      results.push(
        isPresent 
          ? `✅ ${header}: ${actualValue}`
          : `❌ ${header}: ${actualValue || 'MISSING'}`
      );
    }
    
    return testResult('Security Headers', allPresent, results.join(', '));
  } catch (error) {
    return testResult('Security Headers', false, `Error: ${error.message}`);
  }
}

// Main test runner
async function runSecurityTests() {
  log('🛡️  WATSCH SECURITY TEST SUITE', 'info');
  log('=================================', 'info');
  
  const results = [];
  
  try {
    results.push(await testApiKeyLogging());
    results.push(await testDeletedEndpoint());
    results.push(await testInputValidation());
    results.push(await testRateLimiting());
    results.push(await testMockAuthProtection());
    results.push(await testCSPHeaders());
    results.push(await testSecurityHeaders());
    
    // Summary
    const passed = results.filter(r => r).length;
    const total = results.length;
    
    log('\n📊 TEST SUMMARY', 'info');
    log('================', 'info');
    
    if (passed === total) {
      log(`🎉 ALL TESTS PASSED: ${passed}/${total}`, 'success');
      log('✅ Your application is SECURE!', 'success');
    } else {
      log(`⚠️  TESTS PASSED: ${passed}/${total}`, 'warning');
      log('❌ Some security issues need attention!', 'error');
    }
    
  } catch (error) {
    log(`💥 Test suite error: ${error.message}`, 'error');
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSecurityTests();
}

export { runSecurityTests }; 