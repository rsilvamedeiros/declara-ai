import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { Money } from './index'

describe('Money', () => {
  it('soma sem erro de ponto flutuante', () => {
    const sum = Money.fromString('0.10').add(Money.fromString('0.20'))
    expect(sum.toString()).toBe('0.30')
    expect(sum.equals(Money.fromString('0.30'))).toBe(true)
  })

  it('subtrai e aceita resultado negativo', () => {
    expect(Money.fromString('1.00').subtract(Money.fromString('2.50')).toString()).toBe('-1.50')
  })

  it('aceita inteiros e uma casa decimal, normalizando para duas', () => {
    expect(Money.fromString('5').toString()).toBe('5.00')
    expect(Money.fromString('5.1').toString()).toBe('5.10')
  })

  it('compara valores', () => {
    expect(Money.fromString('2.00').compare(Money.fromString('1.99'))).toBeGreaterThan(0)
    expect(Money.fromString('1.99').compare(Money.fromString('2.00'))).toBeLessThan(0)
    expect(Money.fromString('1.00').compare(Money.fromString('1.00'))).toBe(0)
  })

  it.each(['', 'abc', '1,50', '1.234', '1.2.3', '--1', '1e3'])(
    'rejeita formato inválido ou mais de duas casas: %s',
    (input) => {
      expect(() => Money.fromString(input)).toThrow()
    },
  )

  it('propriedade: (a + b) - b é igual a a', () => {
    const cents = fc.integer({ min: -1_000_000_000, max: 1_000_000_000 })
    const toMoney = (c: number) => Money.fromString((c / 100).toFixed(2))
    fc.assert(
      fc.property(cents, cents, (a, b) => {
        const ma = toMoney(a)
        const mb = toMoney(b)
        return ma.add(mb).subtract(mb).equals(ma)
      }),
    )
  })
})
