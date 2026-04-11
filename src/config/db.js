import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD || undefined,
  port: process.env.PGPORT|| 5432,
});
