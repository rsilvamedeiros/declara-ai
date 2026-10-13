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

// Casos em que o resto do módulo 11 é menor que 2 e o dígito verificador vira 0.
describe('dígito verificador igual a zero', () => {
  it.each(['10000003700', '10000000108', '10000000280'])('aceita CPF %s', (cpf) => {
    expect(validateCpf(cpf)).toEqual({ valid: true, normalized: cpf })
  })

  it.each(['10000000000307', '10000000000650', '10000000000900'])('aceita CNPJ %s', (cnpj) => {
    expect(validateCnpj(cnpj)).toEqual({ valid: true, normalized: cnpj })
  })

  it('rejeita CPF com dígito trocado por zero', () => {
    expect(validateCpf('10000003710')).toEqual({ valid: false, reason: 'invalid_check_digits' })
  })
})

describe('entradas limítrofes', () => {
  it.each(['00000000000', '22222222222', '99999999999'])('CPF repetido %s', (cpf) => {
    expect(validateCpf(cpf)).toEqual({ valid: false, reason: 'repeated_digits' })
  })

  it('CNPJ de 14 dígitos repetidos', () => {
    expect(validateCnpj('99999999999999')).toEqual({ valid: false, reason: 'repeated_digits' })
  })

  it('não confunde CPF com CNPJ', () => {
    expect(validateCpf('11222333000181')).toEqual({ valid: false, reason: 'invalid_length' })
    expect(validateCnpj('52998224725')).toEqual({ valid: false, reason: 'invalid_length' })
  })

  it('caractere inválido tem precedência sobre o tamanho', () => {
    expect(validateCpf('abc')).toEqual({ valid: false, reason: 'invalid_characters' })
  })

  it('rejeita dígitos não ASCII', () => {
    expect(validateCpf('٥٢٩٩٨٢٢٤٧٢٥')).toEqual({ valid: false, reason: 'invalid_characters' })
  })

  it('aceita máscara parcial ou misturada', () => {
    expect(validateCpf('529982247-25')).toEqual({ valid: true, normalized: '52998224725' })
    expect(validateCnpj('11222333/0001-81')).toEqual({ valid: true, normalized: '11222333000181' })
  })
})
