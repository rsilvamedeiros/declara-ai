const FORMAT = /^-?\d+(\.\d{1,2})?$/

/** Valor monetário imutável, guardado em centavos inteiros. Nunca usa ponto flutuante. */
export class Money {
  private constructor(private readonly cents: bigint) {}

  static fromString(input: string): Money {
    if (!FORMAT.test(input)) {
      throw new Error(`Invalid money format: "${input}"`)
    }
    const negative = input.startsWith('-')
    const [whole = '0', fraction = ''] = input.replace('-', '').split('.')
    const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
    return new Money(negative ? -cents : cents)
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents)
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents)
  }

  equals(other: Money): boolean {
    return this.cents === other.cents
  }

  compare(other: Money): number {
    return this.cents < other.cents ? -1 : this.cents > other.cents ? 1 : 0
  }

  toString(): string {
    const negative = this.cents < 0n
    const abs = negative ? -this.cents : this.cents
    const whole = abs / 100n
    const fraction = (abs % 100n).toString().padStart(2, '0')
    return `${negative ? '-' : ''}${whole}.${fraction}`
  }
}
