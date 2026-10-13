import type { FieldValue } from '@declara/tax-core'
import type { StoredField, TaxDataRepository } from './ports'

/** Adaptador em memória para testes e desenvolvimento. */
export class InMemoryTaxDataRepository implements TaxDataRepository {
  private readonly rows = new Map<string, { ownerId: string; stored: StoredField }>()
  private seq = 0

  async add(ownerId: string, field: FieldValue): Promise<StoredField> {
    const stored = { id: `field-${++this.seq}`, field }
    this.rows.set(stored.id, { ownerId, stored })
    return stored
  }

  async get(ownerId: string, id: string): Promise<StoredField | undefined> {
    const row = this.rows.get(id)
    return row?.ownerId === ownerId ? row.stored : undefined
  }

  async list(ownerId: string, filter: { personId: string; year: number }): Promise<StoredField[]> {
    return [...this.rows.values()]
      .filter((r) => r.ownerId === ownerId)
      .map((r) => r.stored)
      .filter((s) => s.field.personId === filter.personId && s.field.year === filter.year)
  }

  async replace(ownerId: string, id: string, field: FieldValue): Promise<boolean> {
    const row = this.rows.get(id)
    if (row?.ownerId !== ownerId) return false
    row.stored = { id, field }
    return true
  }
}
