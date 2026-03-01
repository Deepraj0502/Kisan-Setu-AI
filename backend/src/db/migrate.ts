import { getPool } from "./client";
import "dotenv/config";

async function run() {
  const pool = getPool();
  console.log("Running pgvector migration...");

  // Ensure extension is available for RAG embeddings
  await pool.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

  console.log("pgvector extension ensured.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed", err);
  process.exit(1);
});

