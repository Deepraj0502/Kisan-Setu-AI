import { Pool } from "pg";
import { getDbConfig } from "../config/env";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const cfg = getDbConfig();
    pool = new Pool({
      host: cfg.host,
      port: cfg.port,
      database: cfg.database,
      user: cfg.user,
      password: cfg.password,
      ssl: cfg.ssl
    });
  }
  return pool;
}

export async function withConnection<T>(
  fn: (client: Pool) => Promise<T>
): Promise<T> {
  const p = getPool();
  try {
    return await fn(p);
  } finally {
    // In Lambda we typically keep connections warmed; no pool.end() here.
  }
}

