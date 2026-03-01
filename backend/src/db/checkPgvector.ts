import { getPool } from "./client";

async function run() {
  const pool = getPool();
  console.log("Checking pgvector extension...");

  const res = await pool.query(
    `SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';`
  );

  if (res.rows.length === 0) {
    console.log("pgvector is NOT installed. Run: npm run migrate:db");
  } else {
    console.log("pgvector is installed:", res.rows[0]);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Check failed", err);
  process.exit(1);
});

