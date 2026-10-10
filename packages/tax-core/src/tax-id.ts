export type TaxIdFailureReason =
  | 'invalid_length'
  | 'invalid_characters'
  | 'repeated_digits'
  | 'invalid_check_digits'

export type TaxIdResult =
  | { valid: true; normalized: string }
  | { valid: false; reason: TaxIdFailureReason }

const MASK_CHARS = /[.\-/\s]/g

function checkDigit(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, d, i) => acc + d * (weights[i] as number), 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}

function validate(
  input: string,
  length: number,
  weightsFirst: number[],
  weightsSecond: number[],
): TaxIdResult {
  const cleaned = input.replace(MASK_CHARS, '')
  if (!/^\d*$/.test(cleaned)) return { valid: false, reason: 'invalid_characters' }
  if (cleaned.length !== length) return { valid: false, reason: 'invalid_length' }
  if (/^(\d)\1+$/.test(cleaned)) return { valid: false, reason: 'repeated_digits' }

  const digits = [...cleaned].map(Number)
  const base = digits.slice(0, length - 2)
  const first = checkDigit(base, weightsFirst)
  const second = checkDigit([...base, first], weightsSecond)
  if (digits[length - 2] !== first || digits[length - 1] !== second) {
    return { valid: false, reason: 'invalid_check_digits' }
  }
  return { valid: true, normalized: cleaned }
}

export function validateCpf(input: string): TaxIdResult {
  return validate(
    input,
    11,
    [10, 9, 8, 7, 6, 5, 4, 3, 2],
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
  )
}

export function validateCnpj(input: string): TaxIdResult {
  const first = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  return validate(input, 14, first, [6, ...first])
}
