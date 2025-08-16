import * as fs from 'fs'

// Read the composer.json file from the given path
// and return the content as a string
const composer = (path: string) => {
  return fs.readFileSync(path, 'utf8')
}

// Return the PHP version as a string from the given content
// which should be the content of a composer.json file
const phpVersion = (path: string) => {
  const content = composer(path)
  const composerJson = JSON.parse(content)
  return composerJson.require.php
}

export { phpVersion }
