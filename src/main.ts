import * as core from '@actions/core'
import { phpVersion, matrix, minimal, getVersions, latest } from './versions.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const workingDir: string = core.getInput('working-directory')
    const composerPhpVersion = phpVersion(`${workingDir}/composer.json`)
    const versions = await getVersions()
    const mat = matrix(composerPhpVersion, versions)
    const min = minimal(mat)
    const lat = latest(mat)

    core.setOutput('composer-php-version', composerPhpVersion)
    core.setOutput('matrix', mat)
    core.setOutput('minimal', min)
    core.setOutput('latest', lat)

    core.debug(`PHP version defined in ${workingDir} is ${composerPhpVersion}`)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
