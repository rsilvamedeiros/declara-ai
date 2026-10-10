import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ValidationModule } from './validation.module'

// CPF/CNPJ fictícios com dígitos verificadores válidos, gerados para teste.
const VALID_CPF = '529.982.247-25'
const VALID_CNPJ = '11.222.333/0001-81'

describe('POST /validation/tax-id', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ValidationModule] }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  const post = (body: unknown) => request(app.getHttpServer()).post('/validation/tax-id').send(body as object)

  it('valida CPF válido e devolve o valor normalizado', async () => {
    const res = await post({ type: 'cpf', value: VALID_CPF })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: true, normalized: '52998224725' })
  })

  it('valida CNPJ válido', async () => {
    const res = await post({ type: 'cnpj', value: VALID_CNPJ })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: true, normalized: '11222333000181' })
  })

  it('devolve o motivo quando o CPF é inválido', async () => {
    const res = await post({ type: 'cpf', value: '529.982.247-26' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: false, reason: 'invalid_check_digits' })
  })

  it.each([
    [{ type: 'rg', value: '1' }],
    [{ type: 'cpf' }],
    [{ type: 'cpf', value: 123 }],
    [{}],
  ])('responde 400 para corpo inválido: %j', async (body) => {
    const res = await post(body)
    expect(res.status).toBe(400)
  })
})
