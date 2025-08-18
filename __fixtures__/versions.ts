import type {
  phpVersion as PhpVersionType,
  matrix as MatrixType,
  getVersions as GetVersionsType
} from '../src/versions.js'
import { jest } from '@jest/globals'

// Mock phpVersion function
export const phpVersion = jest.fn<typeof PhpVersionType>(() => '7.3')

// Mock getVersions to return the same data that matrix expects
export const getVersions = jest.fn<typeof GetVersionsType>(async () => [
  {
    name: '7.2',
    isFutureVersion: false,
    isEOLVersion: true,
    isSecureVersion: false
  },
  {
    name: '7.3',
    isFutureVersion: false,
    isEOLVersion: true,
    isSecureVersion: false
  },
  {
    name: '7.4',
    isFutureVersion: false,
    isEOLVersion: true,
    isSecureVersion: false
  },
  {
    name: '8.0',
    isFutureVersion: false,
    isEOLVersion: true,
    isSecureVersion: false
  },
  {
    name: '8.1',
    isFutureVersion: false,
    isEOLVersion: false,
    isSecureVersion: true
  },
  {
    name: '8.2',
    isFutureVersion: false,
    isEOLVersion: false,
    isSecureVersion: true
  },
  {
    name: '8.3',
    isFutureVersion: false,
    isEOLVersion: false,
    isSecureVersion: true
  },
  {
    name: '8.4',
    isFutureVersion: false,
    isEOLVersion: false,
    isSecureVersion: true
  },
  {
    name: '8.5',
    isFutureVersion: true,
    isEOLVersion: false,
    isSecureVersion: false
  }
])

// Mock matrix function
export const matrix = jest.fn<typeof MatrixType>()
