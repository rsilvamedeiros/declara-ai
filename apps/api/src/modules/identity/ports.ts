export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER')

export interface Principal {
  readonly ownerId: string
}

/** Porta de verificação de credencial. O adaptador OIDC real entra em spec própria. */
export interface TokenVerifier {
  /** `undefined` para qualquer token inválido ou expirado, sem distinguir o motivo. */
  verify(bearerToken: string): Promise<Principal | undefined>
}
