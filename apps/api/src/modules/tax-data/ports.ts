import type { FieldValue } from '@declara/tax-core'

export interface StoredField {
  readonly id: string
  readonly field: FieldValue
}

/** Porta de armazenamento. Toda operação é restrita ao `ownerId` (RNF-002). */
export interface TaxDataRepository {
  add(ownerId: string, field: FieldValue): Promise<StoredField>
  /** `undefined` tanto para id inexistente quanto para id de outro dono. */
  get(ownerId: string, id: string): Promise<StoredField | undefined>
  list(ownerId: string, filter: { personId: string; year: number }): Promise<StoredField[]>
  /** `false` quando o id não existe para o dono. */
  replace(ownerId: string, id: string, field: FieldValue): Promise<boolean>
}

export type AuditAction = 'enter_manual' | 'confirm' | 'correct' | 'reject'

/** Evento de auditoria: sem valor, trecho ou CPF (RNF-012). */
export interface AuditEvent {
  readonly ownerId: string
  readonly action: AuditAction
  readonly fieldId: string
  readonly at: string
}

export interface AuditSink {
  record(event: AuditEvent): void | Promise<void>
}
