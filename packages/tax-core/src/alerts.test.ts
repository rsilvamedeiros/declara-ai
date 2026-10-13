import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json'
import {
  AlertError,
  checkExtractedVsManual,
  checkSumMatchesTotal,
  confirmField,
  createExtractedField,
  createManualField,
  justifyAlert,
  Money,
  rejectField,
  resolveAlert,
  type Alert,
  type FieldValue,
} from './index'

// Valores e trechos fictícios.
const m = (v: string) => Money.fromString(v)
const doc = (key: string, value: Money | string, over = {}) =>
  confirmField(
    createExtractedField({
      personId: 'p1',
      year: 2025,
      key,
      value,
      origin: { documentId: 'd1', page: 1, excerpt: 'trecho' },
      ...over,
    }),
  )
const manual = (key: string, value: Money | string, over = {}) =>
  createManualField({ personId: 'p1', year: 2025, key, value, enteredAt: '2026-01-01', ...over })

describe('checkSumMatchesTotal (CA-1)', () => {
  const total = doc('total', m('300.00'))

  it('não gera alerta quando a soma bate exatamente', () => {
    expect(checkSumMatchesTotal([doc('a', m('100.00')), doc('b', m('200.00'))], total)).toBeUndefined()
  })

  it('gera V-005 quando difere em um centavo', () => {
    const alert = checkSumMatchesTotal([doc('a', m('100.00')), doc('b', m('200.01'))], total)
    expect(alert).toMatchObject({
      validationId: 'V-005',
      severity: 'warning',
      code: 'sum_mismatch',
      suggestedAction: 'justify',
      state: 'open',
      documentIds: ['d1'],
    })
    expect(alert?.fields.map((f) => f.key).sort()).toEqual(['a', 'b', 'total'])
  })
})

describe('checkSumMatchesTotal: campos ignorados e inválidos (CA-2)', () => {
  const total = doc('total', m('100.00'))
  const extracted = createExtractedField({
    personId: 'p1',
    year: 2025,
    key: 'x',
    value: m('999.00'),
    origin: { documentId: 'd1', page: 1, excerpt: 't' },
  })

  it('ignora campos extracted e rejected', () => {
    const rejected = rejectField(extracted)
    expect(checkSumMatchesTotal([doc('a', m('100.00')), extracted, rejected], total)).toBeUndefined()
  })

  it('não gera alerta sem total utilizável', () => {
    expect(checkSumMatchesTotal([doc('a', m('1.00'))], extracted)).toBeUndefined()
  })

  it('rejeita campo que não é Money', () => {
    expect(() => checkSumMatchesTotal([doc('a', 'texto')], total)).toThrow(AlertError)
  })

  it('rejeita pessoas ou anos diferentes', () => {
    expect(() => checkSumMatchesTotal([doc('a', m('1.00'), { personId: 'p2' })], total)).toThrow(AlertError)
    expect(() => checkSumMatchesTotal([doc('a', m('1.00'), { year: 2024 })], total)).toThrow(AlertError)
  })

  it('com total igual à soma nunca gera alerta (propriedade)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -100000, max: 100000 }), { maxLength: 8 }), (cents) => {
        const parts = cents.map((c, i) => doc(`k${i}`, m((c / 100).toFixed(2))))
        const sum = parts.reduce((acc, f) => acc.add(f.value as Money), m('0.00'))
        expect(checkSumMatchesTotal(parts, doc('total', sum))).toBeUndefined()
      }),
    )
  })
})

