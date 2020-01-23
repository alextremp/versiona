import {log} from './logger'
import fs from 'fs'
import path from 'path'
import {run, quit, addShell, addFunction} from './runner'

const versiona = ({
  repoOrg,
  repoName,
  host = 'github.com',
  publish = NPM_PUBLISH,
  test = false
} = {}) => {
  const packageJSONPath = path.resolve(process.cwd(), PACKAGE_JSON)
  const packageJSON = require(packageJSONPath)

  if (!repoOrg || !repoName) {
    log.error(() => 'repoOrg and repoName are required')
    quit()
  }
  const travisTag = process.env.TRAVIS_TAG
  if (!travisTag) {
    log.info(
      () => 'TRAVIS_TAG is not present in process.env, stopping versiona'
    )
    return false
  }
  if (!REGEX.test(travisTag)) {
    log.info(() => [
      'TRAVIS_TAG is not a semver format tag, stopping versiona',
      {
        received: travisTag,
        semver: REGEX
      }
    ])
    return false
  }
  const ghToken = process.env.GH_TOKEN
  if (!ghToken) {
    log.error(() => 'GH_TOKEN is not in process env')
    quit()
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
  const updatedJSON = JSON.stringify(packageJSON, null, 2).trim()

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
      publish
    }
  ])

  addShell(`git remote rm origin`)
  addShell(`git remote add origin ${repoURL}`)
  addShell(`git checkout -b ${toBranch}`)
  addFunction(`Update package.json to ${releaseVersion}`, () =>
    fs.writeFileSync(packageJSONPath, updatedJSON)
  )
  addShell(`git add package.json`)
  addShell(`git commit -m "${message}"`)
  publish &&
    addShell(
      NPM_PUBLISH === publish
        ? `${publish}${isBeta ? ' --tag beta' : ''}`
        : publish
    )
  addShell(`git push --repo=${repoURL} origin ${toBranch} --quiet`)

  if (test) {
    log.info(() => 'Test finished')
    return false
  }
  run()
  return true
}

const NPM_PUBLISH = 'npm publish'
const PACKAGE_JSON = 'package.json'
const REGEX_PATTERN = '^v[0-9]+.[0-9]+.[0-9]+(-beta.[0-9]+)?$'
const REGEX = new RegExp(REGEX_PATTERN)

export {versiona}
