import { createApp } from './app.js';
import { seedDatabase } from './db/seed.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

// Auto-seed if database is empty
seedDatabase();

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 OpenVyapar Backend API listening on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Businesses:   http://localhost:${PORT}/business`);
  console.log(`📍 Credentials:  http://localhost:${PORT}/credentials/did:biz:sharma001`);
  console.log(`📍 Delegations:  http://localhost:${PORT}/delegation/did:biz:sharma001`);
  console.log(`📍 Audit Log:    http://localhost:${PORT}/audit/did:biz:sharma001`);
});
