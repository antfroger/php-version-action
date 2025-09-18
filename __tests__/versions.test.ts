/**
 * Unit tests for the versions module, src/versions.ts
 */
import * as fs from 'fs'
import path from 'path'
import os from 'os'

const versions = await import('../src/versions.js')
const { phpVersion, matrix, minimal, latest } = versions

describe('versions.ts', () => {
  describe('phpVersion function', () => {
    let tempDir: string

    beforeAll(async () => {
      // Create a temporary directory for tests
      tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'composer-test-'))
    })

    afterAll(async () => {
      // Clean up the temporary directory
      await fs.promises.rm(tempDir, { recursive: true, force: true })
    })

    beforeEach(async () => {
      try {
        // Clean up any files from previous tests
        const composerPath = path.join(tempDir, 'composer.json')
        await fs.promises.unlink(composerPath)
      } catch {
        // File doesn't exist, which is fine
      }
    })

    it('reads PHP version from composer.json file', async () => {
      const composerContent = '{"require": {"php": ">=7.3"}}'
      const composerPath = path.join(tempDir, 'composer.json')
      await fs.promises.writeFile(composerPath, composerContent)

      const result = phpVersion(composerPath)

      expect(result).toBe('>=7.3')
    })

    it('handles different PHP version formats', async () => {
      const testCases = [
        { content: '{"require": {"php": "8.1"}}', expected: '8.1' },
        { content: '{"require": {"php": "^8.0"}}', expected: '^8.0' },
        {
          content: '{"require": {"php": "^7.3 || ^8.0"}}',
          expected: '^7.3 || ^8.0'
        }
      ]

      for (const testCase of testCases) {
        const composerPath = path.join(tempDir, 'composer.json')
        await fs.promises.writeFile(composerPath, testCase.content)

        const result = phpVersion(composerPath)
        expect(result).toBe(testCase.expected)
      }
    })

    it('returns undefined when composer.json does not have php requirement', async () => {
      const composerContent = '{"require": {"other-package": "^1.0"}}'
      const composerPath = path.join(tempDir, 'composer.json')
      await fs.promises.writeFile(composerPath, composerContent)

      const result = phpVersion(composerPath)
      expect(result).toBeUndefined()
    })

    it('throws an error when the file cannot be read', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent', 'composer.json')

      expect(() => phpVersion(nonExistentPath)).toThrow()
      expect(() => phpVersion(nonExistentPath)).toThrow(/ENOENT|no such file|not found/i)
    })

    it('throws an error when composer.json has invalid JSON', async () => {
      const composerContent = '{"require": {"php": ">=7.3"' // Missing closing bracket
      const composerPath = path.join(tempDir, 'composer.json')
      await fs.promises.writeFile(composerPath, composerContent)

      expect(() => phpVersion(composerPath)).toThrow()
      expect(() => phpVersion(composerPath)).toThrow(/Unexpected end of JSON input|JSON/i)
    })

    it('throws an error when the file is not a json file', async () => {
      const composerContent = 'this is not a json file'
      const composerPath = path.join(tempDir, 'composer.txt')
      await fs.promises.writeFile(composerPath, composerContent)

      expect(() => phpVersion(composerPath)).toThrow()
      expect(() => phpVersion(composerPath)).toThrow(/Unexpected end of JSON input|JSON/i)
    })
  })

  describe('matrix function', () => {
    it('returns a matrix starting from the PHP version in the composer.json file and ending at the latest released version', async () => {
      const mockVersions = [
        { name: '7.2', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '7.3', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '7.4', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '8.0', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '8.1', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.2', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.3', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.4', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.5', isFutureVersion: true, isEOLVersion: false, isSecureVersion: false }
      ]

      const testCases = [
        // Basic exact version constraints (these should definitely work)
        { content: '8.1', expected: ['8.1'] },
        { content: '8.3', expected: ['8.3'] },

        // Simple range constraints (basic semver operations)
        { content: '>=8.0', expected: ['8.0', '8.1', '8.2', '8.3', '8.4'] },
        { content: '>7.4', expected: ['8.0', '8.1', '8.2', '8.3', '8.4'] },
        { content: '<8.3', expected: ['7.2', '7.3', '7.4', '8.0', '8.1', '8.2'] },
        { content: '<=8.2', expected: ['7.2', '7.3', '7.4', '8.0', '8.1', '8.2'] },

        // Multiple range constraints (AND logic) - basic semver
        { content: '>=8.0 <8.3', expected: ['8.0', '8.1', '8.2'] },
        { content: '>7.4 <=8.2', expected: ['8.0', '8.1', '8.2'] },
        { content: '>=7.3 <8.1', expected: ['7.3', '7.4', '8.0'] },

        // Tilde version range (~) - semver standard (patch-level changes)
        { content: '~8.0', expected: ['8.0'] }, // ~8.0 = >=8.0.0 <8.1.0 (only 8.0.x)
        { content: '~8.1', expected: ['8.1'] }, // ~8.1 = >=8.1.0 <8.2.0 (only 8.1.x)
        { content: '~8', expected: ['8.0', '8.1', '8.2', '8.3', '8.4'] }, // ~8 = >=8.0.0 <9.0.0

        // Caret version range (^) - semver standard
        { content: '^8.0', expected: ['8.0', '8.1', '8.2', '8.3', '8.4'] },
        { content: '^8.1', expected: ['8.1', '8.2', '8.3', '8.4'] },
        { content: '^7.1.0', expected: ['7.2', '7.3', '7.4'] },

        // Additional semver-compatible constraints
        { content: '8.0.*', expected: ['8.0'] }, // Wildcard: only 8.0.x patches
        { content: '8.*', expected: ['8.0', '8.1', '8.2', '8.3', '8.4'] }, // Wildcard: all 8.x.x
        { content: '8.0 - 8.2', expected: ['8.0', '8.1', '8.2'] }, // Hyphenated range (needs spaces)

        // OR Logic Constraints (||)
        { content: '>=8.0 || <7.4', expected: ['7.2', '7.3', '8.0', '8.1', '8.2', '8.3', '8.4'] },
        { content: '8.1 || 8.3', expected: ['8.1', '8.3'] },

        // Inequality Constraints (using OR logic since != is not supported)
        { content: '<8.1 || >8.1', expected: ['7.2', '7.3', '7.4', '8.0', '8.2', '8.3', '8.4'] },

        // Complex Combined Constraints
        { content: '>=7.4 <8.3 || ^8.4', expected: ['7.4', '8.0', '8.1', '8.2', '8.4'] },
        { content: '8.0.* || 8.2.*', expected: ['8.0', '8.2'] }
      ]

      for (const testCase of testCases) {
        const result = matrix(testCase.content, mockVersions)
        expect(result).toStrictEqual(testCase.expected)
      }
    })

    it('filters out invalid semver versions from the matrix', async () => {
      const mockVersions = [
        { name: 'invalid-version', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '7.3', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '7.4', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '8.0', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
        { name: '8.1', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: 'another-invalid', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true }
      ]

      const result = matrix('>=7.3', mockVersions)

      // Should only include valid semver versions >= 7.3
      expect(result).toEqual(['7.3', '7.4', '8.0', '8.1'])
    })

    it('throws when the matrix is empty', async () => {
      expect(() => matrix('>=7.3', [])).toThrow('No valid versions provided')
    })

    it('throws when the matrix contains only invalid semver versions', async () => {
      expect(() =>
        matrix('>=7.3', [
          { name: 'invalid-version', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false }
        ])
      ).toThrow('No valid versions provided')
    })

    it('includes future versions when inclUnstable is true', async () => {
      const mockVersions = [
        { name: '8.3', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.4', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.5', isFutureVersion: true, isEOLVersion: false, isSecureVersion: false }
      ]

      expect(matrix('>=8.3', mockVersions, true)).toStrictEqual(['8.3', '8.4', '8.5'])
      expect(matrix('8.*', mockVersions, true)).toStrictEqual(['8.3', '8.4', '8.5'])
      expect(matrix('^8.4', mockVersions, true)).toStrictEqual(['8.4', '8.5'])
    })

    it('excludes unsupported versions when inclUnsupported is false', async () => {
      const mockVersions = [
        { name: '7.2', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false }, // unsupported
        { name: '7.3', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false }, // unsupported
        { name: '7.4', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false }, // unsupported
        { name: '8.0', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false }, // unsupported
        { name: '8.1', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.2', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
        { name: '8.3', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true }
      ]

      expect(matrix('>=7.2', mockVersions, false, false)).toStrictEqual(['8.1', '8.2', '8.3'])
    })
  })

  describe('minimal function', () => {
    it('returns the minimal version of the given array of versions', async () => {
      expect(minimal(['8.3', '8.0', '8.4', '7.1', '7.4'])).toEqual('7.1')
    })

    it('throws when there are no valid semver versions', async () => {
      expect(() => minimal(['a', 'b', 'c'])).toThrow('No valid versions provided')
    })
  })

  describe('latest function', () => {
    it('returns the latest version of the given array of versions', async () => {
      expect(latest(['8.3', '8.0', '8.4', '7.1', '7.4'])).toEqual('8.4')
    })

    it('throws when there are no valid semver versions', async () => {
      expect(() => latest(['a', 'b', 'c'])).toThrow('No valid versions provided')
    })
  })
})
