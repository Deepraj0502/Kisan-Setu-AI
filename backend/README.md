## Kisan Setu AI – Backend (Day 1)

This backend is the foundation for the **Agri-OS** intelligence layer, targeting **Amazon RDS PostgreSQL** with **pgvector** for RAG.

### Environment variables (RDS)

Use either a single `DATABASE_URL` or discrete variables:

- **DATABASE_URL**: `postgres://USER:PASSWORD@HOST:PORT/DB_NAME`
- **DB_HOST**
- **DB_PORT** (default: `5432`)
- **DB_NAME**
- **DB_USER**
- **DB_PASSWORD**
- **DB_SSL**: `false` to disable SSL (default uses SSL with `rejectUnauthorized=false`, suitable for many RDS setups/Lambda dev).

### Install & run

```bash
cd backend
npm install

# Check connectivity (requires RDS reachable + env set)
npm run dev

# Ensure pgvector extension exists
npm run migrate:db

# Verify pgvector status
npm run check:db
```

This structure is Lambda-friendly: shared `db` and `config` modules can be imported directly from future handler files without modification.

