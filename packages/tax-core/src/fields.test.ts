import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  confirmField,
  correctField,
  createExtractedField,
  createManualField,
  createPerson,
  createSourceDocument,
  FieldError,
  rejectField,
  usableFields,
  valueFor,
} from './index'
import { Money } from './index'
import pkg from '../package.json'

// Todos os dados abaixo são fictícios.
const base = { personId: 'p1', year: 2025, key: 'salary' }
const origin = { documentId: 'd1', page: 1, excerpt: 'Total: 100,00' }
const extracted = (over = {}) =>
  createExtractedField({ ...base, value: Money.fromString('100.00'), origin, ...over })
const manual = (over = {}) =>
  createManualField({ ...base, value: Money.fromString('50.00'), enteredAt: '2026-01-01', ...over })

describe('createPerson', () => {
  it('aceita titular sem CPF', () => {
    expect(createPerson({ id: 'p1', role: 'holder' })).toEqual({ id: 'p1', role: 'holder' })
  })

  it('normaliza CPF válido e rejeita inválido', () => {
    expect(createPerson({ id: 'p1', role: 'holder', cpf: '529.982.247-25' }).cpf).toBe('52998224725')
    expect(() => createPerson({ id: 'p1', role: 'holder', cpf: '11111111111' })).toThrow(FieldError)
  })
})

describe('createSourceDocument', () => {
  it('guarda tipo, pessoa, ano e hash', () => {
    const doc = createSourceDocument({
      id: 'd1',
      type: 'income_report',
      personId: 'p1',
      year: 2025,
      contentHash: 'abc',
    })
    expect(doc.year).toBe(2025)
  })

  it('rejeita ano que não tem quatro dígitos', () => {
    expect(() =>
      createSourceDocument({ id: 'd', type: 'income_report', personId: 'p', year: 25, contentHash: 'h' }),
    ).toThrow(FieldError)
  })
})

describe('createExtractedField (CA-1)', () => {
  it('aceita origem completa e nasce extracted', () => {
    const f = extracted()
    expect(f.status).toBe('extracted')
    expect(f.origin).toEqual({ kind: 'document', ...origin })
  })

  it.each([
    ['documentId vazio', { documentId: '' }],
    ['page < 1', { page: 0 }],
    ['page não inteira', { page: 1.5 }],
    ['excerpt vazio', { excerpt: '   ' }],
  ])('rejeita %s', (_name, bad) => {
    expect(() => extracted({ origin: { ...origin, ...bad } })).toThrow(FieldError)
  })
})

describe('createManualField (CA-2)', () => {
  it('nasce confirmed com origem manual', () => {
    const f = manual()
    expect(f.status).toBe('confirmed')
    expect(f.origin).toEqual({ kind: 'manual', enteredAt: '2026-01-01' })
  })
})

describe('transições (CA-3, CA-4)', () => {
  it('extracted → confirmed / corrected / rejected', () => {
    expect(confirmField(extracted()).status).toBe('confirmed')
    expect(correctField(extracted(), Money.fromString('90.00')).status).toBe('corrected')
    expect(rejectField(extracted()).status).toBe('rejected')
  })

  it('rejeita qualquer transição fora de extracted', () => {
    const done = [confirmField(extracted()), correctField(extracted(), 'x'), rejectField(extracted()), manual()]
    for (const f of done) {
      expect(() => confirmField(f)).toThrow(FieldError)
      expect(() => correctField(f, 'y')).toThrow(FieldError)
      expect(() => rejectField(f)).toThrow(FieldError)
    }
  })

  it('correctField guarda previousValue e não altera o original', () => {
    const original = extracted()
    const corrected = correctField(original, Money.fromString('90.00'))
    expect(corrected.previousValue).toEqual(Money.fromString('100.00'))
    expect(corrected.value).toEqual(Money.fromString('90.00'))
    expect(original.status).toBe('extracted')
    expect(original.previousValue).toBeUndefined()
  })
})

describe('usableFields e valueFor (CA-5, CA-6)', () => {
  it('nunca devolve extracted nem rejected', () => {
    const fields = [extracted(), rejectField(extracted({ key: 'other' })), confirmField(extracted({ key: 'k3' }))]
    expect(usableFields(fields).map((f) => f.key)).toEqual(['k3'])
    expect(valueFor(fields, 'p1', 2025, 'salary')).toBeUndefined()
    expect(valueFor(fields, 'p1', 2025, 'other')).toBeUndefined()
    expect(valueFor(fields, 'p1', 2025, 'k3')).toEqual(Money.fromString('100.00'))
  })

  it('não mistura pessoas nem anos', () => {
    const fields = [manual(), manual({ personId: 'p2', value: 'x' }), manual({ year: 2024, value: 'y' })]
    expect(valueFor(fields, 'p1', 2025, 'salary')).toEqual(Money.fromString('50.00'))
    expect(valueFor(fields, 'p2', 2025, 'salary')).toBe('x')
    expect(valueFor(fields, 'p1', 2024, 'salary')).toBe('y')
    expect(valueFor(fields, 'p3', 2025, 'salary')).toBeUndefined()
  })

  it('falha de forma explícita quando há dois utilizáveis para a mesma chave', () => {
    expect(() => valueFor([manual(), manual()], 'p1', 2025, 'salary')).toThrow(FieldError)
  })

  it('o erro de ambiguidade não vaza o valor', () => {
    try {
      valueFor([manual({ value: 'segredo-123' }), manual({ value: 'segredo-456' })], 'p1', 2025, 'salary')
    } catch (e) {
      expect(String((e as Error).message)).not.toContain('segredo')
    }
  })
})

describe('propriedade (CA-7)', () => {
  it('origem, pessoa, ano e chave não mudam em nenhuma transição válida', () => {
    fc.assert(
      fc.property(fc.constantFrom('confirm', 'correct', 'reject'), fc.string(), (op, text) => {
        const f = extracted()
        const next =
          op === 'confirm' ? confirmField(f) : op === 'correct' ? correctField(f, text) : rejectField(f)
        expect(next.origin).toEqual(f.origin)
        expect([next.personId, next.year, next.key]).toEqual([f.personId, f.year, f.key])
      }),
    )
  })
})

describe('pureza do pacote (CA-8)', () => {
  it('não declara dependências de runtime (sem framework, rede ou I/O)', () => {
    expect('dependencies' in pkg).toBe(false)
  })
})
