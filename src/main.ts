import * as core from '@actions/core'
import { phpVersion } from './versions.js'

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const workingDir: string = core.getInput('working-directory')
    const composerPhpVersion = phpVersion(`${workingDir}/composer.json`)

    core.debug(`PHP version defined in ${workingDir} is ${composerPhpVersion}`)

    core.setOutput('composer-php-version', composerPhpVersion)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
