import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { Money, createExtractedField } from '@declara/tax-core'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AuthGuard, StaticTokenVerifier, TOKEN_VERIFIER } from '../identity'
import { InMemoryTaxDataRepository } from './in-memory.repository'
import type { AuditEvent } from './ports'
import { TaxDataController } from './tax-data.controller'
import { TaxDataExceptionFilter } from './tax-data.filter'
import { TaxDataService } from './tax-data.service'

const A = { Authorization: 'Bearer token-a' }
const B = { Authorization: 'Bearer token-b' }
const money = (amount: string) => ({ type: 'money', amount })
const manual = { personId: 'p1', year: 2025, key: 'rendimento', value: money('1234.56') }

let app: INestApplication
let repo: InMemoryTaxDataRepository
let events: AuditEvent[]

beforeEach(async () => {
  repo = new InMemoryTaxDataRepository()
  events = []
  const service = new TaxDataService(repo, { record: (e) => void events.push(e) })
  const moduleRef = await Test.createTestingModule({
    controllers: [TaxDataController],
    providers: [
      { provide: TaxDataService, useValue: service },
      { provide: TOKEN_VERIFIER, useValue: new StaticTokenVerifier({ 'token-a': 'A', 'token-b': 'B' }) },
      AuthGuard,
    ],
  }).compile()
  app = moduleRef.createNestApplication()
  app.useGlobalFilters(new TaxDataExceptionFilter())
  await app.init()
})

afterEach(async () => {
  await app.close()
})

const server = () => app.getHttpServer()
const extracted = (owner = 'A', amount = '500.00') =>
  repo.add(
    owner,
    createExtractedField({
      personId: 'p1',
      year: 2025,
      key: 'rendimento',
      value: Money.fromString(amount),
      origin: { documentId: 'd1', page: 1, excerpt: 'trecho fictício' },
    }),
  )