describe('checkExtractedVsManual (CA-3)', () => {
  it('gera V-011 quando manual e documento divergem', () => {
    const alerts = checkExtractedVsManual([manual('salary', m('100.00')), doc('salary', m('90.00'))])
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({
      validationId: 'V-011',
      severity: 'warning',
      code: 'extracted_vs_manual_mismatch',
      suggestedAction: 'fix_value',
      state: 'open',
      documentIds: ['d1'],
      fields: [{ personId: 'p1', year: 2025, key: 'salary' }],
    })
  })

  it('não gera alerta quando coincidem, nem sem par manual/documento', () => {
    expect(checkExtractedVsManual([manual('salary', m('100.00')), doc('salary', m('100.00'))])).toEqual([])
    expect(checkExtractedVsManual([manual('salary', m('100.00'))])).toEqual([])
    expect(checkExtractedVsManual([doc('salary', m('100.00'))])).toEqual([])
  })

  it('ignora campo de documento rejeitado', () => {
    const rejected = rejectField(
      createExtractedField({
        personId: 'p1',
        year: 2025,
        key: 'salary',
        value: m('1.00'),
        origin: { documentId: 'd1', page: 1, excerpt: 't' },
      }),
    )
    expect(checkExtractedVsManual([manual('salary', m('100.00')), rejected])).toEqual([])
  })

  it('texto e Money diferentes divergem', () => {
    expect(checkExtractedVsManual([manual('k', 'abc'), doc('k', m('1.00'))])).toHaveLength(1)
  })
})

describe('checkExtractedVsManual: agrupamento (CA-4)', () => {
  it('três campos na mesma chave geram um único alerta', () => {
    const fields = [manual('k', m('1.00')), doc('k', m('2.00')), doc('k', m('3.00'), { origin: { documentId: 'd2', page: 1, excerpt: 'trecho' } })]
    const alerts = checkExtractedVsManual(fields)
    expect(alerts).toHaveLength(1)
    expect(alerts[0]?.documentIds).toEqual(['d1', 'd2'])
  })

  it('não mistura chaves, pessoas nem anos', () => {
    const fields = [
      manual('k', m('1.00')),
      doc('k2', m('2.00')),
      doc('k', m('2.00'), { personId: 'p2' }),
      doc('k', m('2.00'), { year: 2024 }),
    ]
    expect(checkExtractedVsManual(fields)).toEqual([])
  })

  it('o resultado não depende da ordem dos campos (propriedade)', () => {
    const base: FieldValue[] = [
      manual('a', m('1.00')),
      doc('a', m('2.00')),
      manual('b', m('1.00')),
      doc('b', m('3.00')),
      doc('c', m('1.00')),
    ]
    fc.assert(
      fc.property(fc.shuffledSubarray(base, { minLength: base.length }), (shuffled) => {
        expect(checkExtractedVsManual(shuffled)).toEqual(checkExtractedVsManual(base))
      }),
    )
  })
})

describe('estado do alerta (CA-5)', () => {
  const open = (): Alert =>
    checkExtractedVsManual([manual('k', m('1.00')), doc('k', m('2.00'))])[0] as Alert

  it('open → resolved e open → justified, sem alterar o original', () => {
    const a = open()
    expect(resolveAlert(a).state).toBe('resolved')
    expect(justifyAlert(a, 'o documento arredonda').state).toBe('justified')
    expect(a.state).toBe('open')
  })

  it('rejeita justificativa vazia e qualquer outra transição', () => {
    expect(() => justifyAlert(open(), '   ')).toThrow(AlertError)
    const resolved = resolveAlert(open())
    expect(() => resolveAlert(resolved)).toThrow(AlertError)
    expect(() => justifyAlert(resolved, 'x')).toThrow(AlertError)
    expect(() => resolveAlert(justifyAlert(open(), 'x'))).toThrow(AlertError)
  })

  it('o alerta justificado não carrega a justificativa (CA-6)', () => {
    expect(JSON.stringify(justifyAlert(open(), 'segredo-123'))).not.toContain('segredo')
  })
})

describe('privacidade (CA-6)', () => {
  it('alertas e erros não contêm valores nem trechos', () => {
    const alerts = [
      checkSumMatchesTotal([doc('a', m('123.45'))], doc('total', m('678.90'))),
      ...checkExtractedVsManual([manual('k', m('111.11')), doc('k', m('222.22'))]),
    ]
    const out = JSON.stringify(alerts)
    for (const secret of ['123.45', '678.90', '111.11', '222.22', 'trecho']) expect(out).not.toContain(secret)
    try {
      checkSumMatchesTotal([doc('a', 'segredo-xyz')], doc('total', m('1.00')))
    } catch (e) {
      expect((e as Error).message).not.toContain('segredo')
    }
  })
})

describe('pureza (CA-7)', () => {
  it('não declara dependências de runtime', () => {
    expect('dependencies' in pkg).toBe(false)
  })
})
