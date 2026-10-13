import { createSourceDocument, type SourceDocument } from './fields'

export interface UploadCandidate {
  /** Dado do usuário: nunca é usado para decidir nada nem devolvido nos resultados. */
  readonly fileName: string
  readonly declaredMime: string
  readonly sizeBytes: number
  /** Primeiros bytes do arquivo, para verificar a assinatura. */
  readonly headBytes: Uint8Array
  /** SHA-256 em hexadecimal, calculado fora do domínio. */
  readonly contentHash: string
}

export interface IntakeLimits {
  readonly maxSizeBytes: number
  readonly acceptedMimes: readonly string[]
}

export type UploadRejection =
  | 'empty_file'
  | 'too_large'
  | 'invalid_hash'
  | 'unsupported_type'
  | 'mime_mismatch'

export type UploadValidation =
  | { readonly ok: true; readonly mime: string }
  | { readonly ok: false; readonly reason: UploadRejection }

export type Registration =
  | { readonly ok: true; readonly document: SourceDocument; readonly duplicateOf: string | undefined }
  | { readonly ok: false; readonly reason: UploadRejection }

const SIGNATURES: readonly { mime: string; bytes: readonly number[] }[] = [
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
]

const SHA256_HEX = /^[0-9a-f]{64}$/i

function detectMime(head: Uint8Array): string | undefined {
  return SIGNATURES.find((s) => s.bytes.every((b, i) => head[i] === b))?.mime
}

export function validateUpload(candidate: UploadCandidate, limits: IntakeLimits): UploadValidation {
  if (candidate.sizeBytes <= 0) return { ok: false, reason: 'empty_file' }
  if (candidate.sizeBytes > limits.maxSizeBytes) return { ok: false, reason: 'too_large' }
  if (!SHA256_HEX.test(candidate.contentHash)) return { ok: false, reason: 'invalid_hash' }
  const mime = detectMime(candidate.headBytes)
  if (mime === undefined || !limits.acceptedMimes.includes(mime)) {
    return { ok: false, reason: 'unsupported_type' }
  }
  if (candidate.declaredMime !== mime) return { ok: false, reason: 'mime_mismatch' }
  return { ok: true, mime }
}

export function findDuplicate(
  existing: readonly SourceDocument[],
  personId: string,
  year: number,
  contentHash: string,
): SourceDocument | undefined {
  const hash = contentHash.toLowerCase()
  return existing.find(
    (d) => d.personId === personId && d.year === year && d.contentHash.toLowerCase() === hash,
  )
}

export function registerDocument(
  candidate: UploadCandidate,
  meta: { id: string; type: string; personId: string; year: number },
  existing: readonly SourceDocument[],
  limits: IntakeLimits = DEFAULT_LIMITS,
): Registration {
  const validation = validateUpload(candidate, limits)
  if (!validation.ok) return validation
  const document = createSourceDocument({ ...meta, contentHash: candidate.contentHash.toLowerCase() })
  const duplicate = findDuplicate(existing, meta.personId, meta.year, candidate.contentHash)
  return { ok: true, document, duplicateOf: duplicate?.id }
}

/** Padrão do MVP (SPEC-0005): PDF, PNG e JPEG de até 20 MB. */
export const DEFAULT_LIMITS: IntakeLimits = {
  maxSizeBytes: 20 * 1024 * 1024,
  acceptedMimes: ['application/pdf', 'image/png', 'image/jpeg'],
}
