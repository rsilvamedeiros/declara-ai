import { type FieldContent, type FieldValue, Money } from '@declara/tax-core'
import type { Pool, PoolClient } from 'pg'
import type { StoredField, TaxDataRepository } from '../ports'

/** Erro de armazenamento sem mensagem do banco, que pode trazer valor ou trecho (RNF-012). */
export class TaxDataStorageError extends Error {
  constructor() {
    super('storage_error')
    this.name = 'TaxDataStorageError'
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Row {
  id: string
  person_id: string
  year: number
  key: string
  value_cents: string | null
  value_text: string | null
  previous_cents: string | null
  previous_text: string | null
  status: FieldValue['status']
  origin_kind: 'document' | 'manual'
  document_id: string | null
  page: number | null
  excerpt: string | null
  entered_at: string | null
}

const toCents = (m: Money): string => String(BigInt(m.toString().replace('.', '')))

function fromCents(cents: string): Money {
  const n = BigInt(cents)
  const abs = n < 0n ? -n : n
  const fraction = (abs % 100n).toString().padStart(2, '0')
  return Money.fromString(`${n < 0n ? '-' : ''}${abs / 100n}.${fraction}`)
}

function content(cents: string | null, text: string | null): FieldContent | undefined {
  if (cents !== null) return fromCents(cents)
  return text ?? undefined
}

function toColumns(field: FieldValue) {
  const money = field.value instanceof Money
  const prev = field.previousValue
  return {
    valueCents: money ? toCents(field.value as Money) : null,
    valueText: money ? null : (field.value as string),
    previousCents: prev instanceof Money ? toCents(prev) : null,
    previousText: typeof prev === 'string' ? prev : null,
    originKind: field.origin.kind,
    documentId: field.origin.kind === 'document' ? field.origin.documentId : null,
    page: field.origin.kind === 'document' ? field.origin.page : null,
    excerpt: field.origin.kind === 'document' ? field.origin.excerpt : null,
    enteredAt: field.origin.kind === 'manual' ? field.origin.enteredAt : null,
  }
}

function toStored(row: Row): StoredField {
  const previous = content(row.previous_cents, row.previous_text)
  const field: FieldValue = {
    personId: row.person_id,
    year: row.year,
    key: row.key,
    value: content(row.value_cents, row.value_text) as FieldContent,
    origin:
      row.origin_kind === 'manual'
        ? { kind: 'manual', enteredAt: row.entered_at as string }
        : {
            kind: 'document',
            documentId: row.document_id as string,
            page: row.page as number,
            excerpt: row.excerpt as string,
          },
    status: row.status,
    ...(previous === undefined ? {} : { previousValue: previous }),
  }
  return { id: row.id, field }
}

const SELECT_COLUMNS =
  'id, person_id, year, key, value_cents::text, value_text, previous_cents::text, previous_text, status, origin_kind, document_id, page, excerpt, entered_at'

/**
 * Adaptador PostgreSQL. A conexão deve usar o papel da aplicação (sem BYPASSRLS);
 * cada operação roda numa transação com `app.owner_id` definido, além do filtro por dono.
 */
export class PostgresTaxDataRepository implements TaxDataRepository {
  constructor(private readonly pool: Pool) {}

  async add(ownerId: string, field: FieldValue): Promise<StoredField> {
    const c = toColumns(field)
    const rows = await this.run<Row>(
      ownerId,
      `INSERT INTO tax_fields (owner_id, person_id, year, key, value_cents, value_text, previous_cents, previous_text,
         status, origin_kind, document_id, page, excerpt, entered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING ${SELECT_COLUMNS}`,
      [ownerId, field.personId, field.year, field.key, c.valueCents, c.valueText, c.previousCents,
        c.previousText, field.status, c.originKind, c.documentId, c.page, c.excerpt, c.enteredAt],
    )
    return toStored(rows[0] as Row)
  }

  async get(ownerId: string, id: string): Promise<StoredField | undefined> {
    if (!UUID.test(id)) return undefined
    const rows = await this.run<Row>(
      ownerId,
      `SELECT ${SELECT_COLUMNS} FROM tax_fields WHERE owner_id = $1 AND id = $2`,
      [ownerId, id],
    )
    return rows[0] ? toStored(rows[0]) : undefined
  }

  async list(ownerId: string, filter: { personId: string; year: number }): Promise<StoredField[]> {
    const rows = await this.run<Row>(
      ownerId,
      `SELECT ${SELECT_COLUMNS} FROM tax_fields
       WHERE owner_id = $1 AND person_id = $2 AND year = $3 ORDER BY id`,
      [ownerId, filter.personId, filter.year],
    )
    return rows.map(toStored)
  }

  async replace(ownerId: string, id: string, field: FieldValue): Promise<boolean> {
    if (!UUID.test(id)) return false
    const c = toColumns(field)
    const rows = await this.run<{ id: string }>(
      ownerId,
      `UPDATE tax_fields SET person_id = $3, year = $4, key = $5, value_cents = $6, value_text = $7,
         previous_cents = $8, previous_text = $9, status = $10, origin_kind = $11, document_id = $12,
         page = $13, excerpt = $14, entered_at = $15
       WHERE owner_id = $1 AND id = $2 RETURNING id`,
      [ownerId, id, field.personId, field.year, field.key, c.valueCents, c.valueText, c.previousCents,
        c.previousText, field.status, c.originKind, c.documentId, c.page, c.excerpt, c.enteredAt],
    )
    return rows.length > 0
  }

  private async run<R>(ownerId: string, sql: string, params: unknown[]): Promise<R[]> {
    let client: PoolClient | undefined
    try {
      client = await this.pool.connect()
      await client.query('BEGIN')
      await client.query("SELECT set_config('app.owner_id', $1, true)", [ownerId])
      const result = await client.query(sql, params)
      await client.query('COMMIT')
      return result.rows as R[]
    } catch {
      await client?.query('ROLLBACK').catch(() => undefined)
      throw new TaxDataStorageError()
    } finally {
      client?.release()
    }
  }
}
