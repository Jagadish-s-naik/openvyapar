import { initDatabase } from '../backend/dist/src/db/connection.js';
import { seedDatabase } from '../backend/dist/src/db/seed.js';

console.log('🚀 Resetting & Seeding Demo State for OpenVyapar 5-Beat Demo Narrative...');

async function runSeed() {
  await initDatabase();
  await seedDatabase();
  console.log('✅ Demo state is ready!');
  console.log('📍 Owner Wallet:    http://localhost:5173');
  console.log('📍 Verifier Portal:  http://localhost:5173/verifier');
  console.log('📍 CSC Onboarding:   http://localhost:5173/onboarding');
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
