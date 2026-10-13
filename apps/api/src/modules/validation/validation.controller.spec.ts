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

  it('devolve o motivo quando o CNPJ é inválido', async () => {
    const res = await post({ type: 'cnpj', value: '11.222.333/0001-82' })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: false, reason: 'invalid_check_digits' })
  })

  it('aceita CPF sem máscara', async () => {
    const res = await post({ type: 'cpf', value: '52998224725' })
    expect(res.body).toEqual({ valid: true, normalized: '52998224725' })
  })

  it('não confunde o tipo: CNPJ enviado como cpf é inválido', async () => {
    const res = await post({ type: 'cpf', value: VALID_CNPJ })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ valid: false, reason: 'invalid_length' })
  })

  it('não devolve o valor original na resposta de erro', async () => {
    const res = await post({ type: 'cpf', value: '529.982.247-26' })
    expect(JSON.stringify(res.body)).not.toContain('529')
  })

  it.each([
    ['array', '[]'],
    ['string JSON', '"cpf"'],
    ['null', 'null'],
  ])('responde 400 para corpo %s', async (_nome, raw) => {
    const res = await request(app.getHttpServer())
      .post('/validation/tax-id')
      .set('Content-Type', 'application/json')
      .send(raw)
    expect(res.status).toBe(400)
  })

  it('responde 400 para tipo ausente ou em maiúsculas', async () => {
    expect((await post({ value: VALID_CPF })).status).toBe(400)
    expect((await post({ type: 'CPF', value: VALID_CPF })).status).toBe(400)
  })

  it('responde 404 para GET na rota e 404 para rota inexistente', async () => {
    expect((await request(app.getHttpServer()).get('/validation/tax-id')).status).toBe(404)
    expect((await request(app.getHttpServer()).post('/validation/other').send({})).status).toBe(404)
  })
})
