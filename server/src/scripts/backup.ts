import { STORAGE_PATHS } from '../services/storage.service';
import { createZipBackup } from '../utils/dbBackup';

async function runCliBackup() {
  console.log('📦 Iniciando processo de backup local do LocalSocial...');
  const backup = await createZipBackup();

  if (backup.dbPath) {
    console.log(` -> Banco SQLite adicionado (${backup.dbPath})`);
  } else {
    console.log(' -> Banco SQLite não encontrado; snapshot JSON exportado (database/snapshot.json).');
  }

  if (backup.storageIncluded) {
    console.log(` -> Pasta de mídias /storage adicionada (${STORAGE_PATHS.root})`);
  }

  console.log('\n========================================================');
  console.log('✅ BACKUP LOCAL CONCLUÍDO COM SUCESSO!');
  console.log(`📁 Arquivo gerado: ${backup.filePath}`);
  console.log(`📊 Tamanho total: ${backup.size}`);
  console.log('========================================================\n');
}

runCliBackup().catch((err) => {
  console.error('❌ Erro durante o backup:', err);
  process.exit(1);
});
