import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist', 'assets');
const MAX_BYTES = 3_000_000;

const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

if (!fs.existsSync(DIST_DIR)) {
  console.error('bundle-watchdog: dist/assets not found. Run build first.');
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR);
const mainCandidates = files.filter((file) => file.startsWith('index-') && file.endsWith('.js'));

if (mainCandidates.length === 0) {
  console.error('bundle-watchdog: main chunk not found.');
  process.exit(1);
}

const mainFile = mainCandidates[0];
const mainPath = path.join(DIST_DIR, mainFile);
const mainSize = fs.statSync(mainPath).size;

console.log(`bundle-watchdog: main=${mainFile} size=${formatBytes(mainSize)} limit=${formatBytes(MAX_BYTES)}`);

if (mainSize > MAX_BYTES) {
  console.error('bundle-watchdog: main chunk exceeds threshold.');
  process.exit(1);
}
