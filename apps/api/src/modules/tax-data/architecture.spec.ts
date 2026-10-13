import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = import.meta.dirname
const sources = readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.contract.ts'))

describe('fronteira do módulo tax-data (CA-7)', () => {
  it('importa só de pacotes permitidos e de arquivos do próprio módulo', () => {
    const allowed = ['@declara/tax-core', '@nestjs/common']
    for (const file of sources) {
      const text = readFileSync(join(dir, file), 'utf8')
      for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const spec = m[1] as string
        const ok =
          allowed.includes(spec) || spec === '../identity' || (spec.startsWith('./') && !spec.includes('..'))
        expect(ok, `${file} importa ${spec}`).toBe(true)
      }
    }
  })
})
