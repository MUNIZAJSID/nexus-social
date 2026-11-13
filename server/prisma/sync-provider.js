const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const serverRoot = path.resolve(__dirname, '..');
const envPath = path.join(serverRoot, '.env');
const schemaPath = path.join(__dirname, 'schema.prisma');

if (!process.env.DATABASE_URL && !fs.existsSync(envPath)) {
  fs.writeFileSync(
    envPath,
    'DATABASE_URL="file:./localsocial.db"\nJWT_SECRET="nexus_secret_jwt_2026"\nPORT=5000\nHOST="0.0.0.0"\n'
  );
}

let dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match) dbUrl = match[1].trim();
}

const targetProvider = /^postgres(ql)?:\/\//i.test(dbUrl) ? 'postgresql' : 'sqlite';
const schema = fs.readFileSync(schemaPath, 'utf8');
const updated = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${targetProvider}"`
);

if (updated !== schema) {
  fs.writeFileSync(schemaPath, updated, 'utf8');
  console.log(`[sync-provider] schema.prisma provider -> ${targetProvider}`);
  if (process.argv.includes('--generate')) {
    execSync('npx prisma generate --schema=prisma/schema.prisma', {
      cwd: serverRoot,
      stdio: 'inherit',
    });
  }
}
