import { FieldError, Money, createExtractedField } from '@declara/tax-core'
import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryTaxDataRepository } from './in-memory.repository'
import type { AuditEvent, AuditSink } from './ports'
import { TaxDataError, TaxDataService } from './tax-data.service'

const brl = (c: bigint) => Money.fromString((Number(c) / 100).toFixed(2))

class RecordingSink implements AuditSink {
  events: AuditEvent[] = []
  record(event: AuditEvent): void {
    this.events.push(event)
  }
}

const target = { personId: 'p1', year: 2025, key: 'rendimento' }
const extracted = (value = brl(500n)) =>
  createExtractedField({ ...target, value, origin: { documentId: 'd1', page: 1, excerpt: 'SEGREDO' } })

let repo: InMemoryTaxDataRepository
let sink: RecordingSink
let service: TaxDataService

beforeEach(() => {
  repo = new InMemoryTaxDataRepository()
  sink = new RecordingSink()
  service = new TaxDataService(repo, sink, () => '2026-02-01T00:00:00Z')
})

describe('TaxDataService', () => {
  it('CA-1: enterManualField guarda confirmado/manual e listFields devolve só da pessoa e ano', async () => {
    const stored = await service.enterManualField('A', { ...target, value: brl(1000n) })
    expect(stored.field.status).toBe('confirmed')
    expect(stored.field.origin).toEqual({ kind: 'manual', enteredAt: '2026-02-01T00:00:00Z' })
    await service.enterManualField('A', { ...target, personId: 'p2', value: brl(1n) })
    await service.enterManualField('A', { ...target, year: 2024, value: brl(1n) })
    const list = await service.listFields('A', 'p1', 2025)
    expect(list.map((s) => s.id)).toEqual([stored.id])
  })

  it('CA-2: confirm, correct e reject persistem a transição', async () => {
    const a = await repo.add('A', extracted())
    const b = await repo.add('A', extracted())
    const c = await repo.add('A', extracted())
    expect((await service.confirm('A', a.id)).field.status).toBe('confirmed')
    const corrected = await service.correct('A', b.id, brl(700n))
    expect(corrected.field.status).toBe('corrected')
    expect(corrected.field.previousValue).toEqual(brl(500n))
    expect((await service.reject('A', c.id)).field.status).toBe('rejected')
    expect((await repo.get('A', c.id))?.field.status).toBe('rejected')
  })

  it('CA-2: transição inválida lança e deixa o armazenado intacto', async () => {
    const stored = await repo.add('A', extracted())
    await service.reject('A', stored.id)
    await expect(service.confirm('A', stored.id)).rejects.toMatchObject({ code: 'invalid_transition' })
    expect((await repo.get('A', stored.id))?.field.status).toBe('rejected')
    expect(sink.events).toHaveLength(1)
  })

  it('correct rejeita valor de tipo diferente do campo e deixa o armazenado intacto', async () => {
    const stored = await repo.add('A', extracted())
    await expect(service.correct('A', stored.id, 'texto')).rejects.toMatchObject({ code: 'type_mismatch' })
    expect((await repo.get('A', stored.id))?.field.status).toBe('extracted')
    expect(sink.events).toEqual([])
  })

  it('CA-3: id de outro dono é not_found em todas as operações', async () => {
    const stored = await repo.add('A', extracted())
    for (const op of [
      () => service.confirm('B', stored.id),
      () => service.correct('B', stored.id, brl(1n)),
      () => service.reject('B', stored.id),
    ]) {
      await expect(op()).rejects.toMatchObject({ code: 'not_found' })
    }
    expect((await repo.get('A', stored.id))?.field.status).toBe('extracted')
    expect(await service.listFields('B', 'p1', 2025)).toEqual([])
  })

  it('CA-4: usableValue devolve só confirmado/corrigido e propaga ambiguidade', async () => {
    const stored = await repo.add('A', extracted())
    expect(await service.usableValue('A', 'p1', 2025, 'rendimento')).toBeUndefined()
    await service.confirm('A', stored.id)
    expect(await service.usableValue('A', 'p1', 2025, 'rendimento')).toEqual(brl(500n))
    await service.enterManualField('A', { ...target, value: brl(900n) })
    await expect(service.usableValue('A', 'p1', 2025, 'rendimento')).rejects.toThrow(FieldError)
  })

  it('CA-5: consistencyAlerts devolve V-011 sem misturar donos', async () => {
    await repo.add('A', extracted(brl(500n)))
    await service.enterManualField('A', { ...target, value: brl(900n) })
    await repo.add('B', extracted(brl(1n)))
    expect(await service.consistencyAlerts('A', 'p1', 2025)).toHaveLength(1)
    expect(await service.consistencyAlerts('B', 'p1', 2025)).toHaveLength(0)
  })

  it('CA-6: toda alteração emite um evento sem valor nem trecho; leitura não emite', async () => {
    const m = await service.enterManualField('A', { ...target, key: 'outra', value: brl(123456n) })
    const e = await repo.add('A', extracted())
    await service.confirm('A', e.id)
    await service.listFields('A', 'p1', 2025)
    await service.usableValue('A', 'p1', 2025, 'rendimento')
    await service.consistencyAlerts('A', 'p1', 2025)
    expect(sink.events).toEqual([
      { ownerId: 'A', action: 'enter_manual', fieldId: m.id, at: '2026-02-01T00:00:00Z' },
      { ownerId: 'A', action: 'confirm', fieldId: e.id, at: '2026-02-01T00:00:00Z' },
    ])
    expect(JSON.stringify(sink.events)).not.toMatch(/SEGREDO|123456/)
  })

  it('TaxDataError não carrega dado pessoal', () => {
    expect(new TaxDataError('not_found').message).toBe('not_found')
  })
})
