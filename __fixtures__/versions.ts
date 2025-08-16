import type { phpVersion as PhpVersionType } from '../src/versions.js'
import { jest } from '@jest/globals'

export const phpVersion = jest.fn<typeof PhpVersionType>(() => '7.3')
