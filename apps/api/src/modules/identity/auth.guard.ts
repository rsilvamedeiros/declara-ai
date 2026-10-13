import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common'
import { TOKEN_VERIFIER, type TokenVerifier } from './ports'

const OWNER_KEY = 'authenticatedOwnerId'
const BEARER = /^Bearer ([^\s]+)$/

interface AuthedRequest {
  headers: Record<string, string | string[] | undefined>
  [OWNER_KEY]?: string
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>()
    const header = req.headers.authorization
    const token = typeof header === 'string' ? BEARER.exec(header)?.[1] : undefined
    const principal = token === undefined ? undefined : await this.verifier.verify(token)
    if (!principal) throw new UnauthorizedException({ code: 'unauthorized' })
    req[OWNER_KEY] = principal.ownerId
    return true
  }
}

/** Único ponto de onde o controlador obtém o dono: o token verificado. */
export const OwnerId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  return context.switchToHttp().getRequest<AuthedRequest>()[OWNER_KEY] as string
})
