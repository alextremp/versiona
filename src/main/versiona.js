import {log} from './logger'
import fs from 'fs'
import path from 'path'
import {run, quit, addShell, addFunction} from './runner'

const versiona = ({
  repoOrg,
  repoName,
  host = 'github.com',
  pathToPackageJSON = 'package.json',
  test = false
} = {}) => {
  const packageJSONPath = path.resolve(process.cwd(), pathToPackageJSON)
  const packageJSON = require(packageJSONPath)

  if (!repoOrg || !repoName) {
    log.error(() => 'repoOrg and repoName are required')
    throw new Error()
  }
  const travisTag = process.env.TRAVIS_TAG
  if (!travisTag) {
    log.error(() => 'TRAVIS_TAG is not in process env')
    throw new Error()
  }
  if (!REGEX.test(travisTag)) {
    log.error(() => [
      'TRAVIS_TAG not accepted',
      {
        received: travisTag,
        expected: REGEX
      }
    ])
    throw new Error()
  }
  const ghToken = process.env.GH_TOKEN
  if (!ghToken) {
    log.error(() => 'GH_TOKEN is not in process env')
    throw new Error()
  }

  const releaseVersion = travisTag.replace('v', '')

  const repoURL = `https://${ghToken}@${host}/${repoOrg}/${repoName}.git`
  const message = `[skip travis] Update version to: ${releaseVersion}`

  const isBeta = releaseVersion.indexOf('-beta.') > -1

  const toBranch = isBeta
    ? `develop/v${releaseVersion.replace(/\.[0-9]+\.[0-9]+-beta\.[0-9]+/, '')}`
    : 'master'

  const oldVersion = packageJSON.version

  packageJSON.version = releaseVersion
  const updatedJSON = JSON.stringify(packageJSON, null, 2)

  log.info(() => [
    'Updating...',
    {
      repoOrg,
      repoName,
      host,
      travisTag,
      isBeta,
      toBranch,
      oldversion: oldVersion,
      newVersion: releaseVersion,
      packageJSON: pathToPackageJSON
    }
  ])

  if (test) {
    log.info(() => 'Test finished')
    quit()
  }
  addShell(`git remote rm origin`)
  addShell(`git remote add origin ${repoURL}`)
  addShell(`git checkout -b ${toBranch}`)
  addFunction(() => fs.writeFileSync(packageJSONPath, updatedJSON))
  addShell(`git commit -a -m "${message}"`)
  addShell(`npm publish${isBeta ? ' --tag beta' : ''}`)
  addShell(`git push --repo=${repoURL} origin ${toBranch} --quiet`)

  run()
}

const REGEX_PATTERN = '^v[0-9]+.[0-9]+.[0-9]+(-beta.[0-9]+)?$'
const REGEX = new RegExp(REGEX_PATTERN)

export {versiona}
