import { Money, createExtractedField, createManualField } from '@declara/tax-core'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { repositoryContract } from '../repository.contract'
import { runMigrations } from './migrate'
import { PostgresTaxDataRepository, TaxDataStorageError } from './postgres.repository'

const url = process.env.DATABASE_URL

// Sem DATABASE_URL (ex.: `pnpm test` local sem banco) estes testes são pulados; o CI define a variável.
describe.skipIf(!url)('PostgresTaxDataRepository (PostgreSQL real)', () => {
  let admin: pg.Pool
  let app: pg.Pool

  beforeAll(async () => {
    admin = new pg.Pool({ connectionString: url })
    app = new pg.Pool({ connectionString: url, options: '-c role=declara_app' })
    await admin.query('DROP TABLE IF EXISTS tax_fields, schema_migrations')
    await runMigrations(admin)
  })

  afterAll(async () => {
    await app.end()
    await admin.end()
  })

  const fresh = async () => {
    await admin.query('TRUNCATE tax_fields')
    return new PostgresTaxDataRepository(app)
  }

  repositoryContract('PostgreSQL', fresh)

  const manual = (value: Money | string, key = 'k') =>
    createManualField({ personId: 'p1', year: 2025, key, value, enteredAt: '2026-01-01' })

  it('CA-2: dinheiro e texto fazem ida e volta sem perda', async () => {
    const repo = await fresh()
    const values = ['0.00', '-0.50', '1234.56', '90071992547409.93', '-92233720368547758.08', '5'] as const
    for (const v of values) {
      const stored = await repo.add('A', manual(Money.fromString(v)))
      const back = await repo.get('A', stored.id)
      expect((back?.field.value as Money).toString()).toBe(Money.fromString(v).toString())
    }
    const text = await repo.add('A', manual('texto ç ã 日本'))
    expect((await repo.get('A', text.id))?.field.value).toBe('texto ç ã 日本')
  })

  it('CA-2: origem de documento e valor anterior fazem ida e volta', async () => {
    const repo = await fresh()
    const extracted = createExtractedField({
      personId: 'p1',
      year: 2025,
      key: 'k',
      value: Money.fromString('10.00'),
      origin: { documentId: 'd1', page: 3, excerpt: 'trecho fictício' },
    })
    const stored = await repo.add('A', extracted)
    expect(stored.field).toEqual(extracted)
    const corrected = { ...stored.field, status: 'corrected' as const, value: Money.fromString('11.00'), previousValue: Money.fromString('10.00') }
    expect(await repo.replace('A', stored.id, corrected)).toBe(true)
    expect((await repo.get('A', stored.id))?.field).toEqual(corrected)
  })

  it('CA-3: o papel da aplicação sem app.owner_id não vê linha alguma', async () => {
    const repo = await fresh()
    await repo.add('A', manual('x'))
    await repo.add('B', manual('y'))
    expect((await app.query('SELECT count(*)::int AS n FROM tax_fields')).rows[0].n).toBe(0)
  })

  it('CA-3: com o dono A, uma consulta SQL direta não devolve linhas do dono B', async () => {
    const repo = await fresh()
    await repo.add('A', manual('x'))
    await repo.add('B', manual('y'))
    const client = await app.connect()
    try {
      await client.query('BEGIN')
      await client.query("SELECT set_config('app.owner_id', 'A', true)")
      const rows = (await client.query('SELECT owner_id FROM tax_fields')).rows
      expect(rows).toEqual([{ owner_id: 'A' }])
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
  })

  it('CA-4: INSERT com owner_id diferente de app.owner_id é recusado pelo banco', async () => {
    await fresh()
    const client = await app.connect()
    try {
      await client.query('BEGIN')
      await client.query("SELECT set_config('app.owner_id', 'A', true)")
      await expect(
        client.query(
          "INSERT INTO tax_fields (owner_id, person_id, year, key, value_text, status, origin_kind, entered_at) VALUES ('B', 'p', 2025, 'k', 'v', 'confirmed', 'manual', 'x')",
        ),
      ).rejects.toThrow()
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
  })

  it('o papel da aplicação não tem DELETE nem BYPASSRLS', async () => {
    const repo = await fresh()
    await repo.add('A', manual('x'))
    await expect(app.query('DELETE FROM tax_fields')).rejects.toThrow()
    const role = (await admin.query("SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'declara_app'")).rows[0]
    expect(role).toEqual({ rolbypassrls: false, rolsuper: false })
  })

  it('CA-5: restrições CHECK recusam linhas incoerentes', async () => {
    await fresh()
    const base = { person: "'p'", year: '2025', key: "'k'", status: "'confirmed'" }
    const insert = (over: Partial<Record<string, string>>) => {
      const c = {
        owner_id: "'A'", person_id: base.person, year: base.year, key: base.key,
        value_text: "'v'", value_cents: 'NULL', status: base.status, origin_kind: "'manual'",
        entered_at: "'t'", document_id: 'NULL', page: 'NULL', excerpt: 'NULL', ...over,
      }
      return admin.query(`INSERT INTO tax_fields (${Object.keys(c).join(',')}) VALUES (${Object.values(c).join(',')})`)
    }
    await expect(insert({})).resolves.toBeDefined()
    await expect(insert({ status: "'invalido'" })).rejects.toThrow()
    await expect(insert({ year: '99' })).rejects.toThrow()
    await expect(insert({ key: "''" })).rejects.toThrow()
    await expect(insert({ value_cents: '5' })).rejects.toThrow()
    await expect(insert({ value_text: 'NULL' })).rejects.toThrow()
    await expect(insert({ entered_at: 'NULL' })).rejects.toThrow()
    await expect(insert({ origin_kind: "'document'", entered_at: 'NULL' })).rejects.toThrow()
    await expect(
      insert({ origin_kind: "'document'", entered_at: 'NULL', document_id: "'d'", page: '0', excerpt: "'e'" }),
    ).rejects.toThrow()
  })

  it('CA-6: migrações aplicam do zero e reaplicar não duplica nada', async () => {
    await admin.query('DROP TABLE IF EXISTS tax_fields, schema_migrations')
    expect(await runMigrations(admin)).toEqual(['001_tax_fields.sql'])
    expect(await runMigrations(admin)).toEqual([])
    expect((await admin.query('SELECT count(*)::int AS n FROM schema_migrations')).rows[0].n).toBe(1)
  })

  it('CA-7: erro de armazenamento não carrega valor nem trecho', async () => {
    const repo = await fresh()
    const bad = { ...manual('VALOR-SECRETO-123'), year: 99 }
    const error = await repo.add('A', bad).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(TaxDataStorageError)
    expect(JSON.stringify(error) + String((error as Error).message) + String((error as Error).stack)).not.toContain('VALOR-SECRETO-123')
  })
})
