/**
 * Unit tests for the versions module, src/versions.ts
 */
import * as fs from 'fs'
import path from 'path'
import os from 'os'

const versions = await import('../src/versions.js')
const { phpVersion } = versions

describe('versions.ts', () => {
  let tempDir: string

  beforeAll(async () => {
    // Create a temporary directory for tests
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'composer-test-')
    )
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

  describe('phpVersion function', () => {
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
      expect(() => phpVersion(nonExistentPath)).toThrow(
        /ENOENT|no such file|not found/i
      )
    })

    it('throws an error when composer.json has invalid JSON', async () => {
      const composerContent = '{"require": {"php": ">=7.3"' // Missing closing bracket
      const composerPath = path.join(tempDir, 'composer.json')
      await fs.promises.writeFile(composerPath, composerContent)

      expect(() => phpVersion(composerPath)).toThrow()
      expect(() => phpVersion(composerPath)).toThrow(
        /Unexpected end of JSON input|JSON/i
      )
    })

    it('throws an error when the file is not a json file', async () => {
      const composerContent = 'this is not a json file'
      const composerPath = path.join(tempDir, 'composer.txt')
      await fs.promises.writeFile(composerPath, composerContent)

      expect(() => phpVersion(composerPath)).toThrow()
      expect(() => phpVersion(composerPath)).toThrow(
        /Unexpected end of JSON input|JSON/i
      )
    })
  })
})
