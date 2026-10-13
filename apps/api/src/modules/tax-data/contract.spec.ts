import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { RequestMethod } from '@nestjs/common'
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants'
import { describe, expect, it } from 'vitest'
import { TaxDataController } from './tax-data.controller'
import { toWireField } from './http-schema'
import { Money, createExtractedField, correctField } from '@declara/tax-core'

const spec = JSON.parse(
  readFileSync(join(import.meta.dirname, '../../../../../packages/contracts/openapi.json'), 'utf8'),
) as {
  paths: Record<string, Record<string, unknown>>
  components: { schemas: Record<string, { required?: string[]; properties: Record<string, unknown> }> }
}

const proto = TaxDataController.prototype as unknown as Record<string, () => void>
const implemented = Object.getOwnPropertyNames(proto)
  .filter((n) => n !== 'constructor')
  .map((n) => {
    const handler = proto[n] as () => void
    const method = Reflect.getMetadata(METHOD_METADATA, handler) as number
    const path = '/' + (Reflect.getMetadata(PATH_METADATA, handler) as string).replace(/:(\w+)/g, '{$1}')
    return `${RequestMethod[method]?.toLowerCase()} ${path}`
  })
  .sort()

describe('contrato OpenAPI (CA-7)', () => {
  it('descreve exatamente as rotas implementadas', () => {
    const documented = Object.entries(spec.paths)
      .flatMap(([path, ops]) => Object.keys(ops).map((m) => `${m} ${path}`))
      .sort()
    expect(documented).toEqual(implemented)
  })

  it('toda rota documentada declara 401 e segurança bearer', () => {
    for (const ops of Object.values(spec.paths)) {
      for (const op of Object.values(ops) as { responses: object; security: object[] }[]) {
        expect(op.responses).toHaveProperty('401')
        expect(op.security).toEqual([{ bearerAuth: [] }])
      }
    }
  })

  it('o campo serializado tem as propriedades do schema Field e nenhuma a mais', () => {
    const field = spec.components.schemas.Field as { required: string[]; properties: Record<string, unknown> }
    const extracted = createExtractedField({
      personId: 'p1',
      year: 2025,
      key: 'k',
      value: Money.fromString('1.00'),
      origin: { documentId: 'd', page: 1, excerpt: 'x' },
    })
    const wire = toWireField({ id: 'i', field: correctField(extracted, Money.fromString('2.00')) })
    expect(Object.keys(wire).sort()).toEqual(Object.keys(field.properties).sort())
    for (const key of field.required) expect(wire).toHaveProperty(key)
    const noPrev = toWireField({ id: 'i', field: extracted })
    for (const key of field.required) expect(noPrev).toHaveProperty(key)
    expect(noPrev).not.toHaveProperty('previousValue')
  })
})
