import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { getMongoStatus, connectMongo, disconnectMongo } from '../src/db/mongo.js';

console.log('🧪 Testing MongoDB Connection Lifecycle & Diagnostics...');

// Test 1: Config properties are set with defaults
assert.ok(config.mongodb, 'config.mongodb should exist');
assert.ok(typeof config.mongodb.uri === 'string', 'config.mongodb.uri should be a string');
assert.ok(typeof config.mongodb.maxPoolSize === 'number', 'config.mongodb.maxPoolSize should be a number');
assert.ok(typeof config.mongodb.serverSelectionTimeoutMS === 'number', 'config.mongodb.serverSelectionTimeoutMS should be a number');
console.log('✅ 1. MongoDB config properties verified.');

// Test 2: Initial Status when not connected
const initialStatus = getMongoStatus();
assert.equal(initialStatus.readyState, 0, 'Initial readyState should be 0 (disconnected)');
assert.equal(initialStatus.connected, false, 'Initial connected state should be false');
assert.equal(initialStatus.stateDescription, 'disconnected');
console.log('✅ 2. Initial disconnected status correctly reported.');

// Test 3: Attempt connection or gracefully handle unavailable host
async function runConnectivityTest() {
  try {
    // Short timeout test to ensure graceful error handling on unreachable port
    const testTimeoutUri = 'mongodb://127.0.0.1:27999/openvyapar_test_unreachable';
    await connectMongo(testTimeoutUri);
  } catch (err: unknown) {
    console.log('ℹ️  Unreachable MongoDB correctly threw error as expected:', (err as Error).name);
  } finally {
    await disconnectMongo();
    const finalStatus = getMongoStatus();
    assert.equal(finalStatus.connected, false);
    console.log('✅ 3. Disconnect and error lifecycle handled cleanly.');
  }

  console.log('\n🎉 Step 1 MongoDB Foundation verification passed successfully!\n');
}

runConnectivityTest();
