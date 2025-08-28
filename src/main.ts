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

    const matrixWithLinks = mat
      .map((v) => `<a href="https://www.php.net/ChangeLog-${v.split('.')[0]}.php#${v}">PHP ${v}</a>`)
      .join('<br>')

    await core.summary
      .addHeading('PHP versions summary')
      .addTable([
        [
          { data: 'Output', header: true },
          { data: 'Value', header: true }
        ],
        ['Composer PHP version', composerPhpVersion],
        ['minimal', `<a href="https://www.php.net/releases/${min}/en.php">PHP ${min}</a>`],
        ['latest', `<a href="https://www.php.net/releases/${lat}/en.php">PHP ${lat}</a>`],
        ['matrix', matrixWithLinks]
      ])
      .addRaw(`data extracted from ${workingDir}/composer.json`)
      .write()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
