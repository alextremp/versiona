import {log} from './logger'
import fs from 'fs'
import {run, addShell, addFunction} from './runner'

const versiona = ({repoOrg, repoName, host = 'github.com'} = {}) => {
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

  const packageJSON = require('./package.json')

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
      newVersion: releaseVersion
    }
  ])

  addFunction(() => fs.writeFileSync('package.json', updatedJSON))
  addShell(`git remote rm origin`)
  addShell(`git remote add origin ${repoURL}`)
  addShell(`git checkout -b ${toBranch}`)
  addShell('git add package.json')
  addShell(`git commit -m "${message}"`)
  addShell(`npm publish${isBeta ? ' --tag beta' : ''}`)
  addShell(`git push --repo=${repoURL} origin ${toBranch} --quiet`)

  run()
}

const REGEX_PATTERN = '^v[0-9]+.[0-9]+.[0-9]+(-beta.[0-9]+)?$'
const REGEX = new RegExp(REGEX_PATTERN)

export {versiona}
