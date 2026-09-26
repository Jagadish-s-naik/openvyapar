import {
  mockBusinesses,
  mockCredentials,
  mockPersonas,
  mockDelegationTokens,
  mockProofShares,
  mockAuditLogs,
  ISSUER_REGISTRY,
  DELEGATION_SCOPES,
  SUPPORTED_LANGUAGES,
} from './dist/index.js';

console.log('✅ @openvyapar/shared verification test:');
console.log(`- Loaded ${mockPersonas.length} Personas`);
console.log(`- Loaded ${mockBusinesses.length} Businesses (e.g. ${mockBusinesses[0].name})`);
console.log(`- Loaded ${mockCredentials.length} Credentials`);
console.log(`- Loaded ${mockDelegationTokens.length} Delegation Tokens`);
console.log(`- Loaded ${mockProofShares.length} Proof Shares`);
console.log(`- Loaded ${mockAuditLogs.length} Audit Logs`);
console.log(`- Loaded ${Object.keys(ISSUER_REGISTRY).length} Mock Issuers`);
console.log(`- Loaded ${Object.keys(DELEGATION_SCOPES).length} Delegation Scopes`);
console.log(`- Loaded ${SUPPORTED_LANGUAGES.length} Supported Languages`);
