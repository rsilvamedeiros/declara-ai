import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import pkg from '../package.json'
import {
  FieldError,
  findDuplicate,
  registerDocument,
  validateUpload,
  type IntakeLimits,
  type SourceDocument,
  type UploadCandidate,
} from './index'

// Bytes e hashes sintéticos; nenhum documento real.
const PDF = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])
const HASH = 'a'.repeat(64)
const limits: IntakeLimits = {
  maxSizeBytes: 1000,
  acceptedMimes: ['application/pdf', 'image/png', 'image/jpeg'],
}
const candidate = (over: Partial<UploadCandidate> = {}): UploadCandidate => ({
  fileName: 'x.pdf',
  declaredMime: 'application/pdf',
  sizeBytes: 100,
  headBytes: PDF,
  contentHash: HASH,
  ...over,
})
const meta = { id: 'd1', type: 'income_report', personId: 'p1', year: 2025 }

describe('validateUpload (CA-1)', () => {
  it('aceita PDF, PNG e JPEG pela assinatura', () => {
    expect(validateUpload(candidate(), limits)).toEqual({ ok: true, mime: 'application/pdf' })
    expect(validateUpload(candidate({ declaredMime: 'image/png', headBytes: PNG }), limits)).toEqual({
      ok: true,
      mime: 'image/png',
    })
    expect(validateUpload(candidate({ declaredMime: 'image/jpeg', headBytes: JPEG }), limits)).toEqual({
      ok: true,
      mime: 'image/jpeg',
    })
  })

  it.each([
    ['empty_file', { sizeBytes: 0 }],
    ['too_large', { sizeBytes: 1001 }],
    ['invalid_hash', { contentHash: 'abc' }],
    ['invalid_hash', { contentHash: 'z'.repeat(64) }],
    ['unsupported_type', { headBytes: Uint8Array.from([1, 2, 3]) }],
    ['unsupported_type', { headBytes: new Uint8Array() }],
  ])('rejeita com %s', (reason, over) => {
    expect(validateUpload(candidate(over), limits)).toEqual({ ok: false, reason })
  })

  it('rejeita tipo reconhecido mas fora dos aceitos', () => {
    const onlyPdf = { ...limits, acceptedMimes: ['application/pdf'] }
    expect(validateUpload(candidate({ declaredMime: 'image/png', headBytes: PNG }), onlyPdf)).toEqual({
      ok: false,
      reason: 'unsupported_type',
    })
  })
})

describe('assinatura decide o tipo (CA-2)', () => {
  it('MIME declarado diferente da assinatura é mime_mismatch', () => {
    expect(validateUpload(candidate({ declaredMime: 'image/png' }), limits)).toEqual({
      ok: false,
      reason: 'mime_mismatch',
    })
  })

  it('ignora a extensão do nome', () => {
    expect(validateUpload(candidate({ fileName: 'x.exe' }), limits)).toEqual({
      ok: true,
      mime: 'application/pdf',
    })
  })

  it('o resultado nunca depende do nome do arquivo', () => {
    fc.assert(
      fc.property(fc.string(), (fileName) => {
        expect(validateUpload(candidate({ fileName }), limits)).toEqual(validateUpload(candidate(), limits))
      }),
    )
  })
})

describe('registerDocument (CA-3, CA-4)', () => {
  it('devolve SourceDocument com pessoa, ano e hash, sem alterar existing', () => {
    const existing: SourceDocument[] = []
    const result = registerDocument(candidate(), meta, existing)
    expect(result).toEqual({
      ok: true,
      document: { id: 'd1', type: 'income_report', personId: 'p1', year: 2025, contentHash: HASH },
      duplicateOf: undefined,
    })
    expect(existing).toEqual([])
  })

  it('propaga o motivo de rejeição do upload', () => {
    expect(registerDocument(candidate({ sizeBytes: 0 }), meta, [])).toEqual({ ok: false, reason: 'empty_file' })
  })

  it('rejeita ano inválido', () => {
    expect(() => registerDocument(candidate(), { ...meta, year: 25 }, [])).toThrow(FieldError)
  })

  it('aponta duplicado de mesma pessoa, ano e hash, sem bloquear', () => {
    const first = { id: 'old', type: 'income_report', personId: 'p1', year: 2025, contentHash: HASH }
    const result = registerDocument(candidate(), meta, [first])
    expect(result).toMatchObject({ ok: true, duplicateOf: 'old' })
  })
})

describe('findDuplicate (CA-4)', () => {
  const doc = { id: 'old', type: 'income_report', personId: 'p1', year: 2025, contentHash: HASH }

  it('encontra por pessoa, ano e hash (hash sem diferenciar caixa)', () => {
    expect(findDuplicate([doc], 'p1', 2025, HASH.toUpperCase())).toBe(doc)
  })

  it('não considera outra pessoa, outro ano ou outro hash', () => {
    expect(findDuplicate([doc], 'p2', 2025, HASH)).toBeUndefined()
    expect(findDuplicate([doc], 'p1', 2024, HASH)).toBeUndefined()
    expect(findDuplicate([doc], 'p1', 2025, 'b'.repeat(64))).toBeUndefined()
  })

  it('só devolve documento com mesma pessoa, ano e hash (propriedade)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            type: fc.constant('income_report'),
            personId: fc.constantFrom('p1', 'p2'),
            year: fc.constantFrom(2024, 2025),
            contentHash: fc.constantFrom('a'.repeat(64), 'b'.repeat(64)),
          }),
        ),
        (docs) => {
          const found = findDuplicate(docs, 'p1', 2025, 'a'.repeat(64))
          if (found) expect([found.personId, found.year, found.contentHash]).toEqual(['p1', 2025, 'a'.repeat(64)])
          else expect(docs.some((d) => d.personId === 'p1' && d.year === 2025 && d.contentHash === 'a'.repeat(64))).toBe(false)
        },
      ),
    )
  })
})

describe('privacidade (CA-5)', () => {
  it('o resultado não contém nome do arquivo nem bytes', () => {
    const out = JSON.stringify([
      validateUpload(candidate({ fileName: 'maria-silva-informe.pdf', sizeBytes: 0 }), limits),
      registerDocument(candidate({ fileName: 'maria-silva-informe.pdf' }), meta, []),
    ])
    expect(out).not.toContain('maria')
    expect(out).not.toContain('informe.pdf')
  })
})

describe('pureza (CA-6)', () => {
  it('não declara dependências de runtime', () => {
    expect('dependencies' in pkg).toBe(false)
  })
})
