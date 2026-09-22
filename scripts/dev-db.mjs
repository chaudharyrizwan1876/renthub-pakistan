// Local development Postgres (no Docker needed). Usage: npm run db:local
import EmbeddedPostgres from "embedded-postgres";
import fs from "node:fs";

const dataDir = "./.pgdata";
const port = Number(process.env.PGLOCAL_PORT || 5433);
const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

if (!fs.existsSync(`${dataDir}/PG_VERSION`)) await pg.initialise();
await pg.start();
try { await pg.createDatabase("rentals"); } catch { /* already exists */ }
console.log(`Postgres ready: postgresql://postgres:postgres@localhost:${port}/rentals`);

const stop = async () => { await pg.stop(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
setInterval(() => {}, 1 << 30);
