import { seedDatabase } from '../backend/dist/src/db/seed.js';

console.log('🚀 Resetting & Seeding Demo State for OpenVyapar 5-Beat Demo Narrative...');
seedDatabase();
console.log('✅ Demo state is ready!');
console.log('📍 Owner Wallet:    http://localhost:5173');
console.log('📍 Verifier Portal:  http://localhost:5173/verifier');
console.log('📍 CSC Onboarding:   http://localhost:5173/onboarding');

