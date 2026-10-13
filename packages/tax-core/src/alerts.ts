import { usableFields, type FieldValue } from './fields'
import { Money } from './money'

export type AlertSeverity = 'error' | 'warning' | 'notice'
export type AlertState = 'open' | 'resolved' | 'justified'
export type SuggestedAction = 'fix_value' | 'attach_document' | 'justify'

export interface FieldRef {
  readonly personId: string
  readonly year: number
  readonly key: string
}

/** Alerta sem valores monetários, trechos nem justificativa (RNF-012). A mensagem sai de `code`. */
export interface Alert {
  readonly validationId: 'V-005' | 'V-011'
  readonly severity: AlertSeverity
  readonly code: 'sum_mismatch' | 'extracted_vs_manual_mismatch'
  readonly fields: readonly FieldRef[]
  readonly documentIds: readonly string[]
  readonly suggestedAction: SuggestedAction
  readonly state: AlertState
}

export type AlertErrorCode =
  | 'mixed_scope'
  | 'non_money_value'
  | 'invalid_transition'
  | 'empty_justification'

export class AlertError extends Error {
  constructor(readonly code: AlertErrorCode) {
    super(code)
    this.name = 'AlertError'
  }
}

function documentIdsOf(fields: readonly FieldValue[]): string[] {
  const ids = new Set<string>()
  for (const f of fields) if (f.origin.kind === 'document') ids.add(f.origin.documentId)
  return [...ids].sort()
}

function refsOf(fields: readonly FieldValue[]): FieldRef[] {
  const seen = new Map<string, FieldRef>()
  for (const f of fields) {
    seen.set(`${f.personId}|${f.year}|${f.key}`, { personId: f.personId, year: f.year, key: f.key })
  }
  return [...seen.values()]
}

/** V-005: a soma das partes utilizáveis deve bater, em centavos, com o total do documento. */
export function checkSumMatchesTotal(
  parts: readonly FieldValue[],
  total: FieldValue,
): Alert | undefined {
  const all = [...parts, total]
  if (all.some((f) => f.personId !== total.personId || f.year !== total.year)) {
    throw new AlertError('mixed_scope')
  }
  const usableTotal = usableFields([total])[0]
  if (!usableTotal) return undefined
  const usableParts = usableFields(parts)
  const values = [...usableParts, usableTotal].map((f) => f.value)
  if (!values.every((v): v is Money => v instanceof Money)) throw new AlertError('non_money_value')
  const sum = usableParts.reduce((acc, f) => acc.add(f.value as Money), Money.fromString('0.00'))
  if (sum.equals(usableTotal.value as Money)) return undefined
  const used = [...usableParts, usableTotal]
  return {
    validationId: 'V-005',
    severity: 'warning',
    code: 'sum_mismatch',
    fields: refsOf(used),
    documentIds: documentIdsOf(used),
    suggestedAction: 'justify',
    state: 'open',
  }
}

function sameValue(a: FieldValue['value'], b: FieldValue['value']): boolean {
  if (a instanceof Money && b instanceof Money) return a.equals(b)
  return a === b
}

/** V-011: valor digitado manualmente diverge do extraído de documento (não rejeitado). */
export function checkExtractedVsManual(fields: readonly FieldValue[]): Alert[] {
  const groups = new Map<string, FieldValue[]>()
  for (const f of fields) {
    const id = `${f.personId}|${f.year}|${f.key}`
    groups.set(id, [...(groups.get(id) ?? []), f])
  }
  const alerts: Alert[] = []
  for (const id of [...groups.keys()].sort()) {
    const group = groups.get(id) ?? []
    const manual = usableFields(group).filter((f) => f.origin.kind === 'manual')
    const fromDocument = group.filter((f) => f.origin.kind === 'document' && f.status !== 'rejected')
    const diverges = manual.some((m) => fromDocument.some((d) => !sameValue(m.value, d.value)))
    if (!diverges) continue
    const involved = [...manual, ...fromDocument]
    alerts.push({
      validationId: 'V-011',
      severity: 'warning',
      code: 'extracted_vs_manual_mismatch',
      fields: refsOf(involved),
      documentIds: documentIdsOf(involved),
      suggestedAction: 'fix_value',
      state: 'open',
    })
  }
  return alerts
}

export function resolveAlert(alert: Alert): Alert {
  if (alert.state !== 'open') throw new AlertError('invalid_transition')
  return { ...alert, state: 'resolved' }
}

/** A justificativa é dado do usuário: valida-se que existe, mas não é guardada no alerta. */
export function justifyAlert(alert: Alert, justification: string): Alert {
  if (alert.state !== 'open') throw new AlertError('invalid_transition')
  if (!justification.trim()) throw new AlertError('empty_justification')
  return { ...alert, state: 'justified' }
}
