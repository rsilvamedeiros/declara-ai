import { describe, expect, it } from 'vitest'
import { validateCnpj, validateCpf } from './index'

// CPF/CNPJ fictícios com dígitos verificadores válidos, gerados para teste.
const VALID_CPF = '52998224725'
const VALID_CNPJ = '11222333000181'

describe('validateCpf', () => {
  it('aceita CPF válido sem máscara', () => {
    expect(validateCpf(VALID_CPF)).toEqual({ valid: true, normalized: VALID_CPF })
  })

  it('aceita CPF válido com máscara e espaços', () => {
    expect(validateCpf(' 529.982.247-25 ')).toEqual({ valid: true, normalized: VALID_CPF })
  })

  it('rejeita tamanho errado', () => {
    expect(validateCpf('1234567890')).toEqual({ valid: false, reason: 'invalid_length' })
    expect(validateCpf('')).toEqual({ valid: false, reason: 'invalid_length' })
  })

  it('rejeita caracteres inválidos', () => {
    expect(validateCpf('5299822472a')).toEqual({ valid: false, reason: 'invalid_characters' })
  })

  it('rejeita dígitos repetidos', () => {
    expect(validateCpf('11111111111')).toEqual({ valid: false, reason: 'repeated_digits' })
  })

  it('rejeita dígito verificador errado', () => {
    expect(validateCpf('52998224726')).toEqual({ valid: false, reason: 'invalid_check_digits' })
  })
})

describe('validateCnpj', () => {
  it('aceita CNPJ válido sem máscara', () => {
    expect(validateCnpj(VALID_CNPJ)).toEqual({ valid: true, normalized: VALID_CNPJ })
  })

  it('aceita CNPJ válido com máscara', () => {
    expect(validateCnpj('11.222.333/0001-81')).toEqual({ valid: true, normalized: VALID_CNPJ })
  })

  it('rejeita tamanho errado', () => {
    expect(validateCnpj('1122233300018')).toEqual({ valid: false, reason: 'invalid_length' })
  })

  it('rejeita caracteres inválidos', () => {
    expect(validateCnpj('1122233300018x')).toEqual({ valid: false, reason: 'invalid_characters' })
  })

  it('rejeita dígitos repetidos', () => {
    expect(validateCnpj('00000000000000')).toEqual({ valid: false, reason: 'repeated_digits' })
  })

  it('rejeita dígito verificador errado', () => {
    expect(validateCnpj('11222333000182')).toEqual({ valid: false, reason: 'invalid_check_digits' })
  })
})
