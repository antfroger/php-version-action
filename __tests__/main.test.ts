/**
 * Unit tests for the action's main functionality, src/main.ts
 */
import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as versions from '../__fixtures__/versions.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/versions.js', () => versions)

const { run } = await import('../src/main.js')

describe('main.ts', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Set default mock implementations
    core.getInput.mockImplementation((name?: string) => (name === 'unstable' ? 'false' : '.'))
    versions.getVersions.mockResolvedValue([
      { name: '7.3', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
      { name: '7.4', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
      { name: '8.0', isFutureVersion: false, isEOLVersion: true, isSecureVersion: false },
      { name: '8.1', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
      { name: '8.2', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
      { name: '8.3', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
      { name: '8.4', isFutureVersion: false, isEOLVersion: false, isSecureVersion: true },
      { name: '8.5', isFutureVersion: true, isEOLVersion: false, isSecureVersion: false }
    ])
    versions.phpVersion.mockReturnValue('7.3')
    versions.matrix.mockReturnValue(['7.3', '7.4', '8.0', '8.1', '8.2', '8.3', '8.4'])
    versions.minimal.mockReturnValue('7.3')
    versions.latest.mockReturnValue('8.4')
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('Successful execution', () => {
    it('Sets the version outputs with default working directory', async () => {
      await run()

      expect(versions.phpVersion).toHaveBeenCalledWith('./composer.json')

      expect(core.setOutput).toHaveBeenNthCalledWith(1, 'composer-php-version', '7.3')
      expect(core.setOutput).toHaveBeenNthCalledWith(2, 'matrix', ['7.3', '7.4', '8.0', '8.1', '8.2', '8.3', '8.4'])
      expect(core.setOutput).toHaveBeenNthCalledWith(3, 'minimal', '7.3')
      expect(core.setOutput).toHaveBeenNthCalledWith(4, 'latest', '8.4')
    })

    it('Sets the version outputs with custom working directory', async () => {
      const workingDir = './src'
      core.getInput.mockImplementationOnce(() => workingDir)

      await run()

      expect(versions.phpVersion).toHaveBeenCalledWith('./src/composer.json')
    })

    it('Handles different PHP versions returned by phpVersion', async () => {
      versions.phpVersion.mockReturnValueOnce('8.1')
      versions.matrix.mockReturnValueOnce(['8.1', '8.2', '8.3', '8.4'])
      versions.minimal.mockReturnValueOnce('8.1')

      await run()

      expect(core.setOutput).toHaveBeenNthCalledWith(1, 'composer-php-version', '8.1')
      expect(core.setOutput).toHaveBeenNthCalledWith(2, 'matrix', ['8.1', '8.2', '8.3', '8.4'])
      expect(core.setOutput).toHaveBeenNthCalledWith(3, 'minimal', '8.1')
      expect(core.setOutput).toHaveBeenNthCalledWith(4, 'latest', '8.4')
    })

    it('Passes the unstable param to matrix when input is defined', async () => {
      core.getBooleanInput.mockReturnValueOnce(true)

      await run()

      expect(versions.matrix).toHaveBeenCalledWith(expect.any(String), expect.any(Array), true)
    })
  })

  describe('Error handling', () => {
    it('Sets a failed status when phpVersion throws an error', async () => {
      const workingDir = './fake-directory'
      core.getInput.mockReturnValueOnce(workingDir)

      versions.phpVersion.mockImplementationOnce(() => {
        throw new Error('composer.json not found')
      })

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('composer.json not found')
    })
  })
})
