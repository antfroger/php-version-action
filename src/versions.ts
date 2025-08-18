import * as fs from 'fs'

// Return the PHP version as a string
// The given path should be the path to a composer.json file containing a php requirement
const phpVersion = (path: string) => {
  const content = composer(path)
  const composerJson = JSON.parse(content)
  return composerJson.require.php
}

// Read the composer.json file from the given path
// and return the content as a string
const composer = (path: string) => {
  return fs.readFileSync(path, 'utf8')
}

export { phpVersion }
