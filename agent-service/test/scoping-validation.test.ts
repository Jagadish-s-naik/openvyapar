import { filterValidScopes, FIXED_DELEGATION_SCOPES } from '../src/engine/scoping.js';

async function runScopingValidationTests() {
  console.log('🧪 Running Scoping Engine Scope Filter Unit Tests...');

  // Test: Direct unit test with invalid / hallucinated scopes from model output
  const rawModelScopes = ['file_returns', 'view_compliance', 'delete_everything'];
  console.log('Input raw model scopes:', rawModelScopes);

  const filtered = filterValidScopes(rawModelScopes);
  console.log('Filtered scopes:', filtered);

  // Assertions
  if (!filtered.includes('file_returns')) {
    throw new Error('Assertion failed: Expected "file_returns" to be preserved in filtered scopes');
  }
  if (filtered.includes('view_compliance' as any)) {
    throw new Error('Assertion failed: Expected "view_compliance" to be DROPPED from filtered scopes');
  }
  if (filtered.includes('delete_everything' as any)) {
    throw new Error('Assertion failed: Expected "delete_everything" to be DROPPED from filtered scopes');
  }

  // Assert every item in filtered is part of FIXED_DELEGATION_SCOPES
  for (const scope of filtered) {
    if (!(FIXED_DELEGATION_SCOPES as readonly string[]).includes(scope)) {
      throw new Error(`Assertion failed: Scope "${scope}" is not in FIXED_DELEGATION_SCOPES`);
    }
  }

  console.log('✅ Unit test PASSED: Invalid scopes were successfully filtered out.');
  console.log('\n🎉 ALL SCOPING ENUM VALIDATION TESTS PASSED CLEANLY!\n');
}

runScopingValidationTests().catch((err) => {
  console.error('❌ Scoping validation test failed:', err);
  process.exit(1);
});
