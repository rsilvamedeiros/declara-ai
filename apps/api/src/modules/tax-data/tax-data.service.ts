import {
  type Alert,
  type FieldContent,
  type FieldValue,
  checkExtractedVsManual,
  confirmField,
  correctField,
  createManualField,
  rejectField,
  valueFor,
} from '@declara/tax-core'
import type { AuditAction, AuditSink, StoredField, TaxDataRepository } from './ports'

export type TaxDataErrorCode = 'not_found'

/** Erro do serviço. A mensagem é só o código, nunca dado pessoal (RNF-012). */
export class TaxDataError extends Error {
  constructor(readonly code: TaxDataErrorCode) {
    super(code)
    this.name = 'TaxDataError'
  }
}

export interface ManualFieldInput {
  personId: string
  year: number
  key: string
  value: FieldContent
}

export class TaxDataService {
  constructor(
    private readonly repository: TaxDataRepository,
    private readonly audit: AuditSink,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async enterManualField(ownerId: string, input: ManualFieldInput): Promise<StoredField> {
    const field = createManualField({ ...input, enteredAt: this.now() })
    const stored = await this.repository.add(ownerId, field)
    await this.emit(ownerId, 'enter_manual', stored.id)
    return stored
  }

  listFields(ownerId: string, personId: string, year: number): Promise<StoredField[]> {
    return this.repository.list(ownerId, { personId, year })
  }

  confirm(ownerId: string, id: string): Promise<StoredField> {
    return this.transition(ownerId, id, 'confirm', confirmField)
  }

  correct(ownerId: string, id: string, newValue: FieldContent): Promise<StoredField> {
    return this.transition(ownerId, id, 'correct', (f) => correctField(f, newValue))
  }

  reject(ownerId: string, id: string): Promise<StoredField> {
    return this.transition(ownerId, id, 'reject', rejectField)
  }

  async usableValue(
    ownerId: string,
    personId: string,
    year: number,
    key: string,
  ): Promise<FieldContent | undefined> {
    const stored = await this.listFields(ownerId, personId, year)
    return valueFor(
      stored.map((s) => s.field),
      personId,
      year,
      key,
    )
  }

  async consistencyAlerts(ownerId: string, personId: string, year: number): Promise<Alert[]> {
    const stored = await this.listFields(ownerId, personId, year)
    return checkExtractedVsManual(stored.map((s) => s.field))
  }

  private async transition(
    ownerId: string,
    id: string,
    action: AuditAction,
    apply: (field: FieldValue) => FieldValue,
  ): Promise<StoredField> {
    const current = await this.repository.get(ownerId, id)
    if (!current) throw new TaxDataError('not_found')
    const next = apply(current.field)
    if (!(await this.repository.replace(ownerId, id, next))) throw new TaxDataError('not_found')
    await this.emit(ownerId, action, id)
    return { id, field: next }
  }

  private async emit(ownerId: string, action: AuditAction, fieldId: string): Promise<void> {
    await this.audit.record({ ownerId, action, fieldId, at: this.now() })
  }
}
