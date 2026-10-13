import { Money, createManualField } from '@declara/tax-core'
import { describe, expect, it } from 'vitest'
import type { TaxDataRepository } from './ports'

const field = (key = 'rendimento') =>
  createManualField({ personId: 'p1', year: 2025, key, value: Money.fromString('10.00'), enteredAt: '2026-01-01' })

/** Contrato que todo adaptador de TaxDataRepository deve cumprir (SPEC-0007). */
export function repositoryContract(name: string, create: () => TaxDataRepository): void {
  describe(`TaxDataRepository: ${name}`, () => {
    it('gera id ao adicionar e devolve o campo ao dono', async () => {
      const repo = create()
      const stored = await repo.add('ownerA', field())
      expect(stored.id).toBeTruthy()
      expect(await repo.get('ownerA', stored.id)).toEqual(stored)
    })

    it('gera ids distintos', async () => {
      const repo = create()
      const a = await repo.add('ownerA', field('a'))
      const b = await repo.add('ownerA', field('b'))
      expect(a.id).not.toBe(b.id)
    })

    it('outro dono recebe undefined, igual a id inexistente', async () => {
      const repo = create()
      const stored = await repo.add('ownerA', field())
      expect(await repo.get('ownerB', stored.id)).toBeUndefined()
      expect(await repo.get('ownerA', 'inexistente')).toBeUndefined()
    })

    it('lista só do dono, da pessoa e do ano pedidos', async () => {
      const repo = create()
      await repo.add('ownerA', field('a'))
      await repo.add('ownerB', field('b'))
      await repo.add('ownerA', { ...field('c'), year: 2024 })
      await repo.add('ownerA', { ...field('d'), personId: 'p2' })
      const list = await repo.list('ownerA', { personId: 'p1', year: 2025 })
      expect(list.map((s) => s.field.key)).toEqual(['a'])
    })

    it('replace altera o dono e é ignorado para outro dono', async () => {
      const repo = create()
      const stored = await repo.add('ownerA', field())
      const changed = { ...stored.field, key: 'outra' }
      expect(await repo.replace('ownerB', stored.id, changed)).toBe(false)
      expect((await repo.get('ownerA', stored.id))?.field.key).toBe('rendimento')
      expect(await repo.replace('ownerA', stored.id, changed)).toBe(true)
      expect((await repo.get('ownerA', stored.id))?.field.key).toBe('outra')
    })
  })
}
