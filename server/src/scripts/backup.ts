import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { STORAGE_PATHS } from '../services/storage.service';

async function runCliBackup() {
  console.log('📦 Iniciando processo de backup local do LocalSocial...');

  if (!fs.existsSync(STORAGE_PATHS.backups)) {
    fs.mkdirSync(STORAGE_PATHS.backups, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const backupFileName = `localsocial_backup_${timestamp}.zip`;
  const backupFilePath = path.join(STORAGE_PATHS.backups, backupFileName);

  const output = fs.createWriteStream(backupFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    const stats = fs.statSync(backupFilePath);
    console.log('\n========================================================');
    console.log('✅ BACKUP LOCAL CONCLUÍDO COM SUCESSO!');
    console.log(`📁 Arquivo gerado: ${backupFilePath}`);
    console.log(`📊 Tamanho total: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    console.log('========================================================\n');
  });

  archive.on('error', (err) => {
    console.error('❌ Erro durante o backup:', err);
    process.exit(1);
  });

  archive.pipe(output);

  // Arquivo do banco
  const dbPaths = [
    path.resolve(process.cwd(), 'localsocial.db'),
    path.resolve(process.cwd(), 'server/localsocial.db'),
  ];

  let dbIncluded = false;
  for (const dbp of dbPaths) {
    if (fs.existsSync(dbp)) {
      archive.file(dbp, { name: 'database/localsocial.db' });
      dbIncluded = true;
      console.log(` -> Banco SQLite adicionado (${dbp})`);
      break;
    }
  }

  if (!dbIncluded) {
    console.warn(' ⚠️ Aviso: Arquivo localsocial.db não encontrado no diretório padrão.');
  }

  // Pasta de armazenamento
  if (fs.existsSync(STORAGE_PATHS.root)) {
    archive.directory(STORAGE_PATHS.root, 'storage');
    console.log(` -> Pasta de mídias /storage adicionada (${STORAGE_PATHS.root})`);
  }

  await archive.finalize();
}

runCliBackup().catch(console.error);
