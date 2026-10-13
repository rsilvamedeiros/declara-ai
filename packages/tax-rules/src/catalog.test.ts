import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json'
import { createCatalog, createRule, refOf, RuleError, ruleFor } from './index'

// Regras FICTÍCIAS, só para testar o modelo. Nenhum valor representa regra fiscal real.
const source = { document: 'Norma fictícia, art. 1º', url: 'https://example.com/norma', consultedAt: '2026-01-01' }
const rule = (over = {}) =>
  createRule({
    id: 'teste.regra',
    title: 'Regra de teste',
    description: 'Descrição de teste',
    kind: 'limit',
    fromYear: 2024,
    toYear: 2025,
    value: { n: 1 },
    source,
    version: 1,
    status: 'effective',
    ...over,
  })

describe('createRule (CA-1)', () => {
  it('aceita regra completa', () => {
    expect(rule().id).toBe('teste.regra')
    expect(rule({ toYear: undefined }).toYear).toBeUndefined()
  })

  it.each([
    ['fonte sem documento', { source: { ...source, document: ' ' } }],
    ['url não https', { source: { ...source, url: 'http://example.com' } }],
    ['url inválida', { source: { ...source, url: 'nao-e-url' } }],
    ['consulta sem data', { source: { ...source, consultedAt: '' } }],
    ['vigência invertida', { fromYear: 2026, toYear: 2025 }],
    ['versão 0', { version: 0 }],
    ['versão fracionária', { version: 1.5 }],
    ['ano com 2 dígitos', { fromYear: 24 }],
    ['id vazio', { id: '' }],
  ])('rejeita %s', (_name, bad) => {
    expect(() => rule(bad)).toThrow(RuleError)
  })
})

describe('createCatalog (CA-2)', () => {
  it('rejeita id + version duplicados', () => {
    expect(() => createCatalog([rule(), rule()])).toThrow(RuleError)
  })

  it('aceita versões diferentes do mesmo id', () => {
    expect(() => createCatalog([rule(), rule({ version: 2, status: 'superseded' })])).not.toThrow()
  })
})

describe('ruleFor (CA-3)', () => {
  const catalog = createCatalog([rule()])

  it('inclui os limites da vigência', () => {
    expect(ruleFor(catalog, 'teste.regra', 2024)?.version).toBe(1)
    expect(ruleFor(catalog, 'teste.regra', 2025)?.version).toBe(1)
    expect(ruleFor(catalog, 'teste.regra', 2023)).toBeUndefined()
    expect(ruleFor(catalog, 'teste.regra', 2026)).toBeUndefined()
  })

  it('aceita vigência aberta', () => {
    const open = createCatalog([rule({ toYear: undefined })])
    expect(ruleFor(open, 'teste.regra', 2099)?.version).toBe(1)
    expect(ruleFor(open, 'teste.regra', 2023)).toBeUndefined()
  })

  it('devolve undefined para id desconhecido', () => {
    expect(ruleFor(catalog, 'outra', 2024)).toBeUndefined()
  })
})

describe('ruleFor e status (CA-4)', () => {
  it.each(['draft', 'reviewed', 'superseded'] as const)('ignora regra %s', (status) => {
    expect(ruleFor(createCatalog([rule({ status })]), 'teste.regra', 2024)).toBeUndefined()
  })

  it('falha de forma explícita com duas effective no mesmo ano', () => {
    const catalog = createCatalog([rule(), rule({ version: 2 })])
    expect(() => ruleFor(catalog, 'teste.regra', 2024)).toThrow(RuleError)
  })

  it('o erro cita só id e versão', () => {
    const catalog = createCatalog([rule(), rule({ version: 2 })])
    expect(() => ruleFor(catalog, 'teste.regra', 2024)).toThrow(/teste\.regra/)
  })
})

describe('versões por ano (CA-5)', () => {
  it('devolve a versão correta para cada ano', () => {
    const catalog = createCatalog([
      rule({ version: 1, fromYear: 2024, toYear: 2024 }),
      rule({ version: 2, fromYear: 2025, toYear: undefined }),
    ])
    expect(ruleFor(catalog, 'teste.regra', 2024)?.version).toBe(1)
    expect(ruleFor(catalog, 'teste.regra', 2025)?.version).toBe(2)
    expect(ruleFor(catalog, 'teste.regra', 2030)?.version).toBe(2)
  })
})

describe('refOf e imutabilidade (CA-6)', () => {
  it('devolve { id, version }', () => {
    expect(refOf(rule({ version: 3 }))).toEqual({ id: 'teste.regra', version: 3 })
  })

  it('não altera a regra original nem o catálogo', () => {
    const input = { n: 1 }
    const r = rule({ value: input })
    const snapshot = JSON.stringify(r)
    const catalog = createCatalog([r])
    ruleFor(catalog, 'teste.regra', 2024)
    refOf(r)
    expect(JSON.stringify(r)).toBe(snapshot)
    expect(Object.isFrozen(r)).toBe(true)
  })
})

describe('propriedade', () => {
  it('ruleFor só devolve regra effective cuja vigência cobre o ano', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2000, max: 2040 }),
        fc.integer({ min: 0, max: 15 }),
        fc.constantFrom('draft', 'reviewed', 'effective', 'superseded'),
        fc.integer({ min: 1990, max: 2060 }),
        (from, span, status, year) => {
          const r = rule({ fromYear: from, toYear: from + span, status })
          const found = ruleFor(createCatalog([r]), 'teste.regra', year)
          const expected = status === 'effective' && year >= from && year <= from + span
          expect(found !== undefined).toBe(expected)
        },
      ),
    )
  })
})

describe('pureza (CA-7)', () => {
  it('não declara dependências de runtime', () => {
    expect('dependencies' in pkg).toBe(false)
  })
})
