import { parse } from "pg-connection-string";

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean | { rejectUnauthorized: boolean };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getDbConfig(): DbConfig {
  const url = process.env.DATABASE_URL;

  if (url) {
    const parsed = parse(url);
    if (!parsed.host || !parsed.database || !parsed.user) {
      throw new Error("DATABASE_URL is missing required components");
    }
    return {
      host: parsed.host,
      port: parsed.port ? Number(parsed.port) : 5432,
      database: parsed.database!,
      user: parsed.user!,
      password: parsed.password || "",
      ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
    };
  }

  return {
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || "5432"),
    database: requireEnv("DB_NAME"),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false }
  };
}

