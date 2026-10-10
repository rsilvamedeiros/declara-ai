import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common'
import { type TaxIdResult, validateCnpj, validateCpf } from '@declara/tax-core'

@Controller('validation')
export class ValidationController {
  @Post('tax-id')
  @HttpCode(200)
  validateTaxId(@Body() body: unknown): TaxIdResult {
    // Valor recebido nunca é registrado em log: CPF/CNPJ são dados pessoais.
    if (typeof body !== 'object' || body === null) throw new BadRequestException()
    const { type, value } = body as { type?: unknown; value?: unknown }
    if (typeof value !== 'string') throw new BadRequestException('value must be a string')
    if (type === 'cpf') return validateCpf(value)
    if (type === 'cnpj') return validateCnpj(value)
    throw new BadRequestException('type must be "cpf" or "cnpj"')
  }
}
