import { createAgentApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 3002;
const app = createAgentApp();

app.listen(PORT, () => {
  console.log(`🤖 OpenVyapar Agent Service listening on port ${PORT}`);
  console.log(`📍 Health:            http://localhost:${PORT}/health`);
  console.log(`📍 Onboard Extract:   POST http://localhost:${PORT}/agent/onboard-extract`);
  console.log(`📍 Consent Explain:   POST http://localhost:${PORT}/agent/consent-explain`);
  console.log(`📍 Scope Suggest:     POST http://localhost:${PORT}/agent/scope-suggest`);
  console.log(`📍 Verifier Flags:    POST http://localhost:${PORT}/agent/verifier-flag`);
});
