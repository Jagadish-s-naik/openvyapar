import { seedDatabase } from '../backend/dist/db/seed.js';

console.log('🚀 Resetting & Seeding Demo State for OpenVyapar 5-Beat Demo Narrative...');
seedDatabase();
console.log('✅ Demo state is ready!');
console.log('📍 Owner Wallet:    http://localhost:5173');
console.log('📍 Verifier Portal:  http://localhost:5174');
console.log('📍 CSC Onboarding:   http://localhost:5175');
