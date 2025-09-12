import * as fs from 'fs'
import semverCoerce from 'semver/functions/coerce.js'
import semverSatisfies from 'semver/functions/satisfies.js'

/**
 * Represents a PHP version with its release status information
 */
type Version = {
  /** The PHP version name (e.g., "8.1", "8.2") */
  name: string
  /** Whether it's a future/unreleased version */
  isFutureVersion: boolean
  /** Whether it's end-of-life */
  isEOLVersion: boolean
  /** Whether it still receives security updates */
  isSecureVersion: boolean
}

/**
 * Represents a validated version with both original string and coerced SemVer object
 */
type ValidVersion = {
  /** Original version string (e.g., "8.1") */
  original: string
  /** Coerced SemVer object for comparison and sorting */
  coerced: NonNullable<ReturnType<typeof semverCoerce>>
}

/**
 * Represents a PHP version as returned by the PHP.watch API
 */
interface ApiVersion {
  name: string
  isFutureVersion: boolean
  isEOLVersion: boolean
  isSecureVersion: boolean
}

/**
 * Represents the response structure from the PHP.watch API
 */
interface ApiResponse {
  data: Record<string, ApiVersion>
}

/**
 * Reads a file from the given path and returns its content as a string
 * @param path - Path to the file to read
 * @returns The file content as a string
 * @throws {Error} When the file cannot be read or doesn't exist
 */
const composer = (path: string) => {
  return fs.readFileSync(path, 'utf8')
}

/**
 * Returns the PHP version requirement from a composer.json file
 * @param path - Path to the composer.json file
 * @returns The PHP version requirement as a string (e.g., ">=8.1", "^8.0")
 * @throws {Error} When the file cannot be read, contains invalid JSON, or lacks PHP requirement
 */
const phpVersion = (path: string) => {
  const content = composer(path)
  const composerJson = JSON.parse(content)
  return composerJson.require.php
}

/**
 * Filters and sorts an array of version strings, returning only valid semver versions
 * @param versions - Array of version strings to process
 * @returns Array of ValidVersion objects with original string and coerced SemVer, sorted by version
 */
const validSortedVersions = (versions: string[]): ValidVersion[] => {
  const validVersions: ValidVersion[] = []

  for (const version of versions) {
    const coerced = semverCoerce(version)
    if (coerced) {
      validVersions.push({ original: version, coerced })
    }
  }

  return validVersions.sort((a, b) => a.coerced.compare(b.coerced))
}

/**
 * Returns a matrix of PHP versions that satisfy the given composer version requirement
 * @param composerVersion - The composer version constraint (e.g., ">=8.1", "^8.0", "8.1")
 * @param versions - Array of Version objects to filter from
 * @param inclUnstable - Whether to include future/unreleased versions in the matrix
 * @returns Array of version names that satisfy the constraint, sorted by version
 * @throws {Error} When no versions satisfy the constraint
 */
const matrix = (composerVersion: string, versions: Version[], inclUnstable = false) => {
  const result = validSortedVersions(
    versions.filter((v) => inclUnstable || !v.isFutureVersion).map((v) => v.name)
  ).filter((version: ValidVersion) => semverSatisfies(version.coerced.version, composerVersion))

  if (result.length === 0) {
    throw new Error('No valid versions provided')
  }

  return result.map((v) => v.original)
}

/**
 * Returns the minimal (lowest) version from an array of version strings
 * @param versions - Array of version strings to find the minimum from
 * @returns The minimal version string
 * @throws {Error} When no valid versions are provided
 */
const minimal = (versions: string[]) => {
  const validVersions = validSortedVersions(versions)
  if (validVersions.length === 0) {
    throw new Error('No valid versions provided')
  }
  return validVersions[0].original
}

/**
 * Returns the latest (highest) version from an array of version strings
 * @param versions - Array of version strings to find the maximum from
 * @returns The latest version string
 * @throws {Error} When no valid versions are provided
 */
const latest = (versions: string[]) => {
  const validVersions = validSortedVersions(versions)
  if (validVersions.length === 0) {
    throw new Error('No valid versions provided')
  }
  return validVersions[validVersions.length - 1].original
}

/**
 * Fetches PHP version information from the PHP.watch API
 * @returns Promise that resolves to an array of Version objects with release status information
 * @throws {Error} When the API request fails or returns invalid data
 */
const getVersions = async (): Promise<Version[]> => {
  const url = 'https://php.watch/api/v1/versions'

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not fetch PHP versions from ${url}: ${response.status}`)
  }

  const result = (await response.json()) as ApiResponse
  // Extract and normalize the versions from the API response
  return Object.values(result.data).map((v) => ({
    name: v.name,
    isFutureVersion: v.isFutureVersion,
    isEOLVersion: v.isEOLVersion,
    isSecureVersion: v.isSecureVersion
  }))
}

export { phpVersion, matrix, getVersions, minimal, latest }
