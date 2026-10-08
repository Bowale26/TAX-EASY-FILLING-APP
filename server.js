// server.js wrapper to execute server.ts directly or dist/server.cjs
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const distServer = path.join(process.cwd(), 'dist', 'server.cjs');

if (fs.existsSync(distServer)) {
  import('./dist/server.cjs');
} else {
  // Run with tsx
  const child = spawn('npx', ['tsx', 'server.ts'], {
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
