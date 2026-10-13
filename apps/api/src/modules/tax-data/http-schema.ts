import { type FieldContent, type FieldValue, Money } from '@declara/tax-core'
import type { StoredField } from './ports'

/** Entrada HTTP inválida. Sem eco do conteúdo recebido (RNF-012). */
export class InvalidInputError extends Error {
  constructor() {
    super('invalid_input')
    this.name = 'InvalidInputError'
  }
}

export type WireValue = { type: 'money'; amount: string } | { type: 'text'; text: string }

export interface ManualFieldBody {
  personId: string
  year: number
  key: string
  value: FieldContent
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const nonEmptyString = (v: unknown): string => {
  if (typeof v !== 'string' || !v.trim()) throw new InvalidInputError()
  return v
}

export function parseYear(v: unknown): number {
  const year = typeof v === 'string' && /^\d{4}$/.test(v) ? Number(v) : v
  if (typeof year !== 'number' || !Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new InvalidInputError()
  }
  return year
}

export function parseValue(v: unknown): FieldContent {
  if (!isRecord(v)) throw new InvalidInputError()
  if (v.type === 'money' && typeof v.amount === 'string') {
    try {
      return Money.fromString(v.amount)
    } catch {
      throw new InvalidInputError()
    }
  }
  if (v.type === 'text' && typeof v.text === 'string') return v.text
  throw new InvalidInputError()
}

export function parseManualFieldBody(body: unknown): ManualFieldBody {
  if (!isRecord(body)) throw new InvalidInputError()
  if (typeof body.year !== 'number') throw new InvalidInputError()
  return {
    personId: nonEmptyString(body.personId),
    year: parseYear(body.year),
    key: nonEmptyString(body.key),
    value: parseValue(body.value),
  }
}

export function parseCorrectionBody(body: unknown): FieldContent {
  if (!isRecord(body)) throw new InvalidInputError()
  return parseValue(body.value)
}

const toWire = (value: FieldContent): WireValue =>
  value instanceof Money ? { type: 'money', amount: value.toString() } : { type: 'text', text: value }

export function toWireField(stored: StoredField) {
  const f: FieldValue = stored.field
  return {
    id: stored.id,
    personId: f.personId,
    year: f.year,
    key: f.key,
    value: toWire(f.value),
    status: f.status,
    origin: f.origin,
    ...(f.previousValue === undefined ? {} : { previousValue: toWire(f.previousValue) }),
  }
}
