import { LocalDB } from './lib/db';

async function main() {
  const db = new LocalDB();
  await db.init();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
