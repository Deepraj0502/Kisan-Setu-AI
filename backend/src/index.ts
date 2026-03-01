import { getPool } from "./db/client";

async function main() {
  const pool = getPool();
  const now = await pool.query("SELECT NOW()");
  console.log("Connected to PostgreSQL at:", now.rows[0].now);

  // This is where Agri-OS agentic orchestration endpoints / handlers will be added.
}

main().catch((err) => {
  console.error("Startup failed", err);
  process.exit(1);
});

