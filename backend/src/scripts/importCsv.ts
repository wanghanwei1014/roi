import 'dotenv/config';
import path from 'path';
import { initDatabase } from '../config/database';
import { importCsvFile } from '../services/importService';

async function main() {
  const csvPath = process.argv[2] || path.resolve(__dirname, '../../../app_roi_data.csv');
  console.log(`Initializing database...`);
  await initDatabase();
  console.log(`Importing CSV from: ${csvPath}`);
  const result = await importCsvFile(csvPath);
  console.log(`Import complete: ${result.imported} records imported`);
  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
