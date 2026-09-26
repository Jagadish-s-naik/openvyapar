import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;

const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback for all React Router paths
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`💼 OpenVyapar Unified Dashboard running at http://localhost:${PORT}`);
});
