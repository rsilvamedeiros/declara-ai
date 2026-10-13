import { Controller, Get, type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { AuthGuard, OwnerId, StaticTokenVerifier, TOKEN_VERIFIER } from './index'
import { UseGuards } from '@nestjs/common'

@Controller('whoami')
@UseGuards(AuthGuard)
class WhoAmIController {
  @Get()
  whoami(@OwnerId() ownerId: string) {
    return { ownerId }
  }
}

let app: INestApplication

async function boot(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [WhoAmIController],
    providers: [
      { provide: TOKEN_VERIFIER, useValue: new StaticTokenVerifier({ 'token-a': 'ownerA' }) },
      AuthGuard,
    ],
  }).compile()
  app = moduleRef.createNestApplication()
  await app.init()
  return app
}

afterEach(async () => {
  await app?.close()
})

describe('AuthGuard (CA-1, CA-2)', () => {
  it('sem token, token inválido e esquema errado recebem o mesmo 401', async () => {
    const server = (await boot()).getHttpServer()
    const responses = await Promise.all([
      request(server).get('/whoami'),
      request(server).get('/whoami').set('Authorization', 'Bearer errado'),
      request(server).get('/whoami').set('Authorization', 'Basic token-a'),
      request(server).get('/whoami').set('Authorization', 'Bearer'),
    ])
    for (const r of responses) {
      expect(r.status).toBe(401)
      expect(r.body).toEqual({ code: 'unauthorized' })
    }
  })

  it('token válido expõe o ownerId do verificador', async () => {
    const server = (await boot()).getHttpServer()
    const r = await request(server).get('/whoami').set('Authorization', 'Bearer token-a')
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ ownerId: 'ownerA' })
  })

  it('ownerId em query ou cabeçalho não altera o dono', async () => {
    const server = (await boot()).getHttpServer()
    const r = await request(server)
      .get('/whoami?ownerId=ownerB')
      .set('Authorization', 'Bearer token-a')
      .set('x-owner-id', 'ownerB')
    expect(r.body).toEqual({ ownerId: 'ownerA' })
  })
})
