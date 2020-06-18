import {log} from './logger'
import fs from 'fs'
import path from 'path'
import {run, quit, addShell, addFunction} from './runner'

const versiona = ({
  repoOrg,
  repoName,
  host = 'github.com',
  publish = NPM_PUBLISH,
  masterCommand = MASTER_COMMAND,
  test = false
} = {}) => {
  const packageJSONPath = path.resolve(process.cwd(), PACKAGE_JSON)
  const packageJSON = require(packageJSONPath)

  if (process.env.TRAVIS_COMMIT_MESSAGE.startsWith(SKIP_TRAVIS_PREFIX)) {
    console.log(process.env.TRAVIS_COMMIT_MESSAGE + ' >> skipping versiona')
    return false
  }

  if (!repoOrg || !repoName) {
    log.error(() => 'repoOrg and repoName are required')
    quit()
  }

  const isMaster =
    process.env.TRAVIS_BRANCH === 'master' &&
    process.env.TRAVIS_PULL_REQUEST === 'false'

  const travisTag = process.env.TRAVIS_TAG
  if (travisTag && !REGEX.test(travisTag)) {
    log.info(() => [
      'TRAVIS_TAG is not a semver format tag, stopping versiona',
      {
        received: travisTag,
        semver: REGEX
      }
    ])
    return false
  }

  let environment = travisTag ? 'pro' : 'pre'
  const addMasterCommand = () => {
    const command =
      typeof masterCommand === 'function'
        ? masterCommand(environment)
        : `VERSIONA_ENV=${environment} ${masterCommand}`
    masterCommand && addShell(command)
  }

  if (travisTag) {
    const ghToken = process.env.GH_TOKEN
    if (!ghToken) {
      log.error(() => 'GH_TOKEN is not in process env')
      quit()
    }

    const releaseVersion = travisTag.replace('v', '')

    const repoURL = `https://${ghToken}@${host}/${repoOrg}/${repoName}.git`
    const message = `${SKIP_TRAVIS_PREFIX} Update version to: ${releaseVersion}`

    const isBeta = releaseVersion.indexOf('-beta.') > -1

    isBeta && (environment = 'dev')

    const toBranch = isBeta
      ? `develop/v${releaseVersion.replace(
          /\.[0-9]+\.[0-9]+-beta\.[0-9]+/,
          ''
        )}`
      : 'master'

    const oldVersion = packageJSON.version

    packageJSON.version = releaseVersion
    const updatedJSON = `${JSON.stringify(packageJSON, null, 2)}`

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
    addMasterCommand()
    addShell(`git push --repo=${repoURL} origin ${toBranch} --quiet`)
  } else if (isMaster) {
    addMasterCommand()
  }

  if (test) {
    log.info(() => 'Test finished')
    return false
  }
  run()
  return true
}

const NPM_PUBLISH = 'npm publish'
const MASTER_COMMAND = 'echo Running on master'
const PACKAGE_JSON = 'package.json'
const REGEX_PATTERN = '^v[0-9]+.[0-9]+.[0-9]+(-beta.[0-9]+)?$'
const REGEX = new RegExp(REGEX_PATTERN)
const SKIP_TRAVIS_PREFIX = '[skip travis]'

export {versiona}
