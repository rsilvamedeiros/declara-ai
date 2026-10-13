export type RuleKind = 'table' | 'limit' | 'rate' | 'condition' | 'deadline'
export type RuleStatus = 'draft' | 'reviewed' | 'effective' | 'superseded'

export interface RuleSource {
  /** Norma, artigo ou item. */
  readonly document: string
  readonly url: string
  /** Data ISO da consulta à fonte. */
  readonly consultedAt: string
}

export interface Rule {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly kind: RuleKind
  /** Ano-calendário inicial da vigência (inclusive). */
  readonly fromYear: number
  /** Ano-calendário final (inclusive); ausente = vigência aberta. */
  readonly toYear?: number
  /** Conteúdo estruturado e serializável; opaco ao catálogo. */
  readonly value: unknown
  readonly source: RuleSource
  readonly version: number
  readonly status: RuleStatus
}

export interface RuleRef {
  readonly id: string
  readonly version: number
}

export type Catalog = readonly Rule[]

/** Erro do catálogo. A mensagem cita apenas id e versão da regra. */
export class RuleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RuleError'
  }
}

function isYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1000 && year <= 9999
}

function isHttps(url: string): boolean {
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export function createRule(input: Rule): Rule {
  const label = `${input.id}@${input.version}`
  if (!input.id.trim()) throw new RuleError('invalid rule id')
  if (!Number.isInteger(input.version) || input.version < 1) throw new RuleError(`invalid version: ${label}`)
  if (!isYear(input.fromYear) || (input.toYear !== undefined && !isYear(input.toYear))) {
    throw new RuleError(`invalid year: ${label}`)
  }
  if (input.toYear !== undefined && input.fromYear > input.toYear) {
    throw new RuleError(`invalid validity range: ${label}`)
  }
  const { document, url, consultedAt } = input.source
  if (!document.trim() || !consultedAt.trim() || !isHttps(url)) {
    throw new RuleError(`incomplete source: ${label}`)
  }
  return Object.freeze({ ...input, source: Object.freeze({ ...input.source }) })
}

export function createCatalog(rules: readonly Rule[]): Catalog {
  const seen = new Set<string>()
  for (const rule of rules) {
    const key = `${rule.id}@${rule.version}`
    if (seen.has(key)) throw new RuleError(`duplicate rule: ${key}`)
    seen.add(key)
  }
  return Object.freeze([...rules])
}

export function ruleFor(catalog: Catalog, id: string, year: number): Rule | undefined {
  const matches = catalog.filter(
    (r) =>
      r.id === id &&
      r.status === 'effective' &&
      year >= r.fromYear &&
      (r.toYear === undefined || year <= r.toYear),
  )
  if (matches.length > 1) throw new RuleError(`ambiguous rule: ${id} for ${year}`)
  return matches[0]
}

export function refOf(rule: Rule): RuleRef {
  return { id: rule.id, version: rule.version }
}
