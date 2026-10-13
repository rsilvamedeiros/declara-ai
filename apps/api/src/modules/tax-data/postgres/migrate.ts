import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Pool } from 'pg'

const MIGRATIONS_DIR = join(import.meta.dirname, 'migrations')
const LOCK_ID = 86_001

/** Aplica em ordem as migrações `.sql` ainda não registradas. Migração publicada nunca é editada. */
export async function runMigrations(pool: Pool): Promise<string[]> {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()
  const client = await pool.connect()
  const applied: string[] = []
  try {
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID])
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
    )
    const done = new Set(
      (await client.query<{ name: string }>('SELECT name FROM schema_migrations')).rows.map((r) => r.name),
    )
    for (const file of files) {
      if (done.has(file)) continue
      await client.query('BEGIN')
      try {
        await client.query(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
      applied.push(file)
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => undefined)
    client.release()
  }
  return applied
}
