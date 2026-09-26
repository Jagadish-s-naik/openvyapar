import { createApp } from './app.js';
import { seedDatabase } from './db/seed.js';
import { config } from './config.js';

const PORT = config.port;

// Auto-seed if database is empty
seedDatabase();

const app = createApp();

app.listen(PORT, () => {
  const aiProvider = process.env.GROQ_API_KEY ? `Groq (${process.env.GROQ_MODEL || 'openai/gpt-oss-20b'})` : (process.env.OPENAI_API_KEY ? `OpenAI (${process.env.OPENAI_MODEL || 'gpt-4o-mini'})` : 'Deterministic Fallback');
  console.log(`🚀 OpenVyapar Backend API listening on port ${PORT}`);
  console.log(`🧠 AI Engine:    ${aiProvider}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Businesses:   http://localhost:${PORT}/business`);
  console.log(`📍 Credentials:  http://localhost:${PORT}/credentials/did:biz:sharma001`);
  console.log(`📍 Delegations:  http://localhost:${PORT}/delegation/did:biz:sharma001`);
  console.log(`📍 Audit Log:    http://localhost:${PORT}/audit/did:biz:sharma001`);
});
