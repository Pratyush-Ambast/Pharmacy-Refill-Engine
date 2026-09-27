import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Create a Neon database (Vercel Marketplace), then add the pooled connection string as an env variable. See README.md."
      );
    }
    _sql = neon(url);
  }
  return _sql!;
}
