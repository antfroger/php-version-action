import * as fs from 'fs'

type Version = {
  name: string // The PHP version name (e.g., "8.1", "8.2")
  isFutureVersion: boolean // Whether it's a future/unreleased version
  isEOLVersion: boolean // Whether it's end-of-life
  isSecureVersion: boolean // Whether it still receives security updates
}

interface ApiVersion {
  name: string
  isFutureVersion: boolean
  isEOLVersion: boolean
  isSecureVersion: boolean
}

interface ApiResponse {
  data: Record<string, ApiVersion>
}

// Return the PHP version as a string
// The given path should be the path to a composer.json file containing a php requirement
const phpVersion = (path: string) => {
  const content = composer(path)
  const composerJson = JSON.parse(content)
  return composerJson.require.php
}

// Read the file from the given path and return the content as a string
const composer = (path: string) => {
  return fs.readFileSync(path, 'utf8')
}

// Get the matrix of versions starting from the given version and ending at the latest released version
// The versions parameter is an array of Version objects
// The min parameter is the starting version
// Returns an array of version names
const matrix = (min: string, versions: Version[]) => {
  const result = versions
    .filter((v) => !v.isFutureVersion) // Only include released versions
    .map((v) => v.name)
    .filter((version: string) => version >= min)
    .sort()

  return result
}

// Get the PHP versions from the PHP.watch API
// Returns a normalized array of Version objects with name, isFutureVersion, isEOLVersion, and isSecureVersion properties
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

export { phpVersion, matrix, getVersions }
