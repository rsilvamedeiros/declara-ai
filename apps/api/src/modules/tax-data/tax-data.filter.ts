import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common'
import { FieldError } from '@declara/tax-core'
import { InvalidInputError } from './http-schema'
import { TaxDataError } from './tax-data.service'

interface Reply {
  status(code: number): { json(body: unknown): void }
}

function classify(error: unknown): { status: number; code: string } {
  if (error instanceof TaxDataError) {
    return error.code === 'not_found'
      ? { status: 404, code: 'not_found' }
      : { status: 400, code: 'invalid_input' }
  }
  if (error instanceof FieldError) {
    return error.code === 'invalid_transition' || error.code === 'ambiguous_value'
      ? { status: 409, code: error.code }
      : { status: 400, code: 'invalid_input' }
  }
  if (error instanceof InvalidInputError) return { status: 400, code: 'invalid_input' }
  if (error instanceof HttpException) {
    const status = error.getStatus()
    if (status === 401) return { status, code: 'unauthorized' }
    if (status < 500) return { status: 400, code: 'invalid_input' }
  }
  return { status: 500, code: 'internal_error' }
}

/** Traduz erros para status e código estável, sem valor, trecho ou CPF no corpo (RNF-012). */
@Catch()
export class TaxDataExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const { status, code } = classify(error)
    host.switchToHttp().getResponse<Reply>().status(status).json({ code })
  }
}
