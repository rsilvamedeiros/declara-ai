import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = import.meta.dirname

function sourcesIn(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const path = join(folder, entry.name)
    if (entry.isDirectory()) return sourcesIn(path)
    const isSource = entry.name.endsWith('.ts') && !/\.(spec|contract)\.ts$/.test(entry.name)
    return isSource ? [path] : []
  })
}

describe('fronteira do módulo tax-data (CA-7 da SPEC-0007, CA-8 da SPEC-0008)', () => {
  it('importa só de pacotes permitidos, do módulo identity (interface pública) e de arquivos do próprio módulo', () => {
    const allowed = ['@declara/tax-core', '@nestjs/common', 'pg', 'node:fs', 'node:path']
    const identity = resolve(dir, '../identity')
    for (const file of sourcesIn(dir)) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1] as string
        const target = spec.startsWith('.') ? resolve(file, '..', spec) : undefined
        const inside = target !== undefined && !relative(dir, target).startsWith('..')
        const ok = allowed.includes(spec) || target === identity || inside
        expect(ok, `${relative(dir, file)} importa ${spec}`).toBe(true)
      }
    }
  })
})
