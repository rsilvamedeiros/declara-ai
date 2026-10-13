import { InMemoryTaxDataRepository } from './in-memory.repository'
import { repositoryContract } from './repository.contract'

repositoryContract('em memória', () => new InMemoryTaxDataRepository())
