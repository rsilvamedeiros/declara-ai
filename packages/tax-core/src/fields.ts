import { Money } from './money'
import { validateCpf } from './tax-id'

export type FieldErrorCode =
  | 'invalid_cpf'
  | 'invalid_year'
  | 'invalid_origin'
  | 'invalid_transition'
  | 'ambiguous_value'

/** Erro do modelo de dado fiscal. A mensagem nunca carrega valor, trecho ou CPF (RNF-012). */
export class FieldError extends Error {
  constructor(readonly code: FieldErrorCode) {
    super(code)
    this.name = 'FieldError'
  }
}

export interface Person {
  readonly id: string
  readonly role: 'holder'
  readonly cpf?: string
}

export interface SourceDocument {
  readonly id: string
  readonly type: string
  readonly personId: string
  /** Ano-calendário. O ano de exercício é derivado (calendário + 1). */
  readonly year: number
  readonly contentHash: string
}

export type FieldOrigin =
  | { readonly kind: 'document'; readonly documentId: string; readonly page: number; readonly excerpt: string }
  | { readonly kind: 'manual'; readonly enteredAt: string }

export type FieldStatus = 'extracted' | 'confirmed' | 'corrected' | 'rejected'
export type FieldContent = Money | string

export interface FieldValue {
  readonly personId: string
  readonly year: number
  readonly key: string
  readonly value: FieldContent
  readonly origin: FieldOrigin
  readonly status: FieldStatus
  readonly previousValue?: FieldContent
}

function assertYear(year: number): void {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) throw new FieldError('invalid_year')
}

export function createPerson(input: { id: string; role: 'holder'; cpf?: string }): Person {
  if (input.cpf === undefined) return { id: input.id, role: input.role }
  const result = validateCpf(input.cpf)
  if (!result.valid) throw new FieldError('invalid_cpf')
  return { id: input.id, role: input.role, cpf: result.normalized }
}

export function createSourceDocument(input: SourceDocument): SourceDocument {
  assertYear(input.year)
  return { ...input }
}

interface FieldTarget {
  personId: string
  year: number
  key: string
  value: FieldContent
}

export function createExtractedField(
  input: FieldTarget & { origin: { documentId: string; page: number; excerpt: string } },
): FieldValue {
  const { documentId, page, excerpt } = input.origin
  assertYear(input.year)
  if (!documentId.trim() || !Number.isInteger(page) || page < 1 || !excerpt.trim()) {
    throw new FieldError('invalid_origin')
  }
  return {
    personId: input.personId,
    year: input.year,
    key: input.key,
    value: input.value,
    origin: { kind: 'document', documentId, page, excerpt },
    status: 'extracted',
  }
}

export function createManualField(input: FieldTarget & { enteredAt: string }): FieldValue {
  assertYear(input.year)
  return {
    personId: input.personId,
    year: input.year,
    key: input.key,
    value: input.value,
    origin: { kind: 'manual', enteredAt: input.enteredAt },
    status: 'confirmed',
  }
}

function assertExtracted(field: FieldValue): void {
  if (field.status !== 'extracted') throw new FieldError('invalid_transition')
}

export function confirmField(field: FieldValue): FieldValue {
  assertExtracted(field)
  return { ...field, status: 'confirmed' }
}

export function correctField(field: FieldValue, newValue: FieldContent): FieldValue {
  assertExtracted(field)
  return { ...field, value: newValue, previousValue: field.value, status: 'corrected' }
}

export function rejectField(field: FieldValue): FieldValue {
  assertExtracted(field)
  return { ...field, status: 'rejected' }
}

export function usableFields(fields: readonly FieldValue[]): FieldValue[] {
  return fields.filter((f) => f.status === 'confirmed' || f.status === 'corrected')
}

export function valueFor(
  fields: readonly FieldValue[],
  personId: string,
  year: number,
  key: string,
): FieldContent | undefined {
  const matches = usableFields(fields).filter(
    (f) => f.personId === personId && f.year === year && f.key === key,
  )
  if (matches.length > 1) throw new FieldError('ambiguous_value')
  return matches[0]?.value
}
