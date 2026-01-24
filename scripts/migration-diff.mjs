import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const remoteFileIndex = args.indexOf('--remote-file');
const writePlaceholders = args.includes('--write-placeholders');

if (remoteFileIndex === -1 || !args[remoteFileIndex + 1]) {
  console.error('Usage: node scripts/migration-diff.mjs --remote-file <path> [--write-placeholders]');
  process.exit(1);
}

const remoteFilePath = path.resolve(process.cwd(), args[remoteFileIndex + 1]);
const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');

const readLines = (filePath) =>
  fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

const listLocalVersions = (dir) =>
  fs.readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .map((name) => path.basename(name, '.sql'))
    .sort();

if (!fs.existsSync(remoteFilePath)) {
  console.error(`Remote file not found: ${remoteFilePath}`);
  process.exit(1);
}

if (!fs.existsSync(migrationsDir)) {
  console.error(`Migrations dir not found: ${migrationsDir}`);
  process.exit(1);
}

const remoteVersions = readLines(remoteFilePath).sort();
const localVersions = listLocalVersions(migrationsDir);

const remoteSet = new Set(remoteVersions);
const localSet = new Set(localVersions);

const missingOnLocal = remoteVersions.filter((version) => !localSet.has(version));
const extraOnLocal = localVersions.filter((version) => !remoteSet.has(version));

const output = {
  missing_on_local: missingOnLocal,
  extra_on_local: extraOnLocal,
};

console.log(JSON.stringify(output, null, 2));

if (writePlaceholders && missingOnLocal.length > 0) {
  for (const version of missingOnLocal) {
    const filePath = path.join(migrationsDir, `${version}.sql`);
    if (fs.existsSync(filePath)) {
      continue;
    }
    const contents = `-- noop placeholder to align migration history with remote\n-- remote already has this version recorded in supabase_migrations.schema_migrations\n`;
    fs.writeFileSync(filePath, contents, 'utf8');
    console.log(`created placeholder: ${filePath}`);
  }
}
