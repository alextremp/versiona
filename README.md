# versiona [![NPM Module](https://img.shields.io/npm/v/versiona.svg)](https://www.npmjs.com/package/versiona)

[![Build Status](https://travis-ci.org/alextremp/versiona.svg?branch=master)](https://travis-ci.org/alextremp/versiona)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/alextremp/versiona.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/alextremp/versiona/context:javascript)
[![Maintainability](https://api.codeclimate.com/v1/badges/c2ea0ca1472cb7af910f/maintainability)](https://codeclimate.com/github/alextremp/versiona/maintainability)

**Versiona** is a Travis CI helper tool for NPM projects where teams use Github tags to create new Releases, so assuming:

* Use Travis CI
* Use Github release tagging in semver format:
  * vX.Y.Z tag will publish X.Y.Z version in NPM
  * vX.Y.Z-beta.A tag will publish X.Y.Z-beta.A beta version in NPM
  
This library will:
* Update your package version to the Github tag specific version
* Publish the new version to NPM
* Commit to Github the updated package.json
  * Commit to **master** for Release versions (vX.Y.Z)
  * Commit to **develop/vX** for Beta Release versions (vX.Y.Z-beta.A)

By releasing your NPM packages this way, your collaborators will be aimed to:
* have full control of when a new version should be publicly available 
* know which release tag corresponds to each available NPM version of your package
* doc the releases :)
* don't publish from localhost! ;)

## Usage


Install versiona:

```
npm i versiona --save-dev
``` 

Create a **versiona.js** script into your project:

```
const versiona = require('versiona')

versiona({
  repoOrg: 'your_repo_org_or_username',         // required, ex: 'alextremp'
  repoName: 'your_repo_name',                   // required, ex: 'versiona'
  pathToPackageJSON: 'path_to_package.json',    // defaults to 'package.json', set the relative path to package json if it's not in the same folder than the script
  test: false                                   // true if just want to test the config without publishing / committing, defaults to false     
})
```

Add a new script task into your package.json:

```
"scripts": {
  "versiona": "node versiona.js"
}
```

Call the versiona task from Travis:

* In this travis sample:
```
dist: trusty
language: node_js
node_js:
  - "8"
cache:
  directories:
    - node_modules
before_install:
  - npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
script:
  - npm run check
  - |
    echo TRAVIS_BRANCH=$TRAVIS_BRANCH - TRAVIS_PULL_REQUEST=$TRAVIS_PULL_REQUEST - TRAVIS_TAG=$TRAVIS_TAG
    if [[ $TRAVIS_TAG =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-beta\.[0-9]+)?$ ]]; then
      echo DEPLOY VERSION - TRAVIS_BRANCH=$TRAVIS_BRANCH, PR=$PR, BRANCH=$BRANCH
      TRAVIS_TAG=$TRAVIS_TAG GH_TOKEN=$GH_TOKEN npm run versiona
    fi
```

  * NPM_TOKEN is required to publish packages to NPM
  * GH_TOKEN is required to commit back to Github
  * This library only uses the tokens, does not store / send / ... them to anywhere
  
 
## Troubleshooting

### Failed publishing from a tag

* Ensure that with vX.Y.Z release, the package.json didn't have the X.Y.Z version already (so it won't commit a new version, and so, it won't publish)
* Ensure that the X.Y.Z version does not already exist in NPM 
* In case of creating a tag by mistake:

>Revert a tag locally
>```
>git tag -d vX.Y.Z 
>```
>
>Revert a tag in Github
>```
>git push --delete origin vX.Y.Z
>```

## Maintainers

This library uses itself to publish to NPM.

