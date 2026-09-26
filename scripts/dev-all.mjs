#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const SERVICES = [
  { name: 'BACKEND', cwd: path.join(rootDir, 'backend'), cmd: 'node', args: ['dist/server.js'], color: '\x1b[36m' }, // Cyan
  { name: 'AGENT  ', cwd: path.join(rootDir, 'agent-service'), cmd: 'node', args: ['dist/server.js'], color: '\x1b[35m' }, // Magenta
  { name: 'WALLET ', cwd: path.join(rootDir, 'frontend-wallet'), cmd: 'node', args: ['server.js'], color: '\x1b[34m' }, // Blue
  { name: 'VERIFY ', cwd: path.join(rootDir, 'frontend-verifier'), cmd: 'node', args: ['server.js'], color: '\x1b[33m' }, // Yellow
  { name: 'ONBOARD', cwd: path.join(rootDir, 'frontend-onboarding'), cmd: 'node', args: ['server.js'], color: '\x1b[32m' }, // Green
];

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}🚀 Starting OpenVyapar All-in-One Micro-Services...${RESET}\n`);
console.log(`  💼 Owner Wallet:    http://localhost:5173`);
console.log(`  🔍 Verifier Portal:  http://localhost:5174`);
console.log(`  ✍️ CSC Onboarding:   http://localhost:5175`);
console.log(`  ⚙️ Backend API:     http://localhost:3001`);
console.log(`  🤖 Agent Service:   http://localhost:3002`);
console.log(`\nPress Ctrl+C to stop all services.\n${'-'.repeat(60)}\n`);

const processes = [];

for (const svc of SERVICES) {
  const proc = spawn(svc.cmd, svc.args, {
    cwd: svc.cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const prefix = `${svc.color}[${svc.name}]${RESET} `;

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`${prefix}${line}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`${prefix}\x1b[31m${line}${RESET}`);
    }
  });

  processes.push(proc);
}

function shutdown() {
  console.log(`\n${BOLD}🛑 Stopping all OpenVyapar services...${RESET}`);
  for (const proc of processes) {
    try {
      proc.kill('SIGTERM');
    } catch {}
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
