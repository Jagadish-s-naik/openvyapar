import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5175;

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`✍️ OpenVyapar CSC Onboarding UI running at http://localhost:${PORT}`);
});