describe('API de dados fiscais', () => {
  it('CA-1: todos os endpoints exigem token', async () => {
    const calls = [
      request(server()).post('/fields').send(manual),
      request(server()).get('/people/p1/years/2025/fields'),
      request(server()).post('/fields/x/confirm'),
      request(server()).post('/fields/x/correct').send({ value: money('1.00') }),
      request(server()).post('/fields/x/reject'),
      request(server()).get('/people/p1/years/2025/alerts'),
    ]
    for (const r of await Promise.all(calls)) expect(r.status).toBe(401)
    expect(events).toEqual([])
  })

  it('CA-2/CA-4: cria campo manual para o dono do token, ignorando ownerId do corpo', async () => {
    const r = await request(server()).post('/fields').set(A).send({ ...manual, ownerId: 'B' })
    expect(r.status).toBe(201)
    expect(r.body).toMatchObject({
      personId: 'p1',
      year: 2025,
      key: 'rendimento',
      status: 'confirmed',
      value: money('1234.56'),
      origin: { kind: 'manual' },
    })
    expect(typeof r.body.id).toBe('string')
    expect(await repo.list('A', { personId: 'p1', year: 2025 })).toHaveLength(1)
    expect(await repo.list('B', { personId: 'p1', year: 2025 })).toHaveLength(0)
  })

  it('CA-4: lista inclui rejeitados e só da pessoa e ano pedidos', async () => {
    const e = await extracted()
    await request(server()).post(`/fields/${e.id}/reject`).set(A).expect(201)
    await request(server()).post('/fields').set(A).send({ ...manual, year: 2024 })
    const r = await request(server()).get('/people/p1/years/2025/fields').set(A)
    expect(r.status).toBe(200)
    expect(r.body.map((f: { status: string }) => f.status)).toEqual(['rejected'])
    expect(r.body[0].origin).toEqual({
      kind: 'document',
      documentId: 'd1',
      page: 1,
      excerpt: 'trecho fictício',
    })
  })

  it('CA-4: confirm, correct e reject devolvem o campo atualizado', async () => {
    const [a, b, c] = [await extracted(), await extracted(), await extracted()]
    const confirmed = await request(server()).post(`/fields/${a.id}/confirm`).set(A)
    expect(confirmed.body.status).toBe('confirmed')
    const corrected = await request(server())
      .post(`/fields/${b.id}/correct`)
      .set(A)
      .send({ value: money('700.00') })
    expect(corrected.body).toMatchObject({ status: 'corrected', value: money('700.00'), previousValue: money('500.00') })
    const rejected = await request(server()).post(`/fields/${c.id}/reject`).set(A)
    expect(rejected.body.status).toBe('rejected')
  })

  it('CA-3: campo de outro dono dá 404 em todas as operações e a lista vem vazia', async () => {
    const e = await extracted('A')
    for (const r of [
      await request(server()).post(`/fields/${e.id}/confirm`).set(B),
      await request(server()).post(`/fields/${e.id}/correct`).set(B).send({ value: money('1.00') }),
      await request(server()).post(`/fields/${e.id}/reject`).set(B),
      await request(server()).post('/fields/inexistente/confirm').set(B),
    ]) {
      expect(r.status).toBe(404)
      expect(r.body).toEqual({ code: 'not_found' })
    }
    const list = await request(server()).get('/people/p1/years/2025/fields').set(B)
    expect(list.body).toEqual([])
    expect((await repo.get('A', e.id))?.field.status).toBe('extracted')
  })

  it('CA-5: transição inválida dá 409 e não altera o armazenado', async () => {
    const e = await extracted()
    await request(server()).post(`/fields/${e.id}/reject`).set(A).expect(201)
    const r = await request(server()).post(`/fields/${e.id}/confirm`).set(A)
    expect(r.status).toBe(409)
    expect(r.body).toEqual({ code: 'invalid_transition' })
    expect((await repo.get('A', e.id))?.field.status).toBe('rejected')
  })

  it('alertas V-011 sem misturar donos', async () => {
    await extracted('A', '500.00')
    await request(server()).post('/fields').set(A).send({ ...manual, value: money('900.00') })
    await extracted('B', '1.00')
    const a = await request(server()).get('/people/p1/years/2025/alerts').set(A)
    expect(a.status).toBe(200)
    expect(a.body).toHaveLength(1)
    const b = await request(server()).get('/people/p1/years/2025/alerts').set(B)
    expect(b.body).toEqual([])
  })

  it('CA-6: entrada malformada dá 400 sem eco do conteúdo', async () => {
    const secret = 'VALOR-SECRETO-999'
    const bad = [
      { ...manual, value: money('12,50') },
      { ...manual, value: { type: 'money', amount: 12.5 } },
      { ...manual, value: { type: 'outro', text: secret } },
      { ...manual, value: secret },
      { ...manual, year: '2025' },
      { ...manual, year: 99 },
      { ...manual, key: '' },
      { ...manual, personId: 7 },
      null,
    ]
    for (const body of bad) {
      const r = await request(server()).post('/fields').set(A).send(body as object)
      expect(r.status).toBe(400)
      expect(r.body).toEqual({ code: 'invalid_input' })
    }
    const e = await extracted()
    const c = await request(server()).post(`/fields/${e.id}/correct`).set(A).send({ value: { type: 'text', text: secret } })
    expect(c.status).toBe(400)
    expect(JSON.stringify(c.body)).not.toContain(secret)
    const y = await request(server()).get('/people/p1/years/abc/fields').set(A)
    expect(y.status).toBe(400)
  })

  it('CA-5/mesma chave: correção com tipo diferente do campo dá 400', async () => {
    const e = await extracted()
    const r = await request(server()).post(`/fields/${e.id}/correct`).set(A).send({ value: { type: 'text', text: 'abc' } })
    expect(r.status).toBe(400)
    expect(r.body).toEqual({ code: 'invalid_input' })
    expect((await repo.get('A', e.id))?.field.status).toBe('extracted')
  })

  it('texto é aceito como valor de campo manual', async () => {
    const r = await request(server()).post('/fields').set(A).send({ ...manual, key: 'cnpj', value: { type: 'text', text: 'abc' } })
    expect(r.status).toBe(201)
    expect(r.body.value).toEqual({ type: 'text', text: 'abc' })
  })
})
