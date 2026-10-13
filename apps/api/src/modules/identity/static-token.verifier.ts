import type { Principal, TokenVerifier } from './ports'

/** Verificador de teste/desenvolvimento com tokens fictícios; não serve em produção. */
export class StaticTokenVerifier implements TokenVerifier {
  constructor(private readonly tokens: Readonly<Record<string, string>>) {}

  async verify(bearerToken: string): Promise<Principal | undefined> {
    const ownerId = Object.hasOwn(this.tokens, bearerToken) ? this.tokens[bearerToken] : undefined
    return ownerId === undefined ? undefined : { ownerId }
  }
}
